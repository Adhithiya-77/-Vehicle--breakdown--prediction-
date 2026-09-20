import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { RiskBadge, ProbBar, Spinner } from '../components/Shared'

export default function Vehicles() {
  const [data, setData]     = useState(null)
  const [page, setPage]     = useState(1)
  const [search, setSearch] = useState('')
  const [risk, setRisk]     = useState('')
  const [sortBy, setSortBy] = useState('breakdown_probability')
  const [sortDir, setSortDir] = useState('desc')
  const navigate = useNavigate()

  const load = useCallback(() => {
    setData(null)
    api.vehicles({ page, per_page: 50, search, risk, sort_by: sortBy, sort_dir: sortDir })
       .then(setData)
  }, [page, search, risk, sortBy, sortDir])

  useEffect(() => { load() }, [load])

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
    setPage(1)
  }

  const SortIcon = ({ col }) => sortBy === col
    ? <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
    : <span className="ml-1 opacity-30">↕</span>

  return (
    <div className="p-6 space-y-4 max-w-screen-xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Vehicle Records</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {data ? `${data.total} vehicles` : 'Loading…'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3 items-center">
        <input placeholder="Search vehicle ID…" value={search}
               onChange={e => { setSearch(e.target.value); setPage(1) }}
               className="w-52" />
        <select value={risk} onChange={e => { setRisk(e.target.value); setPage(1) }}>
          <option value="">All Risk Levels</option>
          <option value="HIGH">High Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
        </select>
        <select value={`${sortBy}:${sortDir}`}
                onChange={e => { const [s,d] = e.target.value.split(':'); setSortBy(s); setSortDir(d); setPage(1) }}>
          <option value="breakdown_probability:desc">Probability ↓</option>
          <option value="breakdown_probability:asc">Probability ↑</option>
          <option value="engine_temp_c:desc">Engine Temp ↓</option>
          <option value="odometer_reading:desc">Mileage ↓</option>
        </select>
        {data && (
          <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
            Page {data.page} of {data.pages}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {!data ? <Spinner /> : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Vehicle ID</th>
                  <th className="cursor-pointer" onClick={() => handleSort('risk_level')}>Risk <SortIcon col="risk_level" /></th>
                  <th className="cursor-pointer" onClick={() => handleSort('breakdown_probability')}>Probability <SortIcon col="breakdown_probability" /></th>
                  <th className="cursor-pointer" onClick={() => handleSort('engine_temp_c')}>Engine Temp <SortIcon col="engine_temp_c" /></th>
                  <th>Oil Pressure</th>
                  <th>Battery V</th>
                  <th>Engine RPM</th>
                  <th className="cursor-pointer" onClick={() => handleSort('odometer_reading')}>Mileage <SortIcon col="odometer_reading" /></th>
                  <th>Brake Wear</th>
                  <th>Fuel %</th>
                </tr>
              </thead>
              <tbody>
                {data.vehicles.map(v => (
                  <tr key={v.vehicle_id} onClick={() => navigate(`/vehicles/${v.vehicle_id}`)}>
                    <td className="font-mono font-semibold" style={{ color: '#60a5fa' }}>{v.vehicle_id}</td>
                    <td><RiskBadge level={v.risk_level} /></td>
                    <td style={{ minWidth: 120 }}><ProbBar value={v.breakdown_probability} /></td>
                    <td>{v.engine_temp_c?.toFixed(1)}°C</td>
                    <td>{v.oil_pressure_psi?.toFixed(1)} psi</td>
                    <td>{v.battery_voltage_v?.toFixed(2)} V</td>
                    <td>{Math.round(v.engine_rpm)} rpm</td>
                    <td>{Math.round(v.odometer_reading).toLocaleString()} km</td>
                    <td>{v.brake_pad_wear_mm?.toFixed(1)} mm</td>
                    <td>{v.fuel_level_percent?.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="px-3 py-1 rounded text-sm disabled:opacity-30"
                  style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>← Prev</button>
          {Array.from({ length: Math.min(data.pages, 7) }, (_, i) => {
            const p = page <= 4 ? i+1 : page - 3 + i
            if (p < 1 || p > data.pages) return null
            return (
              <button key={p} onClick={() => setPage(p)}
                      className="px-3 py-1 rounded text-sm"
                      style={{ background: p === page ? 'var(--accent)' : 'var(--bg-card2)', border: '1px solid var(--border)' }}>
                {p}
              </button>
            )
          })}
          <button onClick={() => setPage(p => Math.min(data.pages, p+1))} disabled={page === data.pages}
                  className="px-3 py-1 rounded text-sm disabled:opacity-30"
                  style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)' }}>Next →</button>
        </div>
      )}
    </div>
  )
}
