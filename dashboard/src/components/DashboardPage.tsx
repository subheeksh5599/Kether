import { Link } from "react-router-dom";
import Dashboard from "./Dashboard";

export default function DashboardPage() {
  return (
    <div style={{ minHeight: "100vh", padding: "2rem 0" }}>
      <div className="wrap">
        <div style={{ marginBottom: "1rem" }}>
          <Link to="/" style={{ fontFamily: "'DotGothic16',monospace", fontSize: "1rem", color: "var(--text)", textDecoration: "none" }}>
            ← KETH<span style={{ color: "var(--accent)" }}>ER</span>
          </Link>
        </div>
        <Dashboard />
      </div>
    </div>
  );
}
