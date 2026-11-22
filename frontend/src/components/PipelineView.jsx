import { Cpu, Network, Radar } from 'lucide-react'

export default function PipelineView({ stats }) {
  const counts = stats?.threat_counts || {}
  const stages = [
    ['01', 'Deterministic Rules', 'Stage 1 Signature', 'Suspicious ports and volumetric signatures.', counts.STAGE_1_SIGNATURE || 0, Radar, 'rose'],
    ['02', 'Random Forest', 'Stage 2 Supervised ML', '10-feature ensemble with 100% test accuracy.', counts.STAGE_2_SUPERVISED_ML || 0, Network, 'sky'],
    ['03', 'Isolation Forest', 'Stage 3 Zero-Day AI', 'Anomaly threshold calibrated at -0.15.', counts.STAGE_3_ANOMALY_AI || 0, Cpu, 'amber'],
  ]
  return <section className="mt-5"><div className="mb-4"><h1 className="text-xl font-semibold">Hybrid Detection Pipeline</h1><p className="mt-1 text-xs text-[#86868B]">Three-stage real-time analysis engine</p></div>
    <div className="grid gap-4 md:grid-cols-3">{stages.map(([number, name, label, detail, hits, Icon, color]) =>
      <article key={name} className="liquid-glass min-h-64 rounded-3xl p-6"><div className="flex items-center justify-between"><span className={`mono text-[10px] text-${color}-300`}>{number} / {label}</span><span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.055]"><Icon size={18} /></span></div>
        <h2 className="mt-10 text-lg font-semibold">{name}</h2><p className="mt-2 min-h-12 text-xs leading-5 text-[#86868B]">{detail}</p><div className="mono mt-6 border-t border-white/[0.08] pt-5 text-2xl">{hits}<span className="ml-2 text-xs text-[#86868B]">hits</span></div></article>)}</div>
  </section>
}
