import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface ChainStats {
  total_blocks: number;
  total_txns: number;
  total_addresses: number;
  total_gas: string;
  last_block: number;
  chain_id: number;
  network: string;
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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useChainStats() {
  const [stats, setStats] = useState<ChainStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const poll = () => {
      fetchJson<ChainStats>(`${API_BASE}/chain/stats`)
        .then((d) => { if (alive) { setStats(d); setLoading(false); } })
        .catch(() => { if (alive) setLoading(false); });
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  return { stats, loading };
}

export function useRecentBlocks() {
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    let alive = true;
    const poll = () => {
      fetchJson<{ blocks: Block[] }>(`${API_BASE}/chain/blocks?limit=20`)
        .then((d) => { if (alive) setBlocks(d.blocks || []); })
        .catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  return { blocks };
}

export function useRecentTxns() {
  const [txns, setTxns] = useState<Txn[]>([]);

  useEffect(() => {
    let alive = true;
    const poll = () => {
      fetchJson<{ transactions: Txn[] }>(`${API_BASE}/chain/transactions?limit=20`)
        .then((d) => { if (alive) setTxns(d.transactions || []); })
        .catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  return { txns };
}
