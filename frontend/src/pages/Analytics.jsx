import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, PieChart, Pie, Legend,
} from 'recharts'
import { api } from '../services/api'
import { Spinner, SectionHeader, TOOLTIP_STYLE, AXIS_STYLE } from '../components/Shared'

const RISK_COLORS = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' }

function HistChart({ data, title, sub, xLabel }) {
  return (
    <div className="card">
      <SectionHeader title={title} sub={sub} />
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 8, left: -20, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="range" tick={{ ...AXIS_STYLE, fontSize: 9 }} angle={-35} textAnchor="end" label={xLabel ? { value: xLabel, position: 'insideBottom', offset: -20, fill: 'var(--text-muted)', fontSize: 10 } : undefined} />
          <YAxis tick={AXIS_STYLE} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Vehicles']} />
          <Bar dataKey="count" fill="#3b82f6" radius={[3,3,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function ScatterPlot({ data, title, xKey, xLabel }) {
  return (
    <div className="card">
      <SectionHeader title={title} sub="Each dot = one vehicle" />
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey={xKey} name={xLabel} tick={AXIS_STYLE}
                 label={{ value: xLabel, position: 'insideBottom', offset: -12, fill: 'var(--text-muted)', fontSize: 10 }} />
          <YAxis dataKey="breakdown_probability" name="Probability" tick={AXIS_STYLE}
                 tickFormatter={v => `${Math.round(v*100)}%`} domain={[0,1]} />
          <Tooltip {...TOOLTIP_STYLE}
                   formatter={(v, name) => [name === 'breakdown_probability' ? `${Math.round(v*100)}%` : v.toFixed(1), name === 'breakdown_probability' ? 'Probability' : xLabel]} />
          <Scatter data={data} name="Vehicles">
            {data.map((d, i) => <Cell key={i} fill={RISK_COLORS[d.risk_level] || '#3b82f6'} fillOpacity={0.7} />)}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Analytics() {
  const [dash, setDash]   = useState(null)
  const [analy, setAnaly] = useState(null)

  useEffect(() => {
    api.dashboard().then(setDash)
    api.analytics().then(setAnaly)
  }, [])

  if (!dash || !analy) return <div className="p-8"><Spinner /></div>

  const pieData    = Object.entries(dash.risk_distribution).map(([name, value]) => ({ name, value }))
  const probData   = Object.entries(dash.probability_distribution).map(([range, count]) => ({ range, count }))
  const healthData = [
    { name: 'Healthy',  value: dash.low_risk,    fill: '#22c55e' },
    { name: 'At Risk',  value: dash.medium_risk, fill: '#f59e0b' },
    { name: 'Critical', value: dash.high_risk,   fill: '#ef4444' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Fleet Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Deep-dive telemetry analysis across {dash.total_vehicles} vehicles
        </p>
      </div>

      {/* Telemetry averages */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Avg Engine Temp',  value: `${analy.avg_engine_temp}°C`,  warn: analy.avg_engine_temp > 100 },
          { label: 'Avg Oil Pressure', value: `${analy.avg_oil_pressure} psi`, warn: analy.avg_oil_pressure < 30 },
          { label: 'Avg Battery V',    value: `${analy.avg_battery_v} V`,    warn: analy.avg_battery_v < 12 },
          { label: 'Avg Brake Wear',   value: `${analy.avg_brake_wear} mm`,  warn: analy.avg_brake_wear > 8.5 },
          { label: 'Avg Mileage',      value: `${Math.round(analy.avg_mileage / 1000)}k km` },
          { label: 'Avg Fuel Level',   value: `${analy.avg_fuel}%` },
        ].map(s => (
          <div key={s.label} className="card text-center py-3">
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-lg font-bold tabular-nums" style={{ color: s.warn ? '#f59e0b' : 'var(--text-primary)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Risk overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <SectionHeader title="Risk Distribution" sub="Fleet breakdown by predicted risk level" />
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                   dataKey="value" paddingAngle={3}>
                {pieData.map(e => <Cell key={e.name} fill={RISK_COLORS[e.name]} />)}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Vehicles']} />
              <Legend formatter={(v) => <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <SectionHeader title="Vehicle Health Overview" sub="Count by health category" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={healthData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={AXIS_STYLE} />
              <YAxis dataKey="name" type="category" tick={AXIS_STYLE} width={65} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Vehicles']} />
              <Bar dataKey="value" name="Vehicles" radius={[0,4,4,0]}>
                {healthData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Probability distribution */}
      <div className="card">
        <SectionHeader title="Breakdown Probability Distribution" sub="How many vehicles fall in each probability range" />
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={probData} margin={{ top: 0, right: 8, left: -20, bottom: 32 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="range" tick={{ ...AXIS_STYLE, fontSize: 9 }} angle={-40} textAnchor="end" />
            <YAxis tick={AXIS_STYLE} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [v, 'Vehicles']} />
            <Bar dataKey="count" name="Vehicles" radius={[4,4,0,0]}>
              {probData.map((e, i) => {
                const pct  = parseInt(e.range)
                const fill = pct >= 70 ? '#ef4444' : pct >= 40 ? '#f59e0b' : '#3b82f6'
                return <Cell key={i} fill={fill} />
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Brand risk */}
      {analy.brand_risk?.length > 0 && (
        <div className="card">
          <SectionHeader title="Average Breakdown Risk by Brand" sub="Which brands show higher predicted risk" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analy.brand_risk} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={AXIS_STYLE} tickFormatter={v => `${Math.round(v*100)}%`} domain={[0,1]} />
              <YAxis dataKey="brand" type="category" tick={AXIS_STYLE} width={70} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${Math.round(v*100)}%`, 'Avg Probability']} />
              <Bar dataKey="avg_prob" name="Avg Probability" radius={[0,4,4,0]}>
                {analy.brand_risk.map((e, i) => (
                  <Cell key={i} fill={e.avg_prob >= 0.7 ? '#ef4444' : e.avg_prob >= 0.4 ? '#f59e0b' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Telemetry histograms */}
      <div>
        <SectionHeader title="Telemetry Distributions" sub="Distribution of key sensor readings across the fleet" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <HistChart data={analy.engine_temp_dist}     title="Engine Temperature"  sub="°C distribution" />
          <HistChart data={analy.oil_pressure_dist}    title="Oil Pressure"        sub="psi distribution" />
          <HistChart data={analy.battery_voltage_dist} title="Battery Voltage"     sub="V distribution" />
          <HistChart data={analy.brake_wear_dist}      title="Brake Pad Wear"      sub="mm distribution" />
          <HistChart data={analy.mileage_dist}         title="Odometer Reading"    sub="km distribution" />
          <HistChart data={analy.fuel_level_dist}      title="Fuel Level"          sub="% distribution" />
          <HistChart data={analy.engine_rpm_dist}      title="Engine RPM"          sub="rpm distribution" />
          <HistChart data={analy.vibration_dist}       title="Vibration Level"     sub="g distribution" />
        </div>
      </div>

      {/* Scatter plots */}
      <div>
        <SectionHeader title="Risk vs Telemetry" sub="Relationship between sensor readings and predicted breakdown probability" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ScatterPlot data={analy.scatter_temp_prob}    title="Engine Temp vs Risk"   xKey="engine_temp_c"    xLabel="Engine Temp (°C)" />
          <ScatterPlot data={analy.scatter_mileage_prob} title="Mileage vs Risk"       xKey="odometer_reading" xLabel="Mileage (km)" />
          <ScatterPlot data={analy.scatter_oil_prob}     title="Oil Pressure vs Risk"  xKey="oil_pressure_psi" xLabel="Oil Pressure (psi)" />
        </div>
        <div className="flex gap-4 mt-3 justify-center">
          {Object.entries(RISK_COLORS).map(([l,c]) => (
            <div key={l} className="flex items-center gap-1.5 text-xs">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
              <span style={{ color: 'var(--text-muted)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mileage risk */}
      {analy.mileage_risk?.length > 0 && (
        <div className="card">
          <SectionHeader title="Average Risk by Mileage Range" sub="Do higher-mileage vehicles show more risk?" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analy.mileage_risk} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="range" tick={AXIS_STYLE} />
              <YAxis tick={AXIS_STYLE} tickFormatter={v => `${Math.round(v*100)}%`} domain={[0,1]} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v) => [`${Math.round(v*100)}%`, 'Avg Probability']} />
              <Bar dataKey="avg_prob" name="Avg Probability" fill="#3b82f6" radius={[4,4,0,0]}>
                {analy.mileage_risk.map((e, i) => (
                  <Cell key={i} fill={e.avg_prob >= 0.7 ? '#ef4444' : e.avg_prob >= 0.4 ? '#f59e0b' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
