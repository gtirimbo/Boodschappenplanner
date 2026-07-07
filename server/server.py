"""
server.py — serves the price data and (optionally) the static frontend.

    pip install fastapi uvicorn
    python update_prices.py      # generate prices.json first
    uvicorn server:app --reload
"""

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

BASE = Path(__file__).parent
PRICES_FILE = BASE / "prices.json"
STATIC_DIR = BASE / "static"   # put your built frontend here

app = FastAPI(title="Boodschappenplanner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your domain in production
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/prices")
def get_prices():
    if not PRICES_FILE.exists():
        raise HTTPException(503, "Prices not generated yet — run update_prices.py")
    return json.loads(PRICES_FILE.read_text())


@app.get("/api/health")
def health():
    return {"ok": True}


if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
