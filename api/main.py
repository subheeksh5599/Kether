"""Kether API — reads chain data from JSON state file produced by indexer."""
import json, os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

DATA_DIR = os.environ.get("DATA_DIR", os.path.join(os.path.dirname(__file__), "..", "data"))
STATE_PATH = os.path.join(DATA_DIR, "chain.json")

app = FastAPI(title="Kether API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class ChainStats(BaseModel):
    total_blocks: int = 0
    total_txns: int = 0
    total_addresses: int = 0
    total_gas: str = "0"
    last_block: int = 0
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

def load_state():
    if not os.path.exists(STATE_PATH):
        return {}
    with open(STATE_PATH) as f:
        return json.load(f)

@app.get("/health")
async def health():
    return {"status": "ok", "network": "GOAT Testnet3", "chain_id": 48816}

@app.get("/chain/stats", response_model=ChainStats)
async def chain_stats():
    s = load_state()
    return ChainStats(
        total_blocks=s.get("total_blocks", 0),
        total_txns=s.get("total_txns", 0),
        total_addresses=s.get("total_addresses", 0),
        last_block=s.get("last_block", 0),
    )

@app.get("/chain/blocks", response_model=BlocksResponse)
async def chain_blocks(limit: int = Query(default=20, le=100)):
    s = load_state()
    blocks = s.get("recent_blocks", [])[:limit]
    return BlocksResponse(blocks=[BlockRow(**b) for b in blocks])

@app.get("/chain/transactions", response_model=TxnsResponse)
async def chain_transactions(limit: int = Query(default=20, le=100)):
    s = load_state()
    txns = s.get("recent_txns", [])[:limit]
    return TxnsResponse(transactions=[TxnRow(**t) for t in txns])
