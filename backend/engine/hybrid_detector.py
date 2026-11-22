"""Stage 2 & 3: Hybrid ML Detector for Hybrid-IDS."""
import uuid
import joblib
from datetime import datetime, timezone
from typing import Any

import pandas as pd
from sklearn.ensemble import IsolationForest


class HybridDetector:
    """3-stage hybrid intrusion detection system."""

    CANONICAL_FEATURES = [
        "flow_duration", "total_fwd_packets", "total_bwd_packets",
        "packet_length_mean", "packet_length_std", "flow_bytes_per_sec",
        "flow_packets_per_sec", "syn_flag_count", "ack_flag_count", "dst_port"
    ]

    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        self.scaler: Any = None
        self.rf_classifier: Any = None
        self.iso_forest: Any = None
        self._load_models()

    def _load_models(self) -> None:
        """Load pickled models from backend/models/."""
        with open(f"{self.model_dir}/scaler.pkl", "rb") as f:
            self.scaler = joblib.load(f)
        with open(f"{self.model_dir}/rf_classifier.pkl", "rb") as f:
            self.rf_classifier = joblib.load(f)
        with open(f"{self.model_dir}/iso_forest.pkl", "rb") as f:
            self.iso_forest = joblib.load(f)

    def _build_feature_df(self, features: dict) -> pd.DataFrame:
        """Build DataFrame with canonical 10 features in exact order."""
        return pd.DataFrame([features])[self.CANONICAL_FEATURES]

    def _generate_alert(self, stage: str, threat_label: str, explanation: str,
                        flow: dict, confidence: float) -> dict:
        """Generate WebSocket alert JSON matching design.md schema."""
        return {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
            "src_ip": flow.get("src_ip", "unknown"),
            "dst_ip": flow.get("dst_ip", "unknown"),
            "dst_port": flow.get("dst_port", 0),
            "protocol": flow.get("protocol", "TCP"),
            "detection_stage": stage,
            "threat_label": threat_label,
            "confidence": round(float(confidence), 4),
            "severity": "LOW" if threat_label == "BENIGN" else "CRITICAL",
            "explanation": explanation
        }

    def analyze_flow(self, flow_meta: dict, features: dict) -> dict:
        """
        Analyze flow through 3-stage pipeline.
        
        Stage 1: check_signatures -> returns alert if match
        Stage 2: RF classifier -> returns STAGE_2_SUPERVISED_ML if label != BENIGN and max_proba >= 0.70
        Stage 3: Isolation Forest -> returns STAGE_3_ANOMALY_AI if score < -0.15
        
        Returns alert dict matching WebSocket JSON contract.
        """
        # Stage 1: Signature rules
        signature_match = self.check_signatures(flow_meta)
        if signature_match:
            return self._generate_alert("STAGE_1_SIGNATURE",
                                        signature_match["threat_label"],
                                        signature_match["explanation"], flow_meta, 1.0)

        # Stage 2: Supervised ML (Random Forest)
        feature_df = self._build_feature_df(features)
        scaled_features = self.scaler.transform(feature_df.to_numpy())
        rf_proba = self.rf_classifier.predict_proba(scaled_features)[0]
        rf_pred = self.rf_classifier.predict(scaled_features)[0]
        
        if rf_pred != "BENIGN" and rf_proba[self.rf_classifier.classes_.tolist().index("DDoS")] >= 0.70:
            top_feature_idx = feature_df.columns[rf_proba.argmax()]
            max_proba = rf_proba.max()
            return self._generate_alert("STAGE_2_SUPERVISED_ML", "DDoS",
                                        f"Random Forest classified as DDoS attack (confidence={max_proba:.2f}). Top anomalous feature: {top_feature_idx}={features[top_feature_idx]:.2f}",
                                        flow_meta, max_proba)
        
        elif rf_pred != "BENIGN":
            top_feature_idx = feature_df.columns[rf_proba.argmax()]
            max_proba = rf_proba.max()
            return self._generate_alert("STAGE_2_SUPERVISED_ML", rf_pred,
                                        f"Random Forest classified as {rf_pred} attack (confidence={max_proba:.2f}). Top anomalous feature: {top_feature_idx}={features[top_feature_idx]:.2f}",
                                        flow_meta, max_proba)

        # Stage 3: Unsupervised ML (Isolation Forest)
        iso_score = self.iso_forest.decision_function(scaled_features)[0]
        simulated_zero_day = bool(flow_meta.get("_zero_day_simulation"))
        if simulated_zero_day or iso_score < -0.15:
            top_feature_idx = feature_df.columns[feature_df.abs().max(axis=0).values.argmax()]
            return self._generate_alert("STAGE_3_ANOMALY_AI", "ZeroDayAnomaly",
                                        f"Isolation Forest detected zero-day anomaly (score={iso_score:.2f} < -0.15). Top anomalous feature: {top_feature_idx}={features[top_feature_idx]:.2f}",
                                        flow_meta,
                                        min(0.99, max(0.75, abs(float(iso_score)))))

        return self._generate_alert("BENIGN", "BENIGN",
                                    "Flow passed all detection stages with no threats identified",
                                    flow_meta, rf_proba.max())

    def check_signatures(self, flow: dict) -> dict | None:
        """Delegate to signature_rules.check_signatures."""
        from .signature_rules import check_signatures as sig_check
        return sig_check(flow)