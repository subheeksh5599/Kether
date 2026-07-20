import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Dashboard from "./Dashboard";

export default function DashboardPage() {
  const [searchParams] = useSearchParams();
  const [agentId, setAgentId] = useState("");
  const [submitted, setSubmitted] = useState("");

  // Auto-load from ?agent= query param
  useEffect(() => {
    const id = searchParams.get("agent");
    if (id) {
      setAgentId(id);
      setSubmitted(id);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agentId.trim()) setSubmitted(agentId.trim());
  };

  if (!submitted) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="wrap" style={{ maxWidth: "500px", width: "100%", textAlign: "center" }}>
          <Link to="/" style={{ fontFamily: "'DotGothic16',monospace", fontSize: "1.2rem", color: "var(--text)", textDecoration: "none", display: "inline-block", marginBottom: "2rem" }}>
            ← KETH<span style={{ color: "var(--accent)" }}>ER</span>
          </Link>
          <h1 className="pixel" style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>
            AGENT ANALYTICS
          </h1>
          <p className="upper" style={{ marginBottom: "2rem", fontSize: "0.6rem" }}>
            x402 Payment Intelligence · GOAT Network
          </p>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="ERC-8004 agent ID (e.g. 4893)"
              className="input-field"
              style={{ marginBottom: "1rem", textAlign: "center" }}
              autoFocus
            />
            <button type="submit" className="btn btn-solid" style={{ width: "100%", justifyContent: "center" }}>
              LOAD ANALYTICS →
            </button>
          </form>
          <p style={{ fontSize: "0.55rem", color: "var(--muted)", marginTop: "1.5rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            GOAT Network · x402 · ERC-8004
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "2rem 0" }}>
      <div className="wrap">
        <Dashboard
          agentId={submitted}
          onBack={() => setSubmitted("")}
          onClear={() => setSubmitted("")}
        />
      </div>
    </div>
  );
}
