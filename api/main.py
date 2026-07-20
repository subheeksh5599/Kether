"""
Kether API — GOAT Network chain analytics.

Phase 1 (now): real-time chain metrics — blocks, transactions, gas, active addresses.
Phase 2 (future): x402 payment analytics when agent ecosystem matures.

Endpoints:
  GET  /chain/stats        — total blocks, txns, addresses, gas
  GET  /chain/blocks       — recent blocks
  GET  /chain/transactions — recent transactions
  GET  /health             — liveness check
"""

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from engine.store import get_db

app = FastAPI(title="Kether API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ────────────────────────────────────────

class ChainStats(BaseModel):
    total_blocks: int
    total_txns: int
    total_addresses: int
    total_gas: str
    last_block: int
    chain_id: int = 48816
    network: str = "GOAT Testnet3"

class BlockRow(BaseModel):
    number: int
    hash: str
    timestamp: int
    tx_count: int

class BlocksResponse(BaseModel):
    blocks: list[BlockRow]

class TxnRow(BaseModel):
    hash: str
    block_number: int
    from_addr: str
    to_addr: str | None
    value: str
    timestamp: int

class TxnsResponse(BaseModel):
    transactions: list[TxnRow]


# ── Routes ────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "network": "GOAT Testnet3", "chain_id": 48816}


@app.get("/chain/stats", response_model=ChainStats)
async def chain_stats():
    db = get_db()
    row = db.execute("SELECT * FROM chain_stats WHERE id = 1").fetchone()
    if not row:
        return ChainStats(total_blocks=0, total_txns=0, total_addresses=0, total_gas="0", last_block=0)
    return ChainStats(
        total_blocks=row["total_blocks"],
        total_txns=row["total_txns"],
        total_addresses=row["total_addresses"],
        total_gas=row["total_gas"],
        last_block=row["last_block"],
    )


@app.get("/chain/blocks", response_model=BlocksResponse)
async def chain_blocks(limit: int = Query(default=20, le=100)):
    db = get_db()
    rows = db.execute(
        "SELECT number, hash, timestamp, tx_count FROM blocks ORDER BY number DESC LIMIT ?",
        (limit,),
    ).fetchall()
    return BlocksResponse(
        blocks=[BlockRow(number=r["number"], hash=r["hash"], timestamp=r["timestamp"], tx_count=r["tx_count"]) for r in rows]
    )


@app.get("/chain/transactions", response_model=TxnsResponse)
async def chain_transactions(limit: int = Query(default=20, le=100)):
    db = get_db()
    rows = db.execute(
        "SELECT hash, block_number, from_addr, to_addr, value, timestamp FROM transactions ORDER BY timestamp DESC LIMIT ?",
        (limit,),
    ).fetchall()
    return TxnsResponse(
        transactions=[
            TxnRow(
                hash=r["hash"],
                block_number=r["block_number"],
                from_addr=r["from_addr"],
                to_addr=r["to_addr"],
                value=r["value"],
                timestamp=r["timestamp"],
            )
            for r in rows
        ]
    )
