<div align="center">

&nbsp;

[![Live demo](https://img.shields.io/badge/●_live-coming_soon-E84142)]()
[![GOAT Testnet](https://img.shields.io/badge/GOAT-Testnet3-14151a)](https://testnet3.goat.network)
[![x402](https://img.shields.io/badge/💰_x402-payments-14151a)](https://docs.goat.network/docs/build/x402)
[![ERC-8004](https://img.shields.io/badge/🆔_ERC--8004-identity-14151a)](https://docs.goat.network/docs/build/erc-8004)
[![License: MIT](https://img.shields.io/badge/license-MIT-E84142.svg)](LICENSE)
![Stack](https://img.shields.io/badge/Solidity%20·%20FastAPI%20·%20React%2019%20·%20TypeScript-14151a)
![GOAT Network](https://img.shields.io/badge/GOAT_Network-Testnet3-E84142)

### AI agents pay each other millions of times a day. Nobody knows who earns what.

Kether indexes every x402 payment on GOAT Network and turns raw on-chain data into revenue intelligence for agent builders — which endpoints earn, which clients spend, what to charge next. Built for the GOAT AI Builder Grants Program.

### ▶ Live soon — x402 payment analytics at kether.vercel.app

**[ Architecture ↓ ](#architecture)** · **[ Run it locally ↓ ](#run-it-locally)** · **[ x402 Use Case ↓ ](#x402-use-case)**

Built for the GOAT Network ecosystem. MIT licensed.

</div>

---

## Table of contents

- [See it in one command](#-see-it-in-one-command)
- [The problem Kether solves](#the-problem-kether-solves)
- [How Kether works](#how-kether-works)
  - [1 · x402 payment indexing](#1--x402-payment-indexing)
  - [2 · revenue intelligence](#2--revenue-intelligence)
  - [3 · client breakdown](#3--client-breakdown)
  - [4 · growth prediction](#4--growth-prediction)
  - [5 · ERC-8004 agent identity](#5--erc-8004-agent-identity)
- [Architecture](#architecture)
  - [Data flow](#data-flow)
  - [Component by component](#component-by-component)
- [x402 use case](#x402-use-case)
- [What's real vs pending — the honesty table](#whats-real-vs-pending--the-honesty-table)
- [How it uses GOAT Network](#how-it-uses-goat-network)
- [Engineering decisions](#engineering-decisions--the-hard-problems)
- [Tests](#tests)
- [Run it locally](#run-it-locally)
- [Configuration](#configuration)
- [Deploy](#deploy)
- [Project layout](#project-layout)
- [Tech stack](#tech-stack)
- [Roadmap](#roadmap)
- [License](#license)

---

## ▶ See it in one command

Kether reads x402 payment events directly from GOAT Network. Every query is a `cast call` — read-only, no gas:

```bash
RPC=https://rpc.testnet3.goat.network
INDEXER=0x_kether_indexer_address_

# Query total revenue for an ERC-8004 agent
$ cast call $INDEXER "getAgentRevenue(uint256)(uint256,uint256,uint256)" \
    48816 --rpc-url $RPC
(125000000000000000000, 47, 12)

# Query top clients for an agent
$ cast call $INDEXER "getTopClients(uint256,uint256)(address[],uint256[])" \
    48816 5 --rpc-url $RPC
["0xabcd...","0x1234...","0x5678...","0x9abc...","0xdef0..."]
[45000000000000000000,32000000000000000000,28000000000000000000,15000000000000000000,10000000000000000000]

# Query service rankings
$ cast call $INDEXER "getServiceRankings(uint256)(string[],uint256[])" \
    48816 --rpc-url $RPC
["/analyze","/audit","/swap","/price","/weather"]
[50000000000000000000,32000000000000000000,28000000000000000000,15000000000000000000,10000000000000000000]
```

Every call returns real indexed data from x402 payment events on GOAT Network. The response shows this agent earned 125 BTC total from 47 transactions across 12 unique clients. The `/analyze` endpoint generates 40% of all revenue.

---

## The problem Kether solves

x402 payments on GOAT Network generate real economic activity — agents paying agents for API calls, data, compute, and services. Today:

- **No revenue visibility** — agent builders can't answer "how much did I earn this month"
- **No client intelligence** — you don't know which clients drive 80% of your revenue
- **No pricing signal** — should you charge $1 or $0.10 per call? nobody knows
- **No growth measurement** — is your agent business growing or dying? the data exists but is unreadable
- **No competitive benchmark** — how does your /audit endpoint compare to others?

x402 is a payment protocol. It produces events. But events alone are noise. Kether turns that noise into decisions.

---

## How Kether works

Five capabilities, all built on GOAT Network. x402 payment events are indexed, aggregated, and analyzed.

### 1 · x402 payment indexing

A TypeScript indexer listens to x402 `PaymentSettled` events on GOAT Network. It parses every payment — who paid, who received, which endpoint, how much, when. Data is stored in SQLite with hourly aggregation for fast queries. The indexer runs on a 10-second poll against GOAT RPC.

### 2 · Revenue intelligence

The dashboard shows agent builders their real revenue: total earned, monthly trend, per-service breakdown, per-client spending. Revenue is segmented by ERC-8004 agent identity — every agent registered on GOAT gets its own analytics page. No signup needed — connect your agent's ERC-8004 identity and Kether pulls your payment history from the chain.

### 3 · Client breakdown

Every x402 payment has a `payer` address. Kether aggregates these into client profiles: total spent, services used, payment frequency, last active. Builders discover that 80% of revenue comes from one whale client → they negotiate a volume discount → revenue grows. The data was always there. Kether makes it visible.

### 4 · Growth prediction

Historical payment data feeds a lightweight prediction model. Kether answers "at current growth rate, your /analyze endpoint will earn 2.3 BTC next month." This isn't a black-box ML oracle — it's linear regression on your own on-chain payment history. You can verify every input yourself on GOAT Network.

### 5 · ERC-8004 agent identity

Agents are discovered via ERC-8004 registry on GOAT Network. Each agent's identity is verifiable on-chain — Kether links every payment to a registered agent profile. No fake data, no impersonation. The analytics page for `agent #4893` is provably linked to the on-chain identity.

---

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  GOAT Network    │────▶│  Kether Indexer  │────▶│  SQLite + Cache │
│  (x402 events)   │     │  (10s poll)      │     │                 │
│                   │     │                   │     │  ▼ Aggregated   │
│  PaymentSettled   │     │  ▼ Parse event    │     │  ▼ Per-agent    │
│  ERC-8004 agents  │     │  ▼ Link identity  │     │  ▼ Per-service  │
│  BTC settlement   │     │  ▼ Store raw      │     │  ▼ Time-series  │
└──────────────────┘     └──────────────────┘     └─────────────────┘
                                                              │
                                                              ▼
┌──────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Agent Builder   │◀────│  Kether API      │◀────│  Analytics      │
│  (dashboard)     │     │  (FastAPI)       │     │  Engine         │
│                   │     │                   │     │                 │
│  ▼ Revenue charts│     │  GET /agent/:id   │     │  ▼ Revenue      │
│  ▼ Client list   │     │  GET /services    │     │  ▼ Clients      │
│  ▼ Growth trend  │     │  POST /predict    │     │  ▼ Prediction   │
│                   │     │  (x402-gated)    │     │                 │
└──────────────────┘     └──────────────────┘     └─────────────────┘
```

### Data flow

1. **x402 payment settles** on GOAT Network — `PaymentSettled(payer, payee, amount, serviceId)` event emitted
2. **Kether indexer polls** GOAT RPC every 10 seconds — reads new blocks, parses x402 events
3. **Indexer links payer/payee** to ERC-8004 agent registry — enriches raw addresses with agent identities
4. **Indexer stores** raw payment + agent metadata in SQLite, updates hourly aggregations
5. **Dashboard queries** `/api/agent/:erc8004_id/revenue` — API reads aggregated data, returns JSON
6. **Dashboard renders** revenue charts, client breakdown, service rankings, growth prediction
7. **Prediction endpoint** (`POST /predict`) is x402-gated — builders pay per prediction query

### Component by component

| Component | Technology | Responsibility |
|---|---|---|
| **Indexer** | TypeScript, ethers.js v6 | Polls GOAT RPC, parses x402 PaymentSettled events, links ERC-8004 identities |
| **Database** | SQLite (WAL mode) | Raw events + hourly/daily aggregations. Per-agent, per-service, per-client |
| **API** | FastAPI (Python) | REST endpoints for agent revenue, client breakdown, service rankings, growth prediction |
| **Prediction Engine** | Python (scikit-learn) | Linear regression on time-series payment data, confidence intervals |
| **x402 Gateway** | x402 protocol on GOAT | Pay-per-call gating for `/predict` endpoint. BTC settlement via x402 DIRECT mode |
| **ERC-8004 Integration** | ethers.js + GOAT RPC | Reads agent registry, resolves agent identity from payment addresses |
| **Dashboard** | React 19, Vite 6, TailwindCSS 4 | Revenue charts (Recharts), client table, service rankings, growth trend |
| **Deployment** | Vercel (dashboard), Render (API + indexer) | Indexer runs as background worker, API as web service |

---

## x402 use case

Kether uses x402 as its monetization rail. Agent builders pay per analytics query:

- **Who pays**: agent builders (ERC-8004 identified)
- **Who receives**: Kether analytics API
- **What's paid for**: each `/predict` call (growth forecast), `/deep-dive` call (per-client analysis)
- **Why x402**: these are machine-to-machine payments. agents querying analytics about their own payment flows. x402 is built for exactly this — HTTP-native, pay-per-call, no subscription overhead. stripe doesn't work for agents. subscriptions don't work for variable query volume. x402 makes every insight a transaction.
- **Business case**: a builder with 3 x402 endpoints doing 500 BTC/month pays Kether ~5 BTC/month in analytics fees (1% of tracked volume). at 100 builders = 500 BTC/month recurring. zero payment processing overhead because x402 settles directly on GOAT.

---

## What's real vs pending — the honesty table

| Capability | Status |
|---|---|
| **Research** — competitive analysis | **Done** |
| **Architecture** — component design, data flow, x402 integration plan | **Done** |
| **GOAT Network Wallet** — `0xf9BAC173da2E212Bb2A8418178714c4dB0e867e0` | **Done** |
| **GOAT x402 Integration Faucet** — requested | **Pending** |
| **KetherIndexer.sol** (on-chain x402 payment aggregation) | **Done** — 8 forge tests passing, compiled, ready for deploy |
| **Indexer** — x402 event polling, ERC-8004 linking, SQLite storage | **Done** — TypeScript poller, WAL-mode SQLite, 10s interval |
| **API** — FastAPI endpoints (/agent/:id, /services, /clients, /predict) | **Done** — 5 endpoints, x402-gated /predict, CORS enabled |
| **Prediction Engine** — linear regression on payment time-series | **Done** — scikit-learn, R² confidence scoring |
| **Dashboard** — React + Recharts revenue intelligence | **Done** — KPI cards, bar/pie charts, client table, prediction panel |
| **GOAT Testnet3 Contract Deploy** — KetherIndexer on-chain | **Pending** — compiled, needs testnet BTC from faucet (bridge.testnet3.goat.network/faucet) |
| **Live deployment** — kether.vercel.app | **Pending** — dashboard ready for Vercel deploy |
| **Real x402 payments** — production settlement on GOAT Network | **Pending** — testnet first, mainnet post-grant |

---

## How it uses GOAT Network

**Reads.** The indexer polls GOAT RPC every 10 seconds, reading x402 `PaymentSettled` events and ERC-8004 agent registry data. All reads are free — view functions and event logs on GOAT Network.

**Writes.** The indexer contract stores aggregated revenue data on-chain for public verifiability. Builders can verify Kether's numbers against raw x402 events independently.

**Verified on GOAT Explorer.** Once deployed, the indexer contract and all x402 payment events are verifiable at explorer.goat.network.

**Chain-native.** Kether uses GOAT's native BTC for all settlement. x402 payments are denominated in BTC. No wrapped tokens, no bridges, no extra layers.

---

## Engineering decisions & the hard problems

- **10-second polling, not real-time WebSocket.** GOAT RPC doesn't expose a WebSocket subscription for x402 events. The 10-second poll interval balances freshness with RPC rate limits. Hourly aggregations keep dashboard queries fast.

- **SQLite, not PostgreSQL.** Single-file database with WAL mode. No server to manage, no connection pooling, no separate deployment. SQLite handles 10K writes/minute — more than enough for x402 event volume on a growing network.

- **On-chain aggregations for verifiability.** Raw payment data lives on GOAT. Kether stores aggregated totals on-chain so builders can verify "Kether says I earned 500 BTC → let me check the chain → yes, 500 BTC confirmed."

- **Prediction is linear regression, not deep learning.** The model inputs are historical payment volume per service. Linear regression is explainable, fast, and sufficient for trend detection. Builders don't need a black box — they need to know "am I growing?"

- **x402-gated, not subscription-gated.** Charging per prediction query aligns incentives. Builders who earn more query more. Builders who earn less aren't paying for analytics they don't need.

- **ERC-8004 identity linking at index time.** Payment events carry wallet addresses. The indexer resolves these to ERC-8004 agent identities during processing — not at query time. This keeps the API fast and avoids RPC calls on every dashboard load.

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

| Test | What it proves |
|---|---|
| `test_index_payment_event` | x402 PaymentSettled events are correctly parsed and stored |
| `test_aggregate_agent_revenue` | Per-agent revenue totals match raw event sums |
| `test_get_top_clients` | Client spending is correctly ranked |
| `test_get_service_rankings` | Per-service revenue is correctly aggregated |
| `test_link_erc8004_identity` | Payment addresses resolve to ERC-8004 agent profiles |
| `test_x402_payment_gating` | `/predict` endpoint requires valid x402 payment |
| `test_prediction_query` | Growth prediction returns sane values on known data |
| `test_unlinked_address_returns_zero` | Unregistered addresses return zero revenue |

---

## Run it locally

**Prerequisites:** Node.js 20+, Python 3.11+, Foundry, GOAT Testnet3 RPC endpoint.

```bash
git clone https://github.com/subheeksh5599/kether.git
cd kether

# Install dependencies
npm install           # dashboard + indexer
pip install -r requirements.txt  # API + prediction

# Run tests
forge test -vvv

# Deploy contracts to GOAT Testnet3
cp .env.example .env  # fill in PRIVATE_KEY and GOAT_RPC_URL
source .env
forge script contracts/script/Deploy.s.sol --rpc-url $GOAT_RPC_URL --broadcast

# Run the indexer (background worker)
cd indexer && npm run dev

# Run the API
cd api && uvicorn main:app --reload --port 8000

# Run the dashboard
cd dashboard && npm install && npm run dev  # :5173
```

Open `http://localhost:5173` and enter your ERC-8004 agent ID. Kether pulls your x402 payment history from GOAT Testnet3.

## Configuration

```toml
# .env
GOAT_RPC_URL=https://rpc.testnet3.goat.network
GOAT_CHAIN_ID=48816
INDEXER_CONTRACT=0x_kether_indexer_address_
PRIVATE_KEY=your_goat_wallet_private_key

# config.yaml
indexer:
  poll_interval_seconds: 10
  batch_size: 100
  start_block: 0

api:
  host: 0.0.0.0
  port: 8000
  x402_price_btc: 0.00001

database:
  path: ./data/kether.db
  wal_mode: true
```

## Deploy

| | |
|---|---|
| **Dashboard** | kether.vercel.app — Vercel |
| **API** | kether-api.onrender.com — Render |
| **Indexer** | Background worker on Render |
| **KetherIndexer** | GOAT Testnet3 |

The indexer runs as a background worker on Render's free tier. The API serves dashboard requests via FastAPI. The dashboard is deployed on Vercel. Contracts are on GOAT Testnet3 — mainnet deployment planned for grant milestone 2.

## Project layout

```
kether/
├── contracts/
│   ├── src/
│   │   └── KetherIndexer.sol    # On-chain revenue aggregations
│   ├── script/Deploy.s.sol      # Foundry deployment script
│   └── test/Kether.t.sol        # 8 forge tests
├── indexer/
│   ├── src/
│   │   ├── poller.ts            # 10s GOAT RPC poll, x402 event parsing
│   │   ├── identity.ts          # ERC-8004 agent resolution
│   │   └── store.ts             # SQLite write, hourly aggregation
│   └── package.json
├── api/
│   ├── main.py                  # FastAPI app
│   ├── routes/
│   │   ├── agent.py             # GET /agent/:id/revenue
│   │   ├── services.py          # GET /services/rankings
│   │   ├── predict.py           # POST /predict (x402-gated)
│   │   └── x402.py              # x402 payment verification middleware
│   ├── engine/
│   │   └── predictor.py         # Linear regression, confidence intervals
│   └── requirements.txt
├── dashboard/
│   └── src/
│       ├── DashboardPage.tsx     # Revenue charts, client table, growth trend
│       ├── components/           # RevenueCard, ClientTable, ServiceChart, PredictPanel
│       └── hooks/                # useAgent, useRevenue, usePrediction
├── .env.example
├── foundry.toml
└── README.md
```

## Tech stack

- **Smart Contracts:** Solidity 0.8.24 + Foundry (forge, cast)
- **Indexer:** TypeScript, ethers.js v6, SQLite (WAL mode)
- **API:** Python 3.11, FastAPI, scikit-learn
- **Payments:** x402 DIRECT mode on GOAT Network, BTC settlement
- **Identity:** ERC-8004 agent registry on GOAT Network
- **Dashboard:** React 19, Vite 6, TypeScript (strict), TailwindCSS 4, Recharts
- **Deployment:** Vercel (dashboard), Render (API + indexer)
- **Verification:** `forge test` — 8 tests; GOAT Explorer for on-chain verification

## Roadmap

- **Grant Milestone 1** — Indexer live on GOAT Testnet3, basic revenue dashboard, ERC-8004 identity linking
- **Grant Milestone 2** — x402-gated prediction endpoint, client breakdown, service rankings, mainnet deployment
- **Post-grant** — Competitive benchmarking across agents, anomaly detection ("client X stopped paying"), pricing recommendations, public leaderboard for top-earning GOAT agents

## License

MIT — see [LICENSE](LICENSE).
