import { Cpu, Network, Radar } from 'lucide-react'

export default function PipelineView({ stats }) {
  const counts = stats?.threat_counts || {}
  const stages = [
    ['01', 'Deterministic Rules', 'STAGE 01 · SIGNATURE', 'Suspicious ports and volumetric signatures.', counts.STAGE_1_SIGNATURE || 0, Radar],
    ['02', 'Random Forest', 'STAGE 02 · SUPERVISED ML', '10-feature ensemble with 100% test accuracy.', counts.STAGE_2_SUPERVISED_ML || 0, Network],
    ['03', 'Isolation Forest', 'STAGE 03 · UNSUPERVISED AI', 'Anomaly threshold calibrated at -0.15.', counts.STAGE_3_ANOMALY_AI || 0, Cpu],
  ]
  return <section className="mt-5"><div className="mb-4"><h1 className="text-xl font-semibold">Hybrid Detection Pipeline</h1><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Three-stage real-time analysis engine</p></div>
    <div className="grid gap-4 md:grid-cols-3">{stages.map(([number, name, label, detail, hits, Icon]) =>
      <article key={name} className="liquid-glass min-h-64 rounded-3xl p-6" style={{ color: "var(--text-primary)", backgroundColor: "var(--bg-surface)" }}><div className="flex items-center justify-between"><span className="text-[11px] font-medium tracking-wider" style={{ color: "var(--text-secondary)" }}>{label}</span><span className="grid h-10 w-10 place-items-center rounded-2xl border" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-canvas)" }}><Icon size={18} /></span></div>
        <h2 className="mt-10 text-lg font-semibold">{name}</h2><p className="mt-2 min-h-12 text-xs leading-5" style={{ color: "var(--text-secondary)" }}>{detail}</p><div className="mono mt-6 border-t pt-5 text-2xl" style={{ borderColor: "var(--border)" }}>{hits}<span className="ml-2 text-xs" style={{ color: "var(--text-secondary)" }}>hits</span></div></article>)}</div>
  </section>
}
