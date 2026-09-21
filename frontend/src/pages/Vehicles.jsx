import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { RiskBadge, ProbBar, Spinner, Pagination } from '../components/Shared'

const SORT_OPTIONS = [
  { value: 'breakdown_probability:desc', label: 'Highest Risk First'   },
  { value: 'breakdown_probability:asc',  label: 'Lowest Risk First'    },
  { value: 'odometer_reading:desc',      label: 'Highest Mileage'      },
  { value: 'odometer_reading:asc',       label: 'Lowest Mileage'       },
  { value: 'engine_temp_c:desc',         label: 'Highest Engine Temp'  },
  { value: 'engine_temp_c:asc',          label: 'Lowest Engine Temp'   },
  { value: 'engine_hours:desc',          label: 'Most Engine Hours'    },
]

export default function Vehicles() {
  const [data, setData]       = useState(null)
  const [page, setPage]       = useState(1)
  const [search, setSearch]   = useState('')
  const [risk, setRisk]       = useState('')
  const [sortBy, setSortBy]   = useState('breakdown_probability')
  const [sortDir, setSortDir] = useState('desc')
  const [perPage]             = useState(25)
  const navigate = useNavigate()

  const load = useCallback(() => {
    setData(null)
    api.vehicles({ page, per_page: perPage, search, risk, sort_by: sortBy, sort_dir: sortDir })
       .then(setData)
  }, [page, search, risk, sortBy, sortDir, perPage])

  useEffect(() => { load() }, [load])

  const handleSortChange = (val) => {
    const [s, d] = val.split(':')
    setSortBy(s); setSortDir(d); setPage(1)
  }

  const handleSearch = (val) => { setSearch(val); setPage(1) }
  const handleRisk   = (val) => { setRisk(val);   setPage(1) }

  const SortTh = ({ col, label }) => {
    const active = sortBy === col
    return (
      <th className="cursor-pointer select-none"
          onClick={() => { setSortBy(col); setSortDir(active && sortDir === 'desc' ? 'asc' : 'desc'); setPage(1) }}>
        {label} <span className="opacity-50">{active ? (sortDir === 'desc' ? '↓' : '↑') : '↕'}</span>
      </th>
    )
  }

  return (
    <div className="p-6 space-y-4 max-w-screen-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Vehicle Records</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {data ? `${data.total.toLocaleString()} records found` : 'Loading fleet data…'}
        </p>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-3 items-center">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input placeholder="Search vehicle ID…" value={search}
                 onChange={e => handleSearch(e.target.value)}
                 className="pl-7 w-52" />
        </div>
        <select value={risk} onChange={e => handleRisk(e.target.value)}>
          <option value="">All Risk Levels</option>
          <option value="HIGH">🔴 High Risk</option>
          <option value="MEDIUM">🟡 Medium Risk</option>
          <option value="LOW">🟢 Low Risk</option>
        </select>
        <select value={`${sortBy}:${sortDir}`} onChange={e => handleSortChange(e.target.value)}>
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {search || risk ? (
          <button onClick={() => { setSearch(''); setRisk(''); setPage(1) }}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            Clear Filters
          </button>
        ) : null}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {!data ? <div className="p-8"><Spinner /></div> : data.vehicles.length === 0 ? (
          <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
            No vehicles match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Vehicle ID</th>
                  <th>Brand</th>
                  <SortTh col="risk_level"            label="Risk"         />
                  <SortTh col="breakdown_probability" label="Probability"  />
                  <SortTh col="engine_temp_c"         label="Engine Temp"  />
                  <th>Oil Pressure</th>
                  <th>Battery V</th>
                  <th>Engine RPM</th>
                  <SortTh col="odometer_reading"      label="Mileage"      />
                  <th>Brake Wear</th>
                  <th>Fuel %</th>
                  <SortTh col="engine_hours"          label="Eng. Hours"   />
                </tr>
              </thead>
              <tbody>
                {data.vehicles.map(v => (
                  <tr key={v.vehicle_id} onClick={() => navigate(`/vehicles/${v.vehicle_id}`)}>
                    <td className="font-mono font-semibold" style={{ color: '#60a5fa' }}>{v.vehicle_id}</td>
                    <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.brand}</td>
                    <td><RiskBadge level={v.risk_level} /></td>
                    <td style={{ minWidth: 130 }}><ProbBar value={v.breakdown_probability} /></td>
                    <td className="tabular-nums" style={{ color: v.engine_temp_c > 105 ? '#ef4444' : 'inherit' }}>
                      {v.engine_temp_c?.toFixed(1)}°C
                    </td>
                    <td className="tabular-nums" style={{ color: v.oil_pressure_psi < 25 ? '#ef4444' : 'inherit' }}>
                      {v.oil_pressure_psi?.toFixed(1)} psi
                    </td>
                    <td className="tabular-nums" style={{ color: v.battery_voltage_v < 11.5 ? '#ef4444' : 'inherit' }}>
                      {v.battery_voltage_v?.toFixed(2)} V
                    </td>
                    <td className="tabular-nums">{Math.round(v.engine_rpm).toLocaleString()} rpm</td>
                    <td className="tabular-nums">{Math.round(v.odometer_reading).toLocaleString()} km</td>
                    <td className="tabular-nums" style={{ color: v.brake_pad_wear_mm > 9 ? '#f59e0b' : 'inherit' }}>
                      {v.brake_pad_wear_mm?.toFixed(1)} mm
                    </td>
                    <td className="tabular-nums">{v.fuel_level_percent?.toFixed(0)}%</td>
                    <td className="tabular-nums">{Math.round(v.engine_hours).toLocaleString()} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data && (
        <Pagination page={data.page} pages={data.pages} total={data.total}
                    perPage={perPage} onPage={setPage} />
      )}
    </div>
  )
}
