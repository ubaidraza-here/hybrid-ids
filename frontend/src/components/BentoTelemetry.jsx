import { Activity, Gauge, ShieldAlert, TriangleAlert } from 'lucide-react'

export default function BentoTelemetry({ stats, samples, loading }) {
  const threats = stats?.threat_counts || {}
  const total = Number(stats?.total_flows || 0)
  const benign = total ? Math.round((Number(stats?.benign_count || 0) / total) * 100) : 100
  const signature = Number(threats.STAGE_1_SIGNATURE || 0)
  const supervised = Number(threats.STAGE_2_SUPERVISED_ML || 0)
  const anomalies = Number(threats.STAGE_3_ANOMALY_AI || 0)
  const cards = [
    ['Total Flows', total.toLocaleString(), 'Observed packets', Activity, 'text-zinc-700 dark:text-zinc-200'],
    ['Benign Traffic', `${benign}%`, 'Healthy baseline', Gauge, 'text-zinc-700 dark:text-zinc-200'],
    ['Threat Signals', (signature + supervised).toLocaleString(), 'S1 + S2 detections', ShieldAlert, 'text-rose-600 dark:text-rose-400'],
    ['Zero-Day AI', anomalies.toLocaleString(), 'Isolation anomalies', TriangleAlert, 'text-amber-600 dark:text-amber-400'],
  ]
  const width = 400
  const height = 80
  const safe = Array.isArray(samples) ? samples : Array(40).fill(18)
  const max = Math.max(...safe, 100)
  const rawPoints = safe.map((value, index) => {
    const x = index / Math.max(safe.length - 1, 1) * width
    const y = height - (value / max) * (height - 10) - 5
    return [x, y]
  })
  const curvePath = rawPoints.reduce((path, point, index, points) => {
    if (index === 0) return `M ${point[0]} ${point[1]}`
    const previous = points[index - 1]
    const controlX = (previous[0] + point[0]) / 2
    return `${path} C ${controlX} ${previous[1]}, ${controlX} ${point[1]}, ${point[0]} ${point[1]}`
  }, '')
  const areaPath = `${curvePath} L ${width} ${height} L 0 ${height} Z`
  return (
    <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {loading && cards.map(([label]) => <article key={label} className="liquid-glass min-h-[142px] animate-pulse rounded-3xl p-5"><div className="h-4 w-24 rounded bg-zinc-300/60 dark:bg-zinc-700/60" /><div className="mt-6 h-9 w-28 rounded-lg bg-zinc-300/60 dark:bg-zinc-700/60" /><div className="mt-3 h-3 w-32 rounded bg-zinc-300/40 dark:bg-zinc-800/70" /></article>)}
      {!loading && cards.map(([label, value, detail, Icon, color]) => (
        <article key={label} className={`liquid-glass group min-h-[142px] rounded-3xl p-5 transition-transform duration-300 hover:-translate-y-0.5 ${label === 'Threat Signals' && (signature + supervised) > 0 ? 'border-rose-500/30' : ''} ${label === 'Zero-Day AI' && anomalies > 0 ? 'border-amber-500/30' : ''}`}>
          <div className="flex items-center justify-between"><span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{label}</span><span className="grid h-9 w-9 place-items-center rounded-2xl border border-black/5 bg-zinc-100 dark:border-white/5 dark:bg-white/[0.055]"><Icon size={16} className={color} /></span></div>
          <div className={`mono mt-4 text-3xl font-medium ${label === 'Zero-Day AI' && anomalies > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[#09090B] dark:text-[#F4F4F5]'}`}>{value}</div>
          <div className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400">{detail}</div>
        </article>
      ))}
      {loading ? <article className="liquid-glass h-44 animate-pulse rounded-3xl p-5 md:col-span-2 xl:col-span-4"><div className="h-4 w-36 rounded bg-zinc-300/60 dark:bg-zinc-700/60" /><div className="mt-5 h-24 rounded-xl bg-zinc-200/60 dark:bg-zinc-800/60" /></article> :
      <article className="liquid-glass overflow-hidden rounded-3xl p-5 md:col-span-2 xl:col-span-4">
        <div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-semibold">Live Traffic Intensity</h2><p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">Rolling flow signal</p></div><span className="rounded-full border border-[var(--border)] bg-zinc-100 px-3 py-1.5 text-[9px] font-medium text-zinc-700 dark:bg-white/[0.06] dark:text-zinc-300">Live</span></div>
        <svg viewBox="0 0 400 80" className="h-28 w-full overflow-hidden" preserveAspectRatio="none" aria-label="Live traffic area sparkline">
          {[20,40,60].map((y) => <line key={y} x1="0" y1={y} x2={width} y2={y} stroke="currentColor" className="text-black/[0.06] dark:text-white/[0.06]" strokeDasharray="4 6" />)}
          <path d={curvePath} fill="none" stroke="var(--waveform)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      </article>
      }
    </section>
  )
}
