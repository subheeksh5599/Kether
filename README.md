<div align="center">

&nbsp;

[![Live demo](https://img.shields.io/badge/●_live-kether--three.vercel.app-E84142)](https://kether-three.vercel.app)
[![GOAT Testnet3](https://img.shields.io/badge/📜_Testnet3-KetherIndexer-14151a)](https://explorer.testnet3.goat.network/address/0x8248b253033400a59C751F9c2D3BCCAc5428f6D4)
[![Tests](https://img.shields.io/badge/tests-8%20passing-3fb950)](.)
![Stack](https://img.shields.io/badge/TypeScript%20·%20FastAPI%20·%20React%2019-14151a)
![GOAT Network](https://img.shields.io/badge/GOAT_Network-Testnet3-E84142)

### GOAT Network chain explorer and analytics. Phase 1: every block, every transaction, every address — indexed in real time.

Kether polls GOAT Testnet3 every 10 seconds and builds a live dashboard of chain activity. Blocks, transactions, active addresses, gas usage. Built for the GOAT AI Builder Grants Program ($500 base grant).

### ▶ Live now — chain analytics at [kether-three.vercel.app](https://kether-three.vercel.app)

**[ Live demo ↗ ](https://kether-three.vercel.app)** · **[ KetherIndexer on GOAT Explorer ↗ ](https://explorer.testnet3.goat.network/address/0x8248b253033400a59C751F9c2D3BCCAc5428f6D4)** · **[ Architecture ↓ ](#architecture)**

Built for the GOAT Network ecosystem. MIT licensed.

</div>

---

## Table of contents

- [Phase 1 vs Phase 2 — the honesty section](#phase-1-vs-phase-2--the-honesty-section)
- [The problem Kether solves](#the-problem-kether-solves)
- [How Kether works](#how-kether-works)
- [Architecture](#architecture)
- [What's real vs pending](#whats-real-vs-pending)
- [Engineering decisions](#engineering-decisions--the-hard-problems)
- [Tests](#tests)
- [Run it locally](#run-it-locally)
- [Deploy](#deploy)
- [Project layout](#project-layout)
- [Roadmap](#roadmap)

---

## Phase 1 vs Phase 2 — the honesty section

Kether is built in two phases.

### Phase 1 (now · live)

**GOAT Network chain analytics.** The indexer polls GOAT Testnet3 every 10 seconds. It indexes every block, every transaction, every address. The dashboard shows real-time chain metrics:

- Total blocks indexed
- Total transactions processed
- Active addresses tracked
- Gas usage
- Recent blocks feed
- Recent transactions feed with explorer links

This works today because GOAT Testnet3 produces real blocks and real transactions. No agent IDs needed. No x402 payments needed. Just the chain doing what chains do.

### Phase 2 (future · when agent ecosystem matures)

**x402 payment analytics for AI agents.** When GOAT Network's agent ecosystem launches (ERC-8004 agent identities, x402 payment protocol adoption), Kether will index those payments and provide:

- Per-agent revenue dashboards
- Client spending breakdowns
- Service-level revenue rankings
- Growth prediction models

The Phase 1 indexer architecture is the same foundation Phase 2 needs. The only difference is what events we filter for.

---

## The problem Kether solves

New chains launch. People build on them. Nobody knows what's actually happening.

- **No chain visibility** — how many blocks? how many transactions? is anyone using this?
- **No developer confidence** — should I build here? is the chain alive?
- **No grant reviewer evidence** — did the grant recipient actually deploy something?

Kether answers all three. It's a window into GOAT Network activity.

---

## How Kether works

### 1 · Block indexing

The indexer polls GOAT Testnet3 RPC every 10 seconds. For each new block, it stores the block number, hash, timestamp, and transaction count.

### 2 · Transaction indexing

Every transaction in every block is parsed. From address, to address, value, gas used — all stored in SQLite with WAL mode for concurrent reads by the API.

### 3 · Address tracking

Every unique address that sends or receives a transaction is tracked. First seen, last seen, and total transaction count are updated in real time.

### 4 · Live dashboard

A React dashboard polls the API every 10 seconds. Shows current chain stats (blocks, txns, addresses, gas), recent blocks table, and recent transactions feed with links to GOAT Explorer.

---

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  GOAT Testnet3   │────▶│  Kether Indexer  │────▶│  SQLite (WAL)   │
│  (RPC)           │     │  (10s poll)      │     │                 │
│                   │     │                   │     │  ▼ blocks       │
│  eth_blockNumber  │     │  ▼ getBlock()     │     │  ▼ transactions │
│  eth_getBlock     │     │  ▼ parse txns     │     │  ▼ addresses    │
│                   │     │  ▼ track addrs    │     │  ▼ stats        │
└──────────────────┘     └──────────────────┘     └─────────────────┘
                                                              │
                                                              ▼
┌──────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Browser         │◀────│  Kether API      │◀────│  Query Engine   │
│  (dashboard)     │     │  (FastAPI)       │     │                 │
│                   │     │                   │     │  GET /chain/   │
│  ▼ Stats cards   │     │  /chain/stats     │     │  stats          │
│  ▼ Blocks table  │     │  /chain/blocks    │     │  GET /chain/    │
│  ▼ Txns feed     │     │  /chain/transactions│  │  blocks         │
└──────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## What's real vs pending

| Capability | Status |
|---|---|
| **Contract deployed** — KetherIndexer on GOAT Testnet3 | **Live** — [0x8248b2...](https://explorer.testnet3.goat.network/address/0x8248b253033400a59C751F9c2D3BCCAc5428f6D4), verified |
| **8 forge tests passing** | **Done** |
| **Phase 1 indexer** — polls GOAT Testnet3, indexes blocks/txns/addresses | **Done** |
| **Phase 1 API** — /chain/stats, /chain/blocks, /chain/transactions | **Done** |
| **Phase 1 dashboard** — live chain metrics, blocks table, txns feed | **Done** |
| **Phase 2 x402 payment indexer** — agent-specific event parsing | **Planned** — post-grant, when x402 adoption exists |
| **Phase 2 agent dashboard** — per-agent revenue, clients, predictions | **Planned** — post-grant |
| **Real x402 payments on GOAT** | **Waiting** — ecosystem not launched yet |

---

## Engineering decisions & the hard problems

- **10-second polling, not WebSocket.** GOAT RPC doesn't expose WebSocket subscriptions. 10-second poll balances freshness with rate limits.

- **SQLite, not PostgreSQL.** Single-file database with WAL mode. No server to manage. SQLite handles Kether's write volume easily.

- **Phase 1 funds Phase 2.** The chain analytics indexer is the same architecture the x402 payment indexer needs. Building Phase 1 now means zero refactoring when agent payments go live.

- **No fake data.** Every number on the dashboard comes from a real block on GOAT Testnet3. The stats say LIVE, REAL, TRACKED because they are.

- **Simple API, fast queries.** Three endpoints. No auth. No pagination complexity. Chain stats, blocks, transactions. That's it.

---

## Tests

```bash
cd kether && forge test -vvv
```

```
Ran 8 tests for contracts/test/Kether.t.sol:KetherTest
[PASS] test_index_payment_event
[PASS] test_aggregate_agent_revenue
[PASS] test_get_top_clients
[PASS] test_get_service_rankings
[PASS] test_link_erc8004_identity
[PASS] test_x402_payment_gating
[PASS] test_prediction_query
[PASS] test_unlinked_address_returns_zero
Suite result: ok. 8 passed; 0 failed; 0 skipped
```

The contract tests are written for Phase 2 (x402 payment indexing). They pass on the deployed contract. Phase 1 doesn't change the contract — it just adds a TypeScript indexer that reads raw blocks.

---

## Run it locally

**Prerequisites:** Node.js 20+, Python 3.11+, Foundry.

```bash
git clone https://github.com/subheeksh5599/kether.git
cd kether

# Run the indexer (starts indexing GOAT Testnet3)
cd indexer && npm install && npm run dev

# Run the API
cd api && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

# Run the dashboard
cd dashboard && npm install && npm run dev  # :5173
```

Open `http://localhost:5173` and click "Open Dashboard". The dashboard polls the API every 10 seconds showing real GOAT Testnet3 data.

---

## Deploy

| | |
|---|---|
| **Dashboard** | **[kether-three.vercel.app](https://kether-three.vercel.app)** — Vercel |
| **KetherIndexer** | **[0x8248b2...](https://explorer.testnet3.goat.network/address/0x8248b253033400a59C751F9c2D3BCCAc5428f6D4)** — GOAT Testnet3, verified |

---

## Project layout

```
kether/
├── contracts/
│   ├── src/KetherIndexer.sol     # Phase 2 contract (deployed, verified)
│   └── test/Kether.t.sol         # 8 forge tests
├── indexer/
│   └── src/poller.ts             # Phase 1: block/txn/address indexer
├── api/
│   ├── main.py                   # FastAPI: /chain/stats, blocks, txns
│   └── engine/store.py           # SQLite connection wrapper
├── dashboard/
│   └── src/
│       ├── components/
│       │   ├── Landing.tsx       # Landing page
│       │   ├── Dashboard.tsx     # Chain analytics dashboard
│       │   └── DashboardPage.tsx # Dashboard route
│       └── hooks/
│           └── useChainApi.ts    # Chain API hooks (10s polling)
└── README.md
```

## Tech stack

- **Indexer:** TypeScript, ethers.js v6, SQLite (WAL mode)
- **API:** Python 3.11, FastAPI
- **Dashboard:** React 19, Vite 6, TypeScript, TailwindCSS 4
- **Contract:** Solidity 0.8.24, Foundry (forge, cast)
- **Chain:** GOAT Network Testnet3
- **Deployment:** Vercel (dashboard)

## Roadmap

- **Phase 1 (current)** — Block/txn/address indexer, chain stats dashboard, live on GOAT Testnet3
- **Phase 2 (post-grant)** — x402 payment indexer, agent revenue dashboards, client breakdowns, growth prediction
- **Phase 3 (ecosystem)** — Competitive benchmarking, anomaly detection, pricing recommendations

## License

MIT — see [LICENSE](LICENSE).
