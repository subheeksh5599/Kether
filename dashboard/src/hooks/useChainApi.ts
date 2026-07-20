import { useState, useEffect } from "react";

// Static JSON served from public/ — no API server needed
const DATA_URL = "/chain.json";

interface ChainData {
  total_blocks: number;
  total_txns: number;
  total_addresses: number;
  total_gas: string;
  last_block: number;
  recent_blocks: Block[];
  recent_txns: Txn[];
}

interface Block {
  number: number;
  hash: string;
  timestamp: number;
  tx_count: number;
}

interface Txn {
  hash: string;
  block_number: number;
  from_addr: string;
  to_addr: string | null;
  value: string;
  timestamp: number;
}

let cached: ChainData | null = null;

async function fetchData(): Promise<ChainData> {
  if (cached) return cached;
  const res = await fetch(DATA_URL);
  cached = await res.json();
  return cached!;
}

export function useChainStats() {
  const [stats, setStats] = useState<ChainData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData().then((d) => { setStats(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return { stats, loading };
}

export function useRecentBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    fetchData().then((d) => setBlocks(d.recent_blocks || []));
  }, []);

  return { blocks };
}

export function useRecentTxns() {
  const [txns, setTxns] = useState<Txn[]>([]);

  useEffect(() => {
    fetchData().then((d) => setTxns(d.recent_txns || []));
  }, []);

  return { txns };
}
