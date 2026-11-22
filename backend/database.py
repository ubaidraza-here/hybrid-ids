"""Lightweight SQLite persistence for Hybrid-IDS state."""

import sqlite3
import os
from pathlib import Path


DB_PATH = (
    Path("/tmp/ids_state.db")
    if os.environ.get("VERCEL")
    else Path(__file__).resolve().parent / "data" / "ids_state.db"
)


def _connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    """Create persistence tables when the backend starts."""
    with _connect() as connection:
        connection.execute(
            "CREATE TABLE IF NOT EXISTS blocked_ips "
            "(ip TEXT PRIMARY KEY, blocked_at TEXT NOT NULL, reason TEXT NOT NULL)"
        )
        connection.execute(
            "CREATE TABLE IF NOT EXISTS alerts "
            "(id TEXT PRIMARY KEY, timestamp TEXT, src_ip TEXT, dst_ip TEXT, "
            "dst_port INTEGER, detection_stage TEXT, threat_label TEXT, "
            "severity TEXT, confidence REAL, payload TEXT)"
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_alerts_timestamp "
            "ON alerts(timestamp DESC)"
        )


def list_blocked_ips() -> list[dict[str, str]]:
    with _connect() as connection:
        rows = connection.execute(
            "SELECT ip, blocked_at, reason FROM blocked_ips "
            "ORDER BY blocked_at DESC"
        ).fetchall()
    return [dict(row) for row in rows]


def add_blocked_ip(ip: str, blocked_at: str, reason: str) -> dict[str, str]:
    with _connect() as connection:
        connection.execute(
            "INSERT INTO blocked_ips(ip, blocked_at, reason) "
            "VALUES (?, ?, ?) ON CONFLICT(ip) DO UPDATE SET "
            "blocked_at=excluded.blocked_at, reason=excluded.reason",
            (ip, blocked_at, reason),
        )
    return {"ip": ip, "blockedAt": blocked_at, "reason": reason}


def remove_blocked_ip(ip: str) -> bool:
    with _connect() as connection:
        cursor = connection.execute("DELETE FROM blocked_ips WHERE ip = ?", (ip,))
    return cursor.rowcount > 0


def save_alert(alert: dict) -> None:
    import json

    with _connect() as connection:
        connection.execute(
            "INSERT OR REPLACE INTO alerts "
            "(id, timestamp, src_ip, dst_ip, dst_port, detection_stage, "
            "threat_label, severity, confidence, payload) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (alert.get("id"), alert.get("timestamp"), alert.get("src_ip"),
             alert.get("dst_ip"), alert.get("dst_port"), alert.get("detection_stage"),
             alert.get("threat_label"), alert.get("severity"),
             alert.get("confidence"), json.dumps(alert)),
        )
        connection.execute(
            "DELETE FROM alerts WHERE id NOT IN "
            "(SELECT id FROM alerts ORDER BY timestamp DESC LIMIT 500)"
        )
