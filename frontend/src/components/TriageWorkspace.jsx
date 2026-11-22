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
          style={activeFilter === value ? {
            backgroundColor: 'var(--text-primary, #18181b)',
            color: 'var(--bg-canvas, #ffffff)',
            borderColor: 'var(--text-primary, #18181b)',
          } : undefined}
          className={`liquid-glass-pill h-9 shrink-0 border px-3 text-[10px] font-medium focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${activeFilter !== value ? 'bg-transparent text-zinc-600 border-zinc-200 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:border-zinc-800 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/60' : ''}`}>{label}</button>)}</div>
      <div className="flex items-center gap-2">
        <label className="liquid-glass-pill flex h-10 min-w-0 flex-1 items-center gap-2 px-4 md:w-64" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}><Search size={14} style={{ color: "var(--text-secondary)" }} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search IP, port, label" className="mono min-w-0 w-full bg-transparent text-[10px] outline-none" style={{ color: "var(--text-primary)" }} /></label>
        <button type="button" onClick={exportCsv} disabled={visible.length === 0}
          className="liquid-glass-pill flex h-10 shrink-0 items-center gap-2 px-3 text-[10px] disabled:opacity-40 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
          style={{ color: "var(--text-primary)", backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}><Download size={13} />Export CSV</button>
      </div>
    </div>
    <div className="hidden md:block"><div className="liquid-glass overflow-hidden rounded-3xl">
      <table className="w-full table-fixed text-left"><thead className="mono text-[9px] uppercase text-zinc-500 dark:text-zinc-400"><tr>{['Time','Source → Destination','Classification','Detection Engine','Confidence','Severity'].map((label,index)=><th key={label} className={`px-4 py-3.5 font-normal ${index===1?'w-[31%]':''}`}>{label}</th>)}</tr></thead>
      <tbody>{loading ? Array.from({ length: 6 }, (_, index) => <tr key={index} className="border-t border-[var(--border)] animate-pulse"><td colSpan="6" className="px-4 py-3.5"><div className="h-5 w-full rounded bg-zinc-200/70 dark:bg-zinc-800/70" /></td></tr>) : visible.map((alert)=><DesktopRow key={alert.id} alert={alert} blocked={isBlocked(alert.src_ip)} onClick={()=>setSelectedAlert(alert)} />)}</tbody></table>
    </div></div>
    <div className="space-y-3 md:hidden">{loading ? Array.from({ length: 6 }, (_, index) => <div key={index} className="liquid-glass h-28 animate-pulse rounded-2xl p-4"><div className="h-3 w-20 rounded bg-zinc-300/60 dark:bg-zinc-700/60" /><div className="mt-4 h-4 w-44 rounded bg-zinc-300/60 dark:bg-zinc-700/60" /><div className="mt-5 h-2 w-full rounded bg-zinc-300/40 dark:bg-zinc-800/70" /></div>) : visible.map((alert)=><MobileCard key={alert.id} alert={alert} blocked={isBlocked(alert.src_ip)} onClick={()=>setSelectedAlert(alert)} />)}</div>
    {selectedAlert && <Inspector alert={selectedAlert} blocked={isBlocked(selectedAlert.src_ip)} onClose={()=>setSelectedAlert(null)} onBlock={onBlock} />}
  </section>
}

function DesktopRow({ alert, blocked, onClick }) {
  const isZeroDay = alert.detection_stage === 'STAGE_3_ANOMALY_AI'
  const isCritical = alert.severity === 'CRITICAL'
  const rowClass = isCritical
    ? 'border-l-2 border-l-rose-500'
    : isZeroDay ? 'border-l-2 border-l-amber-500' : 'border-l-2 border-l-transparent'
  return <tr onClick={onClick} className={`mono cursor-pointer border-t border-[var(--border)] text-[11px] bg-white transition-colors hover:bg-zinc-50 dark:bg-[#111114] dark:hover:bg-zinc-900/70 ${rowClass}`}>
    <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400">{new Date(alert.timestamp).toLocaleTimeString([], {hour12:false})}</td><td className="px-4 py-3.5">{alert.src_ip} <span className="text-zinc-400">→</span> {alert.dst_ip}:{alert.dst_port}</td>
    <td className="px-4 py-3.5">{blocked && <span className="mr-2 text-[10px] font-medium text-rose-600 dark:text-rose-400">Blocked</span>}{alert.threat_label}</td>
    <td className="px-4 py-3.5"><DetectionLabel stage={alert.detection_stage} /></td>
    <td className="px-4 py-3.5">{Math.round(alert.confidence*100)}%</td>
    <td className={`px-4 py-3.5 ${severityClass(alert.severity)}`}>{severityLabel(alert.severity)}</td>
  </tr>
}

function MobileCard({ alert, blocked, onClick }) {
  const confidence = Math.round(alert.confidence*100)
  const isCritical = alert.severity === 'CRITICAL'
  const isZeroDay = alert.detection_stage === 'STAGE_3_ANOMALY_AI'
  const rowClass = isCritical ? 'border-l-2 border-l-rose-500' : isZeroDay ? 'border-l-2 border-l-amber-500' : 'border-l-2 border-l-transparent'
  return <button type="button" onClick={onClick} className={`liquid-glass block w-full rounded-2xl p-4 text-left ${rowClass}`}>
    <div className="flex items-center justify-between"><span className={severityClass(alert.severity)}>{blocked ? 'Blocked' : severityLabel(alert.severity)}</span><span className="mono text-[9px] text-zinc-500 dark:text-zinc-400">{new Date(alert.timestamp).toLocaleTimeString([], {hour12:false})}</span></div>
    <div className="mt-2"><DetectionLabel stage={alert.detection_stage} /></div>
    <div className="mono mt-3 text-xs">{alert.src_ip}<span className="mx-2 text-zinc-400">→</span>{alert.dst_ip}:{alert.dst_port}</div>
    <div className="mt-3 flex items-center gap-3"><span className="text-xs font-semibold">{alert.threat_label}</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/[0.07]"><div className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100" style={{width:`${confidence}%`}} /></div><span className="mono text-[9px] text-zinc-600 dark:text-zinc-300">{confidence}%</span></div>
  </button>
}

function severityClass(severity) {
  const normalized = String(severity).toUpperCase()
  if (normalized === 'CRITICAL') return 'text-rose-600 dark:text-rose-400 font-medium'
  if (normalized === 'HIGH' || normalized === 'MEDIUM') return 'text-amber-600 dark:text-amber-400 font-medium'
  return 'text-zinc-500 dark:text-zinc-400'
}

function severityLabel(severity) {
  const normalized = String(severity).toLowerCase()
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function DetectionLabel({ stage }) {
  if (stage === 'STAGE_1_SIGNATURE') return <span className="flex items-center gap-2 font-sans text-xs font-medium"><span className="h-[6px] w-[6px] rounded-full bg-rose-500" />S1 · Signature</span>
  if (stage === 'STAGE_2_SUPERVISED_ML') return <span className="flex items-center gap-2 font-sans text-xs font-medium"><span className="h-[6px] w-[6px] rounded-full bg-indigo-500" />S2 · Random Forest</span>
  if (stage === 'STAGE_3_ANOMALY_AI') return <span className="flex items-center gap-2 font-sans text-xs font-medium"><span className="h-[6px] w-[6px] rounded-full bg-amber-500" />S3 · Isolation AI</span>
  return <span className="flex items-center gap-2 font-sans text-xs font-medium"><span className="h-[6px] w-[6px] rounded-full bg-zinc-400" />Baseline</span>
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
    <aside className="liquid-glass fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto overscroll-contain touch-pan-y rounded-t-3xl p-5 pb-0 md:inset-y-3 md:left-auto md:right-3 md:w-[440px] md:max-h-none md:rounded-l-3xl md:rounded-r-3xl">
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 md:hidden" />
      <header className="flex items-center justify-between"><div><div className="text-sm font-semibold">Flow Inspector</div><div className="mono mt-1 text-[9px] text-zinc-500 dark:text-zinc-400">{alert.id}</div></div><button type="button" onClick={onClose} aria-label="Close inspector"><X size={18} /></button></header>
      <section className="mt-5"><div className="flex items-center justify-between"><span className={severityClass(alert.severity)}>{severityLabel(alert.severity)}</span><DetectionLabel stage={alert.detection_stage} /></div>
        <div className="mono mt-5 text-sm" style={{ color: "var(--text-primary)" }}>{alert.src_ip}<span className="mx-2" style={{ color: "var(--text-secondary)" }}>→</span>{alert.dst_ip}:{alert.dst_port}</div>
        </section>
      <section className="mt-5 border-t border-[var(--border)] pt-4"><div className="mb-2 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">3-Stage Pipeline Trace</div>
        {stages.map(([label, stage]) => { const triggered = alert.detection_stage === stage; return <div key={stage} className="flex h-11 items-center border-b border-[var(--border)] text-[11px]"><span className="flex-1">{label}</span><span className={triggered ? 'text-amber-600 dark:text-amber-300' : 'text-zinc-500 dark:text-zinc-400'}>{triggered ? 'Triggered' : 'Passed'}</span></div> })}
      </section><section className="mt-5"><div className="mb-2 text-[10px] text-zinc-500 dark:text-zinc-400">Feature explanation</div><p className="mono rounded-2xl border border-[var(--border)] bg-zinc-100/70 p-3 text-[10px] leading-5 text-zinc-600 dark:bg-black/15 dark:text-zinc-300">{alert.explanation}</p></section>
      <div className="sticky bottom-0 -mx-5 mt-5 border-t border-[var(--border)] px-5 py-3" style={{ backgroundColor: "var(--bg-surface)" }}>
        <button type="button" onClick={() => onBlock(alert.src_ip, alert.explanation || 'Manually blocked from Flow Inspector')} disabled={blocked}
          className="liquid-glass-pill flex h-11 w-full items-center justify-center gap-2 text-[11px] text-rose-600 disabled:opacity-50 dark:text-rose-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"><Ban size={14} />{blocked ? 'Source IP blocked' : 'Block Source IP'}</button>
        <button type="button" onClick={onClose} className="mt-2 h-9 w-full text-xs text-[var(--text-secondary)] focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400">Close Inspector</button>
      </div>
    </aside>
  </>
}
