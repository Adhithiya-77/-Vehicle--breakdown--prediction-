import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',         label: 'Dashboard' },
  { to: '/vehicles', label: 'Vehicles'  },
  { to: '/analytics',label: 'Analytics' },
  { to: '/alerts',   label: 'Alerts'    },
]

export default function Navbar() {
  return (
    <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
            className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold leading-none" style={{ color: 'var(--text-primary)' }}>VehicleGuard AI</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Predictive Fleet Intelligence</p>
        </div>
      </div>
      <nav className="flex items-center gap-1">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
