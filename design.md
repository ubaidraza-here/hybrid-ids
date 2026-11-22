# Hybrid-IDS Architecture & Data Contracts

## 1. System Overview

A 3-stage Hybrid Intrusion Detection System:

- **Stage 1 (Signature Engine):** Deterministic rules (blacklisted ports like 4444/31337, Xmas tree TCP flags `FPU`, SYN flood packet rate > 100/sec).
- **Stage 2 (Supervised ML - Random Forest):** Classifies known attack families (`BENIGN`, `DDoS`, `PortScan`, `BruteForce`) using 10 standardized flow features.
- **Stage 3 (Unsupervised ML - Isolation Forest):** Flags zero-day/unknown structural anomalies (`ANOMALY_ZERO_DAY`) when traffic passes Stage 1 and is predicted `BENIGN` by Stage 2, yet has an anomaly score < -0.15.

## 2. Canonical 10 Flow Features (Exact Order)

Every dataset generator, training script, and live feature extractor MUST use these exact 10 float features in this exact order:

1. `flow_duration` (milliseconds)
2. `total_fwd_packets` (int)
3. `total_bwd_packets` (int)
4. `packet_length_mean` (bytes)
5. `packet_length_std` (bytes)
6. `flow_bytes_per_sec` (float)
7. `flow_packets_per_sec` (float)
8. `syn_flag_count` (int)
9. `ack_flag_count` (int)
10. `dst_port` (int)

## 3. WebSocket Alert JSON Contract (`/ws/alerts`)

Backend broadcasts JSON objects matching this exact schema:

```json
{
  "id": "uuid-string",
  "timestamp": "2026-11-22T00:15:30Z",
  "src_ip": "192.168.1.45",
  "dst_ip": "10.0.0.12",
  "dst_port": 80,
  "protocol": "TCP",
  "detection_stage": "STAGE_1_SIGNATURE | STAGE_2_SUPERVISED_ML | STAGE_3_ANOMALY_AI | BENIGN",
  "threat_label": "BENIGN | DDoS | PortScan | BruteForce | ZeroDayAnomaly | SuspiciousPort",
  "confidence": 0.96,
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "explanation": "High SYN flag count (85) with 0.04s flow duration"
}
```

## 4. Exact Project Directory Structure

All files MUST be placed at these exact relative paths:

- `backend/requirements.txt`
- `backend/data/network_flows.csv`
- `backend/models/` (`rf_classifier.pkl`, `iso_forest.pkl`, `scaler.pkl`)
- `backend/ml/generate_dataset.py`
- `backend/ml/train_models.py`
- `backend/engine/signature_rules.py`
- `backend/engine/feature_extractor.py`
- `backend/engine/hybrid_detector.py`
- `backend/engine/traffic_sniffer.py`
- `backend/main.py`
- `frontend/` (React + Vite + Tailwind dashboard)
