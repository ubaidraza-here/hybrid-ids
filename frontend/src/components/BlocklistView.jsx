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
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full items-center justify-between gap-3 lg:w-auto">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">Firewall Blocklist</h1>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Manually isolated source addresses</p>
          </div>
          <span className="liquid-glass-pill shrink-0 px-3 py-2 text-[10px] text-rose-600 dark:text-rose-300">
            {blockedIps.length} {blockedIps.length === 1 ? 'address' : 'addresses'}
          </span>
        </div>
        <div className="liquid-glass w-full rounded-2xl p-3 sm:p-4 lg:max-w-[620px]">
          <div className="flex w-full flex-col gap-2.5 sm:flex-row">
            <input value={ip} onChange={(event) => setIp(event.target.value)} placeholder="Source IP address" className="h-10 w-full min-w-0 rounded-xl border px-3 text-sm outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 sm:flex-1"
              style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", borderColor: "var(--border)" }} />
            <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason" className="h-10 w-full min-w-0 rounded-xl border px-3 text-sm outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 sm:flex-1"
              style={{ backgroundColor: "var(--bg-surface)", color: "var(--text-primary)", borderColor: "var(--border)" }} />
            <button type="button" onClick={submitBlock} disabled={!ip.trim()} className="h-10 w-full shrink-0 rounded-xl border px-4 text-sm font-medium disabled:opacity-40 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 sm:w-auto"
              style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-canvas)", borderColor: "var(--text-primary)" }}>Block IP</button>
          </div>
        </div>
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
          <div key={entry.ip} className="flex flex-col items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-4 sm:flex-row sm:items-center sm:px-5 sm:py-5 last:border-0">
            <div className="min-w-0 max-w-full">
              <div className="mono text-sm">{entry.ip}</div>
              <div className="mono mt-1 text-[9px] text-zinc-500 dark:text-zinc-400">
                {new Date(entry.blockedAt).toLocaleString()}
              </div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{entry.reason}</div>
            </div>
            <button type="button" onClick={() => onUnblock(entry.ip)} className="liquid-glass-pill flex h-9 w-full shrink-0 items-center justify-center gap-2 px-3 text-[10px] focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 sm:w-auto"
              style={{ color: "var(--text-primary)", backgroundColor: "var(--bg-surface)", borderColor: "var(--border)" }}>
              <Ban size={12} />Unblock
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
