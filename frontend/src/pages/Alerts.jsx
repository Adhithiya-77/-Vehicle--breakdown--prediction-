import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { RiskBadge, ProbBar, Spinner } from '../components/Shared'

export default function Alerts() {
  const [data, setData]       = useState(null)
  const [severity, setSeverity] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    setData(null)
    api.alerts({ severity }).then(setData)
  }, [severity])

  return (
    <div className="p-6 space-y-4 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Alerts</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {data ? `${data.total} vehicles requiring attention` : 'Loading…'}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#ef4444' }}>High Risk</p>
            <p className="text-3xl font-bold" style={{ color: '#ef4444' }}>
              {data.alerts.filter(a => a.risk_level === 'HIGH').length}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Immediate attention required</p>
          </div>
          <div className="card" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#f59e0b' }}>Medium Risk</p>
            <p className="text-3xl font-bold" style={{ color: '#f59e0b' }}>
              {data.alerts.filter(a => a.risk_level === 'MEDIUM').length}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Monitor and schedule inspection</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="card flex gap-3 items-center">
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Filter:</span>
        {['', 'HIGH', 'MEDIUM'].map(s => (
          <button key={s} onClick={() => setSeverity(s)}
                  className="px-3 py-1 rounded text-sm font-medium transition-all"
                  style={{
                    background: severity === s ? 'var(--accent)' : 'var(--bg-card2)',
                    border: '1px solid var(--border)',
                    color: severity === s ? 'white' : 'var(--text-muted)',
                  }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      {!data ? <Spinner /> : (
        <div className="space-y-3">
          {data.alerts.map(a => (
            <div key={a.vehicle_id} className="card cursor-pointer hover:border-blue-500 transition-all"
                 onClick={() => navigate(`/vehicles/${a.vehicle_id}`)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                       style={{ background: a.risk_level === 'HIGH' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)' }}>
                    {a.risk_level === 'HIGH' ? '🔴' : '🟡'}
                  </div>
                  <div>
                    <p className="font-mono font-bold" style={{ color: '#60a5fa' }}>{a.vehicle_id}</p>
                    <RiskBadge level={a.risk_level} />
                  </div>
                </div>
                <div className="w-32">
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Probability</p>
                  <ProbBar value={a.breakdown_probability} />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Issues Detected</p>
                  <div className="flex flex-wrap gap-1">
                    {a.issues.map(i => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>Recommended Action</p>
                  <p className="text-xs" style={{ color: '#fbbf24' }}>{a.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
