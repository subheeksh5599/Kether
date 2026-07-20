import { useChainStats, useRecentBlocks, useRecentTxns } from "../hooks/useChainApi";

function truncate(s: string, n: number = 8) {
  if (!s) return "";
  return s.length <= n * 2 + 4 ? s : s.slice(0, n) + "..." + s.slice(-n);
}

function timeAgo(ts: number): string {
  if (!ts) return "never";
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatGas(gas: string): string {
  const gwei = parseInt(gas) / 1e9;
  if (gwei < 1) return gwei.toFixed(2) + " gwei";
  if (gwei < 1000) return gwei.toFixed(0) + " gwei";
  return (gwei / 1000).toFixed(1) + "K gwei";
}

export default function Dashboard() {
  const { stats, loading: statsLoading } = useChainStats();
  const { blocks } = useRecentBlocks();
  const { txns } = useRecentTxns();

  return (
    <div style={{ minHeight: "100vh", padding: "2rem 0" }}>
      <div className="wrap">
        {/* Header */}
        <div className="dash-header">
          <div className="dash-header-left">
            <div>
              <h3 className="pixel" style={{ fontSize: "1.4rem", marginBottom: "0.1rem" }}>
                GOAT NETWORK <span style={{ color: "var(--accent)" }}>TESTNET3</span>
              </h3>
              <p className="upper" style={{ fontSize: "0.5rem" }}>Real-time chain analytics · Phase 1</p>
            </div>
          </div>
          <div className="tag">{statsLoading ? "SYNCING..." : `BLOCK #${stats?.last_block?.toLocaleString() || "..."}`}</div>
        </div>

        {/* Data disclaimer */}
        <div style={{
          border: "1px solid var(--border)", background: "var(--card-bg)",
          padding: "0.75rem 1rem", marginBottom: "1.5rem",
          fontFamily: "'Space Mono', monospace", fontSize: "0.6rem",
          color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em",
          lineHeight: 1.6
        }}>
          ⚠ STATIC SNAPSHOT — this is a one-time seed of {stats?.total_blocks?.toLocaleString() || "..."} real GOAT Testnet3 blocks indexed on july 20 2026.
          data is frozen and does not update. transactions and addresses are real on-chain data, verifiable on{" "}
          <a href="https://explorer.testnet3.goat.network" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>
            GOAT Explorer
          </a>.
          a live indexer requires 24/7 polling infrastructure — planned for phase 2.
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <KpiCard label="Blocks Indexed" value={statsLoading ? "..." : (stats?.total_blocks?.toLocaleString() || "0")} />
          <KpiCard label="Transactions" value={statsLoading ? "..." : (stats?.total_txns?.toLocaleString() || "0")} />
          <KpiCard label="Active Addresses" value={statsLoading ? "..." : (stats?.total_addresses?.toLocaleString() || "0")} />
          <KpiCard label="Total Gas Used" value={statsLoading ? "..." : (stats ? formatGas(stats.total_gas) : "0")} />
        </div>

        {/* Recent Blocks */}
        <div className="dash-card" style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "1rem", fontWeight: 400 }}>
            Recent Blocks
          </h4>
          {blocks.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Block</th>
                    <th>Hash</th>
                    <th>Txns</th>
                    <th>Age</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.slice(0, 15).map((b) => (
                    <tr key={b.number}>
                      <td style={{ fontFamily: "'DotGothic16',monospace", color: "var(--accent)", fontSize: "0.9rem" }}>
                        #{b.number.toLocaleString()}
                      </td>
                      <td style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.65rem" }}>
                        {truncate(b.hash, 8)}
                      </td>
                      <td>{b.tx_count}</td>
                      <td style={{ color: "var(--muted)" }}>{timeAgo(b.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty text="Indexing blocks from GOAT Testnet3..." />
          )}
        </div>

        {/* Recent Transactions */}
        <div className="dash-card">
          <h4 style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "1rem", fontWeight: 400 }}>
            Recent Transactions
          </h4>
          {txns.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Txn Hash</th>
                    <th>Block</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Age</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.slice(0, 20).map((tx) => (
                    <tr key={tx.hash}>
                      <td style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.65rem" }}>
                        <a
                          href={`https://explorer.testnet3.goat.network/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--accent)", textDecoration: "none" }}
                        >
                          {truncate(tx.hash, 6)}
                        </a>
                      </td>
                      <td style={{ fontFamily: "'DotGothic16',monospace", fontSize: "0.7rem" }}>
                        #{tx.block_number}
                      </td>
                      <td style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.6rem" }}>
                        {truncate(tx.from_addr, 5)}
                      </td>
                      <td style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.6rem" }}>
                        {tx.to_addr ? truncate(tx.to_addr, 5) : "Contract"}
                      </td>
                      <td style={{ color: "var(--muted)", fontSize: "0.6rem" }}>{timeAgo(tx.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty text="Waiting for transactions..." />
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="upper" style={{ fontSize: "0.5rem", marginBottom: "0.25rem" }}>{label}</div>
      <div className="pixel" style={{ fontSize: "1.4rem", color: "var(--accent)" }}>{value}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--muted)", fontSize: "0.65rem", fontFamily: "'Space Mono',monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>
      {text}
    </div>
  );
}
