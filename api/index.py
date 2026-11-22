"""Vercel Python serverless entrypoint for the Hybrid-IDS API."""

import sys
from pathlib import Path


PROJECT_ROOT = str(Path(__file__).resolve().parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.main import app

__all__ = ["app"]
