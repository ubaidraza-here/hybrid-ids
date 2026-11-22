# Hybrid-IDS UI/UX Design Specification (Linear / Vercel Security Aesthetic)

## 1. Visual Philosophy (Anti-Slop Rules)

- **90 / 8 / 2 Color Discipline:**
  - 90% neutral obsidian surfaces (`#09090B` page background, `#111114` cards/panels, `#18181B` hover states, `rgba(255,255,255,0.07)` 1px hairlines).
  - 8% crisp neutral typography (`#FAFAFA` primary values, `#A1A1AA` secondary labels, `#71717A` muted metadata).
  - 2% surgical semantic accents:
    - Live connection / Benign: `#10B981` (6px status dot only)
    - Stage 1 Signature / Critical Threat: `#F43F5E` (`bg-rose-500/10 text-rose-400 border-rose-500/20`)
    - Stage 2 Supervised ML / Medium-High: `#38BDF8` (`bg-sky-500/10 text-sky-400 border-sky-500/20`)
    - Stage 3 Zero-Day AI Anomaly: `#F59E0B` (`bg-amber-500/10 text-amber-400 border-amber-500/20`)
- **Forbidden Patterns:** NO rainbow gradient bars, NO duplicate KPI boxes repeating chart numbers, NO heavy borders, NO truncated axis labels, NO full-width sidebars.
- **Tabular Precision:** Every number, IP address, port, timestamp, and percentage MUST use `font-mono tabular-nums`.

## 2. Exact Frontend File Architecture

Keep the entire UI clean, flat, and easy to debug across 4 files inside `frontend/src/`:

1. `frontend/src/App.jsx` — State owner: connects to `ws://localhost:8000/ws/alerts` (auto-reconnect), polls/loads `GET http://localhost:8000/api/stats`, maintains `alerts` list (max 200), `blockedIps` set, `selectedAlert` state, and renders the 4 layout zones below.
2. `frontend/src/components/TopBar.jsx` — 56px top navigation bar: `Hybrid-IDS` wordmark + `v1.0` monospace pill, live WebSocket status indicator, and a segmented `Stream: Active / Paused` toggle (`POST /api/stream/start` or `/stop`).
3. `frontend/src/components/TelemetryStrip.jsx` — Single unified horizontal telemetry bar (replacing separate KPI cards + bar charts):
   - Displays 5 clean inline metrics separated by subtle vertical hairlines (`Total Flows`, `Benign Rate %`, `Signature · S1`, `Supervised ML · S2`, `Zero-Day AI · S3`).
   - Right side renders a crisp SVG polyline sparkline (last 40 flow events: baseline vs. threat spikes) with zero external chart library dependencies that can crash.
4. `frontend/src/components/TriageWorkspace.jsx` — Main interactive workspace:
   - **Command Toolbar:** Filter tabs (`All`, `Threats`, `S1 Signature`, `S2 ML`, `S3 Zero-Day`), IP/Port search box, and compact right-aligned red-team trigger buttons (`DDoS`, `PortScan`, `BruteForce`, `SuspiciousPort`, `ZeroDayAnomaly` calling `POST /api/simulate/{type}`).
   - **High-Density Event Table:** Columns: `Time`, `Source → Destination`, `Classification`, `Detection Engine`, `Confidence`, `Severity`. Clicking any row opens the Inspector Drawer.
   - **Slide-Over Inspector Drawer:** Fixed right panel (`w-96`) appearing when a row is clicked, showing full flow metadata, 3-stage pipeline trace (`Stage 1 → Stage 2 → Stage 3`), AI feature explanation, and a working **"Block Source IP"** button.
