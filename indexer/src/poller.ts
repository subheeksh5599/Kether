import { JsonRpcProvider } from "ethers";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Config ───────────────────────────────────────
const GOAT_RPC = process.env.GOAT_RPC_URL || "https://rpc.testnet3.goat.network";
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || "10");
const DATA_DIR = process.env.DATA_DIR || resolve(__dirname, "..", "..", "data");
const STATE_PATH = resolve(DATA_DIR, "chain.json");

// ── State ────────────────────────────────────────
interface ChainState {
  total_blocks: number;
  total_txns: number;
  total_addresses: number;
  last_block: number;
  recent_blocks: BlockEntry[];
  recent_txns: TxnEntry[];
  addresses: Record<string, AddressEntry>;
}

interface BlockEntry {
  number: number;
  hash: string;
  timestamp: number;
  tx_count: number;
}

interface TxnEntry {
  hash: string;
  block_number: number;
  from_addr: string;
  to_addr: string | null;
  value: string;
  timestamp: number;
}

interface AddressEntry {
  first_seen: number;
  last_seen: number;
  tx_count: number;
}

let state: ChainState;

function loadState(): ChainState {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (existsSync(STATE_PATH)) {
    return JSON.parse(readFileSync(STATE_PATH, "utf-8"));
  }
  return {
    total_blocks: 0,
    total_txns: 0,
    total_addresses: 0,
    last_block: 0,
    recent_blocks: [],
    recent_txns: [],
    addresses: {},
  };
}

function saveState() {
  writeFileSync(STATE_PATH, JSON.stringify(state));
}

// ── Block Processing ─────────────────────────────
async function processBlock(provider: JsonRpcProvider, blockNumber: number): Promise<number> {
  const block = await provider.getBlock(blockNumber, true);
  if (!block) return 0;

  let txnCount = 0;

  // Store block (keep last 100)
  state.recent_blocks.unshift({
    number: block.number,
    hash: block.hash!,
    timestamp: block.timestamp,
    tx_count: block.transactions.length,
  });
  if (state.recent_blocks.length > 100) state.recent_blocks = state.recent_blocks.slice(0, 100);

  // Process transactions (keep last 200)
  for (const txHash of block.transactions) {
    // GOAT RPC returns tx hashes, fetch full tx
    const hash = typeof txHash === "string" ? txHash : txHash.hash!;
    const tx = typeof txHash === "string" ? await provider.getTransaction(hash) : txHash;
    if (!tx) continue;

    const fromAddr = (tx.from || "").toLowerCase();
    const toAddr = tx.to ? (tx.to as string).toLowerCase() : null;

    state.recent_txns.unshift({
      hash,
      block_number: block.number,
      from_addr: fromAddr,
      to_addr: toAddr,
      value: tx.value?.toString() || "0",
      timestamp: block.timestamp,
    });
    if (state.recent_txns.length > 200) state.recent_txns = state.recent_txns.slice(0, 200);

    // Track addresses
    if (fromAddr) {
      const existing = state.addresses[fromAddr];
      if (existing) {
        existing.last_seen = block.timestamp;
        existing.tx_count++;
      } else {
        state.addresses[fromAddr] = { first_seen: block.timestamp, last_seen: block.timestamp, tx_count: 1 };
      }
    }
    if (toAddr) {
      const existing = state.addresses[toAddr];
      if (existing) {
        existing.last_seen = block.timestamp;
        existing.tx_count++;
      } else {
        state.addresses[toAddr] = { first_seen: block.timestamp, last_seen: block.timestamp, tx_count: 1 };
      }
    }

    txnCount++;
  }

  return txnCount;
}

// ── Main Poll Loop ───────────────────────────────
async function main() {
  state = loadState();
  const provider = new JsonRpcProvider(GOAT_RPC);
  const network = await provider.getNetwork();
  console.log(`[kether] GOAT Testnet3 chain ${network.chainId}`);
  console.log(`[kether] polling every ${POLL_INTERVAL}s`);

  let lastBlock = state.last_block;

  if (lastBlock === 0) {
    const current = await provider.getBlockNumber();
    lastBlock = Math.max(0, current - 100);
    console.log(`[kether] first run, starting from block ${lastBlock}`);
  }

  while (true) {
    try {
      const currentBlock = await provider.getBlockNumber();

      if (currentBlock > lastBlock) {
        const start = lastBlock + 1;
        const end = Math.min(currentBlock, lastBlock + 20);
        let totalTxns = 0;

        for (let bn = start; bn <= end; bn++) {
          totalTxns += await processBlock(provider, bn);
        }

        state.total_blocks += end - start + 1;
        state.total_txns += totalTxns;
        state.total_addresses = Object.keys(state.addresses).length;
        state.last_block = end;
        saveState();

        console.log(`[kether] blocks ${start}→${end} (${totalTxns} txns, latest: ${end})`);
        lastBlock = end;
      }
    } catch (err) {
      console.error("[kether] poll error:", (err as Error).message);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL * 1000));
  }
}

main().catch(console.error);
