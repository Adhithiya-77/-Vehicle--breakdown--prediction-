import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { api } from '../services/api'
import { KpiCard, RiskBadge, ProbBar, Spinner } from '../components/Shared'

const COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' }

export default function Dashboard() {
  const [data, setData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { api.dashboard().then(setData) }, [])

  if (!data) return <div className="p-8"><Spinner /></div>

  const pieData = Object.entries(data.risk_distribution).map(([name, value]) => ({ name, value }))
  const barData = Object.entries(data.probability_distribution).map(([range, count]) => ({ range, count }))

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(6,182,212,0.1))', borderColor: 'rgba(59,130,246,0.3)' }}>
        <p className="text-sm font-semibold" style={{ color: '#60a5fa' }}>⚡ AI Prediction Active</p>
        <p className="text-lg font-bold mt-1">
          <span style={{ color: '#ef4444' }}>{data.high_risk} vehicles</span> are at high risk of breakdown within the next 30 days.
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Detect vehicle failures before they happen — powered by XGBoost ML model.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Total Vehicles"       value={data.total_vehicles}       />
        <KpiCard label="High Risk"            value={data.high_risk}            color="#ef4444" sub="≥70% probability" />
        <KpiCard label="Medium Risk"          value={data.medium_risk}          color="#f59e0b" sub="40–69% probability" />
        <KpiCard label="Low Risk"             value={data.low_risk}             color="#22c55e" sub="<40% probability" />
        <KpiCard label="Predicted Breakdowns" value={data.predicted_breakdowns} color="#ef4444" sub="within 30 days" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie */}
        <div className="card">
          <p className="text-sm font-semibold mb-4">Breakdown Risk Distribution</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                   dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                   labelLine={false}>
                {pieData.map(e => <Cell key={e.name} fill={COLORS[e.name]} />)}
              </Pie>
              <Tooltip formatter={(v) => [v, 'Vehicles']} contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map(e => (
              <div key={e.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[e.name] }} />
                <span style={{ color: 'var(--text-muted)' }}>{e.name}: {e.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar */}
        <div className="card">
          <p className="text-sm font-semibold mb-4">Breakdown Probability Distribution</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} margin={{ top: 0, right: 10, left: -20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="range" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} angle={-40} textAnchor="end" />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="count" name="Vehicles" radius={[4,4,0,0]}>
                {barData.map((e, i) => {
                  const pct = parseInt(e.range)
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
        <p className="text-sm font-semibold mb-4">Top 10 Highest-Risk Vehicles</p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Vehicle ID</th><th>Risk Level</th><th>Breakdown Probability</th>
                <th>Engine Temp (°C)</th><th>Oil Pressure (psi)</th>
              </tr>
            </thead>
            <tbody>
              {data.top10_highest_risk.map(v => (
                <tr key={v.vehicle_id} onClick={() => navigate(`/vehicles/${v.vehicle_id}`)}>
                  <td className="font-mono font-semibold" style={{ color: '#60a5fa' }}>{v.vehicle_id}</td>
                  <td><RiskBadge level={v.risk_level} /></td>
                  <td><ProbBar value={v.breakdown_probability} /></td>
                  <td>{v.engine_temp_c?.toFixed(1)}°C</td>
                  <td>{v.oil_pressure_psi?.toFixed(1)} psi</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vehicles requiring attention */}
      <AttentionSection navigate={navigate} />
    </div>
  )
}

function AttentionSection({ navigate }) {
  const [alerts, setAlerts] = useState(null)
  useEffect(() => { api.alerts({ severity: 'HIGH' }).then(d => setAlerts(d.alerts?.slice(0, 8))) }, [])
  if (!alerts) return null
  return (
    <div className="card">
      <p className="text-sm font-semibold mb-4">🚨 Vehicles Requiring Attention</p>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Vehicle ID</th><th>Risk</th><th>Probability</th>
              <th>Issues Detected</th><th>Recommended Action</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map(a => (
              <tr key={a.vehicle_id} onClick={() => navigate(`/vehicles/${a.vehicle_id}`)}>
                <td className="font-mono font-semibold" style={{ color: '#60a5fa' }}>{a.vehicle_id}</td>
                <td><RiskBadge level={a.risk_level} /></td>
                <td><ProbBar value={a.breakdown_probability} /></td>
                <td className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.issues.join(' · ')}</td>
                <td className="text-xs" style={{ color: '#f59e0b' }}>{a.recommendation.slice(0, 60)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
