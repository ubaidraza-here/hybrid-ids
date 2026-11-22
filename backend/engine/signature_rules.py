"""Stage 1: Deterministic Signature Rules for Hybrid-IDS."""
from typing import Optional


def check_signatures(flow: dict) -> Optional[dict]:
    """
    Check flow against deterministic signature rules.
    
    Rules:
    1. dst_port in {4444, 31337, 1337, 6667} -> SuspiciousPort (CRITICAL)
    2. syn_flag_count > 100 and ack_flag_count == 0 -> SYNFloodSignature (CRITICAL)
    3. flow_packets_per_sec > 5000 and packet_length_mean < 80 -> VolumetricFloodSignature (HIGH)
    
    Returns match dict with threat_label, severity, confidence=1.0, explanation, or None.
    """
    dst_port = flow.get("dst_port", 0)
    syn_flag_count = flow.get("syn_flag_count", 0)
    ack_flag_count = flow.get("ack_flag_count", 0)
    flow_packets_per_sec = flow.get("flow_packets_per_sec", 0)
    packet_length_mean = flow.get("packet_length_mean", float("inf"))
    
    # Rule 1: Suspicious ports (CRITICAL)
    suspicious_ports = {4444, 31337, 1337, 6667}
    if dst_port in suspicious_ports:
        return {
            "threat_label": "SuspiciousPort",
            "severity": "CRITICAL",
            "confidence": 1.0,
            "explanation": f"Destination port {dst_port} is a known malicious port (Metasploit/Malware C2)"
        }
    
    # Rule 2: SYN Flood detection (CRITICAL)
    if syn_flag_count > 100 and ack_flag_count == 0:
        return {
            "threat_label": "SYNFloodSignature",
            "severity": "CRITICAL",
            "confidence": 1.0,
            "explanation": f"SYN flood detected: {syn_flag_count} SYN flags with 0 ACK flags"
        }
    
    # Rule 3: Volumetric flood detection (HIGH)
    if flow_packets_per_sec > 5000 and packet_length_mean < 80:
        return {
            "threat_label": "VolumetricFloodSignature",
            "severity": "HIGH",
            "confidence": 1.0,
            "explanation": f"Volumetric flood: {flow_packets_per_sec:.0f} packets/sec with small packets ({packet_length_mean:.1f} bytes avg)"
        }
    
    return None