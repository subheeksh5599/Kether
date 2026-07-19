import { JsonRpcProvider, Contract, Interface, Log } from "ethers";
import Database from "better-sqlite3";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ───────────────────────────────────────
const GOAT_RPC = process.env.GOAT_RPC_URL || "https://rpc.testnet3.goat.network";
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || "10");
const DB_PATH = process.env.DB_PATH || resolve(__dirname, "..", "..", "data", "kether.db");

// x402 PaymentSettled event signature
const PAYMENT_SETTLED_TOPIC =
  "0x7a0b5c5f9e6e2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c";

// Minimal x402 PaymentSettled ABI
const X402_ABI = [
  "event PaymentSettled(address indexed payer, address indexed payee, uint256 amount, string serviceId)",
];
const X402_IFACE = new Interface(X402_ABI);

// ── Database ─────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_number INTEGER NOT NULL,
    tx_hash TEXT NOT NULL,
    payer TEXT NOT NULL,
    payee TEXT NOT NULL,
    amount TEXT NOT NULL,
    service_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    agent_id INTEGER,
    UNIQUE(tx_hash, payer, payee, service_id)
  );

  CREATE TABLE IF NOT EXISTS agent_revenue (
    agent_id INTEGER PRIMARY KEY,
    total_revenue TEXT NOT NULL DEFAULT '0',
    transaction_count INTEGER NOT NULL DEFAULT 0,
    unique_clients INTEGER NOT NULL DEFAULT 0,
    last_updated INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS client_spending (
    agent_id INTEGER,
    client TEXT,
    total_spent TEXT NOT NULL DEFAULT '0',
    transaction_count INTEGER NOT NULL DEFAULT 0,
    last_payment INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (agent_id, client)
  );

  CREATE TABLE IF NOT EXISTS service_revenue (
    agent_id INTEGER,
    service_id TEXT,
    total_revenue TEXT NOT NULL DEFAULT '0',
    call_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (agent_id, service_id)
  );

  CREATE INDEX IF NOT EXISTS idx_payments_agent ON payments(agent_id);
  CREATE INDEX IF NOT EXISTS idx_payments_timestamp ON payments(timestamp);
  CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer);
`);

const insertPayment = db.prepare(`
  INSERT OR IGNORE INTO payments (block_number, tx_hash, payer, payee, amount, service_id, timestamp, agent_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const upsertAgentRevenue = db.prepare(`
  INSERT INTO agent_revenue (agent_id, total_revenue, transaction_count, unique_clients, last_updated)
  VALUES (?, ?, 1, 1, ?)
  ON CONFLICT(agent_id) DO UPDATE SET
    total_revenue = agent_revenue.total_revenue + ?,
    transaction_count = agent_revenue.transaction_count + 1,
    unique_clients = agent_revenue.unique_clients + ?,
    last_updated = ?
`);

const upsertClientSpend = db.prepare(`
  INSERT INTO client_spending (agent_id, client, total_spent, transaction_count, last_payment)
  VALUES (?, ?, ?, 1, ?)
  ON CONFLICT(agent_id, client) DO UPDATE SET
    total_spent = client_spending.total_spent + ?,
    transaction_count = client_spending.transaction_count + 1,
    last_payment = ?
`);

const upsertServiceRevenue = db.prepare(`
  INSERT INTO service_revenue (agent_id, service_id, total_revenue, call_count)
  VALUES (?, ?, ?, 1)
  ON CONFLICT(agent_id, service_id) DO UPDATE SET
    total_revenue = service_revenue.total_revenue + ?,
    call_count = service_revenue.call_count + 1
`);

// ── ERC-8004 Agent Resolution ────────────────────
// In production: resolve payee address → ERC-8004 agent ID
// For now: use a simple mapping or fallback to address hash
function resolveAgentId(payee: string): number {
  // In production, call ERC-8004 registry on GOAT:
  // registry.getAgentByAddress(payee)
  // For testnet: use last 4 bytes of address as stub agent ID
  return parseInt(payee.slice(-8), 16) % 100000;
}

function isNewClient(agentId: number, client: string): boolean {
  const row = db
    .prepare("SELECT COUNT(*) as c FROM client_spending WHERE agent_id = ? AND client = ?")
    .get(agentId, client) as { c: number };
  return row.c === 0;
}

// ── Event Processing ─────────────────────────────
function processPaymentEvent(log: Log, blockNumber: number) {
  const parsed = X402_IFACE.parseLog({ topics: log.topics as string[], data: log.data });
  if (!parsed) return;

  const payer = parsed.args.payer;
  const payee = parsed.args.payee;
  const amount = parsed.args.amount.toString();
  const serviceId = parsed.args.serviceId || "unknown";
  const txHash = log.transactionHash;
  const timestamp = Math.floor(Date.now() / 1000);

  const agentId = resolveAgentId(payee);
  const isNew = isNewClient(agentId, payer);

  // Store raw payment
  insertPayment.run(blockNumber, txHash, payer, payee, amount, serviceId, timestamp, agentId);

  // Aggregate
  upsertAgentRevenue.run(agentId, amount, timestamp, amount, isNew ? 1 : 0, timestamp);
  upsertClientSpend.run(agentId, payer, amount, timestamp, amount, timestamp);
  upsertServiceRevenue.run(agentId, serviceId, amount, amount);

  console.log(
    `[${new Date().toISOString()}] agent=${agentId} payer=${payer.slice(0, 10)} amount=${amount} service=${serviceId}`
  );
}

// ── Main Poll Loop ───────────────────────────────
async function main() {
  const provider = new JsonRpcProvider(GOAT_RPC);
  const network = await provider.getNetwork();
  console.log(`[kether-indexer] connected to GOAT Network chain ${network.chainId}`);
  console.log(`[kether-indexer] DB: ${DB_PATH}`);
  console.log(`[kether-indexer] polling every ${POLL_INTERVAL}s`);

  let lastBlock = await provider.getBlockNumber();

  while (true) {
    try {
      const currentBlock = await provider.getBlockNumber();

      if (currentBlock > lastBlock) {
        // Query x402 PaymentSettled events in block range
        // In production, listen for specific contract events
        // For now: log polling heartbeat
        const blocksProcessed = currentBlock - lastBlock;
        console.log(
          `[kether-indexer] blocks ${lastBlock}→${currentBlock} (${blocksProcessed} new)`
        );
        lastBlock = currentBlock;
      }
    } catch (err) {
      console.error("[kether-indexer] poll error:", err);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL * 1000));
  }
}

main().catch(console.error);
