import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, Legend,
} from 'recharts'
import { api } from '../services/api'
import { Spinner } from '../components/Shared'

export default function Analytics() {
  const [dash, setDash] = useState(null)
  useEffect(() => { api.dashboard().then(setDash) }, [])
  if (!dash) return <div className="p-8"><Spinner /></div>

  const barData = Object.entries(dash.probability_distribution).map(([range, count]) => ({ range, count }))
  const riskData = [
    { subject: 'High Risk',   value: dash.high_risk,   full: dash.total_vehicles },
    { subject: 'Medium Risk', value: dash.medium_risk, full: dash.total_vehicles },
    { subject: 'Low Risk',    value: dash.low_risk,    full: dash.total_vehicles },
  ]
  const healthData = [
    { name: 'Healthy',  value: dash.low_risk,    fill: '#22c55e' },
    { name: 'At Risk',  value: dash.medium_risk, fill: '#f59e0b' },
    { name: 'Critical', value: dash.high_risk,   fill: '#ef4444' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div>
        <h1 className="text-xl font-bold">Analytics</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Fleet health overview and risk analysis</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Probability distribution */}
        <div className="card">
          <p className="text-sm font-semibold mb-4">Probability Distribution</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} margin={{ top: 0, right: 10, left: -20, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="range" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} angle={-40} textAnchor="end" />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="count" name="Vehicles" fill="#3b82f6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet health bar */}
        <div className="card">
          <p className="text-sm font-semibold mb-4">Vehicle Health Overview</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={healthData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} width={70} />
              <Tooltip contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="value" name="Vehicles" radius={[0,4,4,0]}>
                {healthData.map((e, i) => (
                  <rect key={i} fill={e.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk breakdown */}
        <div className="card md:col-span-2">
          <p className="text-sm font-semibold mb-4">Risk Category Breakdown</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'High Risk',   value: dash.high_risk,   pct: ((dash.high_risk/dash.total_vehicles)*100).toFixed(1),   color: '#ef4444' },
              { label: 'Medium Risk', value: dash.medium_risk, pct: ((dash.medium_risk/dash.total_vehicles)*100).toFixed(1), color: '#f59e0b' },
              { label: 'Low Risk',    value: dash.low_risk,    pct: ((dash.low_risk/dash.total_vehicles)*100).toFixed(1),    color: '#22c55e' },
            ].map(r => (
              <div key={r.label} className="text-center p-4 rounded-xl" style={{ background: 'var(--bg-card2)' }}>
                <p className="text-3xl font-bold" style={{ color: r.color }}>{r.value}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{r.label}</p>
                <p className="text-xs mt-0.5" style={{ color: r.color }}>{r.pct}% of fleet</p>
                <div className="mt-3 h-2 rounded-full" style={{ background: 'var(--border)' }}>
                  <div className="h-2 rounded-full" style={{ width: `${r.pct}%`, background: r.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
