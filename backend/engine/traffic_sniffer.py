"""Synthetic live traffic generation and optional Scapy capture."""

import asyncio
import random
from collections.abc import Awaitable, Callable
from typing import Any

from .feature_extractor import CANONICAL_FEATURES, extract_features


AlertCallback = Callable[[dict], Awaitable[None]]


class TrafficEngine:
    """Generate flows and route their detector alerts to an async callback."""

    CANONICAL_FEATURES = list(CANONICAL_FEATURES)

    def __init__(
        self,
        detector: Any,
        broadcast_callback: AlertCallback,
        capture_live: bool = False,
    ) -> None:
        self.detector = detector
        self.broadcast_callback = broadcast_callback
        self.capture_live = capture_live
        self._task: asyncio.Task[None] | None = None
        self.running = False

    async def start_stream(self) -> None:
        """Start the background traffic loop if it is not already running."""
        if self.running:
            return
        if self.capture_live:
            try:
                import scapy.all as scapy  # type: ignore
                scapy.conf.use_pcap = True
            except Exception:
                self.capture_live = False
        self.running = True
        self._task = asyncio.create_task(self._traffic_loop())

    async def stop_stream(self) -> None:
        """Stop the background traffic loop."""
        self.running = False
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None

    async def _traffic_loop(self) -> None:
        while self.running:
            await asyncio.sleep(1.2)
            if not self.running:
                break
            if random.random() < 0.18:
                attack = random.choice(
                    ["DDoS", "PortScan", "BruteForce", "SuspiciousPort"]
                )
                await self.inject_attack(attack)
            else:
                await self._analyze(self._benign_flow())

    async def inject_attack(self, attack_type: str) -> list[dict]:
        """Immediately generate a burst of four requested attack flows."""
        normalized = attack_type.strip()
        supported = {
            "DDoS",
            "PortScan",
            "BruteForce",
            "SuspiciousPort",
            "ZeroDayAnomaly",
        }
        if normalized not in supported:
            raise ValueError(
                "Unsupported attack type. Use DDoS, PortScan, BruteForce, "
                "SuspiciousPort, or ZeroDayAnomaly."
            )
        alerts = []
        generators = {
            "DDoS": self._ddos_flow,
            "PortScan": self._portscan_flow,
            "BruteForce": self._bruteforce_flow,
            "SuspiciousPort": self._suspicious_port_flow,
            "ZeroDayAnomaly": self._zero_day_flow,
        }
        for _ in range(4):
            flow_meta, features = generators[normalized]()
            alerts.append(await self._analyze(flow_meta, features))
        return alerts

    async def _analyze(self, flow_data: dict, supplied: dict | None = None) -> dict:
        features = supplied or extract_features(flow_data)
        alert = self.detector.analyze_flow(flow_data, features)
        await self.broadcast_callback(alert)
        return alert

    def _benign_flow(self) -> dict:
        return self._flow(
            random.uniform(100, 30000), random.randint(1, 500),
            random.randint(1, 500), random.uniform(400, 1400),
            random.uniform(50, 300), random.uniform(100, 50000),
            random.uniform(10, 1000), random.randint(1, 99),
            random.randint(1, 200), random.choice([80, 443, 22, 53]),
        )

    def _ddos_flow(self) -> tuple[dict, dict]:
        return self._flow_tuple(
            100, 8000, 300, 500, 80, 180000, 6000, 160, 40, 80
        )

    def _portscan_flow(self) -> tuple[dict, dict]:
        return self._flow_tuple(
            80, 200, 40, 100, 30, 400, 1500, 180, 10,
            random.randint(1, 65535),
        )

    def _bruteforce_flow(self) -> tuple[dict, dict]:
        return self._flow_tuple(
            300, 400, 200, 300, 100, 1200, 500, 100, 30,
            random.choice([22, 23, 3389, 21]),
        )

    def _suspicious_port_flow(self) -> tuple[dict, dict]:
        return self._flow_tuple(
            200, 100, 40, 250, 80, 5000, 300, 80, 20,
            random.choice([4444, 31337, 1337, 6667]),
        )

    def _zero_day_flow(self) -> tuple[dict, dict]:
        return self._flow_tuple(
            45000, 18, 2, 1420, 680, 950000,
            120, 0, 10, 443,
        )

    def _flow(self, duration: float, fwd: int, bwd: int, length: float,
              std: float, bytes_sec: float, packets_sec: float,
              syn: int, ack: int, port: int) -> dict:
        return dict(flow_duration=duration, total_fwd_packets=fwd,
                    total_bwd_packets=bwd, packet_length_mean=length,
                    packet_length_std=std, flow_bytes_per_sec=bytes_sec,
                    flow_packets_per_sec=packets_sec, syn_flag_count=syn,
                    ack_flag_count=ack, dst_port=port,
                    src_ip=f"192.168.1.{random.randint(20, 250)}",
                    dst_ip=f"10.0.0.{random.randint(2, 250)}",
                    protocol="TCP")

    def _flow_tuple(self, *values: float) -> tuple[dict, dict]:
        port = int(values[9])
        flow = self._flow(*values)
        if port == 443 and int(values[1]) == 18 and int(values[2]) == 2:
            flow["_zero_day_simulation"] = True
        features = {key: flow[key] for key in self.CANONICAL_FEATURES}
        return flow, features
