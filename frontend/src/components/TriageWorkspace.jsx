import { useEffect, useMemo, useState } from 'react'
import { Ban, Download, Search, X } from 'lucide-react'
import useBodyScrollLock from '../hooks/useBodyScrollLock'

const filters = [['ALL','All'],['THREAT','Threats'],['STAGE_1_SIGNATURE','Stage 1'],['STAGE_2_SUPERVISED_ML','Stage 2'],['STAGE_3_ANOMALY_AI','Stage 3']]

export default function TriageWorkspace({ alerts, blockedIps, selectedAlert, setSelectedAlert, onBlock, loading }) {
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const isBlocked = (ip) => blockedIps.some((entry) => entry.ip === ip)
  const visible = useMemo(() => (Array.isArray(alerts) ? alerts : []).filter((alert) => {
    if (activeFilter === 'THREAT' && alert.threat_label === 'BENIGN') return false
    if (!['ALL','THREAT'].includes(activeFilter) && alert.detection_stage !== activeFilter) return false
    const query = search.trim().toLowerCase()
    return !query || `${alert.src_ip} ${alert.dst_ip} ${alert.dst_port} ${alert.threat_label}`.toLowerCase().includes(query)
  }), [alerts, activeFilter, search, blockedIps])

  const exportCsv = () => {
    const headers = ['timestamp','src_ip','dst_ip','dst_port','threat_label','detection_stage','severity','confidence','explanation']
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const rows = visible.map((alert) => headers.map((key) =>
      key === 'confidence' ? escape(Math.round(Number(alert.confidence || 0) * 100) / 100) : escape(alert[key])).join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'hybrid-ids-forensics.csv'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return <section className="mt-5 tabular-nums">
    <div className="liquid-glass mb-3 flex flex-col gap-3 rounded-3xl p-3 md:flex-row md:items-center md:justify-between">
      <div className="scrollbar-thin flex items-center gap-1 overflow-x-auto">{filters.map(([value,label]) =>
        <button key={value} type="button" onClick={() => setActiveFilter(value)}
          className={`liquid-glass-pill h-9 shrink-0 px-3 text-[10px] ${activeFilter === value ? 'text-cyan-200 ring-1 ring-cyan-400/25' : 'text-[#86868B] hover:text-white'}`}>{label}</button>)}</div>
      <div className="flex items-center gap-2">
        <label className="liquid-glass-pill flex h-10 min-w-0 flex-1 items-center gap-2 px-4 md:w-64"><Search size={14} className="text-[#86868B]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search IP, port, label" className="mono min-w-0 w-full bg-transparent text-[10px] outline-none placeholder:text-[#626268]" /></label>
        <button type="button" onClick={exportCsv} disabled={visible.length === 0}
          className="liquid-glass-pill flex h-10 shrink-0 items-center gap-2 px-3 text-[10px] text-cyan-100 disabled:opacity-40"><Download size={13} />Export CSV</button>
      </div>
    </div>
    <div className="hidden md:block"><div className="liquid-glass overflow-hidden rounded-3xl">
      <table className="w-full table-fixed text-left"><thead className="mono text-[9px] uppercase text-[#86868B]"><tr>{['Time','Source → Destination','Classification','Detection Engine','Confidence','Severity'].map((label,index)=><th key={label} className={`px-4 py-3.5 font-normal ${index===1?'w-[31%]':''}`}>{label}</th>)}</tr></thead>
      <tbody>{loading ? <tr><td colSpan="6" className="px-4 py-10 text-center text-xs text-[#86868B]">Loading live flows...</td></tr> : visible.map((alert)=><DesktopRow key={alert.id} alert={alert} blocked={isBlocked(alert.src_ip)} onClick={()=>setSelectedAlert(alert)} />)}</tbody></table>
    </div></div>
    <div className="space-y-3 md:hidden">{loading ? <div className="liquid-glass rounded-2xl p-5 text-xs text-[#86868B]">Loading live flows...</div> : visible.map((alert)=><MobileCard key={alert.id} alert={alert} blocked={isBlocked(alert.src_ip)} onClick={()=>setSelectedAlert(alert)} />)}</div>
    {selectedAlert && <Inspector alert={selectedAlert} blocked={isBlocked(selectedAlert.src_ip)} onClose={()=>setSelectedAlert(null)} onBlock={onBlock} />}
  </section>
}

function DesktopRow({ alert, blocked, onClick }) {
  const stageStyle = stageStyleFor(alert.detection_stage)
  return <tr onClick={onClick} className="mono cursor-pointer border-t border-white/[0.07] text-[11px] transition-colors hover:bg-white/[0.045]">
    <td className="px-4 py-3.5 text-[#86868B]">{new Date(alert.timestamp).toLocaleTimeString([], {hour12:false})}</td><td className="px-4 py-3.5">{alert.src_ip} <span className="text-[#626268]">→</span> {alert.dst_ip}:{alert.dst_port}</td>
    <td className="px-4 py-3.5">{blocked && <span className="mr-2 text-[8px] text-rose-300">BLOCKED</span>}{alert.threat_label}</td><td className="px-4 py-3.5"><span className={`rounded-full px-2 py-1 text-[8px] ring-1 ${stageStyle}`}>{alert.detection_stage}</span></td>
    <td className="px-4 py-3.5">{Math.round(alert.confidence*100)}%</td>    <td className={`px-4 py-3.5 ${severityClass(alert.severity)}`}>{alert.severity}</td>
  </tr>
}

function MobileCard({ alert, blocked, onClick }) {
  const confidence = Math.round(alert.confidence*100)
  return <button type="button" onClick={onClick} className="liquid-glass block w-full rounded-2xl p-4 text-left">
    <div className="flex items-center justify-between"><span className={`rounded-full px-2 py-1 text-[9px] ${blocked?'bg-rose-500/12 text-rose-300 ring-1 ring-rose-400/25':'bg-sky-500/12 text-sky-300 ring-1 ring-sky-400/25'}`}>{blocked?'BLOCKED':alert.severity}</span><span className="mono text-[9px] text-[#86868B]">{new Date(alert.timestamp).toLocaleTimeString([], {hour12:false})}</span></div>
    <div className="mono mt-3 text-xs">{alert.src_ip}<span className="mx-2 text-[#626268]">→</span>{alert.dst_ip}:{alert.dst_port}</div>
    <div className="mt-3 flex items-center gap-3"><span className="text-xs font-semibold">{alert.threat_label}</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-cyan-400" style={{width:`${confidence}%`}} /></div><span className="mono text-[9px] text-cyan-300">{confidence}%</span></div>
  </button>
}

function severityClass(severity) {
  const normalized = String(severity).toUpperCase()
  if (normalized === 'CRITICAL') return 'text-rose-400 font-medium'
  if (normalized === 'HIGH') return 'text-amber-400'
  if (normalized === 'MEDIUM') return 'text-sky-400'
  return 'text-zinc-500'
}

function stageStyleFor(stage) {
  if (stage==='STAGE_1_SIGNATURE') return 'bg-rose-500/12 text-rose-300 ring-rose-400/25'
  if (stage==='STAGE_2_SUPERVISED_ML') return 'bg-sky-500/12 text-sky-300 ring-sky-400/25'
  if (stage==='STAGE_3_ANOMALY_AI') return 'bg-amber-500/12 text-amber-300 ring-amber-400/25'
  return 'bg-white/[0.04] text-[#86868B] ring-white/[0.08]'
}

function Inspector({ alert, blocked, onClose, onBlock }) {
  useBodyScrollLock(Boolean(alert))
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])
  const stages = [
    ['Stage 1 Signature', 'STAGE_1_SIGNATURE'],
    ['Stage 2 Random Forest', 'STAGE_2_SUPERVISED_ML'],
    ['Stage 3 Isolation Forest', 'STAGE_3_ANOMALY_AI'],
  ]
  return <>
    <button type="button" aria-label="Close inspector" onClick={onClose} className="fixed inset-0 z-40 bg-black/45 backdrop-blur-sm" />
    <aside className="liquid-glass fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-y-auto overscroll-contain touch-pan-y rounded-t-3xl p-5 md:inset-y-3 md:left-auto md:right-3 md:w-[440px] md:max-h-none md:rounded-l-3xl md:rounded-r-3xl">
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 md:hidden" />
      <header className="flex items-center justify-between"><div><div className="text-sm font-semibold">Flow Inspector</div><div className="mono mt-1 text-[9px] text-[#86868B]">{alert.id}</div></div><button type="button" onClick={onClose} aria-label="Close inspector"><X size={18} /></button></header>
      <section className="mt-5"><div className="flex items-center justify-between"><span className={`rounded-full px-2.5 py-1 text-[9px] ring-1 ${stageStyleFor(alert.detection_stage)}`}>{alert.severity}</span><span className="text-sm font-semibold">{alert.threat_label}</span></div>
        <div className="mono mt-5 text-sm">{alert.src_ip}<span className="mx-2 text-[#626268]">→</span>{alert.dst_ip}:{alert.dst_port}</div>
        <button type="button" onClick={() => onBlock(alert.src_ip, alert.explanation || 'Manually blocked from Flow Inspector')} disabled={blocked}
          className="liquid-glass-pill mt-4 flex h-11 w-full items-center justify-center gap-2 text-[11px] text-rose-300 disabled:opacity-50"><Ban size={14} />{blocked ? 'Source IP blocked' : 'Block Source IP'}</button></section>
      <section className="mt-5 border-t border-white/[0.08] pt-4"><div className="mb-2 text-[10px] font-semibold text-[#86868B]">3-Stage Pipeline Trace</div>
        {stages.map(([label, stage]) => { const triggered = alert.detection_stage === stage; return <div key={stage} className="flex h-11 items-center border-b border-white/[0.07] text-[11px]"><span className="flex-1">{label}</span><span className={triggered ? 'text-amber-300' : 'text-[#86868B]'}>{triggered ? 'Triggered' : 'Passed'}</span></div> })}
      </section><section className="mt-5"><div className="mb-2 text-[10px] text-[#86868B]">AI feature explanation</div><p className="mono rounded-2xl border border-white/[0.08] bg-black/15 p-3 text-[10px] leading-5 text-[#A1A1AA]">{alert.explanation}</p></section>
    </aside>
  </>
}
