import { useRevenue, useClients, useServices, usePredict } from "../hooks/useApi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

interface Props {
  agentId: string;
  onBack: () => void;
  onClear: () => void;
}

const ORANGE_SCALE = ["#ff5a00", "#ff7a2e", "#ff9a5c", "#ffba8a", "#ffd4b8", "#ffe8d6"];

export default function Dashboard({ agentId, onBack, onClear }: Props) {
  const { revenue, loading: revLoading } = useRevenue(agentId);
  const { clients } = useClients(agentId);
  const { services } = useServices(agentId);
  const { predict, loading: predLoading, prediction, runPrediction } = usePredict(agentId);

  if (revLoading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Mini header */}
      <div className="dash-header">
        <div className="dash-header-left">
          <button onClick={onClear} className="btn btn-ghost btn-sm" style={{ padding: "0.4rem 0.7rem" }}>
            ← BACK TO SITE
          </button>
          <div>
            <h3 className="pixel" style={{ fontSize: "1.4rem", marginBottom: "0.1rem" }}>
              AGENT <span style={{ color: "var(--accent)" }}>#{agentId}</span>
            </h3>
            <p className="upper" style={{ fontSize: "0.5rem" }}>GOAT Network · ERC-8004 · x402 Payments</p>
          </div>
        </div>
        <div className="tag">LIVE · TESTNET3</div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KpiCard label="Total Revenue" value={`${formatBTC(revenue?.total_revenue || "0")} BTC`} />
        <KpiCard label="Transactions" value={String(revenue?.transaction_count || 0)} />
        <KpiCard label="Unique Clients" value={String(revenue?.unique_clients || 0)} />
        <KpiCard label="Chain" value="GOAT Testnet3" />
      </div>

      {/* Charts Row */}
      <div className="chart-grid">
        <div className="chart-box">
          <h4>Service Revenue (BTC)</h4>
          {services.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={services.map((s) => ({ name: s.service_id, revenue: parseInt(s.total_revenue) / 1e18 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "'Space Mono', monospace" }} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "'Space Mono', monospace" }} />
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    fontFamily: "'Space Mono', monospace", fontSize: "0.7rem",
                  }}
                />
                <Bar dataKey="revenue" fill="var(--accent)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty text="No service data yet" />
          )}
        </div>

        <div className="chart-box">
          <h4>Client Breakdown</h4>
          {clients.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={clients.slice(0, 5).map((c) => ({
                    name: c.address.slice(0, 8) + "...",
                    value: parseInt(c.total_spent) / 1e18,
                  }))}
                  cx="50%" cy="50%" outerRadius={85} innerRadius={45} dataKey="value"
                >
                  {clients.slice(0, 5).map((_, i) => (
                    <Cell key={i} fill={ORANGE_SCALE[i % ORANGE_SCALE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    fontFamily: "'Space Mono', monospace", fontSize: "0.7rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Empty text="No client data yet" />
          )}
        </div>
      </div>

      {/* Client Table */}
      <div className="dash-card" style={{ marginBottom: "1.5rem" }}>
        <h4 style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "1rem", fontWeight: 400 }}>
          Top Clients
        </h4>
        {clients.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Client Address</th>
                  <th>Total Spent</th>
                  <th>Txns</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.65rem" }}>
                      {c.address.slice(0, 14)}...{c.address.slice(-6)}
                    </td>
                    <td>{formatBTC(c.total_spent)} BTC</td>
                    <td>{c.transaction_count}</td>
                    <td style={{ color: "var(--muted)" }}>{timeAgo(c.last_payment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="No client data yet" />
        )}
      </div>

      {/* Prediction */}
      <div className="dash-card">
        <h4 style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: "1rem", fontWeight: 400 }}>
          Revenue Prediction
        </h4>
        {services.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            {services.slice(0, 6).map((s) => (
              <button
                key={s.service_id}
                onClick={() => runPrediction(s.service_id)}
                disabled={predLoading}
                className="btn btn-sm"
                style={{
                  background: predict === s.service_id ? "var(--accent)" : "transparent",
                  borderColor: predict === s.service_id ? "var(--accent)" : "var(--border)",
                  color: predict === s.service_id ? "#fff" : "var(--muted)",
                  cursor: predLoading ? "wait" : "pointer",
                }}
              >
                {s.service_id}
              </button>
            ))}
          </div>
        ) : null}
        {predLoading && <div className="spinner" />}
        {prediction && !predLoading && (
          <div className="prediction-badge">
            <p className="upper" style={{ fontSize: "0.55rem", marginBottom: "0.25rem" }}>
              Predicted 30-day revenue for {prediction.endpoint}
            </p>
            <p className="big">{formatBTC(prediction.predicted_revenue_30d)} BTC</p>
            <p className="upper" style={{ fontSize: "0.5rem", marginTop: "0.35rem" }}>
              Confidence: {(prediction.confidence * 100).toFixed(0)}% · Linear Regression
            </p>
          </div>
        )}
        {!prediction && !predLoading && (
          <Empty text="Select a service endpoint to predict 30-day revenue" />
        )}
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

function formatBTC(wei: string): string {
  const btc = parseInt(wei) / 1e18;
  if (btc === 0) return "0";
  if (btc < 0.001) return btc.toFixed(6);
  if (btc < 1) return btc.toFixed(4);
  return btc.toFixed(2);
}

function timeAgo(ts: number): string {
  if (!ts) return "never";
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
