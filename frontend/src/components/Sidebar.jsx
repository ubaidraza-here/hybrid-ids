import { Ban, PanelLeftClose, PanelLeftOpen, Network, Shield, Activity } from 'lucide-react'

const views = [
  ['Live Triage', Activity],
  ['Pipeline & Models', Network],
  ['Firewall Blocklist', Ban],
]

export default function Sidebar({ activeView, setActiveView, blockedCount, collapsed, setCollapsed }) {
  return (
    <aside className={`liquid-glass fixed inset-y-3 left-3 z-30 hidden flex-col rounded-3xl transition-all duration-300 ease-out md:flex ${collapsed ? 'w-[78px]' : 'w-64'}`}>
      <div className={`flex h-20 items-center border-b border-white/[0.08] ${collapsed ? 'justify-center px-1' : 'justify-between px-3'}`}>
        {collapsed ? null :
          <div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/20"><Shield size={18} className="text-cyan-300" /></div><div className="min-w-0"><div className="truncate text-sm font-bold">Hybrid-IDS</div><div className="mono text-[9px] text-[#86868B]">NEURAL DEFENSE</div></div></div>}
        <button type="button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)}
          className={`z-30 grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-[#86868B] transition-all hover:bg-white/10 active:scale-95 ${collapsed ? 'mx-auto' : ''}`}>
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      <nav className="flex-1 space-y-2 p-3">
        {views.map(([label, Icon]) => (
          <button key={label} type="button" onClick={() => setActiveView(label)} title={collapsed ? label : undefined}
            className={`group relative flex h-12 w-full items-center rounded-2xl text-sm transition-all ${collapsed ? 'justify-center' : 'gap-3 px-3'} ${activeView === label ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.08)]' : 'text-[#86868B] hover:bg-white/[0.04] hover:text-white'}`}>
            <Icon size={17} className={`shrink-0 ${activeView === label ? 'text-cyan-300' : ''}`} />
            {!collapsed && <span className="font-medium">{label}</span>}
            {label === 'Firewall Blocklist' && <span className={`mono rounded-full bg-rose-500/10 px-2 py-0.5 text-[9px] text-rose-300 ring-1 ring-rose-400/20 ${collapsed ? 'absolute right-1 top-1' : 'ml-auto'}`}>{blockedCount}</span>}
            {collapsed && <span className="liquid-glass pointer-events-none absolute left-[66px] z-50 whitespace-nowrap rounded-xl px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">{label}</span>}
          </button>
        ))}
      </nav>
      <div className={`m-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.8)]" /> :
          <><div className="flex items-center justify-between"><span className="text-[10px] text-[#86868B]">Engine Health</span><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /></div><div className="mono mt-2 text-[9px] text-[#A1A1AA]">RF 100% · IF -0.15</div></>}
      </div>
    </aside>
  )
}
