import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',            label: 'Dashboard'   },
  { to: '/vehicles',    label: 'Vehicles'    },
  { to: '/predict',     label: 'Predict'     },
  { to: '/analytics',   label: 'Analytics'   },
  { to: '/maintenance', label: 'Maintenance' },
  { to: '/alerts',      label: 'Alerts'      },
]

export default function Navbar() {
  return (
    <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}
            className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>VehicleGuard AI</p>
          <p className="text-xs leading-tight" style={{ color: 'var(--text-muted)' }}>Predict. Prioritize. Prevent.</p>
        </div>
      </div>
      <nav className="flex items-center gap-0.5">
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
