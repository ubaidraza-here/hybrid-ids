import { Ban, ShieldCheck } from 'lucide-react'

export default function BlocklistView({ blockedIps, onUnblock }) {
  return <section className="mt-5"><div className="mb-4 flex items-center justify-between"><div><h1 className="text-xl font-semibold">Firewall Blocklist</h1><p className="mt-1 text-xs text-[#86868B]">Manually isolated source addresses</p></div><span className="liquid-glass-pill px-3 py-2 text-[10px] text-rose-300">{blockedIps.length} blocked</span></div>
    <div className="liquid-glass overflow-hidden rounded-3xl">{blockedIps.length === 0 ?
      <div className="grid min-h-72 place-items-center text-center"><div><ShieldCheck size={28} className="mx-auto text-emerald-400" /><p className="mt-3 text-sm text-[#86868B]">No source IPs are currently blocked.</p></div></div> :
      blockedIps.map((entry) => <div key={entry.ip} className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-5 last:border-0"><div><div className="mono text-sm">{entry.ip}</div><div className="mono mt-1 text-[9px] text-[#86868B]">{new Date(entry.blockedAt).toLocaleString()}</div><div className="mt-1 text-xs text-[#86868B]">{entry.reason}</div></div><button type="button" onClick={() => onUnblock(entry.ip)} className="liquid-glass-pill flex h-9 items-center gap-2 px-3 text-[10px] text-rose-300"><Ban size={12} />Unblock</button></div>)}</div>
  </section>
}
