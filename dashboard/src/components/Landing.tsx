import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const PROJECTS = [
  {
    id: "kether", category: "analytics", tag: "GOAT Grant", logo: "K",
    name: "Kether",
    desc: "x402 payment analytics for AI agents on GOAT Network. Indexes every PaymentSettled event, links ERC-8004 identities, and delivers revenue intelligence dashboards. Built for GOAT AI Builder Grants ($500 base grant).",
    stats: [["Chain", "GOAT Network"], ["Contract", "Testnet3 Verified"], ["Tests", "8 passing"], ["Stack", "Solidity+FastAPI+React"]],
    website: "https://kether-three.vercel.app", twitter: "https://github.com/subheeksh5599/kether",
  },
  {
    id: "payrollx", category: "defi", tag: "Xphere Grant", logo: "PX",
    name: "PayrollX",
    desc: "Stablecoin payroll for Southeast Asian remote teams. Employers deposit USDC into an escrow contract. Workers receive funds directly to wallets — no bank account needed. Built on Xphere EVM.",
    stats: [["Chain", "Xphere EVM"], ["Stack", "Solidity+FastAPI+React"], ["Status", "Idea → Building"]],
    website: "https://github.com/subheeksh5599/payrollx", twitter: "https://github.com/subheeksh5599/payrollx",
  },
  {
    id: "fabricx", category: "defi", tag: "OKX Live", logo: "FX",
    name: "FabricX",
    desc: "x402 payment-gated API agent on OKX. Agent #4893 — live, reviewer-tested. Accepts payments via x402 protocol with ERC-8004 identity verification. Production agent with real transaction volume.",
    stats: [["Chain", "X Layer (OKX)"], ["Agent ID", "#4893"], ["Status", "Live"], ["Stack", "x402+ERC-8004"]],
    website: "https://github.com/subheeksh5599/FabricX", twitter: "https://github.com/subheeksh5599/FabricX",
  },
  {
    id: "nox", category: "privacy", tag: "Midnight", logo: "N",
    name: "Nox",
    desc: "Privacy-preserving credential verification on Midnight Network. Zero-knowledge proofs for enterprise identity — verify credentials without revealing underlying data. Deployed on Midnight testnet.",
    stats: [["Chain", "Midnight Compact 0.5.1"], ["Type", "ZK Credentials"], ["Deploy", "nox-smoky.vercel.app"]],
    website: "https://nox-smoky.vercel.app", twitter: "https://github.com/subheeksh5599/nox",
  },
  {
    id: "robinhood", category: "defi", tag: "Policy Layer", logo: "RH",
    name: "Robinhood Chain",
    desc: "On-chain policy layer for AI agents. Agents can't move funds without passing programmable guardrails. Rate limiting, allowlists, spending caps — enforced at the chain level. Built for the Robinhood Ecosystem Fund.",
    stats: [["Chain", "Robinhood Chain"], ["Type", "Agent Policy Layer"], ["Standard", "x402+USDG"]],
    website: "https://github.com/subheeksh5599/robinhood-chain", twitter: "https://github.com/subheeksh5599/robinhood-chain",
  },
  {
    id: "night", category: "privacy", tag: "Midnight", logo: "NS",
    name: "NightSignals",
    desc: "On-chain trading signals with ZK privacy. Creators publish signals that buyers can verify without revealing strategy details. Signal validity proven via Midnight ZK circuits.",
    stats: [["Chain", "Midnight"], ["Type", "ZK Trading Signals"], ["Status", "Contract Deployed"]],
    website: "https://github.com/subheeksh5599/nightsignals", twitter: "https://github.com/subheeksh5599/nightsignals",
  },
];

const FILTERS = ["All", "Analytics", "DeFi", "Privacy"];

export default function Landing() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState<typeof PROJECTS[0] | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navRef = useRef<HTMLElement>(null);

  const filtered = PROJECTS.filter((p) => {
    const matchFilter = filter === "All" || p.category === filter.toLowerCase();
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  // Three.js node network
  useEffect(() => {
    let animId: number;
    let scene: any, camera: any, renderer: any, nodes: any[], ptLight: any;
    const init = async () => {
      const THREE = await import("three");
      const canvas = canvasRef.current;
      if (!canvas) return;
      const parent = canvas.parentElement!;
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(parent.clientWidth, parent.clientHeight);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, parent.clientWidth / parent.clientHeight, 0.1, 100);
      camera.position.set(0, 0, 12);

      nodes = [];
      const nodeGeo = new THREE.SphereGeometry(0.22, 32, 32);
      for (let i = 0; i < 18; i++) {
        const mat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.05, roughness: 0.1, transparent: true, opacity: 0.85, clearcoat: 0.3 });
        const mesh = new THREE.Mesh(nodeGeo, mat);
        mesh.position.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4);
        mesh.userData = { basePos: mesh.position.clone(), speed: 0.3 + Math.random() * 0.5, offset: Math.random() * Math.PI * 2 };
        scene.add(mesh);
        nodes.push(mesh);
        const ringGeo = new THREE.TorusGeometry(0.3, 0.03, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff5a00, transparent: true, opacity: 0.7 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        mesh.add(ring);
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() < 0.18) {
            const dist = nodes[i].position.distanceTo(nodes[j].position);
            if (dist < 5) {
              const mid = new THREE.Vector3().addVectors(nodes[i].position, nodes[j].position).multiplyScalar(0.5);
              const cylGeo = new THREE.CylinderGeometry(0.02, 0.02, dist, 6);
              const cylMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.15, transparent: true, opacity: 0.35, clearcoat: 0.2 });
              const cyl = new THREE.Mesh(cylGeo, cylMat);
              cyl.position.copy(mid);
              cyl.lookAt(nodes[j].position);
              cyl.rotateX(Math.PI / 2);
              scene.add(cyl);
            }
          }
        }
      }

      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      ptLight = new THREE.PointLight(0xff5a00, 1.2, 15);
      ptLight.position.set(2, 1, 4);
      scene.add(ptLight);
      const ptLight2 = new THREE.PointLight(0xffffff, 0.6, 10);
      ptLight2.position.set(-3, -1, 2);
      scene.add(ptLight2);

      const clock = new THREE.Clock();
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        nodes.forEach((n, i) => {
          n.position.x = n.userData.basePos.x + Math.sin(t * n.userData.speed + n.userData.offset) * 0.3;
          n.position.y = n.userData.basePos.y + Math.cos(t * n.userData.speed * 0.7 + n.userData.offset) * 0.25;
          const glow = n.children[0];
          if (glow) {
            const s = 1 + Math.sin(t * 2.5 + i) * 0.25;
            glow.scale.setScalar(s);
            glow.material.opacity = 0.4 + Math.sin(t * 2.5 + i) * 0.3;
          }
        });
        ptLight.intensity = 1.2 + Math.sin(t * 1.5) * 0.3;
        scene.rotation.y += 0.0015;
        renderer.render(scene, camera);
      };
      animate();

      const onResize = () => {
        renderer.setSize(parent.clientWidth, parent.clientHeight);
        camera.aspect = parent.clientWidth / parent.clientHeight;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", onResize);
    };
    init();
    return () => { cancelAnimationFrame(animId); };
  }, []);

  // Nav scroll hide
  useEffect(() => {
    let lastScroll = 0;
    const onScroll = () => {
      const nav = navRef.current;
      if (!nav) return;
      if (window.scrollY > lastScroll && window.scrollY > 200) nav.classList.add("hidden");
      else nav.classList.remove("hidden");
      lastScroll = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Nav */}
      <nav ref={navRef} id="nav">
        <div className="nav-inner">
          <Link to="/" className="nav-logo">KETH<span>ER</span></Link>
          <div className="nav-center">
            <a href="#products">Projects</a>
            <a href="#ecosystem">Ecosystem</a>
            <a href="#docs">Docs</a>
            <a href="#blog">Blog</a>
          </div>
          <div className="nav-right">
            <Link to="/dashboard" className="btn btn-ghost btn-sm">Open Dashboard</Link>
            <a href="https://github.com/subheeksh5599/kether" className="btn btn-solid btn-sm">GITHUB</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero section" id="hero">
        <div className="wrap">
          <div className="hero-grid">
            <div className="hero-left">
              <div className="upper" style={{ marginBottom: "0.5rem" }}>GOAT AI Builder Grants ($500) · Real-Time Chain Analytics</div>
              <h1 className="pixel glitch-h1">
                <span>GOAT</span>{" "}
                <span>NETWORK</span>{" "}
                <span>ANALYTICS</span>
              </h1>
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", maxWidth: "400px", marginTop: "1.5rem" }}>
                Phase 1: index every block and transaction on GOAT Testnet3. Real-time chain metrics — blocks, transactions, active addresses, gas usage. Phase 2: x402 payment analytics when the agent ecosystem matures.
              </p>
              <div className="hero-stats">
                <div className="stat-tile"><div className="upper">Blocks Indexed</div><div className="stat-val">LIVE</div></div>
                <div className="stat-tile"><div className="upper">Transactions</div><div className="stat-val">REAL</div></div>
                <div className="stat-tile"><div className="upper">Active Addresses</div><div className="stat-val">TRACKED</div></div>
              </div>
            </div>
            <div className="hero-right">
              <canvas ref={canvasRef} id="node-canvas" />
            </div>
          </div>
        </div>
        <div className="hero-scroll-hint">↓ Scroll to explore</div>
      </section>

      {/* Products */}
      <section className="section portfolio-section" id="products">
        <div className="wrap">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div className="upper" style={{ marginBottom: "0.3rem" }}>Phase 1: GOAT Testnet3 Chain Analytics · Phase 2: x402 Payments</div>
              <h2 className="pixel" style={{ fontSize: "clamp(2rem,5vw,4.5rem)" }}>PROJECTS</h2>
            </div>
            <div className="tag">PHASE 1 · LIVE</div>
          </div>

          <div className="filter-bar">
            {FILTERS.map((f) => (
              <button key={f} className={`filter-tab${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
            <input type="text" className="filter-search" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="bento-grid">
            {filtered.map((p, i) => (
              <div key={p.id} className={`bento-card${i === 0 ? " featured" : ""}`} onClick={() => setDetail(p)}>
                <span className="card-tag">{p.tag}</span>
                <div className="card-logo">{p.logo}</div>
                <div className="card-name">{p.name}</div>
                <div className="card-desc">{p.desc}</div>
                <div className="card-stats">
                  {p.stats.map(([k, v]) => (
                    <div key={k} className="card-stat">{k}<span>{v}</span></div>
                  ))}
                </div>
                <span className="card-arrow">VIEW DETAILS →</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section section">
        <div className="wrap">
          <div className="upper" style={{ marginBottom: "0.5rem" }}>GOAT AI Builder Grants Program · $500 Base Grant</div>
          <h2 className="pixel" style={{ fontSize: "clamp(2rem,5vw,4.5rem)", marginBottom: "1rem" }}>
            READY TO EXPLORE<br />GOAT NETWORK?
          </h2>
          <p style={{ fontSize: "0.75rem", color: "var(--muted)", maxWidth: "500px", margin: "0 auto 1rem" }}>
            Phase 1 is live — every block, every transaction, every address on GOAT Testnet3, indexed in real time. Phase 2 ships x402 payment analytics when the agent ecosystem goes live.
          </p>
          <div className="cta-buttons">
            <Link to="/dashboard" className="btn btn-solid">OPEN DASHBOARD</Link>
            <a href="https://github.com/subheeksh5599/kether" className="btn btn-ghost">VIEW ON GITHUB</a>
          </div>
        </div>
      </section>

      {/* Detail overlay */}
      {detail && (
        <div className="detail-overlay open" onClick={() => setDetail(null)}>
          <div className="detail-panel" onClick={(e) => e.stopPropagation()}>
            <button className="detail-close" onClick={() => setDetail(null)}>✕</button>
            <div className="detail-name">{detail.name}</div>
            <div className="detail-desc">{detail.desc}</div>
            <div className="detail-links">
              <a href={detail.website} className="btn btn-solid btn-sm" target="_blank">Visit Website ↗</a>
              <a href={detail.twitter} className="btn btn-ghost btn-sm" target="_blank">GitHub ↗</a>
            </div>
            <div className="detail-meta">
              {detail.stats.map(([k, v]) => (
                <div key={k} className="detail-meta-item">
                  <div className="upper">{k}</div>
                  <div>{v}</div>
                </div>
              ))}
            </div>
            <div className="chrome-block">
              <div className="upper">Tech Stack</div>
              <div className="stat-val">{detail.stats.map(([k, v]) => `${k}: ${v}`).join(" · ")}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
