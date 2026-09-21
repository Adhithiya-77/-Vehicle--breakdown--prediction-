import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { RiskBadge, ProbBar, Spinner, Pagination } from '../components/Shared'

export default function Alerts() {
  const [data, setData]         = useState(null)
  const [severity, setSeverity] = useState('')
  const [page, setPage]         = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    setData(null)
    api.alerts({ severity, page, per_page: 20 }).then(setData)
  }, [severity, page])

  const handleSeverity = (s) => { setSeverity(s); setPage(1) }

  return (
    <div className="p-6 space-y-4 max-w-screen-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Fleet Alerts</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {data ? `${data.total.toLocaleString()} vehicles requiring attention` : 'Loading…'}
        </p>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#ef4444' }}>🔴 Critical / High Risk</p>
            <p className="text-3xl font-bold tabular-nums" style={{ color: '#ef4444' }}>
              {data.alerts.filter(a => a.risk_level === 'HIGH').length}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Immediate attention required — inspect within 7 days</p>
          </div>
          <div className="card" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#f59e0b' }}>🟡 Medium Risk</p>
            <p className="text-3xl font-bold tabular-nums" style={{ color: '#f59e0b' }}>
              {data.alerts.filter(a => a.risk_level === 'MEDIUM').length}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Monitor closely — schedule inspection within 30 days</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="card flex gap-2 items-center flex-wrap">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Filter:</span>
        {[['', 'All Alerts'], ['HIGH', '🔴 High Risk'], ['MEDIUM', '🟡 Medium Risk']].map(([s, label]) => (
          <button key={s} onClick={() => handleSeverity(s)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: severity === s ? 'var(--accent)' : 'var(--bg-card2)',
                    border: '1px solid var(--border)',
                    color: severity === s ? 'white' : 'var(--text-muted)',
                  }}>
            {label}
          </button>
        ))}
      </div>

      {/* Alert cards */}
      {!data ? <Spinner /> : data.alerts.length === 0 ? (
        <div className="card text-center py-12" style={{ color: 'var(--text-muted)' }}>
          No alerts for the selected filter.
        </div>
      ) : (
        <div className="space-y-3">
          {data.alerts.map(a => (
            <div key={a.vehicle_id} className="card transition-all"
                 style={{ borderColor: a.risk_level === 'HIGH' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)' }}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                       style={{ background: a.risk_level === 'HIGH' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)' }}>
                    {a.risk_level === 'HIGH' ? '🔴' : '🟡'}
                  </div>
                  <div>
                    <p className="font-mono font-bold text-base" style={{ color: '#60a5fa' }}>{a.vehicle_id}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <RiskBadge level={a.risk_level} />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.brand}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-36">
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Breakdown Probability</p>
                    <ProbBar value={a.breakdown_probability} />
                  </div>
                  <button onClick={() => navigate(`/vehicles/${a.vehicle_id}`)}
                          className="px-4 py-1.5 rounded-lg text-sm font-semibold flex-shrink-0"
                          style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }}>
                    View Vehicle →
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Issues Detected</p>
                  <div className="flex flex-wrap gap-1.5">
                    {a.issues.map(issue => (
                      <span key={issue} className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.18)' }}>
                        ⚠ {issue}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Recommended Action</p>
                  <p className="text-xs" style={{ color: '#fbbf24' }}>{a.recommendation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data && <Pagination page={data.page} pages={data.pages} total={data.total} perPage={20} onPage={setPage} />}
    </div>
  )
}
