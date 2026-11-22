import { useState } from 'react'
import { Ban, ShieldCheck } from 'lucide-react'

export default function BlocklistView({ blockedIps, onUnblock, onBlock }) {
  const [ip, setIp] = useState('')
  const [reason, setReason] = useState('')
  const submitBlock = () => {
    if (!ip.trim()) return
    onBlock?.(ip.trim(), reason.trim() || 'Manually blocked from Firewall Blocklist')
    setIp('')
    setReason('')
  }
  return (
    <section className="mt-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Firewall Blocklist</h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Manually isolated source addresses</p>
        </div>
        <div className="liquid-glass mb-3 rounded-2xl p-4">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            <input value={ip} onChange={(event) => setIp(event.target.value)} placeholder="Source IP address" className="h-10 rounded-xl border px-3 text-sm outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
              style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", borderColor: "var(--border)" }} />
            <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" className="h-10 rounded-xl border px-3 text-sm outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
              style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", borderColor: "var(--border)" }} />
            <button type="button" onClick={submitBlock} disabled={!ip.trim()} className="h-10 rounded-xl border px-4 text-sm font-medium disabled:opacity-40 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
              style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-canvas)", borderColor: "var(--text-primary)" }}>Block IP</button>
          </div>
        </div>
        <span className="liquid-glass-pill px-3 py-2 text-[10px] text-rose-600 dark:text-rose-300">
          {blockedIps.length} {blockedIps.length === 1 ? 'address' : 'addresses'}
        </span>
      </div>
      <div className="liquid-glass overflow-hidden rounded-3xl">
        {blockedIps.length === 0 ? (
          <div className="grid min-h-72 place-items-center text-center">
            <div>
              <ShieldCheck size={28} className="mx-auto text-zinc-500 dark:text-zinc-300" />
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">No source IPs are currently blocked.</p>
            </div>
          </div>
        ) : blockedIps.map((entry) => (
          <div key={entry.ip} className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-5 last:border-0">
            <div>
              <div className="mono text-sm">{entry.ip}</div>
              <div className="mono mt-1 text-[9px] text-zinc-500 dark:text-zinc-400">
                {new Date(entry.blockedAt).toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{entry.reason}</div>
            </div>
            <button type="button" onClick={() => onUnblock(entry.ip)} className="liquid-glass-pill flex h-9 items-center gap-2 px-3 text-[10px] focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
              style={{ color: "var(--text-primary)", backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
              <Ban size={12} />Unblock
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
