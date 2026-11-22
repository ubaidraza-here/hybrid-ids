# Hybrid-IDS — Apple Liquid Glass & Gemini Spatial Design System

## 1. Ambient Canvas & Liquid Glass Material Tokens

- **Page Canvas (`body`):** Deep obsidian `#05060A` with two fixed, non-interactive blurred ambient light orbs (`radial-gradient` in deep indigo `#1e1b4b` and slate-cyan `#0c4a6e` at `opacity-25 blur-3xl`) so frosted glass panels refract real depth.
- **`.liquid-glass` Surface Class (defined in `index.css`):**
  - `background: rgba(17, 19, 27, 0.58);`
  - `backdrop-filter: blur(24px) saturate(180%);`
  - `-webkit-backdrop-filter: blur(24px) saturate(180%);`
  - `border: 1px solid rgba(255, 255, 255, 0.09);`
  - `box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.14), 0 18px 40px -12px rgba(0, 0, 0, 0.65);`
- **`.liquid-glass-pill` (Floating Capsule Header & Controls):**
  - Same blur + `border-radius: 9999px`, `background: rgba(22, 25, 35, 0.68)`, inner rim highlight `inset 0 1px 0 0 rgba(255, 255, 255, 0.18)`.
- **Palette Discipline (Apple Dark Vibrancy):**
  - Primary Text: `#F5F5F7` (Apple Off-White)
  - Secondary Text: `#86868B` (Apple Neutral Gray)
  - Accent / Interactive Focus: `#38BDF8` (Ice Cyan) & `#818CF8` (Soft Indigo)
  - Semantic Signals (translucent glass pills only):
    - Benign / Live: `emerald-400` (`bg-emerald-500/12 ring-1 ring-emerald-400/25`)
    - Stage 1 Signature / Critical: `rose-400` (`bg-rose-500/12 ring-1 ring-rose-400/25`)
    - Stage 2 Supervised ML: `sky-400` (`bg-sky-500/12 ring-1 ring-sky-400/25`)
    - Stage 3 Zero-Day AI: `amber-400` (`bg-amber-500/12 ring-1 ring-amber-400/25`)

## 2. Typography (`index.html` + `index.css`)

- Load Google Fonts: **`Plus Jakarta Sans`** (weights `400, 500, 600, 700`) for all UI headings, navigation, and labels (`letter-spacing: -0.02em` on headings), and **`JetBrains Mono`** (weights `400, 500`) with `font-variant-numeric: tabular-nums` for metrics, timestamps, IPs, ports, and confidence scores.

## 3. Spatial Layout Architecture

1. **Collapsible Gemini-Style Left Sidebar (`Sidebar.jsx`):**
   - Desktop (`hidden md:flex`): Sticky full-height glass rail (`w-64` expanded, `w-[76px]` collapsed via smooth `duration-300` transition).
   - Top of Sidebar: Brand mark + dedicated **Collapse/Expand Rail Button** (`PanelLeftClose` / `PanelLeftOpen`).
   - Nav Items: `Live Triage`, `Pipeline & Models`, `Firewall Blocklist` (with pill count badge). When collapsed, icons stay centered with custom floating glass tooltips on hover.
   - Bottom of Sidebar: Compact Engine Health card (`RF: 100% Acc · IF: -0.15 Threshold`).
2. **Floating Glass Capsule Header (`FloatingHeader.jsx`):**
   - Centered floating pill (`rounded-full liquid-glass-pill px-4 py-2.5 max-w-[1240px] mx-auto`).
   - Left: Mobile hamburger trigger (`md:hidden`), active page breadcrumb title, and live WebSocket pulse pill (`Engine Live`).
   - Right:
     - **Interactive "Simulate Attack" Glass Hover/Click Dropdown Menu:** Hovering or clicking opens a sleek floating glass popover (`rounded-2xl liquid-glass p-2 w-72`) listing `DDoS Flood`, `Port Scan`, `Brute Force`, `Suspicious Port`, and `Zero-Day Anomaly` with a 1-line description of which AI stage each tests.
     - **Stream Play/Pause Capsule Toggle** (`POST /api/stream/start` or `/stop`).
   - Mobile (`<768px`): Tapping the hamburger opens a full-screen frosted glass overlay (`fixed inset-0 z-50 backdrop-blur-2xl bg-[#05060A]/90`) with large tactile nav cards and stream controls (auto-closes on selection).
3. **Centered Main Content Stage (`max-w-[1240px] mx-auto`):**
   - **Bento Glass KPI & Waveform Grid:** 4 spacious `.liquid-glass rounded-3xl p-5` cards (`Total Flows`, `Benign Traffic %`, `AI & Signature Threats`, `Zero-Day Anomalies`) + a full-width or spanned `.liquid-glass rounded-3xl p-6` live traffic area waveform card.
   - **Responsive Triage Feed (`TriageWorkspace.jsx`):**
     - Clean glass filter pill bar (`All`, `Threats`, `Stage 1`, `Stage 2`, `Stage 3`) + rounded search input.
     - **Desktop (`hidden md:block`):** Spacious, uncrowded glass table with generous row padding (`py-3.5 px-4`), hover luminescence, and click-to-open **Right Glass Inspector Drawer** (`w-[440px] rounded-l-3xl`).
     - **Mobile (`md:hidden`):** Vertical stack of **Liquid Glass Threat Cards** (`rounded-2xl p-4 space-y-2.5`)—each showing Threat Badge, Severity, `src_ip → dst_ip:port`, confidence bar, and tap-to-open **Bottom Glass Inspector Sheet** (`rounded-t-3xl`).
