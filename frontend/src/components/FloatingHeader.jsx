import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Menu, Pause, Play, Radar, Shield, X, Zap } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:8000')

const views = ['Live Triage', 'Pipeline & Models', 'Firewall Blocklist']
const attacks = [
  ['DDoS', 'DDoS Flood', 'Tests Stage 1 volumetric signatures'],
  ['PortScan', 'Port Scan', 'Tests suspicious port signatures'],
  ['BruteForce', 'Brute Force', 'Tests Stage 1 & Stage 2 models'],
  ['SuspiciousPort', 'Suspicious Port', 'Tests deterministic rules'],
  ['ZeroDayAnomaly', 'Zero-Day Anomaly', 'Tests Isolation Forest Stage 3'],
]

export default function FloatingHeader({ status, isStreaming, activeView, setActiveView, blockedCount, onToggle, sourceMode = 'simulated' }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [attackOpen, setAttackOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const attackRef = useRef(null)
  const connected = status === 'Connected'
  useEffect(() => {
    const close = (event) => { if (attackRef.current && !attackRef.current.contains(event.target)) setAttackOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])
  const simulate = async (type, label) => {
    setFeedback(`${label} sent`)
    setAttackOpen(false)
    try {
      const response = await fetch(`${API_BASE}/api/simulate/${type}`, { method: 'POST' })
      if (!response.ok) throw new Error(`Simulation failed: ${response.status}`)
    } catch (error) { setFeedback(error.message); console.error(error) }
  }
  const selectView = (view) => { setActiveView(view); setMenuOpen(false) }
  return <>
    <header className="liquid-glass-pill mx-auto flex h-14 max-w-[1240px] items-center justify-between px-3 md:px-4">
      <div className="flex items-center gap-2.5">
        <button type="button" aria-label="Open navigation" onClick={() => setMenuOpen(true)} className="grid h-9 w-9 place-items-center rounded-full md:hidden"><Menu size={18} /></button>
        <div className="hidden h-8 w-px bg-white/[0.08] md:block" />
        <div><div className="text-xs font-semibold md:text-sm">{activeView}</div><div className="hidden text-[9px] text-[#86868B] md:block">Hybrid detection console</div></div>
      </div>
      <div className="flex items-center gap-2">
        <span className="mono hidden items-center gap-2 text-xs text-zinc-300 sm:flex"><span className={`h-[6px] w-[6px] rounded-full ${connected ? 'animate-pulse bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'animate-pulse bg-amber-400'}`} />{connected ? `LIVE · ${sourceMode === 'live' ? 'NIC' : 'SIM'}` : status}</span>
        <div ref={attackRef} className="relative hidden sm:block" onMouseEnter={() => setAttackOpen(true)} onMouseLeave={() => setAttackOpen(false)}>
          <button type="button" onClick={() => setAttackOpen(!attackOpen)} className="flex h-9 items-center gap-2 rounded-full border border-white/12 bg-white/[0.07] px-3 text-[11px] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,.12)] hover:bg-white/[0.12]"><Radar size={13} />Simulate<ChevronDown size={12} className={`transition-transform duration-200 ${attackOpen ? 'rotate-180' : ''}`} /></button>
          {attackOpen && <div className="liquid-glass absolute right-0 top-11 w-72 rounded-2xl p-2 shadow-2xl">
            {attacks.map(([type, label, detail]) => <button key={type} type="button" onClick={() => simulate(type, label)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-white/[0.07]"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white/[0.05] text-cyan-300"><Zap size={14} /></span><span><span className="block text-xs font-semibold">{label}</span><span className="mt-0.5 block text-[9px] text-[#86868B]">{detail}</span></span></button>)}
            {feedback && <div className="mono mt-1 border-t border-white/[0.07] px-3 pt-2 text-[9px] text-emerald-300">{feedback}</div>}
          </div>}
        </div>
        <button type="button" onClick={() => onToggle(isStreaming ? 'stop' : 'start')} aria-label={isStreaming ? 'Pause stream' : 'Start stream'}
          className="flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 text-[10px] text-zinc-100 backdrop-blur-xl transition-all hover:bg-white/[0.11] active:scale-95">
          {isStreaming ? <Pause size={13} /> : <Play size={13} />}<span className="hidden sm:inline">{isStreaming ? 'Pause' : 'Start'}</span>
        </button>
      </div>
    </header>
    {menuOpen && <div className="fixed inset-0 z-[100] flex h-screen w-screen flex-col bg-[#05060A]/95 p-5 backdrop-blur-2xl md:hidden">
      <div className="liquid-glass-pill flex h-14 items-center justify-between px-4"><div className="flex items-center gap-2"><Shield size={16} className="text-cyan-300" /><span className="text-sm font-bold">Hybrid-IDS</span></div><button type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><X size={20} /></button></div>
      <nav className="mt-6 space-y-3">{views.map((view) => <button key={view} type="button" onClick={() => selectView(view)}
        className={`liquid-glass flex h-16 w-full items-center justify-between rounded-2xl px-5 text-left ${activeView === view ? 'text-cyan-200' : 'text-[#F5F5F7]'}`}><span className="text-lg font-semibold">{view}</span>{view === 'Firewall Blocklist' && <span className="mono text-xs text-rose-300">{blockedCount}</span>}</button>)}</nav>
      <div className="mt-auto">
        <button type="button" onClick={() => onToggle(isStreaming ? 'stop' : 'start')} className="liquid-glass-pill mb-3 flex h-12 w-full items-center justify-center gap-2 text-sm">
          {isStreaming ? <Pause size={16} /> : <Play size={16} />}Stream {isStreaming ? 'Active' : 'Paused'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          {attacks.map(([type, label]) => <button key={type} type="button" onClick={() => { simulate(type, label); setMenuOpen(false) }}
            className="liquid-glass flex h-11 items-center justify-center gap-2 rounded-2xl px-2 text-[9px] text-cyan-100"><Zap size={12} />{type}</button>)}
        </div>
      </div>
    </div>}
  </>
}
