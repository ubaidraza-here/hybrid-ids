"""Train ML models for Hybrid-IDS: RandomForestClassifier and IsolationForest."""
import os
import pickle
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.ensemble import IsolationForest

# Define paths
DATA_PATH = "backend/data/network_flows.csv"
MODELS_DIR = "backend/models"
os.makedirs(MODELS_DIR, exist_ok=True)

# Load dataset
print(f"Loading dataset from {DATA_PATH}...")
df = pd.read_csv(DATA_PATH)
print(f"Dataset shape: {df.shape}")
print(f"Class distribution:\n{df['label'].value_counts().sort_index()}")

# Define feature columns (exact order from design.md)
FEATURE_COLS = [
    "flow_duration", "total_fwd_packets", "total_bwd_packets", "packet_length_mean",
    "packet_length_std", "flow_bytes_per_sec", "flow_packets_per_sec", "syn_flag_count",
    "ack_flag_count", "dst_port"
]
TARGET_COL = "label"

# Prepare training data
X = df[FEATURE_COLS].values
y = df[TARGET_COL].values

# 80/20 stratified split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)
print(f"\nTrain size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")

# Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Train RandomForestClassifier
print("\nTraining RandomForestClassifier...")
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train_scaled, y_train)
rf_train_acc = rf.score(X_train_scaled, y_train)
rf_test_acc = rf.score(X_test_scaled, y_test)
print(f"RF Train Accuracy: {rf_train_acc:.4f}")
print(f"RF Test Accuracy: {rf_test_acc:.4f}")

# Train IsolationForest ONLY on BENIGN training rows
benign_mask = y_train == "BENIGN"
X_benign_scaled = X_train_scaled[benign_mask]
print(f"\nIsolationForest training on {X_benign_scaled.shape[0]} BENIGN samples...")
iso = IsolationForest(contamination=0.05, random_state=42)
iso.fit(X_benign_scaled)

# Compute anomaly scores for test set (all classes)
X_test_scaled_for_iso = X_test_scaled.copy()
anomaly_scores = iso.score_samples(X_test_scaled_for_iso)
print(f"\nSample anomaly scores (first 10):")
for i in range(min(10, len(anomaly_scores))):
    print(f"  Sample {i}: {anomaly_scores[i]:.4f}")

# Save models
print("\nSaving models...")
joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.pkl"))
joblib.dump(rf, os.path.join(MODELS_DIR, "rf_classifier.pkl"))
joblib.dump(iso, os.path.join(MODELS_DIR, "iso_forest.pkl"))
print("Models saved successfully!")

# Summary
print("\n" + "="*50)
print("TRAINING SUMMARY")
print("="*50)
print(f"Random Forest Classifier Test Accuracy: {rf_test_acc:.4f}")
print(f"Isolation Forest contamination: 0.05")
print(f"Anomaly score threshold (negative): -0.15")
print("="*50)