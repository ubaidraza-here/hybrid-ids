import { useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import FloatingHeader from './components/FloatingHeader'
import BentoTelemetry from './components/BentoTelemetry'
import TriageWorkspace from './components/TriageWorkspace'
import PipelineView from './components/PipelineView'
import BlocklistView from './components/BlocklistView'

const API_BASE = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:8000')
const WS_BASE = import.meta.env.VITE_WS_URL ||
  (import.meta.env.PROD
    ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
    : 'ws://localhost:8000')
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
  const [pollingFallback, setPollingFallback] = useState(false)
  const [isPollingLive, setIsPollingLive] = useState(false)
  const [theme, setTheme] = useState(() => {
    const saved = window.localStorage.getItem('theme')
    return saved === 'light' ? 'light' : 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme((current) => current === 'dark' ? 'light' : 'dark')

  useEffect(() => {
    const bootTimer = window.setTimeout(() => setBooting(false), 400)
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
    const sameOriginProduction = import.meta.env.PROD &&
      !import.meta.env.VITE_API_URL
    if (!sameOriginProduction && !pollingFallback) return undefined
    if (!isStreaming) return undefined
    let stopped = false
    const poll = async () => {
      try {
        const response = await fetch(`${API}/api/tick`)
        if (!response.ok) throw new Error(`Tick request failed: ${response.status}`)
        const data = await response.json()
        setIsPollingLive(true)
        setSocketStatus('Connected')
        setIsStreaming(data?.is_streaming !== false)
        const incoming = Array.isArray(data?.alerts) ? data.alerts : []
        incoming.forEach((alert) => {
          const normalized = {
            ...alert,
            id: alert?.id ?? crypto.randomUUID?.() ?? String(Date.now()),
            timestamp: alert?.timestamp ?? new Date().toISOString(),
            confidence: Number(alert?.confidence ?? 0),
          }
          setAlerts((current) => [normalized, ...(Array.isArray(current) ? current : [])].slice(0, 200))
          setSamples((current) => [...current.slice(-39),
            normalized.threat_label === 'BENIGN' ? 18 : 82])
        })
        if (data?.stats && typeof data.stats === 'object') setStats({
          total_flows: Number(data.stats.total_flows || 0),
          benign_count: Number(data.stats.benign_count || 0),
          threat_counts: data.stats.threat_counts || {},
        })
        if (Array.isArray(data?.blocked_ips)) {
          blockedRef.current = data.blocked_ips
          setBlockedIps(data.blocked_ips)
        }
        setLoading(false)
      } catch (error) {
        setIsPollingLive(false)
        setSocketStatus('Reconnecting')
        console.error(error)
      }
    }
    poll()
    const intervalId = window.setInterval(() => {
      if (!stopped) poll()
    }, 1500)
    return () => {
      stopped = true
      window.clearInterval(intervalId)
    }
  }, [isStreaming, pollingFallback])

  useEffect(() => {
    let stopped = false
    let reconnectId
    const connect = () => {
      setSocketStatus('Reconnecting')
      try {
        const socket = new WebSocket(`${WS_BASE}/ws/alerts`)
        socketRef.current = socket
        socket.onopen = () => {
          setSocketStatus('Connected')
          setIsPollingLive(false)
          if (!import.meta.env.PROD) setPollingFallback(false)
        }
        socket.onclose = () => {
          setSocketStatus('Reconnecting')
          setPollingFallback(true)
          setIsPollingLive(false)
          if (!stopped) reconnectId = window.setTimeout(connect, 2500)
        }
        socket.onerror = () => {
          setPollingFallback(true)
          setIsPollingLive(false)
          socket.close()
        }
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

  if (booting) return <main className="grid min-h-screen place-items-center bg-[var(--canvas)]">
    <svg className="h-8 w-8 animate-spin text-zinc-500 dark:text-zinc-300" viewBox="0 0 32 32" aria-label="Loading">
      <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="2" />
      <path d="M16 4a12 12 0 0 1 11.2 7.7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </main>

  return <main className="min-h-screen overflow-x-hidden text-[var(--primary)]">
    <Sidebar activeView={activeView} setActiveView={setActiveView} blockedCount={blockedIps.length}
      collapsed={isSidebarCollapsed} setCollapsed={setIsSidebarCollapsed}
      theme={theme} toggleTheme={toggleTheme} />
    <div className={`min-w-0 transition-[padding] duration-300 ease-out ${isSidebarCollapsed ? 'md:pl-[78px]' : 'md:pl-64'}`}>
      <div className="sticky top-0 z-40 px-3 pt-3 md:px-6 md:pt-4">
        <FloatingHeader status={socketStatus} isStreaming={isStreaming} activeView={activeView}
          setActiveView={setActiveView} blockedCount={blockedIps.length} onToggle={toggleStream}
          sourceMode={sourceMode} isPollingLive={isPollingLive}
          theme={theme} toggleTheme={toggleTheme} />
      </div>
      <div className="mx-auto max-w-[1240px] px-4 pb-10 md:px-6">
        {activeView === 'Live Triage' && <>
          <BentoTelemetry stats={stats} samples={samples} loading={loading} />
          <TriageWorkspace alerts={alerts} blockedIps={blockedIps} selectedAlert={selectedAlert}
            setSelectedAlert={setSelectedAlert} onBlock={blockSource} loading={loading} />
        </>}
        {activeView === 'Pipeline & Models' && <PipelineView stats={stats} />}
        {activeView === 'Firewall Blocklist' && <BlocklistView blockedIps={blockedIps} onUnblock={unblockSource} onBlock={blockSource} />}
      </div>
    </div>
  </main>
}
