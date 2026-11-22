"""Canonical live-flow feature extraction for Hybrid-IDS."""

from typing import Any


CANONICAL_FEATURES: tuple[str, ...] = (
    "flow_duration",
    "total_fwd_packets",
    "total_bwd_packets",
    "packet_length_mean",
    "packet_length_std",
    "flow_bytes_per_sec",
    "flow_packets_per_sec",
    "syn_flag_count",
    "ack_flag_count",
    "dst_port",
)


def extract_features(flow: dict[str, Any]) -> dict[str, float]:
    """Return the canonical flow features in their required order."""
    if not isinstance(flow, dict):
        raise TypeError("flow must be a dictionary")

    missing = [name for name in CANONICAL_FEATURES if name not in flow]
    if missing:
        raise KeyError(f"Missing canonical flow features: {', '.join(missing)}")

    return {name: float(flow[name]) for name in CANONICAL_FEATURES}
