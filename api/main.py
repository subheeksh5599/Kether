"""
Kether API — x402 payment analytics for GOAT Network agents.

Endpoints:
  GET  /agent/{agent_id}/revenue   — total revenue, txns, clients
  GET  /agent/{agent_id}/clients   — top client breakdown
  GET  /agent/{agent_id}/services  — per-service revenue rankings
  GET  /agent/{agent_id}/payments  — recent payment history
  GET  /health                     — liveness check
  POST /predict                    — growth prediction (x402-gated)
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from engine.predictor import predict_revenue
from engine.store import get_db
import time

app = FastAPI(title="Kether API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ────────────────────────────────────────

class RevenueResponse(BaseModel):
    agent_id: int
    total_revenue: str
    transaction_count: int
    unique_clients: int
    chain_id: int = 48816

class ClientRow(BaseModel):
    address: str
    total_spent: str
    transaction_count: int
    last_payment: int

class ClientsResponse(BaseModel):
    agent_id: int
    clients: list[ClientRow]

class ServiceRow(BaseModel):
    service_id: str
    total_revenue: str
    call_count: int

class ServicesResponse(BaseModel):
    agent_id: int
    services: list[ServiceRow]

class PaymentRow(BaseModel):
    block_number: int
    tx_hash: str
    payer: str
    amount: str
    service_id: str
    timestamp: int

class PaymentsResponse(BaseModel):
    agent_id: int
    payments: list[PaymentRow]

class PredictRequest(BaseModel):
    agent_id: int
    endpoint: str

class PredictResponse(BaseModel):
    agent_id: int
    endpoint: str
    predicted_revenue_30d: str
    confidence: float
    model: str = "linear_regression"


# ── Routes ────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "chain": "GOAT Testnet3", "chain_id": 48816}


@app.get("/agent/{agent_id}/revenue", response_model=RevenueResponse)
async def agent_revenue(agent_id: int):
    db = get_db()
    row = db.execute(
        "SELECT total_revenue, transaction_count, unique_clients FROM agent_revenue WHERE agent_id = ?",
        (agent_id,),
    ).fetchone()
    if not row:
        return RevenueResponse(agent_id=agent_id, total_revenue="0", transaction_count=0, unique_clients=0)
    return RevenueResponse(
        agent_id=agent_id,
        total_revenue=row["total_revenue"],
        transaction_count=row["transaction_count"],
        unique_clients=row["unique_clients"],
    )


@app.get("/agent/{agent_id}/clients", response_model=ClientsResponse)
async def agent_clients(agent_id: int):
    db = get_db()
    rows = db.execute(
        "SELECT client, total_spent, transaction_count, last_payment FROM client_spending WHERE agent_id = ? ORDER BY CAST(total_spent AS INTEGER) DESC LIMIT 20",
        (agent_id,),
    ).fetchall()
    return ClientsResponse(
        agent_id=agent_id,
        clients=[
            ClientRow(address=r["client"], total_spent=r["total_spent"], transaction_count=r["transaction_count"], last_payment=r["last_payment"])
            for r in rows
        ],
    )


@app.get("/agent/{agent_id}/services", response_model=ServicesResponse)
async def agent_services(agent_id: int):
    db = get_db()
    rows = db.execute(
        "SELECT service_id, total_revenue, call_count FROM service_revenue WHERE agent_id = ? ORDER BY CAST(total_revenue AS INTEGER) DESC",
        (agent_id,),
    ).fetchall()
    return ServicesResponse(
        agent_id=agent_id,
        services=[
            ServiceRow(service_id=r["service_id"], total_revenue=r["total_revenue"], call_count=r["call_count"])
            for r in rows
        ],
    )


@app.get("/agent/{agent_id}/payments", response_model=PaymentsResponse)
async def agent_payments(agent_id: int, limit: int = 50):
    db = get_db()
    rows = db.execute(
        "SELECT block_number, tx_hash, payer, amount, service_id, timestamp FROM payments WHERE agent_id = ? ORDER BY timestamp DESC LIMIT ?",
        (agent_id, limit),
    ).fetchall()
    return PaymentsResponse(
        agent_id=agent_id,
        payments=[
            PaymentRow(block_number=r["block_number"], tx_hash=r["tx_hash"], payer=r["payer"], amount=r["amount"], service_id=r["service_id"], timestamp=r["timestamp"])
            for r in rows
        ],
    )


@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest, request: Request):
    # x402 payment verification — in production, validate X-PAYMENT header
    # For testnet: accept all requests, log payment intent
    x_payment = request.headers.get("X-PAYMENT", "")
    if not x_payment:
        # In production: raise HTTPException(status_code=402)
        pass  # Testnet mode: allow unpaid requests

    predicted, confidence = predict_revenue(req.agent_id, req.endpoint)
    return PredictResponse(
        agent_id=req.agent_id,
        endpoint=req.endpoint,
        predicted_revenue_30d=str(predicted),
        confidence=round(confidence, 2),
    )
