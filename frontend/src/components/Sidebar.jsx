import { Ban, Code2, Moon, PanelLeftClose, PanelLeftOpen, Network, Shield, Sun, Activity } from 'lucide-react'

const views = [
  ['Live Triage', Activity],
  ['Pipeline & Models', Network],
  ['Firewall Blocklist', Ban],
]

export default function Sidebar({ activeView, setActiveView, blockedCount, collapsed, setCollapsed, theme, toggleTheme }) {
  return (
    <aside className={`liquid-glass fixed inset-y-3 left-3 z-30 hidden flex-col rounded-3xl transition-all duration-300 ease-out md:flex ${collapsed ? 'w-[78px]' : 'w-64'}`}>
      <div className={`flex h-20 items-center border-b border-white/[0.08] ${collapsed ? 'justify-center px-1' : 'justify-between px-3'}`}>
        {collapsed ? null :
          <div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-[var(--border)] bg-zinc-100 dark:bg-white/[0.06]"><Shield size={18} /></div><div className="min-w-0"><div className="truncate text-sm font-bold">Hybrid-IDS</div><div className="mono text-[9px] text-zinc-500 dark:text-zinc-400">SECURITY CONSOLE</div></div></div>}
        <button type="button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)}
          className={`z-30 grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-[var(--border)] bg-zinc-100 text-zinc-600 transition-all hover:bg-zinc-200 active:scale-95 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:bg-white/[0.03] dark:text-zinc-400 dark:hover:bg-white/10 ${collapsed ? 'mx-auto' : ''}`}>
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>
      <nav className="flex-1 space-y-2 p-3">
        {views.map(([label, Icon]) => (
          <button key={label} type="button" onClick={() => setActiveView(label)} title={collapsed ? label : undefined}
            className={`group relative flex h-12 w-full items-center rounded-xl text-sm transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 ${collapsed ? 'justify-center' : 'gap-3 px-3'} ${activeView === label ? 'bg-zinc-900 text-white shadow-sm dark:bg-white/[0.10] dark:text-white' : 'text-zinc-600 hover:bg-black/[0.04] hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-white'}`}>
            <Icon size={17} className="shrink-0" />
            {!collapsed && <span className="font-medium">{label}</span>}
            {label === 'Firewall Blocklist' && <span className={`mono rounded-full bg-rose-500/10 px-2 py-0.5 text-[9px] text-rose-300 ring-1 ring-rose-400/20 ${collapsed ? 'absolute right-1 top-1' : 'ml-auto'}`}>{blockedCount}</span>}
            {collapsed && <span className="liquid-glass pointer-events-none absolute left-[66px] z-50 whitespace-nowrap rounded-xl px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">{label}</span>}
          </button>
        ))}
      </nav>
      <div className="m-3 space-y-1 border-t border-[var(--border)] pt-3">
        <button type="button" onClick={toggleTheme} title={collapsed ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : undefined}
          className={`flex h-11 w-full items-center rounded-xl text-sm text-zinc-600 hover:bg-black/[0.04] hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}>
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <a href="https://github.com/ubaidraza-here/hybrid-ids" target="_blank" rel="noopener noreferrer"
          title={collapsed ? 'Source Code' : undefined}
          className={`flex h-11 w-full items-center rounded-xl text-sm text-zinc-600 hover:bg-black/[0.04] hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white ${collapsed ? 'justify-center' : 'gap-3 px-3'}`}>
          <Code2 size={17} />{!collapsed && <span>Source Code</span>}
        </a>
      </div>
    </aside>
  )
}
