import { useRevenue, useClients, useServices, usePredict } from "../hooks/useApi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { ArrowLeft, TrendingUp, Users, Zap, DollarSign } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface Props {
  agentId: string;
  onBack: () => void;
}

const COLORS = ["#E84142", "#FF6B6B", "#FF8E8E", "#FFB3B3", "#FFD6D6", "#FFEAEA"];

export default function Dashboard({ agentId, onBack }: Props) {
  const { revenue, loading: revLoading } = useRevenue(agentId);
  const { clients, loading: cliLoading } = useClients(agentId);
  const { services, loading: svcLoading } = useServices(agentId);
  const { predict, loading: predLoading, prediction, runPrediction } = usePredict(agentId);

  const id = parseInt(agentId);

  if (revLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              Agent <span style={{ color: "var(--accent)" }}>#{agentId}</span>
            </h1>
            <p className="text-xs text-[var(--muted)]">GOAT Network · ERC-8004 · x402 Payments</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={<DollarSign size={18} />} label="Total Revenue" value={`${formatBTC(revenue?.total_revenue || "0")} BTC`} />
        <KpiCard icon={<Zap size={18} />} label="Transactions" value={String(revenue?.transaction_count || 0)} />
        <KpiCard icon={<Users size={18} />} label="Unique Clients" value={String(revenue?.unique_clients || 0)} />
        <KpiCard icon={<TrendingUp size={18} />} label="Chain" value="GOAT Testnet3" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Service Revenue Bar Chart */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4 text-[var(--muted)] uppercase tracking-wider">Service Revenue</h3>
          {services.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={services.map((s) => ({ name: s.service_id, revenue: parseInt(s.total_revenue) / 1e18 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No service data yet" />
          )}
        </div>

        {/* Client Spending Pie */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
          <h3 className="text-sm font-semibold mb-4 text-[var(--muted)] uppercase tracking-wider">Client Breakdown</h3>
          {clients.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={clients.slice(0, 5).map((c, i) => ({ name: c.address.slice(0, 8) + "...", value: parseInt(c.total_spent) / 1e18 }))} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value">
                  {clients.slice(0, 5).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState text="No client data yet" />
          )}
        </div>
      </div>

      {/* Client Table */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-8">
        <h3 className="text-sm font-semibold mb-4 text-[var(--muted)] uppercase tracking-wider">Top Clients</h3>
        {clients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--muted)] text-left">
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Total Spent</th>
                  <th className="pb-3 font-medium">Txns</th>
                  <th className="pb-3 font-medium">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c, i) => (
                  <tr key={i} className="border-t border-[var(--border)]">
                    <td className="py-3 font-mono text-xs">{c.address.slice(0, 12)}...{c.address.slice(-6)}</td>
                    <td className="py-3">{formatBTC(c.total_spent)} BTC</td>
                    <td className="py-3">{c.transaction_count}</td>
                    <td className="py-3 text-[var(--muted)]">{timeAgo(c.last_payment)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="No client data yet" />
        )}
      </div>

      {/* Prediction Panel */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6">
        <h3 className="text-sm font-semibold mb-4 text-[var(--muted)] uppercase tracking-wider">Revenue Prediction</h3>
        {services.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {services.slice(0, 6).map((s) => (
              <button
                key={s.service_id}
                onClick={() => runPrediction(s.service_id)}
                disabled={predLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border"
                style={{
                  background: predict === s.service_id ? "var(--accent)" : "transparent",
                  borderColor: predict === s.service_id ? "var(--accent)" : "var(--border)",
                  color: predict === s.service_id ? "white" : "var(--muted)",
                }}
              >
                {s.service_id}
              </button>
            ))}
          </div>
        ) : null}
        {prediction && (
          <div className="mt-4 p-4 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5">
            <p className="text-sm text-[var(--muted)]">Predicted 30-day revenue for <strong>{prediction.endpoint}</strong>:</p>
            <p className="text-2xl font-bold mt-1" style={{ color: "var(--accent)" }}>
              {formatBTC(prediction.predicted_revenue_30d)} BTC
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">Confidence: {(prediction.confidence * 100).toFixed(0)}% · Linear Regression</p>
          </div>
        )}
        {!prediction && (
          <EmptyState text="Select a service endpoint to predict 30-day revenue" />
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-center gap-2 text-[var(--muted)] mb-2">{icon}<span className="text-xs uppercase tracking-wider">{label}</span></div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-center py-12 text-[var(--muted)] text-sm">{text}</div>;
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
