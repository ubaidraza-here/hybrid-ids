import { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="grid min-h-screen place-items-center bg-[var(--canvas)] p-6 text-[var(--primary)]">
          <section className="liquid-glass w-full max-w-md rounded-3xl p-6">
            <div className="text-sm font-semibold">Hybrid-IDS paused safely</div>
            <p className="mt-2 text-xs leading-5 text-[#A1A1AA]">
              An unexpected render error was caught. Reload the workspace to reconnect.
            </p>
            <button type="button" onClick={() => window.location.reload()}
              className="mt-5 h-9 rounded-md border border-white/10 px-4 text-xs">Reload dashboard</button>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
