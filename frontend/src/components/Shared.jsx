export function RiskBadge({ level }) {
  const cls = level === 'HIGH' ? 'badge-high' : level === 'MEDIUM' ? 'badge-medium' : 'badge-low'
  return <span className={`badge ${cls}`}>{level}</span>
}

export function PriorityBadge({ priority }) {
  const map = {
    Critical: { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', border: 'rgba(239,68,68,0.3)'  },
    High:     { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    Medium:   { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    Low:      { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e', border: 'rgba(34,197,94,0.3)'  },
  }
  const s = map[priority] || map.Low
  return (
    <span className="badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {priority}
    </span>
  )
}

export function ProbBar({ value }) {
  const pct   = Math.round(value * 100)
  const color = value >= 0.7 ? '#ef4444' : value >= 0.4 ? '#f59e0b' : '#22c55e'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div className="card flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</p>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <p className="text-3xl font-bold tabular-nums" style={{ color: color || 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

export function SectionHeader({ title, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold">{title}</h2>
      {sub && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  )
}

export const TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 },
  cursor: { fill: 'rgba(59,130,246,0.05)' },
}

export const AXIS_STYLE = { fill: 'var(--text-muted)', fontSize: 11 }

export function Pagination({ page, pages, total, perPage, onPage }) {
  if (pages <= 1) return null
  const start = (page - 1) * perPage + 1
  const end   = Math.min(page * perPage, total)

  // Build page numbers window
  let nums = []
  if (pages <= 7) {
    nums = Array.from({ length: pages }, (_, i) => i + 1)
  } else {
    nums = [1]
    if (page > 3) nums.push('…')
    for (let p = Math.max(2, page - 1); p <= Math.min(pages - 1, page + 1); p++) nums.push(p)
    if (page < pages - 2) nums.push('…')
    nums.push(pages)
  }

  const btn = (label, disabled, onClick, active = false) => (
    <button key={label} onClick={onClick} disabled={disabled}
            className="px-3 py-1 rounded text-sm font-medium transition-all disabled:opacity-30"
            style={{
              background: active ? 'var(--accent)' : 'var(--bg-card2)',
              border: '1px solid var(--border)',
              color: active ? 'white' : 'var(--text-muted)',
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}>
      {label}
    </button>
  )

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Showing {start}–{end} of {total.toLocaleString()} vehicles
      </p>
      <div className="flex items-center gap-1">
        {btn('← Prev', page === 1, () => onPage(page - 1))}
        {nums.map((n, i) =>
          n === '…'
            ? <span key={`ellipsis-${i}`} className="px-2 text-sm" style={{ color: 'var(--text-muted)' }}>…</span>
            : btn(n, false, () => onPage(n), n === page)
        )}
        {btn('Next →', page === pages, () => onPage(page + 1))}
      </div>
    </div>
  )
}
