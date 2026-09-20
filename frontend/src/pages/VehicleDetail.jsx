import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { RiskBadge, ProbBar, Spinner } from '../components/Shared'

function TelCard({ label, value, unit, warn }) {
  return (
    <div className="card flex flex-col gap-1" style={warn ? { borderColor: 'rgba(239,68,68,0.4)' } : {}}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: warn ? '#ef4444' : 'var(--text-primary)' }}>
        {value} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>{unit}</span>
      </p>
    </div>
  )
}

export default function VehicleDetail() {
  const { vehicleId } = useParams()
  const navigate = useNavigate()
  const [v, setV] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    api.vehicle(vehicleId).then(setV).catch(() => setErr('Vehicle not found'))
  }, [vehicleId])

  if (err) return <div className="p-8 text-center" style={{ color: '#ef4444' }}>{err}</div>
  if (!v)  return <div className="p-8"><Spinner /></div>

  const pct = Math.round(v.breakdown_probability * 100)

  return (
    <div className="p-6 space-y-6 max-w-screen-lg mx-auto">
      <button onClick={() => navigate(-1)} className="text-sm flex items-center gap-1"
              style={{ color: 'var(--text-muted)' }}>← Back</button>

      {/* Header */}
      <div className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Vehicle Profile</p>
          <h1 className="text-2xl font-bold font-mono">{v.vehicle_id}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{v.brand} · Last reading: {v.timestamp?.slice(0,16)}</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Current Risk</p>
            <RiskBadge level={v.risk_level} />
          </div>
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Breakdown Probability</p>
            <p className="text-3xl font-bold" style={{ color: v.risk_level === 'HIGH' ? '#ef4444' : v.risk_level === 'MEDIUM' ? '#f59e0b' : '#22c55e' }}>
              {pct}%
            </p>
          </div>
        </div>
      </div>

      {/* Telemetry */}
      <div>
        <p className="text-sm font-semibold mb-3">Telemetry Readings</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <TelCard label="Engine Temp"     value={v.engine_temp_c?.toFixed(1)}       unit="°C"  warn={v.engine_temp_c > 105} />
          <TelCard label="Oil Pressure"    value={v.oil_pressure_psi?.toFixed(1)}    unit="psi" warn={v.oil_pressure_psi < 25} />
          <TelCard label="Battery Voltage" value={v.battery_voltage_v?.toFixed(2)}   unit="V"   warn={v.battery_voltage_v < 11.5} />
          <TelCard label="Engine RPM"      value={Math.round(v.engine_rpm)}          unit="rpm" />
          <TelCard label="Mileage"         value={Math.round(v.odometer_reading).toLocaleString()} unit="km" warn={v.odometer_reading > 80000} />
          <TelCard label="Brake Wear"      value={v.brake_pad_wear_mm?.toFixed(1)}   unit="mm"  warn={v.brake_pad_wear_mm > 9} />
          <TelCard label="Fuel Level"      value={v.fuel_level_percent?.toFixed(0)}  unit="%"   warn={v.fuel_level_percent < 15} />
          <TelCard label="Coolant Temp"    value={v.coolant_temp_c?.toFixed(1)}      unit="°C"  warn={v.coolant_temp_c > 97} />
          <TelCard label="Battery Health"  value={v.battery_health_percent?.toFixed(1)} unit="%" warn={v.battery_health_percent < 92} />
          <TelCard label="Engine Hours"    value={Math.round(v.engine_hours)}        unit="hrs" warn={v.engine_hours > 4000} />
          <TelCard label="Vibration"       value={v.vibration_level?.toFixed(3)}     unit=""    warn={v.vibration_level > 2.5} />
          <TelCard label="Engine Load"     value={v.engine_load_percent?.toFixed(0)} unit="%"   />
        </div>
      </div>

      {/* AI Risk Assessment */}
      <div className="card" style={{ borderColor: 'rgba(239,68,68,0.25)' }}>
        <p className="text-sm font-semibold mb-3">🤖 AI Risk Assessment</p>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          The following telemetry factors are contributing to this vehicle's risk score:
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {v.risk_factors?.map(f => (
            <span key={f} className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.25)', fontSize: '0.78rem' }}>
              ⚠ {f}
            </span>
          ))}
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p className="text-xs font-semibold mb-1" style={{ color: '#f59e0b' }}>Recommended Action</p>
          <p className="text-sm">{v.recommendation}</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            ⓘ This is an AI-generated prototype recommendation based on telemetry data.
          </p>
        </div>
      </div>

      {/* Probability bar */}
      <div className="card">
        <p className="text-sm font-semibold mb-3">Breakdown Probability Score</p>
        <ProbBar value={v.breakdown_probability} />
        <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          <span>0% — Healthy</span><span>40% — Medium</span><span>70% — High Risk</span><span>100%</span>
        </div>
      </div>
    </div>
  )
}
