import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { RiskBadge, PriorityBadge, ProbBar, Spinner, Pagination } from '../components/Shared'

const STATUS_COLORS = {
  'Needs Inspection': { bg: 'rgba(239,68,68,0.1)',  color: '#fca5a5' },
  'Monitor':          { bg: 'rgba(245,158,11,0.1)', color: '#fcd34d' },
  'Healthy':          { bg: 'rgba(34,197,94,0.1)',  color: '#86efac' },
}

export default function Maintenance() {
  const [data, setData]         = useState(null)
  const [filter, setFilter]     = useState('')
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const perPage = 25
  const navigate = useNavigate()

  useEffect(() => { api.maintenance().then(setData) }, [])

  if (!data) return <div className="p-8"><Spinner /></div>

  // Client-side filter/search/paginate (maintenance list is small — max 50 vehicles)
  let filtered = data.vehicles
  if (filter)  filtered = filtered.filter(v => v.priority === filter)
  if (search)  filtered = filtered.filter(v => v.vehicle_id.toLowerCase().includes(search.toLowerCase()))

  const total  = filtered.length
  const pages  = Math.max(1, Math.ceil(total / perPage))
  const paged  = filtered.slice((page - 1) * perPage, page * perPage)

  const counts = {
    Critical: data.vehicles.filter(v => v.priority === 'Critical').length,
    High:     data.vehicles.filter(v => v.priority === 'High').length,
    Low:      data.vehicles.filter(v => v.priority === 'Low').length,
  }

  return (
    <div className="p-6 space-y-5 max-w-screen-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Maintenance Priority</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          AI-driven maintenance scheduling for {data.total} vehicles
        </p>
      </div>

      {/* Priority summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#ef4444' }}>🔴 Critical</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: '#ef4444' }}>{counts.Critical}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Inspect within 7 days</p>
        </div>
        <div className="card" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#f59e0b' }}>🟡 High Priority</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: '#f59e0b' }}>{counts.High}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Inspect within 30 days</p>
        </div>
        <div className="card" style={{ borderColor: 'rgba(34,197,94,0.2)' }}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#22c55e' }}>🟢 Low Priority</p>
          <p className="text-3xl font-bold tabular-nums" style={{ color: '#22c55e' }}>{counts.Low}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Regular schedule</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3 items-center">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input placeholder="Search vehicle ID…" value={search}
                 onChange={e => { setSearch(e.target.value); setPage(1) }}
                 className="pl-7 w-48" />
        </div>
        {[['', 'All'], ['Critical', '🔴 Critical'], ['High', '🟡 High'], ['Low', '🟢 Low']].map(([val, label]) => (
          <button key={val} onClick={() => { setFilter(val); setPage(1) }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background: filter === val ? 'var(--accent)' : 'var(--bg-card2)',
                    border: '1px solid var(--border)',
                    color: filter === val ? 'white' : 'var(--text-muted)',
                  }}>
            {label}
          </button>
        ))}
        <p className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
          ⓘ Statuses are AI-generated prototype recommendations, not historical records.
        </p>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {paged.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>No vehicles match your filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Vehicle ID</th>
                  <th>Brand</th>
                  <th>Risk</th>
                  <th>Probability</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Main Concern</th>
                  <th>Mileage</th>
                  <th>Engine Hours</th>
                  <th>Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(v => {
                  const sc = STATUS_COLORS[v.status] || STATUS_COLORS['Healthy']
                  return (
                    <tr key={v.vehicle_id} onClick={() => navigate(`/vehicles/${v.vehicle_id}`)}>
                      <td className="font-mono font-semibold" style={{ color: '#60a5fa' }}>{v.vehicle_id}</td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.brand}</td>
                      <td><RiskBadge level={v.risk_level} /></td>
                      <td style={{ minWidth: 120 }}><ProbBar value={v.breakdown_probability} /></td>
                      <td><PriorityBadge priority={v.priority} /></td>
                      <td>
                        <span className="badge text-xs" style={{ background: sc.bg, color: sc.color, border: 'none' }}>
                          {v.status}
                        </span>
                      </td>
                      <td className="text-xs" style={{ color: 'var(--text-muted)', maxWidth: 160 }}>{v.main_concern}</td>
                      <td className="tabular-nums text-xs">{Math.round(v.odometer_reading).toLocaleString()} km</td>
                      <td className="tabular-nums text-xs">{Math.round(v.engine_hours).toLocaleString()} h</td>
                      <td className="text-xs" style={{ color: '#fbbf24', maxWidth: 200 }}>{v.recommendation.slice(0, 65)}…</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} pages={pages} total={total} perPage={perPage} onPage={setPage} />
    </div>
  )
}
