# FlowGuard AI — Predictive Maintenance & Hydraulic Reconciliation Engine for Pipeline Infrastructure
---

## 📌 Executive Overview

**FlowGuard AI** is an end-to-end condition-based predictive maintenance, prescriptive analytics, and hydraulic reconciliation platform engineered for fluid transportation pipelines. 

Operating across **Kenya Pipeline Company's (KPC) 1,342 km network** (connecting Mombasa, Nairobi, Nakuru, Eldoret, and Kisumu), the platform addresses the multi-million shilling operational risks associated with unplanned booster pump failures, pressure excursions, and undetected leak precursors.

Instead of traditional fixed-interval maintenance schedules or generic sensor dashboards, FlowGuard AI introduces the **Flowgard Hydraulic Reconciliation Engine**—a proprietary mechanism that calculates pressure residuals between actual SCADA readings and physical hydraulic baseline simulations ($P_{\text{actual}} - P_{\text{simulated}}$). This isolates true equipment mechanical wear from normal operational line transients and pressure fluctuations.

---

## 🌟 Key Features & Screen Architecture

The repository contains a fully interactive, zero-dependency **Single Page Application (SPA)** compliant with **ISO 9241 Human-Computer Interaction (HCI) standards for industrial control rooms**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  FlowGuard AI  [Company: KPC Line 5 ▼] [Fluid: AGO Diesel ▼] [Live Telemetry ● ON]     │
├─────────────┬──────────────────────────────────────────────────────────────────────────┤
│ NAV RAIL    │ VIEW DISPLAY                                                             │
│ 1. GIS Map  │                                                                          │
│ 2. SCADA    │  Screen 1: Spatiotemporal Anomaly & Network GIS Map                      │
│ 3. 3D Pump  │  Screen 2: Flowgard Hydraulic Reconciliation & Diagnostics                │
│ 4. ML AI    │  Screen 3: Interactive 3D Pump Component & Wear Inspector                │
│ 5. Financial│  Screen 4: ML Failure Predictions, RUL Bounds & SHAP Explainability       │
│ 6. Alerts   │  Screen 5: Financial Revenue-at-Risk & Prescriptive Maintenance Engine  │
│             │  Screen 6: Live Command Control & Emergency Alert Center                 │
└─────────────┴──────────────────────────────────────────────────────────────────────────┘
```

### 1. 🗺️ Spatiotemporal Anomaly & Network GIS Map

- **Network Pipeline Topology**: Interactive visualization of Line 5 connecting PS1 Mombasa, PS3 Mtito Andei, PS5 Sultan Hamud, PS6 Nairobi Terminal, PS7 Nakuru, and PS9 Kisumu.
- **Directional Fluid Velocity**: Animated SVG vector dash lines illustrating real-time product flow (1,000,000 L/hr throughput).
- **Environmental Vulnerability Layer**: Soil porosity and river-crossing risk overlays (e.g., Thange River erosion exposure).
- **Station Inspector Modal**: Clickable nodes providing station head pressure, elevation, active pump availability, and local risk scores.

### 2. 📈 Flowgard Hydraulic Reconciliation & Diagnostics

- **Pressure Residual Tracker**: Plots real-time actual pressure ($P_{\text{actual}}$) against physical baseline simulation ($P_{\text{simulated}}$) to derive the **Health Deviation Index ($HDI$)**.
- **Interactive Synthetic Fault Injector**: Allows testing system behavior under 4 operational modes:
  - *Normal Flow Baseline*
  - *Bearing Friction Drift* (Thermal rise + 120Hz BPFO vibration)
  - *Impeller Cavitation Spike* (Pressure drop + random high-frequency noise)
  - *Leak Precursor Loss* (Sustained negative pressure drift)
- **Live SCADA Telemetry Gauges**: Real-time meters for Vibration (mm/s), Bearing Temp (°C), Inlet/Outlet Pressure (bar), and Motor Current (Amps).

### 3. 🔍 Interactive 3D Pump Component Inspector

- **Exploded SVG 3D Centrifugal Pump**: Interactive assembly breakdown featuring:
  - *Inboard/Outboard Deep Groove Roller Bearings*
  - *Enclosed Centrifugal Impeller*
  - *Mechanical Face Seal*
  - *Electric Drive Motor Stator*
- **Dynamic Failure Glow States**: Components visually shift from nominal green to warning amber and pulsing red based on live diagnostic thresholds.
- **SHAP Weight Attribution**: Click any component to inspect exact feature weights contributing to its wear state.

### 4. 🧠 ML Predictions, RUL Bounds & SHAP Explainable AI

- **7-Day Failure Classifier**: Outputs a high-accuracy failure risk score gauge (94.2% model benchmark).
- **Monte Carlo Dropout RUL Bounds**: Regression chart displaying mean Remaining Useful Life alongside 95% upper and lower confidence bounds ($RUL = 142.5 \text{ hrs } \pm 18.2 \text{ hrs}$).
- **SHAP Feature Driver Waterfall**: Visual breakdown identifying physical sensor attributions (+0.42 SHAP from bearing temp, +0.28 from Flowgard residual).

### 5. 💰 Financial Revenue-at-Risk & Prescriptive Maintenance

- **Standard Orifice Leak Loss Calculator**: Models product volume loss ($Q = C_d \cdot A \cdot \sqrt{2\Delta P / \rho}$) across 5mm hairline crack, 25mm puncture, and 50mm rupture for AGO Diesel, PMS Petrol, and Jet A-1:
  - *5mm Crack*: **4,627 L/hr** (KES 14,700,000 / hr loss)
  - *25mm Puncture*: **115,687 L/hr** (KES 367,800,000 / hr loss)
  - *50mm Rupture*: **462,747 L/hr** (KES 1,471,500,000 / hr loss)
- **ROI Cost Asymmetry Matrix**: Demonstrates the financial business case: **KES 1,000** preventive bearing replacement vs. **KES 103,000,000** direct cleanup cost (Thange/Kiboko baseline) vs. **KES 25 Billion** class-action liability exposure.
- **Prescriptive Dispatch Work Orders**: Automated generation of technician service tickets with SKF part numbers, downtime windows, and technician requirements.

### 6. 🚨 Live Command Control & Emergency Alert Center

- **Severity-Coded Notification Feed**: Real-time event log for CRITICAL, WARNING, PRECURSOR, and INFO alerts.
- **Browser Push Alert Simulator**: Dispatches test browser notifications.
- **Emergency Station Isolation Switch**: Simulates emergency pump shutdown with Web Audio API sound synthesis.

---

## 🌍 Global Pipeline & Multi-Fluid Scalability

FlowGuard AI is built to scale beyond KPC to any fluid transportation operator globally via top-bar dropdown selectors:

- **Pipeline Networks Supported**:
  1. *Kenya Pipeline Company (KPC Line 5)* — Mombasa to Kisumu (1,342 km)
  2. *Trans-Alaska Pipeline System (TAPS)* — Prudhoe Bay to Valdez (1,287 km)
  3. *Petrobras Santos Basin Offshore* — Deepwater Subsea Network (850 km)
  4. *Enbridge Mainline Network* — Edmonton to Superior (5,360 km)
- **Fluid Types Supported**: AGO Diesel, PMS Petrol, Jet A-1 / Kerosene, Light Sweet Crude Oil.

---

## 📁 Repository Structure

```
Capstone/
├── app.js                 # Application logic, state management, SCADA simulator & charts
├── index.css              # HCI design system, KPC color tokens, animations & grid layout
├── index.html             # Main Single Page Application shell & navigation views
├── README.md              # Project documentation & setup guide
└── Documentation/         # Original research documents & proposal specs
    ├── Capstone Research.docx
    ├── Capstone_Proposal_Team_NULL_TERMINATORS.docx
    ├── Methodology_MVP_Execution_Plan.docx
    ├── mvp.docx
    └── extracted_docs.txt
```

---

## 🚀 Quickstart: Running Locally

No complex dependencies, `npm install`, or Node environment required! You can run the prototype locally using Python's built-in HTTP server.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Ingrido-20/capstone_test1.git
   cd capstone_test1
   ```

2. **Start the local HTTP server**:
   ```bash
   python3 -m http.server 8085
   ```

3. **Open in your browser**:
   Navigate to [http://localhost:8085](http://localhost:8085)

---

## 🛠️ Technology Stack

- **Frontend Core**: HTML5, CSS3 (Vanilla CSS with Custom Design Tokens), Vanilla JavaScript (ES6+ Modules).
- **Icons & Visualizations**: [Lucide Icons](https://lucide.dev/), [Chart.js](https://www.chartjs.org/), SVG 3D Engine.
- **Audio Synthesizer**: Web Audio API (Frequency Oscillators for SCADA alarms).
- **HCI Standard**: ISO 9241 Ergonomic Control Room Guidelines.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---