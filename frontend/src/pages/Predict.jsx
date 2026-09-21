import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { RiskBadge, ProbBar } from '../components/Shared'

// Feature definitions matching the model's FEATURE_COLS exactly
// brand + 33 numerical features
const BRAND_OPTIONS = ['BMW','Toyota','Ford','Honda','Mercedes','Volkswagen','Hyundai','Kia','Nissan','Chevrolet']

const NUM_FIELDS = [
  { key: 'odometer_reading',       label: 'Odometer Reading',       unit: 'km',   min: 0,      max: 200000, step: 100,  default: 55000,  hint: 'Total distance driven' },
  { key: 'engine_temp_c',          label: 'Engine Temperature',      unit: '°C',   min: 60,     max: 130,    step: 0.1,  default: 95,     hint: 'Normal: 85–100°C' },
  { key: 'engine_rpm',             label: 'Engine RPM',              unit: 'rpm',  min: 700,    max: 5000,   step: 10,   default: 2000,   hint: 'Normal idle: 700–900' },
  { key: 'oil_pressure_psi',       label: 'Oil Pressure',            unit: 'psi',  min: 5,      max: 80,     step: 0.1,  default: 45,     hint: 'Normal: 25–65 psi' },
  { key: 'coolant_temp_c',         label: 'Coolant Temperature',     unit: '°C',   min: 70,     max: 110,    step: 0.1,  default: 90,     hint: 'Normal: 80–95°C' },
  { key: 'fuel_level_percent',     label: 'Fuel Level',              unit: '%',    min: 0,      max: 100,    step: 1,    default: 50,     hint: '' },
  { key: 'fuel_consumption_lph',   label: 'Fuel Consumption',        unit: 'L/h',  min: 0,      max: 20,     step: 0.1,  default: 5,      hint: '' },
  { key: 'engine_load_percent',    label: 'Engine Load',             unit: '%',    min: 0,      max: 100,    step: 1,    default: 40,     hint: '' },
  { key: 'throttle_pos_percent',   label: 'Throttle Position',       unit: '%',    min: 0,      max: 100,    step: 1,    default: 30,     hint: '' },
  { key: 'air_flow_rate_gps',      label: 'Air Flow Rate',           unit: 'g/s',  min: 0,      max: 120,    step: 0.1,  default: 50,     hint: '' },
  { key: 'exhaust_gas_temp_c',     label: 'Exhaust Gas Temperature', unit: '°C',   min: -100,   max: 1100,   step: 1,    default: 400,    hint: 'Normal: 200–600°C' },
  { key: 'vibration_level',        label: 'Vibration Level',         unit: 'g',    min: 0,      max: 8,      step: 0.01, default: 1.5,    hint: 'Normal: <2.0' },
  { key: 'engine_hours',           label: 'Engine Hours',            unit: 'hrs',  min: 0,      max: 6000,   step: 1,    default: 2600,   hint: '' },
  { key: 'brake_fluid_level_psi',  label: 'Brake Fluid Level',       unit: 'psi',  min: 400,    max: 1400,   step: 1,    default: 1000,   hint: 'Normal: 900–1100 psi' },
  { key: 'brake_pad_wear_mm',      label: 'Brake Pad Wear',          unit: 'mm',   min: 5,      max: 10,     step: 0.01, default: 8,      hint: 'Replace >9.5mm' },
  { key: 'brake_temp_c',           label: 'Brake Temperature',       unit: '°C',   min: -100,   max: 400,    step: 1,    default: 80,     hint: '' },
  { key: 'abs_fault_indicator',    label: 'ABS Fault Indicator',     unit: '',     min: 0,      max: 1,      step: 1,    default: 0,      hint: '0 = OK, 1 = Fault' },
  { key: 'brake_pedal_pos_percent',label: 'Brake Pedal Position',    unit: '%',    min: 0,      max: 100,    step: 1,    default: 50,     hint: '' },
  { key: 'wheel_speed_fl_kph',     label: 'Wheel Speed FL',          unit: 'kph',  min: 0,      max: 180,    step: 0.1,  default: 60,     hint: '' },
  { key: 'wheel_speed_fr_kph',     label: 'Wheel Speed FR',          unit: 'kph',  min: 0,      max: 180,    step: 0.1,  default: 60,     hint: '' },
  { key: 'wheel_speed_rl_kph',     label: 'Wheel Speed RL',          unit: 'kph',  min: 0,      max: 180,    step: 0.1,  default: 60,     hint: '' },
  { key: 'wheel_speed_rr_kph',     label: 'Wheel Speed RR',          unit: 'kph',  min: 0,      max: 180,    step: 0.1,  default: 60,     hint: '' },
  { key: 'battery_voltage_v',      label: 'Battery Voltage',         unit: 'V',    min: 9,      max: 15,     step: 0.01, default: 12.6,   hint: 'Normal: 12.4–12.8V' },
  { key: 'battery_current_a',      label: 'Battery Current',         unit: 'A',    min: -70,    max: 85,     step: 0.1,  default: 10,     hint: '' },
  { key: 'battery_temp_c',         label: 'Battery Temperature',     unit: '°C',   min: 5,      max: 45,     step: 0.1,  default: 25,     hint: '' },
  { key: 'alternator_output_v',    label: 'Alternator Output',       unit: 'V',    min: 13,     max: 16,     step: 0.01, default: 14.2,   hint: 'Normal: 13.8–14.5V' },
  { key: 'battery_charge_percent', label: 'Battery Charge',          unit: '%',    min: 40,     max: 100,    step: 1,    default: 70,     hint: '' },
  { key: 'battery_health_percent', label: 'Battery Health',          unit: '%',    min: 90,     max: 100,    step: 0.1,  default: 94,     hint: 'Normal: >92%' },
  { key: 'vehicle_speed_kph',      label: 'Vehicle Speed',           unit: 'kph',  min: 0,      max: 180,    step: 0.1,  default: 70,     hint: '' },
  { key: 'ambient_temp_c',         label: 'Ambient Temperature',     unit: '°C',   min: -20,    max: 65,     step: 0.1,  default: 30,     hint: '' },
  { key: 'humidity_percent',       label: 'Humidity',                unit: '%',    min: 10,     max: 120,    step: 0.1,  default: 60,     hint: '' },
  { key: 'gps_latitude',           label: 'GPS Latitude',            unit: '°',    min: 28,     max: 35,     step: 0.001,default: 31.5,   hint: '' },
  { key: 'gps_longitude',          label: 'GPS Longitude',           unit: '°',    min: 75,     max: 85,     step: 0.001,default: 80,     hint: '' },
]

const GROUPS = [
  { title: 'Engine',  keys: ['odometer_reading','engine_temp_c','engine_rpm','oil_pressure_psi','coolant_temp_c','engine_load_percent','throttle_pos_percent','air_flow_rate_gps','exhaust_gas_temp_c','vibration_level','engine_hours','fuel_level_percent','fuel_consumption_lph'] },
  { title: 'Brakes',  keys: ['brake_fluid_level_psi','brake_pad_wear_mm','brake_temp_c','abs_fault_indicator','brake_pedal_pos_percent','wheel_speed_fl_kph','wheel_speed_fr_kph','wheel_speed_rl_kph','wheel_speed_rr_kph'] },
  { title: 'Battery', keys: ['battery_voltage_v','battery_current_a','battery_temp_c','alternator_output_v','battery_charge_percent','battery_health_percent'] },
  { title: 'Environment', keys: ['vehicle_speed_kph','ambient_temp_c','humidity_percent','gps_latitude','gps_longitude'] },
]

function buildDefaults() {
  const d = { brand: 'Toyota' }
  NUM_FIELDS.forEach(f => { d[f.key] = f.default })
  return d
}

export default function Predict() {
  const [form, setForm]       = useState(buildDefaults)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [activeGroup, setActiveGroup] = useState('Engine')
  const navigate = useNavigate()

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    try {
      const payload = { ...form }
      NUM_FIELDS.forEach(f => { payload[f.key] = parseFloat(payload[f.key]) })
      const res = await api.predict(payload)
      setResult(res)
    } catch (err) {
      setError('Prediction failed. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const groupFields = GROUPS.find(g => g.title === activeGroup)?.keys || []
  const fieldMap    = Object.fromEntries(NUM_FIELDS.map(f => [f.key, f]))

  const riskColor = result
    ? result.risk_level === 'HIGH' ? '#ef4444' : result.risk_level === 'MEDIUM' ? '#f59e0b' : '#22c55e'
    : '#3b82f6'

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Predict Vehicle Risk</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Enter vehicle telemetry to get an AI-powered breakdown risk prediction
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-4">
          {/* Brand */}
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Vehicle Brand</p>
            <select value={form.brand} onChange={e => set('brand', e.target.value)} className="w-full">
              {BRAND_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Group tabs */}
          <div className="card p-0 overflow-hidden">
            <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
              {GROUPS.map(g => (
                <button key={g.title} type="button" onClick={() => setActiveGroup(g.title)}
                        className="flex-1 py-2.5 text-sm font-medium transition-all"
                        style={{
                          background: activeGroup === g.title ? 'rgba(59,130,246,0.1)' : 'transparent',
                          color: activeGroup === g.title ? '#60a5fa' : 'var(--text-muted)',
                          borderBottom: activeGroup === g.title ? '2px solid #3b82f6' : '2px solid transparent',
                        }}>
                  {g.title}
                </button>
              ))}
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              {groupFields.map(key => {
                const f = fieldMap[key]
                if (!f) return null
                return (
                  <div key={key}>
                    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
                      {f.label} {f.unit && <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>({f.unit})</span>}
                    </label>
                    <input type="number" value={form[key]} min={f.min} max={f.max} step={f.step}
                           onChange={e => set(key, e.target.value)}
                           className="w-full" />
                    {f.hint && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>{f.hint}</p>}
                  </div>
                )
              })}
            </div>
          </div>

          <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-base font-bold transition-all disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', color: 'white' }}>
            {loading ? '⏳ Analyzing…' : '🔍 Analyze Vehicle Risk'}
          </button>

          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}
        </form>

        {/* Result panel */}
        <div className="lg:col-span-2 space-y-4">
          {!result ? (
            <div className="card text-center py-16" style={{ color: 'var(--text-muted)' }}>
              <p className="text-4xl mb-3">🤖</p>
              <p className="text-sm font-semibold">AI Risk Assessment</p>
              <p className="text-xs mt-1">Fill in the telemetry form and click<br />"Analyze Vehicle Risk" to get a prediction.</p>
            </div>
          ) : (
            <>
              {/* Main result */}
              <div className="card text-center" style={{ borderColor: `${riskColor}40` }}>
                <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>AI Vehicle Risk Assessment</p>
                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-3"
                     style={{ background: `${riskColor}18`, border: `3px solid ${riskColor}` }}>
                  <p className="text-3xl font-bold tabular-nums" style={{ color: riskColor }}>
                    {Math.round(result.breakdown_probability * 100)}%
                  </p>
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Breakdown Probability</p>
                <RiskBadge level={result.risk_level} />
                <div className="mt-4">
                  <ProbBar value={result.breakdown_probability} />
                  <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    <span>0%</span><span>40%</span><span>70%</span><span>100%</span>
                  </div>
                </div>
              </div>

              {/* Risk factors */}
              {result.risk_factors?.length > 0 && (
                <div className="card">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                    Contributing Factors
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.risk_factors.map(f => (
                      <span key={f} className="badge text-xs"
                            style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.18)' }}>
                        ⚠ {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation */}
              <div className="card" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#f59e0b' }}>
                  Maintenance Recommendation
                </p>
                <p className="text-sm">{result.recommendation}</p>
                <p className="text-xs mt-3 p-2 rounded-lg" style={{ color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)' }}>
                  ⓘ Prototype AI recommendation. Not a guaranteed diagnosis. Consult a qualified technician.
                </p>
              </div>

              <button onClick={() => setResult(null)}
                      className="w-full py-2 rounded-lg text-sm"
                      style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                Reset & Predict Another
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
