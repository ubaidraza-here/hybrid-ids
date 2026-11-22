import { Activity, Gauge, ShieldAlert, TriangleAlert } from 'lucide-react'

export default function BentoTelemetry({ stats, samples, loading }) {
  const threats = stats?.threat_counts || {}
  const total = Number(stats?.total_flows || 0)
  const benign = total ? Math.round((Number(stats?.benign_count || 0) / total) * 100) : 100
  const signature = Number(threats.STAGE_1_SIGNATURE || 0)
  const supervised = Number(threats.STAGE_2_SUPERVISED_ML || 0)
  const anomalies = Number(threats.STAGE_3_ANOMALY_AI || 0)
  const cards = [
    ['Total Flows', total.toLocaleString(), 'Observed packets', Activity, 'text-cyan-300'],
    ['Benign Traffic', `${benign}%`, 'Healthy baseline', Gauge, 'text-emerald-300'],
    ['Threat Signals', (signature + supervised).toLocaleString(), 'S1 + S2 detections', ShieldAlert, 'text-sky-300'],
    ['Zero-Day AI', anomalies.toLocaleString(), 'Isolation anomalies', TriangleAlert, 'text-amber-300'],
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
      {cards.map(([label, value, detail, Icon, color]) => (
        <article key={label} className="liquid-glass group min-h-[142px] rounded-3xl p-5 transition-transform duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold text-[#86868B]">{label}</span><span className="grid h-9 w-9 place-items-center rounded-2xl bg-white/[0.055]"><Icon size={16} className={color} /></span></div>
          {loading ? <span className="mt-5 block h-9 w-28 animate-pulse rounded-xl bg-white/[0.06]" /> :
            <div className={`mono mt-4 text-3xl font-medium ${label === 'Zero-Day AI' && anomalies > 0 ? 'text-[#FBBF24]' : 'text-[#F5F5F7]'}`}>{value}</div>}
          <div className="mt-2 text-[10px] text-[#86868B]">{detail}</div>
        </article>
      ))}
      <article className="liquid-glass overflow-hidden rounded-3xl p-5 md:col-span-2 xl:col-span-4">
        <div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-semibold">Live Traffic Intensity</h2><p className="mt-1 text-[10px] text-[#86868B]">Rolling WebSocket flow signal</p></div><span className="rounded-full bg-cyan-400/10 px-3 py-1.5 text-[9px] text-cyan-300 ring-1 ring-cyan-400/20">STREAMING</span></div>
        <svg viewBox="0 0 400 80" className="h-28 w-full overflow-hidden" preserveAspectRatio="none" aria-label="Live traffic area sparkline">
          <defs><linearGradient id="glassArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38BDF8" stopOpacity=".38" /><stop offset="100%" stopColor="#818CF8" stopOpacity="0" /></linearGradient></defs>
          {[20,40,60].map((y) => <line key={y} x1="0" y1={y} x2={width} y2={y} stroke="rgba(255,255,255,.05)" strokeDasharray="4 6" />)}
          <path d={areaPath} fill="url(#glassArea)" />
          <path d={curvePath} fill="none" stroke="#67E8F9" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      </article>
    </section>
  )
}
