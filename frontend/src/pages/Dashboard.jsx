import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { api } from '../services/api'
import { KpiCard, RiskBadge, ProbBar, Spinner, SectionHeader, TOOLTIP_STYLE, AXIS_STYLE } from '../components/Shared'

const RISK_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' }

export default function Dashboard() {
  const [data, setData]     = useState(null)
  const [error, setError]   = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .catch(() => setError('Failed to load dashboard. Is the backend running?'))
  }, [])

  if (error) return (
    <div className="p-8 text-center">
      <p style={{ color: '#ef4444' }}>{error}</p>
      <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Run: <code>cd backend && python app.py</code></p>
    </div>
  )
  if (!data) return <div className="p-8"><Spinner /></div>

  const pieData = Object.entries(data.risk_distribution).map(([name, value]) => ({ name, value }))
  const barData = Object.entries(data.probability_distribution).map(([range, count]) => ({ range, count }))

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fleet Health Overview</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            AI-powered predictive maintenance for your vehicle fleet
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
             style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          AI Model Active
        </div>
      </div>

      {/* Alert banner */}
      <div className="rounded-xl p-4"
           style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.08),rgba(245,158,11,0.06))', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold" style={{ color: '#fca5a5' }}>
              ⚠ {data.high_risk} vehicles flagged as HIGH RISK — immediate attention recommended
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {data.maintenance_required} vehicles total require maintenance · Powered by XGBoost ML model (ROC-AUC 0.9974)
            </p>
          </div>
          <button onClick={() => navigate('/alerts')}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
                  style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
            View Alerts →
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="sm:col-span-2">
          <KpiCard label="Total Vehicles"       value={data.total_vehicles.toLocaleString()} icon="🚗" sub={`${data.total_records.toLocaleString()} telemetry records`} />
        </div>
        <div className="sm:col-span-1">
          <KpiCard label="High Risk"            value={data.high_risk}            color="#ef4444" icon="🔴" sub="≥70% probability" />
        </div>
        <div className="sm:col-span-1">
          <KpiCard label="Medium Risk"          value={data.medium_risk}          color="#f59e0b" icon="🟡" sub="40–69% probability" />
        </div>
        <div className="sm:col-span-1">
          <KpiCard label="Low Risk"             value={data.low_risk}             color="#22c55e" icon="🟢" sub="<40% probability" />
        </div>
        <div className="sm:col-span-1">
          <KpiCard label="Maintenance Required" value={data.maintenance_required} color="#f59e0b" icon="🔧" sub="High + Medium risk" />
        </div>
        <div className="sm:col-span-1">
          <KpiCard label="Fleet Health"         value={`${data.avg_fleet_health}%`} color="#3b82f6" icon="💡" sub="Average score" />
        </div>
        <div className="sm:col-span-1">
          <KpiCard label="Predicted Breakdowns" value={data.predicted_breakdowns} color="#ef4444" icon="⚡" sub="Within 30 days" />
        </div>
      </div>

      {/* Fleet health scores */}
      {data.fleet_health_scores && (
        <div className="card">
          <SectionHeader title="Fleet Health Scores" sub="Calculated from live telemetry averages" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.fleet_health_scores.map(([label, score]) => {
              const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
              return (
                <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-card2)' }}>
                  <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
                  <p className="text-2xl font-bold" style={{ color }}>{score}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>/ 100</p>
                  <div className="mt-2 h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${score}%`, background: color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <SectionHeader title="Risk Distribution" sub="Fleet breakdown by predicted risk level" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                   dataKey="value" paddingAngle={3}>
                {pieData.map(e => <Cell key={e.name} fill={RISK_COLORS[e.name]} />)}
              </Pie>
              <Tooltip formatter={(v) => [v.toLocaleString(), 'Vehicles']} {...TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-5 mt-1">
            {pieData.map(e => (
              <div key={e.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: RISK_COLORS[e.name] }} />
                <span style={{ color: 'var(--text-muted)' }}>{e.name}: <strong style={{ color: 'var(--text-primary)' }}>{e.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionHeader title="Breakdown Probability Distribution" sub="How many vehicles fall in each probability range" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 0, right: 8, left: -20, bottom: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="range" tick={{ ...AXIS_STYLE, fontSize: 9 }} angle={-40} textAnchor="end" />
              <YAxis tick={AXIS_STYLE} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Vehicles']} />
              <Bar dataKey="count" name="Vehicles" radius={[4,4,0,0]}>
                {barData.map((e, i) => {
                  const pct  = parseInt(e.range)
                  const fill = pct >= 70 ? '#ef4444' : pct >= 40 ? '#f59e0b' : '#3b82f6'
                  return <Cell key={i} fill={fill} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title="Top 10 Highest-Risk Vehicles" sub="Vehicles with the highest predicted breakdown probability" />
          <button onClick={() => navigate('/vehicles')} className="text-xs px-3 py-1 rounded-lg"
                  style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Vehicle ID</th><th>Brand</th><th>Risk</th>
                <th>Breakdown Probability</th><th>Engine Temp</th>
                <th>Oil Pressure</th><th>Mileage</th>
              </tr>
            </thead>
            <tbody>
              {data.top10_highest_risk.map(v => (
                <tr key={v.vehicle_id} onClick={() => navigate(`/vehicles/${v.vehicle_id}`)}>
                  <td className="font-mono font-semibold" style={{ color: '#60a5fa' }}>{v.vehicle_id}</td>
                  <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.brand}</td>
                  <td><RiskBadge level={v.risk_level} /></td>
                  <td style={{ minWidth: 130 }}><ProbBar value={v.breakdown_probability} /></td>
                  <td className="tabular-nums">{v.engine_temp_c?.toFixed(1)}°C</td>
                  <td className="tabular-nums">{v.oil_pressure_psi?.toFixed(1)} psi</td>
                  <td className="tabular-nums">{Math.round(v.odometer_reading || 0).toLocaleString()} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance priority preview */}
      <MaintenancePreview navigate={navigate} />
    </div>
  )
}

function MaintenancePreview({ navigate }) {
  const [alerts, setAlerts] = useState(null)
  useEffect(() => {
    api.alerts({ severity: 'HIGH', per_page: 6 }).then(d => setAlerts(d.alerts))
  }, [])
  if (!alerts) return null
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <SectionHeader title="🚨 Immediate Maintenance Priority" sub="High-risk vehicles requiring urgent attention" />
        <button onClick={() => navigate('/maintenance')} className="text-xs px-3 py-1 rounded-lg"
                style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          Full List →
        </button>
      </div>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Vehicle ID</th><th>Risk</th><th>Probability</th>
              <th>Main Concern</th><th>Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(a => (
              <tr key={a.vehicle_id} onClick={() => navigate(`/vehicles/${a.vehicle_id}`)}>
                <td className="font-mono font-semibold" style={{ color: '#60a5fa' }}>{a.vehicle_id}</td>
                <td><RiskBadge level={a.risk_level} /></td>
                <td style={{ minWidth: 120 }}><ProbBar value={a.breakdown_probability} /></td>
                <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.issues[0]}</td>
                <td className="text-xs" style={{ color: '#f59e0b', maxWidth: 260 }}>{a.recommendation.slice(0, 70)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
