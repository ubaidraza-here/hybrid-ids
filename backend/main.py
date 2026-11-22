"""FastAPI entry point for the Hybrid-IDS WebSocket dashboard."""

import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.engine.hybrid_detector import HybridDetector
from backend.engine.traffic_sniffer import TrafficEngine
from backend.database import (
    add_blocked_ip,
    initialize_database,
    list_blocked_ips,
    remove_blocked_ip,
    save_alert,
)


connections: set[WebSocket] = set()
stats: dict[str, Any] = {
    "total_flows": 0,
    "benign_count": 0,
    "threat_counts": {},
}

MODEL_DIR = str(Path(__file__).resolve().parent / "models")
detector = HybridDetector(model_dir=MODEL_DIR)


async def broadcast_alert(alert: dict) -> None:
    """Update statistics and broadcast one analyzed flow alert."""
    save_alert(alert)
    stats["total_flows"] += 1
    if alert["threat_label"] == "BENIGN":
        stats["benign_count"] += 1
    stage = alert["detection_stage"]
    stats["threat_counts"][stage] = stats["threat_counts"].get(stage, 0) + 1
    for connection in list(connections):
        try:
            await connection.send_json(alert)
        except Exception:
            connections.discard(connection)


traffic = TrafficEngine(detector, broadcast_alert)
source_mode = "simulated"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage the background traffic stream with application lifecycle."""
    initialize_database()
    await traffic.start_stream()
    yield
    await traffic.stop_stream()


app = FastAPI(title="Hybrid-IDS", version="1.0.0", lifespan=lifespan)
frontend_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
extra_origins = os.getenv("FRONTEND_ORIGINS", "")
frontend_origins.extend(
    origin.strip()
    for origin in extra_origins.split(",")
    if origin.strip()
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket) -> None:
    """Register a dashboard client and stream analyzed flow JSON."""
    await websocket.accept()
    connections.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connections.discard(websocket)
    finally:
        connections.discard(websocket)


def stats_payload() -> dict[str, Any]:
    """Return flow totals and threats grouped by detection stage."""
    return {
        "total_flows": stats["total_flows"],
        "benign_count": stats["benign_count"],
        "threat_counts": dict(stats["threat_counts"]),
        "detection_stage": dict(stats["threat_counts"]),
    }


@app.get("/api/health")
async def health() -> dict[str, Any]:
    """Return service status and analysis totals."""
    return {"status": "healthy", **stats_payload()}


@app.get("/api/stats")
async def get_stats() -> dict[str, Any]:
    """Return detailed traffic analysis statistics."""
    return stats_payload()


@app.post("/api/simulate/{attack_type}")
async def simulate(attack_type: str) -> dict[str, Any]:
    """Generate and broadcast a four-flow attack burst."""
    try:
        alerts = await traffic.inject_attack(attack_type)
    except ValueError as exc:
        return {"status": "error", "detail": str(exc)}
    return {"status": "ok", "attack_type": attack_type, "alerts": alerts}


@app.post("/api/stream/{action}")
async def stream_action(action: str) -> dict[str, str]:
    """Start or stop automatic background telemetry."""
    if action == "start":
        await traffic.start_stream()
    elif action == "stop":
        await traffic.stop_stream()
    else:
        return {"status": "error", "detail": "action must be start or stop"}
    return {"status": "ok", "stream": action}


@app.get("/api/source")
async def get_source() -> dict[str, str | bool]:
    """Return the configured telemetry source."""
    global source_mode
    return {
        "mode": source_mode,
        "label": "Live Scapy NIC capture" if source_mode == "live"
        else "Synthetic Telemetry Engine",
        "capture_live": source_mode == "live",
    }


@app.post("/api/source/{mode}")
async def set_source(mode: str) -> dict[str, str | bool]:
    """Switch telemetry source mode between simulated and live capture."""
    global source_mode
    if mode not in {"simulated", "live"}:
        return {"status": "error", "detail": "mode must be simulated or live"}
    source_mode = mode
    traffic.capture_live = mode == "live"
    if traffic.running:
        await traffic.stop_stream()
        await traffic.start_stream()
    return await get_source()


class BlocklistRequest(BaseModel):
    """Request payload for a persistent firewall block."""

    ip: str = Field(min_length=7, max_length=45)
    reason: str = "Manually blocked from Flow Inspector"


@app.get("/api/blocklist")
async def get_blocklist() -> list[dict[str, str]]:
    """Return persistent blocked source IP entries."""
    return list_blocked_ips()


@app.post("/api/blocklist")
async def create_blocklist_entry(request: BlocklistRequest) -> dict[str, str]:
    """Persist a source IP in the blocklist."""
    from datetime import datetime, timezone

    blocked_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    return add_blocked_ip(request.ip, blocked_at, request.reason)


@app.delete("/api/blocklist/{ip}")
async def delete_blocklist_entry(ip: str) -> dict[str, str | bool]:
    """Remove a source IP from persistent blocklist."""
    removed = remove_blocked_ip(ip)
    return {"ip": ip, "removed": removed}
