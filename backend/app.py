import os
import numpy as np
import pandas as pd
import joblib
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ML_DIR   = os.path.join(BASE_DIR, '..', 'ml')

# ── Risk thresholds — single source of truth for the entire application ───────
HIGH_THRESHOLD   = 0.70   # probability >= 0.70  → HIGH
MEDIUM_THRESHOLD = 0.40   # probability >= 0.40  → MEDIUM  (else LOW)

# ── Load model package ────────────────────────────────────────────────────────
pkg          = joblib.load(os.path.join(ML_DIR, 'vehicle_breakdown_model.pkl'))
model        = pkg['model']
preprocessor = pkg['preprocessor']
THRESHOLD    = pkg['threshold']        # 0.70 — kept for reference / predict endpoint
FEATURE_COLS = pkg['feature_columns']  # 34 cols: brand + 33 numerics

# ── Load dataset — ALL rows ───────────────────────────────────────────────────
# The CSV has ~1970 rows. Every row is treated as a distinct vehicle record.
df_raw = pd.read_csv(os.path.join(ML_DIR, 'synthetic_telemetry_data.csv'))
df_raw['timestamp']    = pd.to_datetime(df_raw['timestamp'],    errors='coerce')
df_raw['failure_date'] = pd.to_datetime(df_raw['failure_date'], errors='coerce')

df = df_raw.copy().reset_index(drop=True)
# Unique addressable ID per row (vehicle_id repeats across multiple readings)
df['record_id'] = df['vehicle_id'] + '_R' + df.index.astype(str).str.zfill(4)

# ── Run ML predictions on ALL rows ───────────────────────────────────────────
X_proc = preprocessor.transform(df[FEATURE_COLS])
probs  = model.predict_proba(X_proc)[:, 1]
df['breakdown_probability'] = probs

# Assign risk level using the thresholds defined above
df['risk_level'] = pd.cut(
    df['breakdown_probability'],
    bins=[-0.001, MEDIUM_THRESHOLD, HIGH_THRESHOLD, 1.001],
    labels=['LOW', 'MEDIUM', 'HIGH']
).astype(str)

# ── Helper functions ──────────────────────────────────────────────────────────

def get_risk_label(prob):
    """Classify a single probability value using the project thresholds."""
    if prob >= HIGH_THRESHOLD:   return 'HIGH'
    if prob >= MEDIUM_THRESHOLD: return 'MEDIUM'
    return 'LOW'


def vehicle_to_dict(row):
    return {
        'vehicle_id':             row.get('record_id', row['vehicle_id']),
        'base_vehicle_id':        row['vehicle_id'],
        'brand':                  str(row.get('brand', '')),
        'risk_level':             row['risk_level'],
        'breakdown_probability':  round(float(row['breakdown_probability']), 4),
        'engine_temp_c':          round(float(row.get('engine_temp_c', 0)), 2),
        'engine_rpm':             round(float(row.get('engine_rpm', 0)), 2),
        'oil_pressure_psi':       round(float(row.get('oil_pressure_psi', 0)), 2),
        'coolant_temp_c':         round(float(row.get('coolant_temp_c', 0)), 2),
        'fuel_level_percent':     round(float(row.get('fuel_level_percent', 0)), 2),
        'fuel_consumption_lph':   round(float(row.get('fuel_consumption_lph', 0)), 2),
        'engine_load_percent':    round(float(row.get('engine_load_percent', 0)), 2),
        'throttle_pos_percent':   round(float(row.get('throttle_pos_percent', 0)), 2),
        'exhaust_gas_temp_c':     round(float(row.get('exhaust_gas_temp_c', 0)), 2),
        'vibration_level':        round(float(row.get('vibration_level', 0)), 4),
        'engine_hours':           round(float(row.get('engine_hours', 0)), 2),
        'odometer_reading':       round(float(row.get('odometer_reading', 0)), 2),
        'battery_voltage_v':      round(float(row.get('battery_voltage_v', 0)), 2),
        'battery_current_a':      round(float(row.get('battery_current_a', 0)), 2),
        'battery_temp_c':         round(float(row.get('battery_temp_c', 0)), 2),
        'battery_charge_percent': round(float(row.get('battery_charge_percent', 0)), 2),
        'battery_health_percent': round(float(row.get('battery_health_percent', 0)), 2),
        'alternator_output_v':    round(float(row.get('alternator_output_v', 0)), 2),
        'brake_pad_wear_mm':      round(float(row.get('brake_pad_wear_mm', 0)), 2),
        'brake_temp_c':           round(float(row.get('brake_temp_c', 0)), 2),
        'brake_fluid_level_psi':  round(float(row.get('brake_fluid_level_psi', 0)), 2),
        'abs_fault_indicator':    int(row.get('abs_fault_indicator', 0)),
        'vehicle_speed_kph':      round(float(row.get('vehicle_speed_kph', 0)), 2),
        'ambient_temp_c':         round(float(row.get('ambient_temp_c', 0)), 2),
        'humidity_percent':       round(float(row.get('humidity_percent', 0)), 2),
        'timestamp':              str(row.get('timestamp', ''))[:16],
    }


def get_risk_factors(row):
    factors = []
    if float(row.get('engine_temp_c', 0)) > 105:
        factors.append('High engine temperature')
    if float(row.get('oil_pressure_psi', 0)) < 25:
        factors.append('Low oil pressure')
    if float(row.get('odometer_reading', 0)) > 80000:
        factors.append('High mileage')
    if float(row.get('brake_pad_wear_mm', 0)) > 9:
        factors.append('Brake pad wear detected')
    if float(row.get('battery_voltage_v', 0)) < 11.5:
        factors.append('Low battery voltage')
    if float(row.get('battery_health_percent', 0)) < 92:
        factors.append('Degraded battery health')
    if float(row.get('vibration_level', 0)) > 2.5:
        factors.append('Abnormal vibration levels')
    if float(row.get('engine_hours', 0)) > 4000:
        factors.append('High engine hours')
    if float(row.get('coolant_temp_c', 0)) > 97:
        factors.append('Elevated coolant temperature')
    if float(row.get('exhaust_gas_temp_c', 0)) > 700:
        factors.append('High exhaust gas temperature')
    if int(row.get('abs_fault_indicator', 0)) == 1:
        factors.append('ABS fault detected')
    if float(row.get('brake_fluid_level_psi', 0)) < 800:
        factors.append('Low brake fluid pressure')
    if not factors:
        factors.append('Elevated risk from combined sensor readings')
    return factors


def get_recommendation(risk, factors):
    if risk == 'HIGH':
        top = ', '.join(factors[:3])
        return f'HIGH PRIORITY — Schedule preventive inspection within 7 days. Key concerns: {top}.'
    if risk == 'MEDIUM':
        return 'MEDIUM PRIORITY — Monitor closely. Schedule inspection within 30 days.'
    return 'LOW PRIORITY — Vehicle appears healthy. Continue regular maintenance schedule.'


def compute_fleet_health_scores():
    """
    Compute sub-system health scores from actual dataset telemetry columns.

    Engine Health:
        Normalise engine_temp_c (85°C = 100, 120°C = 0) and
        oil_pressure_psi (5 psi = 0, 65 psi = 100).
        Engine Health = mean of (temp_score + oil_score) / 2 across all rows.

    Battery Health:
        Direct mean of battery_health_percent column (already 0–100 scale).

    Brake Health:
        brake_pad_wear_mm — lower wear = healthier.
        Normalised using the actual min/max range in the dataset.
        Score = 100 * (max_wear - wear) / (max_wear - min_wear)

    Overall Fleet Health:
        Risk-weighted average:
          LOW    → 100 pts
          MEDIUM →  50 pts
          HIGH   →   0 pts
        fleet_health = (low*100 + medium*50 + high*0) / total
    """
    scores = []

    # Engine Health
    temp_score    = (120 - df['engine_temp_c'].clip(85, 120)) / (120 - 85) * 100
    oil_score     = (df['oil_pressure_psi'].clip(5, 65) - 5) / (65 - 5) * 100
    engine_health = round(float(((temp_score + oil_score) / 2).mean()), 1)
    scores.append(('Engine Health', engine_health))

    # Battery Health — direct from column
    battery_health = round(float(df['battery_health_percent'].mean()), 1)
    scores.append(('Battery Health', battery_health))

    # Brake Health — normalised wear
    wear_min = float(df['brake_pad_wear_mm'].min())
    wear_max = float(df['brake_pad_wear_mm'].max())
    if wear_max > wear_min:
        brake_score = (wear_max - df['brake_pad_wear_mm']) / (wear_max - wear_min) * 100
    else:
        brake_score = pd.Series([100.0] * len(df), index=df.index)
    brake_health = round(float(brake_score.mean()), 1)
    scores.append(('Brake Health', brake_health))

    # Overall Fleet Health — risk-weighted
    high   = int((df['risk_level'] == 'HIGH').sum())
    medium = int((df['risk_level'] == 'MEDIUM').sum())
    low    = int((df['risk_level'] == 'LOW').sum())
    total  = len(df)
    overall = round((low * 100 + medium * 50) / total, 1) if total > 0 else 0.0
    scores.append(('Overall Fleet Health', overall))

    return scores


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get('/api/health')
def health():
    return jsonify({
        'status':            'ok',
        'total_records':     len(df),
        'unique_vehicle_ids': int(df['vehicle_id'].nunique()),
    })


@app.get('/api/dashboard')
def dashboard():
    high   = int((df['risk_level'] == 'HIGH').sum())
    medium = int((df['risk_level'] == 'MEDIUM').sum())
    low    = int((df['risk_level'] == 'LOW').sum())
    total  = len(df)

    # Invariant: high + medium + low == total
    # (pd.cut with the bins above guarantees every row gets a label)

    # predicted_breakdowns: rows where probability >= model threshold (0.70)
    # Equals high_risk by construction; kept as explicit calculation for clarity.
    predicted_breakdowns = int((df['breakdown_probability'] >= HIGH_THRESHOLD).sum())

    # maintenance_required: HIGH + MEDIUM (vehicles needing attention)
    maintenance_required = high + medium

    # Fleet health: risk-weighted score (LOW=100, MEDIUM=50, HIGH=0)
    avg_fleet_health = round((low * 100 + medium * 50) / total, 1) if total > 0 else 0.0

    # Top 10 highest-risk records from the COMPLETE dataset
    top10_rows = df.nlargest(10, 'breakdown_probability')
    top10 = [
        {
            'vehicle_id':            r['record_id'],
            'brand':                 str(r.get('brand', '')),
            'risk_level':            r['risk_level'],
            'breakdown_probability': round(float(r['breakdown_probability']), 4),
            'engine_temp_c':         round(float(r.get('engine_temp_c', 0)), 2),
            'oil_pressure_psi':      round(float(r.get('oil_pressure_psi', 0)), 2),
            'odometer_reading':      round(float(r.get('odometer_reading', 0)), 2),
        }
        for _, r in top10_rows.iterrows()
    ]

    # Probability distribution — every record in exactly one bucket
    bins   = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    labels = ['0-10%', '10-20%', '20-30%', '30-40%', '40-50%',
              '50-60%', '60-70%', '70-80%', '80-90%', '90-100%']
    dist_series = pd.cut(
        df['breakdown_probability'], bins=bins, labels=labels, include_lowest=True
    ).value_counts().sort_index()
    dist_dict = {str(k): int(v) for k, v in dist_series.items()}

    health_scores = compute_fleet_health_scores()

    # Telemetry summary — all from complete dataset
    telemetry = {
        'avg_engine_temp_c':         round(float(df['engine_temp_c'].mean()), 2),
        'avg_oil_pressure_psi':      round(float(df['oil_pressure_psi'].mean()), 2),
        'avg_battery_voltage_v':     round(float(df['battery_voltage_v'].mean()), 2),
        'avg_battery_health_pct':    round(float(df['battery_health_percent'].mean()), 2),
        'avg_brake_pad_wear_mm':     round(float(df['brake_pad_wear_mm'].mean()), 2),
        'avg_fuel_level_pct':        round(float(df['fuel_level_percent'].mean()), 2),
        'avg_odometer_km':           round(float(df['odometer_reading'].mean()), 0),
        'avg_engine_hours':          round(float(df['engine_hours'].mean()), 0),
        'avg_breakdown_probability': round(float(df['breakdown_probability'].mean()), 4),
        'max_breakdown_probability': round(float(df['breakdown_probability'].max()), 4),
        'min_breakdown_probability': round(float(df['breakdown_probability'].min()), 4),
        'vehicles_high_engine_temp': int((df['engine_temp_c'] > 105).sum()),
        'vehicles_low_oil_pressure': int((df['oil_pressure_psi'] < 25).sum()),
        'vehicles_low_battery_v':    int((df['battery_voltage_v'] < 11.5).sum()),
        'vehicles_high_brake_wear':  int((df['brake_pad_wear_mm'] > 9).sum()),
        'vehicles_abs_fault':        int((df['abs_fault_indicator'] == 1).sum()),
    }

    return jsonify({
        'total_vehicles':           total,
        'total_records':            total,
        'high_risk':                high,
        'medium_risk':              medium,
        'low_risk':                 low,
        'predicted_breakdowns':     predicted_breakdowns,
        'maintenance_required':     maintenance_required,
        'avg_fleet_health':         avg_fleet_health,
        'recently_flagged':         high,
        'risk_distribution':        {'HIGH': high, 'MEDIUM': medium, 'LOW': low},
        'probability_distribution': dist_dict,
        'top10_highest_risk':       top10,
        'fleet_health_scores':      health_scores,
        'telemetry':                telemetry,
        'thresholds':               {'high': HIGH_THRESHOLD, 'medium': MEDIUM_THRESHOLD},
    })


@app.get('/api/vehicles')
def vehicles():
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 25))
    risk     = request.args.get('risk', '').upper()
    search   = request.args.get('search', '').lower()
    sort_by  = request.args.get('sort_by', 'breakdown_probability')
    sort_dir = request.args.get('sort_dir', 'desc')

    filtered = df.copy()
    if risk:
        filtered = filtered[filtered['risk_level'] == risk]
    if search:
        mask = (
            filtered['record_id'].str.lower().str.contains(search, na=False) |
            filtered['vehicle_id'].str.lower().str.contains(search, na=False)
        )
        filtered = filtered[mask]

    ascending = (sort_dir == 'asc')
    if sort_by in filtered.columns:
        filtered = filtered.sort_values(sort_by, ascending=ascending)

    total   = len(filtered)
    start   = (page - 1) * per_page
    page_df = filtered.iloc[start:start + per_page]

    return jsonify({
        'total':    total,
        'page':     page,
        'per_page': per_page,
        'pages':    max(1, (total + per_page - 1) // per_page),
        'vehicles': [vehicle_to_dict(r) for _, r in page_df.iterrows()],
    })


@app.get('/api/vehicles/<vehicle_id>')
def vehicle_detail(vehicle_id):
    row = df[df['record_id'] == vehicle_id]
    if row.empty:
        row = df[df['vehicle_id'] == vehicle_id]
    if row.empty:
        return jsonify({'error': 'Vehicle not found'}), 404
    r       = row.iloc[0]
    data    = vehicle_to_dict(r)
    factors = get_risk_factors(r)
    data['risk_factors']   = factors
    data['recommendation'] = get_recommendation(r['risk_level'], factors)

    base_id = r['vehicle_id']
    hist = (df_raw[df_raw['vehicle_id'] == base_id]
            .sort_values('timestamp')
            .tail(10)[['timestamp', 'engine_temp_c', 'oil_pressure_psi',
                        'battery_voltage_v', 'engine_rpm']]
            .to_dict(orient='records'))
    data['history'] = hist
    return jsonify(data)


@app.get('/api/alerts')
def alerts():
    severity = request.args.get('severity', '').upper()
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    alerts_df = df[df['risk_level'].isin(['HIGH', 'MEDIUM'])].copy()
    if severity in ('HIGH', 'MEDIUM'):
        alerts_df = alerts_df[alerts_df['risk_level'] == severity]
    alerts_df = alerts_df.sort_values('breakdown_probability', ascending=False)

    total   = len(alerts_df)
    start   = (page - 1) * per_page
    page_df = alerts_df.iloc[start:start + per_page]

    result = []
    for _, r in page_df.iterrows():
        factors = get_risk_factors(r)
        result.append({
            'vehicle_id':            r['record_id'],
            'brand':                 str(r.get('brand', '')),
            'risk_level':            r['risk_level'],
            'breakdown_probability': round(float(r['breakdown_probability']), 4),
            'issues':                factors[:3],
            'recommendation':        get_recommendation(r['risk_level'], factors),
            'engine_temp_c':         round(float(r.get('engine_temp_c', 0)), 1),
            'odometer_reading':      round(float(r.get('odometer_reading', 0)), 0),
        })
    return jsonify({
        'total':    total,
        'page':     page,
        'per_page': per_page,
        'pages':    max(1, (total + per_page - 1) // per_page),
        'alerts':   result,
    })


@app.get('/api/maintenance')
def maintenance():
    maint_df = df.sort_values('breakdown_probability', ascending=False)
    result = []
    for _, r in maint_df.iterrows():
        factors = get_risk_factors(r)
        risk    = r['risk_level']
        if risk == 'HIGH':
            priority, status = 'Critical', 'Needs Inspection'
        elif risk == 'MEDIUM':
            priority, status = 'High', 'Monitor'
        else:
            priority, status = 'Low', 'Healthy'
        result.append({
            'vehicle_id':            r['record_id'],
            'brand':                 str(r.get('brand', '')),
            'risk_level':            risk,
            'breakdown_probability': round(float(r['breakdown_probability']), 4),
            'priority':              priority,
            'status':                status,
            'main_concern':          factors[0] if factors else 'N/A',
            'issues':                factors[:3],
            'recommendation':        get_recommendation(risk, factors),
            'odometer_reading':      round(float(r.get('odometer_reading', 0)), 0),
            'engine_hours':          round(float(r.get('engine_hours', 0)), 0),
        })
    return jsonify({'total': len(result), 'vehicles': result})


@app.get('/api/analytics')
def analytics():
    def hist(col, bins=10):
        counts, edges = np.histogram(df[col].dropna(), bins=bins)
        return [{'range': f'{edges[i]:.1f}–{edges[i+1]:.1f}', 'count': int(counts[i])}
                for i in range(len(counts))]

    sample = df.sample(min(200, len(df)), random_state=42)

    brand_risk = (df.groupby('brand')['breakdown_probability']
                    .mean().round(4).reset_index()
                    .rename(columns={'breakdown_probability': 'avg_prob'})
                    .sort_values('avg_prob', ascending=False)
                    .to_dict(orient='records'))

    # Use a local copy to avoid mutating the shared df
    df_local = df[['odometer_reading', 'breakdown_probability']].copy()
    df_local['mileage_bucket'] = pd.cut(
        df_local['odometer_reading'],
        bins=[0, 20000, 40000, 60000, 80000, 100000, 200000],
        labels=['<20k', '20-40k', '40-60k', '60-80k', '80-100k', '>100k']
    )
    mileage_risk = (df_local.groupby('mileage_bucket', observed=True)['breakdown_probability']
                      .mean().round(4).reset_index()
                      .rename(columns={'breakdown_probability': 'avg_prob',
                                       'mileage_bucket': 'range'})
                      .to_dict(orient='records'))

    return jsonify({
        'engine_temp_dist':     hist('engine_temp_c'),
        'oil_pressure_dist':    hist('oil_pressure_psi'),
        'battery_voltage_dist': hist('battery_voltage_v'),
        'brake_wear_dist':      hist('brake_pad_wear_mm'),
        'mileage_dist':         hist('odometer_reading'),
        'fuel_level_dist':      hist('fuel_level_percent'),
        'engine_rpm_dist':      hist('engine_rpm'),
        'vibration_dist':       hist('vibration_level'),
        'scatter_temp_prob':    sample[['engine_temp_c', 'breakdown_probability', 'risk_level']].to_dict(orient='records'),
        'scatter_mileage_prob': sample[['odometer_reading', 'breakdown_probability', 'risk_level']].to_dict(orient='records'),
        'scatter_oil_prob':     sample[['oil_pressure_psi', 'breakdown_probability', 'risk_level']].to_dict(orient='records'),
        'brand_risk':           brand_risk,
        'mileage_risk':         mileage_risk,
        'avg_engine_temp':      round(float(df['engine_temp_c'].mean()), 2),
        'avg_oil_pressure':     round(float(df['oil_pressure_psi'].mean()), 2),
        'avg_battery_v':        round(float(df['battery_voltage_v'].mean()), 2),
        'avg_brake_wear':       round(float(df['brake_pad_wear_mm'].mean()), 2),
        'avg_mileage':          round(float(df['odometer_reading'].mean()), 0),
        'avg_fuel':             round(float(df['fuel_level_percent'].mean()), 1),
    })


@app.post('/api/predict')
def predict():
    body = request.get_json(force=True)
    if not body:
        return jsonify({'error': 'No input provided'}), 400

    row = {}
    for col in FEATURE_COLS:
        val = body.get(col)
        if val is None:
            val = float(df[col].median()) if col in df.columns and df[col].dtype != object else (df[col].mode()[0] if col in df.columns else 0)
        row[col] = val

    try:
        X_proc = preprocessor.transform(pd.DataFrame([row]))
        prob   = float(model.predict_proba(X_proc)[0, 1])
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

    risk    = get_risk_label(prob)
    factors = get_risk_factors(row)
    return jsonify({
        'breakdown_probability': round(prob, 4),
        'risk_level':            risk,
        'risk_factors':          factors,
        'recommendation':        get_recommendation(risk, factors),
        'threshold_used':        HIGH_THRESHOLD,
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
