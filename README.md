# 🚗 VehicleGuard AI

### Predictive Vehicle Breakdown Detection & Fleet Monitoring System

> **Predict → Prioritize → Prevent**

VehicleGuard AI is an AI-powered predictive maintenance prototype designed to help fleet managers identify vehicles that are at elevated risk of breakdown within the next 30 days.

The system analyzes vehicle telemetry data, uses a trained machine learning model to estimate breakdown risk, and presents the results through an interactive fleet management dashboard.

---

## 🎯 Problem Statement

Managing a large fleet of vehicles can make preventive maintenance difficult.

Traditional maintenance approaches often depend on:

- Fixed service schedules
- Manual inspection
- Driver-reported issues
- Reactive maintenance after a failure

This can result in unexpected breakdowns, vehicle downtime, and higher maintenance costs.

### VehicleGuard AI aims to solve this by:

**Vehicle Telemetry → ML Prediction → Risk Assessment → Maintenance Priority**

The goal is to help fleet managers identify potentially high-risk vehicles before serious failures occur.

---

## 💡 Solution

VehicleGuard AI analyzes vehicle telemetry such as:

- 🌡️ Engine temperature
- 🛢️ Oil pressure
- 🔋 Battery voltage
- ⚙️ Engine RPM
- 🛞 Brake wear
- 🚗 Mileage
- ⛽ Fuel level
- 🛞 Tire pressure
- And other available telemetry features

The trained ML model generates a breakdown-risk prediction for each vehicle.

Vehicles are then categorized into:

🟢 **LOW RISK**

🟡 **MEDIUM RISK**

🔴 **HIGH RISK**

Fleet managers can use these predictions to prioritize preventive maintenance.

---

# 🚀 Key Features

## 📊 Fleet Dashboard

Provides a high-level overview of the entire fleet.

Includes:

- Total vehicles
- High-risk vehicles
- Medium-risk vehicles
- Low-risk vehicles
- Predicted breakdowns
- Risk distribution
- Highest-risk vehicles
- Vehicles requiring attention

---

## 🚗 Vehicle Records

The Vehicles page provides a searchable fleet database.

Fleet managers can:

- Search vehicles
- Filter by risk level
- Sort by breakdown probability
- View telemetry information
- Browse vehicle records
- Open individual vehicle profiles

---

## 🔍 Vehicle Details

Each vehicle has a dedicated profile containing:

- Vehicle ID
- Breakdown probability
- Risk level
- Telemetry measurements
- Vehicle health information
- Risk contributing factors
- Recommended maintenance action

---

## 🚨 Maintenance Alerts

The Alerts section highlights vehicles that require attention.

Example:

```text
Vehicle: VH-1023

Risk Level: HIGH
Breakdown Probability: 87%

Issues:
• High engine temperature
• Low oil pressure
• High mileage

Recommended Action:
Schedule preventive maintenance.
