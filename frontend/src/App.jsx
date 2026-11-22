import { useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import FloatingHeader from './components/FloatingHeader'
import BentoTelemetry from './components/BentoTelemetry'
import TriageWorkspace from './components/TriageWorkspace'
import PipelineView from './components/PipelineView'
import BlocklistView from './components/BlocklistView'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'
const API = API_BASE
const emptyStats = { total_flows: 0, benign_count: 0, threat_counts: {} }

export default function App() {
  const [alerts, setAlerts] = useState([])
  const [stats, setStats] = useState(emptyStats)
  const [isStreaming, setIsStreaming] = useState(true)
  const [socketStatus, setSocketStatus] = useState('Reconnecting')
  const [blockedIps, setBlockedIps] = useState([])
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [samples, setSamples] = useState(Array(40).fill(18))
  const [activeView, setActiveView] = useState('Live Triage')
  const [booting, setBooting] = useState(true)
  const [loading, setLoading] = useState(true)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [sourceMode, setSourceMode] = useState('simulated')
  const socketRef = useRef(null)
  const blockedRef = useRef([])

  useEffect(() => {
    const bootTimer = window.setTimeout(() => setBooting(false), 650)
    fetch(`${API}/api/source`).then(async (response) => {
      if (!response.ok) throw new Error(`Source request failed: ${response.status}`)
      const data = await response.json()
      setSourceMode(data?.mode === 'live' ? 'live' : 'simulated')
    }).catch(console.error)
    fetch(`${API}/api/blocklist`).then(async (response) => {
      if (!response.ok) throw new Error(`Blocklist request failed: ${response.status}`)
      const entries = await response.json()
      const normalized = Array.isArray(entries) ? entries.map((entry) => ({
        ip: entry.ip,
        blockedAt: entry.blockedAt || entry.blocked_at,
        reason: entry.reason || 'Manually blocked',
      })) : []
      blockedRef.current = normalized
      setBlockedIps(normalized)
    }).catch(console.error)
    fetch(`${API}/api/stats`).then(async (response) => {
      if (!response.ok) throw new Error(`Stats request failed: ${response.status}`)
      const data = await response.json()
      setStats({
        total_flows: Number(data?.total_flows ?? 0),
        benign_count: Number(data?.benign_count ?? 0),
        threat_counts: data?.threat_counts && typeof data.threat_counts === 'object'
          ? data.threat_counts : {},
      })
    }).catch(console.error).finally(() => setLoading(false))
    return () => window.clearTimeout(bootTimer)
  }, [])

  useEffect(() => {
    let stopped = false
    let reconnectId
    const connect = () => {
      setSocketStatus('Reconnecting')
      try {
        const socket = new WebSocket(`${WS_BASE}/ws/alerts`)
        socketRef.current = socket
        socket.onopen = () => setSocketStatus('Connected')
        socket.onclose = () => {
          setSocketStatus('Reconnecting')
          if (!stopped) reconnectId = window.setTimeout(connect, 2500)
        }
        socket.onerror = () => socket.close()
        socket.onmessage = (event) => {
          try {
            const alert = JSON.parse(event.data)
            if (!alert || typeof alert !== 'object') return
            const srcIp = alert?.src_ip ?? '0.0.0.0'
            const normalized = { ...alert, id: alert?.id ?? crypto.randomUUID?.() ?? String(Date.now()),
              timestamp: alert?.timestamp ?? new Date().toISOString(), src_ip: srcIp,
              dst_ip: alert?.dst_ip ?? '0.0.0.0', dst_port: Number(alert?.dst_port ?? 0),
              detection_stage: alert?.detection_stage ?? 'BENIGN',
              threat_label: alert?.threat_label ?? 'BENIGN', severity: alert?.severity ?? 'LOW',
              confidence: Number(alert?.confidence ?? 0), explanation: alert?.explanation ?? '' }
            const blocked = blockedRef.current.some((entry) => entry.ip === srcIp)
            setAlerts((current) => [blocked ? { ...normalized, blocked: true } : normalized,
              ...(Array.isArray(current) ? current : [])].slice(0, 200))
            setLoading(false)
            setSamples((current) => [...current.slice(-39),
              normalized.threat_label === 'BENIGN' ? 18 : 82])
            setStats((current) => {
              const counts = current.threat_counts || {}
              const stage = alert.detection_stage
              return { total_flows: (current.total_flows || 0) + 1,
                benign_count: (current.benign_count || 0) + (alert.threat_label === 'BENIGN' ? 1 : 0),
                threat_counts: { ...counts, [stage]: (counts[stage] || 0) + 1 } }
            })
          } catch (error) { console.error('Invalid websocket alert', error) }
        }
      } catch (error) {
        setSocketStatus('Reconnecting')
        console.error(error)
        reconnectId = window.setTimeout(connect, 2500)
      }
    }
    connect()
    return () => { stopped = true; window.clearTimeout(reconnectId); socketRef.current?.close() }
  }, [])

  const toggleStream = async (action) => {
    setIsStreaming(action === 'start')
    try {
      const response = await fetch(`${API}/api/stream/${action}`, { method: 'POST' })
      if (!response.ok) throw new Error(`Stream request failed: ${response.status}`)
    } catch (error) { setIsStreaming((current) => !current); console.error(error) }
  }
  const blockSource = async (ip, reason = 'Manually blocked from Flow Inspector') => {
    if (blockedRef.current.some((entry) => entry.ip === ip)) return
    try {
      const response = await fetch(`${API}/api/blocklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, reason }),
      })
      if (!response.ok) throw new Error(`Blocklist update failed: ${response.status}`)
      const entry = await response.json()
      const normalized = { ip: entry.ip, blockedAt: entry.blockedAt, reason: entry.reason }
      const next = [...blockedRef.current, normalized]
      blockedRef.current = next
      setBlockedIps(next)
      setAlerts((current) => current.map((alert) => alert.src_ip === ip ? { ...alert, blocked: true } : alert))
    } catch (error) { console.error(error) }
  }
  const unblockSource = async (ip) => {
    try {
      const response = await fetch(`${API}/api/blocklist/${encodeURIComponent(ip)}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(`Blocklist removal failed: ${response.status}`)
    } catch (error) { console.error(error); return }
    const next = blockedRef.current.filter((entry) => entry.ip !== ip)
    blockedRef.current = next
    setBlockedIps(next)
    setAlerts((current) => current.map((alert) => alert.src_ip === ip ? { ...alert, blocked: false } : alert))
    setSelectedAlert((current) => current?.src_ip === ip ? { ...current, blocked: false } : current)
  }

  if (booting) return <main className="grid min-h-screen place-items-center bg-[#05060A]">
    <div className="w-[min(420px,calc(100vw-48px))] text-center">
      <div className="mono mb-5 text-xs text-[#86868B]">Hybrid-IDS // Initializing Engines...</div>
      <div className="h-px origin-left animate-[boot_650ms_ease-out] bg-gradient-to-r from-cyan-400 to-emerald-500" />
    </div></main>

  return <main className="ambient-noise min-h-screen overflow-x-hidden text-[#F5F5F7]">
    <Sidebar activeView={activeView} setActiveView={setActiveView} blockedCount={blockedIps.length}
      collapsed={isSidebarCollapsed} setCollapsed={setIsSidebarCollapsed} />
    <div className={`min-w-0 transition-[padding] duration-300 ease-out ${isSidebarCollapsed ? 'md:pl-[78px]' : 'md:pl-64'}`}>
      <div className="sticky top-0 z-40 px-3 pt-3 md:px-6 md:pt-4">
        <FloatingHeader status={socketStatus} isStreaming={isStreaming} activeView={activeView}
          setActiveView={setActiveView} blockedCount={blockedIps.length} onToggle={toggleStream}
          sourceMode={sourceMode} />
      </div>
      <div className="mx-auto max-w-[1240px] px-4 pb-10 md:px-6">
        {activeView === 'Live Triage' && <>
          <BentoTelemetry stats={stats} samples={samples} loading={loading} />
          <TriageWorkspace alerts={alerts} blockedIps={blockedIps} selectedAlert={selectedAlert}
            setSelectedAlert={setSelectedAlert} onBlock={blockSource} loading={loading} />
        </>}
        {activeView === 'Pipeline & Models' && <PipelineView stats={stats} />}
        {activeView === 'Firewall Blocklist' && <BlocklistView blockedIps={blockedIps} onUnblock={unblockSource} />}
      </div>
    </div>
  </main>
}
