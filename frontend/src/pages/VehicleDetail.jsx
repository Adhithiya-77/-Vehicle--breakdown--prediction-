import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { api } from '../services/api'
import { RiskBadge, ProbBar, Spinner, TOOLTIP_STYLE, AXIS_STYLE } from '../components/Shared'

function TelCard({ label, value, unit, warn, ok }) {
  const color = warn ? '#ef4444' : ok ? '#22c55e' : 'var(--text-primary)'
  const border = warn ? 'rgba(239,68,68,0.35)' : ok ? 'rgba(34,197,94,0.2)' : 'var(--border)'
  return (
    <div className="card flex flex-col gap-1" style={{ borderColor: border }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-xl font-bold tabular-nums" style={{ color }}>
        {value}
        {unit && <span className="text-sm font-normal ml-1" style={{ color: 'var(--text-muted)' }}>{unit}</span>}
      </p>
      {warn && <p className="text-xs" style={{ color: '#ef4444' }}>⚠ Abnormal</p>}
      {ok   && <p className="text-xs" style={{ color: '#22c55e' }}>✓ Normal</p>}
    </div>
  )
}

export default function VehicleDetail() {
  const { vehicleId } = useParams()
  const navigate      = useNavigate()
  const [v, setV]     = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    api.vehicle(vehicleId).then(setV).catch(() => setErr('Vehicle not found'))
  }, [vehicleId])

  if (err) return (
    <div className="p-8 text-center">
      <p style={{ color: '#ef4444' }}>{err}</p>
      <button onClick={() => navigate('/vehicles')} className="mt-4 text-sm" style={{ color: '#60a5fa' }}>← Back to Vehicles</button>
    </div>
  )
  if (!v) return <div className="p-8"><Spinner /></div>

  const pct        = Math.round(v.breakdown_probability * 100)
  const riskColor  = v.risk_level === 'HIGH' ? '#ef4444' : v.risk_level === 'MEDIUM' ? '#f59e0b' : '#22c55e'
  const histData   = (v.history || []).map(h => ({
    ...h,
    timestamp: String(h.timestamp).slice(5, 16),
  }))

  return (
    <div className="p-6 space-y-5 max-w-screen-lg mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm flex items-center gap-1 hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}>← Back</button>

      {/* Header card */}
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Vehicle Profile</p>
            <h1 className="text-3xl font-bold font-mono">{v.vehicle_id}</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {v.brand} &nbsp;·&nbsp; Last reading: {v.timestamp}
            </p>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>Risk Level</p>
              <RiskBadge level={v.risk_level} />
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Breakdown Probability</p>
              <p className="text-4xl font-bold tabular-nums" style={{ color: riskColor }}>{pct}%</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>AI-predicted risk</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Breakdown Probability Score</p>
          <ProbBar value={v.breakdown_probability} />
          <div className="flex justify-between text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
            <span>0% Healthy</span><span>40% Medium</span><span>70% High Risk</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* Telemetry grid */}
      <div>
        <p className="text-sm font-semibold mb-3">Live Telemetry Readings</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <TelCard label="Engine Temp"      value={v.engine_temp_c?.toFixed(1)}        unit="°C"  warn={v.engine_temp_c > 105}          ok={v.engine_temp_c <= 100} />
          <TelCard label="Oil Pressure"     value={v.oil_pressure_psi?.toFixed(1)}     unit="psi" warn={v.oil_pressure_psi < 25}         ok={v.oil_pressure_psi >= 35} />
          <TelCard label="Battery Voltage"  value={v.battery_voltage_v?.toFixed(2)}    unit="V"   warn={v.battery_voltage_v < 11.5}      ok={v.battery_voltage_v >= 12.4} />
          <TelCard label="Engine RPM"       value={Math.round(v.engine_rpm).toLocaleString()} unit="rpm" />
          <TelCard label="Mileage"          value={Math.round(v.odometer_reading).toLocaleString()} unit="km" warn={v.odometer_reading > 80000} />
          <TelCard label="Brake Wear"       value={v.brake_pad_wear_mm?.toFixed(1)}    unit="mm"  warn={v.brake_pad_wear_mm > 9}         ok={v.brake_pad_wear_mm <= 7} />
          <TelCard label="Fuel Level"       value={v.fuel_level_percent?.toFixed(0)}   unit="%"   warn={v.fuel_level_percent < 15} />
          <TelCard label="Coolant Temp"     value={v.coolant_temp_c?.toFixed(1)}       unit="°C"  warn={v.coolant_temp_c > 97} />
          <TelCard label="Battery Health"   value={v.battery_health_percent?.toFixed(1)} unit="%" warn={v.battery_health_percent < 92}   ok={v.battery_health_percent >= 95} />
          <TelCard label="Battery Charge"   value={v.battery_charge_percent?.toFixed(0)} unit="%" warn={v.battery_charge_percent < 45} />
          <TelCard label="Engine Hours"     value={Math.round(v.engine_hours).toLocaleString()} unit="hrs" warn={v.engine_hours > 4000} />
          <TelCard label="Vibration"        value={v.vibration_level?.toFixed(3)}      unit=""    warn={v.vibration_level > 2.5} />
          <TelCard label="Engine Load"      value={v.engine_load_percent?.toFixed(0)}  unit="%"   warn={v.engine_load_percent > 85} />
          <TelCard label="Exhaust Temp"     value={v.exhaust_gas_temp_c?.toFixed(0)}   unit="°C"  warn={v.exhaust_gas_temp_c > 700} />
          <TelCard label="Brake Fluid"      value={v.brake_fluid_level_psi?.toFixed(0)} unit="psi" warn={v.brake_fluid_level_psi < 800} />
          <TelCard label="ABS Fault"        value={v.abs_fault_indicator === 1 ? 'FAULT' : 'OK'} warn={v.abs_fault_indicator === 1} ok={v.abs_fault_indicator === 0} />
        </div>
      </div>

      {/* Historical trend */}
      {histData.length > 1 && (
        <div className="card">
          <p className="text-sm font-semibold mb-4">Historical Telemetry Trend (Last {histData.length} Readings)</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={histData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="timestamp" tick={{ ...AXIS_STYLE, fontSize: 9 }} />
              <YAxis tick={AXIS_STYLE} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="engine_temp_c"   name="Engine Temp (°C)"   stroke="#ef4444" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="oil_pressure_psi" name="Oil Pressure (psi)" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
              <Line type="monotone" dataKey="battery_voltage_v" name="Battery V"         stroke="#3b82f6" dot={false} strokeWidth={1.5} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-center">
            {[['Engine Temp','#ef4444'],['Oil Pressure','#f59e0b'],['Battery V','#3b82f6']].map(([l,c]) => (
              <div key={l} className="flex items-center gap-1.5 text-xs">
                <span className="w-3 h-0.5 rounded" style={{ background: c }} />
                <span style={{ color: 'var(--text-muted)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Risk Assessment */}
      <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
        <p className="text-sm font-semibold mb-3">🤖 AI Risk Assessment</p>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Telemetry factors contributing to this vehicle's elevated risk score:
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {v.risk_factors?.map(f => (
            <span key={f} className="badge text-xs"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
              ⚠ {f}
            </span>
          ))}
        </div>

        <div className="p-4 rounded-xl" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: '#f59e0b' }}>
            Maintenance Recommendation
          </p>
          <p className="text-sm font-medium">{v.recommendation}</p>
          <p className="text-xs mt-3 p-2 rounded-lg" style={{ color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)' }}>
            ⓘ Prototype decision-support recommendation. This is an AI-generated suggestion based on telemetry patterns — not a guaranteed diagnosis. Always consult a qualified technician.
          </p>
        </div>
      </div>
    </div>
  )
}
