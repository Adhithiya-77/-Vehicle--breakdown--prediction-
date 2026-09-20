import os
import numpy as np
import pandas as pd
import joblib
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ML_DIR = os.path.join(BASE_DIR, '..', 'ml')

# ── Load model package ────────────────────────────────────────────────────────
pkg = joblib.load(os.path.join(ML_DIR, 'vehicle_breakdown_model.pkl'))
model       = pkg['model']
preprocessor = pkg['preprocessor']
THRESHOLD   = pkg['threshold']          # 0.70
FEATURE_COLS = pkg['feature_columns']   # 34 cols (brand + 33 numerics)

# ── Load & preprocess dataset ─────────────────────────────────────────────────
df_raw = pd.read_csv(os.path.join(ML_DIR, 'synthetic_telemetry_data.csv'))

# Aggregate per vehicle (latest reading)
df = df_raw.sort_values('timestamp').groupby('vehicle_id').last().reset_index()

# Columns the model needs
DROP_COLS = ['vehicle_id', 'timestamp', 'failure_date', 'failure_type',
             'engine_failure_imminent', 'brake_issue_imminent', 'battery_issue_imminent']

def get_risk_label(prob):
    if prob >= 0.70:
        return 'HIGH'
    elif prob >= 0.40:
        return 'MEDIUM'
    return 'LOW'

def build_predictions():
    X = df[FEATURE_COLS]
    X_proc = preprocessor.transform(X)
    probs = model.predict_proba(X_proc)[:, 1]
    return probs

probs = build_predictions()
df['breakdown_probability'] = probs
df['risk_level'] = df['breakdown_probability'].apply(get_risk_label)

# ── Helper ────────────────────────────────────────────────────────────────────
def vehicle_to_dict(row):
    return {
        'vehicle_id':            row['vehicle_id'],
        'brand':                 row.get('brand', ''),
        'risk_level':            row['risk_level'],
        'breakdown_probability': round(float(row['breakdown_probability']), 4),
        'engine_temp_c':         round(float(row.get('engine_temp_c', 0)), 2),
        'engine_rpm':            round(float(row.get('engine_rpm', 0)), 2),
        'oil_pressure_psi':      round(float(row.get('oil_pressure_psi', 0)), 2),
        'coolant_temp_c':        round(float(row.get('coolant_temp_c', 0)), 2),
        'fuel_level_percent':    round(float(row.get('fuel_level_percent', 0)), 2),
        'odometer_reading':      round(float(row.get('odometer_reading', 0)), 2),
        'battery_voltage_v':     round(float(row.get('battery_voltage_v', 0)), 2),
        'battery_health_percent':round(float(row.get('battery_health_percent', 0)), 2),
        'battery_charge_percent':round(float(row.get('battery_charge_percent', 0)), 2),
        'brake_pad_wear_mm':     round(float(row.get('brake_pad_wear_mm', 0)), 2),
        'brake_temp_c':          round(float(row.get('brake_temp_c', 0)), 2),
        'brake_fluid_level_psi': round(float(row.get('brake_fluid_level_psi', 0)), 2),
        'vibration_level':       round(float(row.get('vibration_level', 0)), 4),
        'engine_hours':          round(float(row.get('engine_hours', 0)), 2),
        'vehicle_speed_kph':     round(float(row.get('vehicle_speed_kph', 0)), 2),
        'exhaust_gas_temp_c':    round(float(row.get('exhaust_gas_temp_c', 0)), 2),
        'engine_load_percent':   round(float(row.get('engine_load_percent', 0)), 2),
        'abs_fault_indicator':   int(row.get('abs_fault_indicator', 0)),
        'timestamp':             str(row.get('timestamp', '')),
    }

def get_risk_factors(row):
    factors = []
    if row.get('engine_temp_c', 0) > 105:
        factors.append('High engine temperature')
    if row.get('oil_pressure_psi', 0) < 25:
        factors.append('Low oil pressure')
    if row.get('odometer_reading', 0) > 80000:
        factors.append('High mileage')
    if row.get('brake_pad_wear_mm', 0) > 9:
        factors.append('Brake pad wear detected')
    if row.get('battery_voltage_v', 0) < 11.5:
        factors.append('Low battery voltage')
    if row.get('battery_health_percent', 0) < 92:
        factors.append('Degraded battery health')
    if row.get('vibration_level', 0) > 2.5:
        factors.append('Abnormal vibration levels')
    if row.get('engine_hours', 0) > 4000:
        factors.append('High engine hours')
    if row.get('coolant_temp_c', 0) > 97:
        factors.append('Elevated coolant temperature')
    if row.get('exhaust_gas_temp_c', 0) > 700:
        factors.append('High exhaust gas temperature')
    if row.get('abs_fault_indicator', 0) == 1:
        factors.append('ABS fault detected')
    if not factors:
        factors.append('Elevated breakdown probability from combined sensor readings')
    return factors

def get_recommendation(risk, factors):
    if risk == 'HIGH':
        return 'Schedule preventive maintenance within 7 days. Inspect: ' + ', '.join(factors[:3]) + '.'
    elif risk == 'MEDIUM':
        return 'Monitor closely. Schedule inspection within 30 days.'
    return 'Vehicle is healthy. Continue regular maintenance schedule.'

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get('/api/health')
def health():
    return jsonify({'status': 'ok', 'vehicles_loaded': len(df)})

@app.get('/api/dashboard')
def dashboard():
    high   = int((df['risk_level'] == 'HIGH').sum())
    medium = int((df['risk_level'] == 'MEDIUM').sum())
    low    = int((df['risk_level'] == 'LOW').sum())
    total  = len(df)

    top10 = (df.nlargest(10, 'breakdown_probability')
               [['vehicle_id', 'risk_level', 'breakdown_probability', 'engine_temp_c', 'oil_pressure_psi']]
               .to_dict(orient='records'))

    dist_bins = pd.cut(df['breakdown_probability'], bins=[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
                       labels=['0-10%','10-20%','20-30%','30-40%','40-50%','50-60%','60-70%','70-80%','80-90%','90-100%'])
    dist = dist_bins.value_counts().sort_index().to_dict()

    return jsonify({
        'total_vehicles':        total,
        'high_risk':             high,
        'medium_risk':           medium,
        'low_risk':              low,
        'predicted_breakdowns':  high,
        'risk_distribution':     {'HIGH': high, 'MEDIUM': medium, 'LOW': low},
        'probability_distribution': {str(k): int(v) for k, v in dist.items()},
        'top10_highest_risk':    top10,
    })

@app.get('/api/vehicles')
def vehicles():
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    risk     = request.args.get('risk', '')
    search   = request.args.get('search', '').lower()
    sort_by  = request.args.get('sort_by', 'breakdown_probability')
    sort_dir = request.args.get('sort_dir', 'desc')

    filtered = df.copy()
    if risk:
        filtered = filtered[filtered['risk_level'] == risk.upper()]
    if search:
        filtered = filtered[filtered['vehicle_id'].str.lower().str.contains(search)]

    ascending = sort_dir == 'asc'
    if sort_by in filtered.columns:
        filtered = filtered.sort_values(sort_by, ascending=ascending)

    total = len(filtered)
    start = (page - 1) * per_page
    page_df = filtered.iloc[start:start + per_page]

    return jsonify({
        'total':    total,
        'page':     page,
        'per_page': per_page,
        'pages':    (total + per_page - 1) // per_page,
        'vehicles': [vehicle_to_dict(r) for _, r in page_df.iterrows()],
    })

@app.get('/api/vehicles/<vehicle_id>')
def vehicle_detail(vehicle_id):
    row = df[df['vehicle_id'] == vehicle_id]
    if row.empty:
        return jsonify({'error': 'Vehicle not found'}), 404
    r = row.iloc[0]
    data = vehicle_to_dict(r)
    factors = get_risk_factors(r)
    data['risk_factors']     = factors
    data['recommendation']   = get_recommendation(r['risk_level'], factors)
    return jsonify(data)

@app.get('/api/alerts')
def alerts():
    severity = request.args.get('severity', '')
    alerts_df = df[df['risk_level'].isin(['HIGH', 'MEDIUM'])].copy()
    if severity:
        alerts_df = alerts_df[alerts_df['risk_level'] == severity.upper()]
    alerts_df = alerts_df.sort_values('breakdown_probability', ascending=False)

    result = []
    for _, r in alerts_df.iterrows():
        factors = get_risk_factors(r)
        result.append({
            'vehicle_id':            r['vehicle_id'],
            'risk_level':            r['risk_level'],
            'breakdown_probability': round(float(r['breakdown_probability']), 4),
            'issues':                factors[:3],
            'recommendation':        get_recommendation(r['risk_level'], factors),
        })
    return jsonify({'total': len(result), 'alerts': result})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
