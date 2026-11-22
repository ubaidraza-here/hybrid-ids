# AI-Based Hybrid Intrusion Detection System for Modern Networks

Hybrid-IDS is a real-time, browser-based intrusion detection dashboard that combines deterministic security rules with supervised and unsupervised machine learning. The FastAPI backend analyzes synthetic network flows, broadcasts detections over WebSockets, and exposes simulation and statistics APIs. The React dashboard provides live triage, model pipeline visibility, and a shared firewall blocklist.

## 3-Stage Hybrid Detection Architecture

### Stage 1: Deterministic Signatures

- Identifies blacklisted ports, including `4444` and `31337`.
- Detects Xmas-tree TCP flag patterns (`FPU`).
- Detects SYN-flood-style traffic with a packet rate above `100` packets per second.
- These results are assigned high-confidence signature detections before ML processing.

### Stage 2: Supervised Random Forest Classifier

- Classifies known attack families with a trained Random Forest model.
- Supported labels are `BENIGN`, `DDoS`, `PortScan`, and `BruteForce`.
- Uses the exact canonical 10-feature vector and its standardized scaler.

### Stage 3: Unsupervised Isolation Forest Zero-Day Anomaly Detector

- Runs when traffic passes Stage 1 and is predicted `BENIGN` by Stage 2.
- Uses Isolation Forest anomaly scoring to identify unknown or structurally anomalous traffic.
- Scores below `-0.15` are promoted to `ANOMALY_ZERO_DAY`.

## Canonical 10 Flow Features

All dataset generation, model training, live extraction, and prediction must use these features in this exact order:

1. `flow_duration` - milliseconds
2. `total_fwd_packets` - integer
3. `total_bwd_packets` - integer
4. `packet_length_mean` - bytes
5. `packet_length_std` - bytes
6. `flow_bytes_per_sec` - float
7. `flow_packets_per_sec` - float
8. `syn_flag_count` - integer
9. `ack_flag_count` - integer
10. `dst_port` - integer

## Project Structure

```text
hybrid-ids/
|-- backend/
|   |-- requirements.txt
|   |-- data/
|   |   `-- network_flows.csv
|   |-- models/
|   |   |-- rf_classifier.pkl
|   |   |-- iso_forest.pkl
|   |   `-- scaler.pkl
|   |-- ml/
|   |   |-- generate_dataset.py
|   |   `-- train_models.py
|   |-- engine/
|   |   |-- signature_rules.py
|   |   |-- feature_extractor.py
|   |   |-- hybrid_detector.py
|   |   `-- traffic_sniffer.py
|   `-- main.py
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |   |-- TelemetryStrip.jsx
|   |   |   |-- TopBar.jsx
|   |   |   `-- TriageWorkspace.jsx
|   |   |-- App.jsx
|   |   `-- main.jsx
|   |-- public/
|   |-- index.html
|   |-- package.json
|   `-- vite.config.js
|-- design.md
`-- README.md
```

## Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- npm

## Run the FastAPI Backend

From the project root on Windows:

```powershell
cd C:\Users\Ubaid\Desktop\hybrid-ids
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend URLs:

- API documentation: <http://localhost:8000/docs>
- Health: <http://localhost:8000/api/health>
- Statistics: <http://localhost:8000/api/stats>
- Alert stream: `ws://localhost:8000/ws/alerts`

## Run the React Frontend

Open a second terminal in the project root:

```powershell
cd C:\Users\Ubaid\Desktop\hybrid-ids\frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open <http://localhost:5173>.

The frontend requires CORS access from `http://localhost:5173`, and the FastAPI service must remain available on port `8000`.

## Generate Data and Train Models

Run these commands from the project root:

```powershell
python backend\ml\generate_dataset.py
python backend\ml\train_models.py
```

The training outputs are written to `backend/models/`.
