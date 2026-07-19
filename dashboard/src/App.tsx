import { useState } from "react";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [agentId, setAgentId] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agentId.trim()) setSubmitted(true);
  };

  if (!submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            <span style={{ color: "var(--accent)" }}>Kether</span>
          </h1>
          <p className="text-sm text-[var(--muted)] mb-8">
            x402 payment analytics for GOAT Network agents
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="ERC-8004 agent ID (e.g. 4893)"
              className="w-full px-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-lg font-semibold transition-colors"
              style={{ background: "var(--accent)", color: "white" }}
            >
              View Analytics
            </button>
          </form>
          <p className="text-xs text-[var(--muted)] mt-4">
            Powered by GOAT Network · x402 · ERC-8004
          </p>
        </div>
      </div>
    );
  }

  return <Dashboard agentId={agentId} onBack={() => setSubmitted(false)} />;
}
