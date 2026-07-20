import { JsonRpcProvider, Block } from "ethers";
import Database from "better-sqlite3";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ───────────────────────────────────────
const GOAT_RPC = process.env.GOAT_RPC_URL || "https://rpc.testnet3.goat.network";
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || "10");
const DB_PATH = process.env.DB_PATH || resolve(__dirname, "..", "..", "data", "kether.db");

// ── Database ─────────────────────────────────────
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS blocks (
    number INTEGER PRIMARY KEY,
    hash TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    tx_count INTEGER NOT NULL DEFAULT 0,
    gas_used TEXT NOT NULL DEFAULT '0',
    indexed_at INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS transactions (
    hash TEXT PRIMARY KEY,
    block_number INTEGER NOT NULL,
    from_addr TEXT NOT NULL,
    to_addr TEXT,
    value TEXT NOT NULL DEFAULT '0',
    gas_used TEXT NOT NULL DEFAULT '0',
    timestamp INTEGER NOT NULL,
    FOREIGN KEY(block_number) REFERENCES blocks(number)
  );

  CREATE TABLE IF NOT EXISTS addresses (
    address TEXT PRIMARY KEY,
    first_seen INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    tx_count INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS chain_stats (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    total_blocks INTEGER NOT NULL DEFAULT 0,
    total_txns INTEGER NOT NULL DEFAULT 0,
    total_addresses INTEGER NOT NULL DEFAULT 0,
    total_gas TEXT NOT NULL DEFAULT '0',
    last_block INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_blocks_timestamp ON blocks(timestamp);
  CREATE INDEX IF NOT EXISTS idx_txns_block ON transactions(block_number);
  CREATE INDEX IF NOT EXISTS idx_txns_from ON transactions(from_addr);
  CREATE INDEX IF NOT EXISTS idx_addresses_last ON addresses(last_seen);

  INSERT OR IGNORE INTO chain_stats (id, total_blocks, total_txns, total_addresses, total_gas, last_block, updated_at)
  VALUES (1, 0, 0, 0, '0', 0, 0);
`);

// ── Prepared Statements ──────────────────────────
const insertBlock = db.prepare(`
  INSERT OR IGNORE INTO blocks (number, hash, timestamp, tx_count, gas_used, indexed_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertTxn = db.prepare(`
  INSERT OR IGNORE INTO transactions (hash, block_number, from_addr, to_addr, value, gas_used, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const upsertAddress = db.prepare(`
  INSERT INTO addresses (address, first_seen, last_seen, tx_count)
  VALUES (?, ?, ?, 1)
  ON CONFLICT(address) DO UPDATE SET
    last_seen = ?,
    tx_count = addresses.tx_count + 1
`);

const updateStats = db.prepare(`
  UPDATE chain_stats SET
    total_blocks = total_blocks + ?,
    total_txns = total_txns + ?,
    total_addresses = (SELECT COUNT(*) FROM addresses),
    total_gas = CAST(CAST(total_gas AS INTEGER) + ? AS TEXT),
    last_block = ?,
    updated_at = ?
  WHERE id = 1
`);

// ── Block Processing ─────────────────────────────
async function processBlock(provider: JsonRpcProvider, blockNumber: number) {
  const block = await provider.getBlock(blockNumber, true);
  if (!block) return { txns: 0, addresses: new Set<string>(), gas: BigInt(0) };

  const now = Math.floor(Date.now() / 1000);
  let gasTotal = BigInt(0);
  const addrs = new Set<string>();

  // Store block
  insertBlock.run(
    block.number,
    block.hash,
    block.timestamp,
    block.transactions.length,
    "0", // gas used filled below
    now
  );

  // Process transactions
  for (const tx of block.transactions) {
    if (typeof tx === "string") continue; // skip hash-only
    const txData = tx as any;

    insertTxn.run(
      txData.hash,
      block.number,
      txData.from || "",
      txData.to || null,
      txData.value?.toString() || "0",
      txData.gasLimit?.toString() || "0",
      block.timestamp
    );

    if (txData.from) {
      addrs.add(txData.from.toLowerCase());
      upsertAddress.run(txData.from.toLowerCase(), block.timestamp, block.timestamp, block.timestamp);
    }
    if (txData.to) {
      addrs.add(txData.to.toLowerCase());
      upsertAddress.run(txData.to.toLowerCase(), block.timestamp, block.timestamp, block.timestamp);
    }

    gasTotal += BigInt(txData.gasLimit || 0);
  }

  // Update block gas total
  db.prepare("UPDATE blocks SET gas_used = ? WHERE number = ?").run(
    gasTotal.toString(),
    block.number
  );

  return { txns: block.transactions.length, addresses: addrs, gas: gasTotal };
}

// ── Main Poll Loop ───────────────────────────────
async function main() {
  const provider = new JsonRpcProvider(GOAT_RPC);
  const network = await provider.getNetwork();
  console.log(`[kether] GOAT Testnet3 chain ${network.chainId}`);
  console.log(`[kether] polling every ${POLL_INTERVAL}s`);

  // Start from last indexed block or current
  const row = db.prepare("SELECT last_block FROM chain_stats WHERE id = 1").get() as any;
  let lastBlock = row?.last_block || 0;

  if (lastBlock === 0) {
    // First run: start from 100 blocks behind current
    const current = await provider.getBlockNumber();
    lastBlock = Math.max(0, current - 100);
    console.log(`[kether] first run, starting from block ${lastBlock}`);
  }

  while (true) {
    try {
      const currentBlock = await provider.getBlockNumber();

      if (currentBlock > lastBlock) {
        const start = lastBlock + 1;
        const end = Math.min(currentBlock, lastBlock + 20); // Batch 20 blocks max

        for (let bn = start; bn <= end; bn++) {
          const { txns, gas } = await processBlock(provider, bn);
          updateStats.run(1, txns, gas.toString(), bn, Math.floor(Date.now() / 1000));
        }

        console.log(
          `[kether] blocks ${start}→${end} (${end - start + 1} indexed, latest: ${end})`
        );
        lastBlock = end;
      }
    } catch (err) {
      console.error("[kether] poll error:", (err as Error).message);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL * 1000));
  }
}

main().catch(console.error);
