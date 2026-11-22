"""Generate balanced synthetic network flow dataset for Hybrid-IDS."""
import os
import numpy as np
import pandas as pd

# Create data directory
os.makedirs('backend/data', exist_ok=True)

# Set random seed for reproducibility
np.random.seed(42)

# Define the 10 canonical features in exact order
FEATURES = [
    'flow_duration',
    'total_fwd_packets',
    'total_bwd_packets',
    'packet_length_mean',
    'packet_length_std',
    'flow_bytes_per_sec',
    'flow_packets_per_sec',
    'syn_flag_count',
    'ack_flag_count',
    'dst_port'
]

# Generate 2500 samples per class (balanced 10,000 total)
n_samples_per_class = 2500
n_classes = 4

# BENIGN: Normal traffic patterns
benign_data = {
    'flow_duration': np.random.uniform(100, 30000, n_samples_per_class),
    'total_fwd_packets': np.random.randint(1, 5000, n_samples_per_class),
    'total_bwd_packets': np.random.randint(1, 5000, n_samples_per_class),
    'packet_length_mean': np.random.uniform(400, 1400, n_samples_per_class),
    'packet_length_std': np.random.uniform(50, 300, n_samples_per_class),
    'flow_bytes_per_sec': np.random.uniform(100, 50000, n_samples_per_class),
    'flow_packets_per_sec': np.random.uniform(10, 1000, n_samples_per_class),
    'syn_flag_count': np.random.randint(1, 100, n_samples_per_class),
    'ack_flag_count': np.random.randint(1, 200, n_samples_per_class),
    'dst_port': np.random.choice([80, 443, 22, 21, 25, 53, 110, 143, 993, 995, 3306, 5432], n_samples_per_class)
}

# DDoS: High packet rates, short duration, many SYN flags
ddos_data = {
    'flow_duration': np.random.uniform(10, 500, n_samples_per_class),
    'total_fwd_packets': np.random.randint(1000, 10000, n_samples_per_class),
    'total_bwd_packets': np.random.randint(100, 500, n_samples_per_class),
    'packet_length_mean': np.random.uniform(300, 800, n_samples_per_class),
    'packet_length_std': np.random.uniform(20, 150, n_samples_per_class),
    'flow_bytes_per_sec': np.random.uniform(50000, 200000, n_samples_per_class),
    'flow_packets_per_sec': np.random.uniform(500, 5000, n_samples_per_class),
    'syn_flag_count': np.random.randint(80, 500, n_samples_per_class),
    'ack_flag_count': np.random.randint(1, 50, n_samples_per_class),
    'dst_port': np.random.choice([80, 443, 8080, 8443, 31337, 4444], n_samples_per_class)
}

# PortScan: Many short connections, probing multiple ports
portscan_data = {
    'flow_duration': np.random.uniform(5, 200, n_samples_per_class),
    'total_fwd_packets': np.random.randint(50, 300, n_samples_per_class),
    'total_bwd_packets': np.random.randint(10, 100, n_samples_per_class),
    'packet_length_mean': np.random.uniform(40, 200, n_samples_per_class),
    'packet_length_std': np.random.uniform(10, 80, n_samples_per_class),
    'flow_bytes_per_sec': np.random.uniform(50, 500, n_samples_per_class),
    'flow_packets_per_sec': np.random.uniform(500, 2000, n_samples_per_class),
    'syn_flag_count': np.random.randint(50, 300, n_samples_per_class),
    'ack_flag_count': np.random.randint(1, 20, n_samples_per_class),
    'dst_port': np.random.randint(1, 65535, n_samples_per_class)
}

# BruteForce: Many failed login attempts, repeated connections
bruteforce_data = {
    'flow_duration': np.random.uniform(20, 1000, n_samples_per_class),
    'total_fwd_packets': np.random.randint(100, 800, n_samples_per_class),
    'total_bwd_packets': np.random.randint(50, 400, n_samples_per_class),
    'packet_length_mean': np.random.uniform(100, 500, n_samples_per_class),
    'packet_length_std': np.random.uniform(30, 200, n_samples_per_class),
    'flow_bytes_per_sec': np.random.uniform(200, 2000, n_samples_per_class),
    'flow_packets_per_sec': np.random.uniform(100, 800, n_samples_per_class),
    'syn_flag_count': np.random.randint(30, 150, n_samples_per_class),
    'ack_flag_count': np.random.randint(5, 50, n_samples_per_class),
    'dst_port': np.random.choice([22, 23, 3389, 21, 25, 110, 143], n_samples_per_class)
}

# Combine all datasets
data = [benign_data, ddos_data, portscan_data, bruteforce_data]
labels = ['BENIGN', 'DDoS', 'PortScan', 'BruteForce']

# Create DataFrame
df = pd.DataFrame({col: np.concatenate([d[col] for d in data]) for col in FEATURES})
df['label'] = np.repeat(labels, n_samples_per_class)

# Save to CSV
df.to_csv('backend/data/network_flows.csv', index=False)

# Print class counts
print("Class counts:")
print(df['label'].value_counts().sort_index())
print(f"\nTotal rows: {len(df)}")
print("Dataset saved to backend/data/network_flows.csv")