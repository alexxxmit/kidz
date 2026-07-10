import { STYLE_CATALOG } from "@kidz/domain";

export const dynamic = "force-dynamic";

type Report = { id: string; targetType: string; reason: string; status: string; createdAt: string; details?: string | null };
type Queue = { reports: Report[]; metrics: { open: number; reviewing: number; resolved: number } };

const apiUrl = process.env.API_URL;

async function loadQueue(): Promise<Queue> {
  if (!apiUrl || !process.env.ADMIN_TOKEN) return { reports: [], metrics: { open: 0, reviewing: 0, resolved: 0 } };
  try {
    const response = await fetch(`${apiUrl}/v1/admin/moderation/reports`, { headers: { "x-admin-token": process.env.ADMIN_TOKEN }, cache: "no-store" });
    if (!response.ok) throw new Error("queue unavailable");
    return response.json() as Promise<Queue>;
  } catch {
    return { reports: [], metrics: { open: 0, reviewing: 0, resolved: 0 } };
  }
}

export default async function Dashboard() {
  const queue = await loadQueue();
  return (
    <main>
      <aside>
        <div><div className="mark">MIRA/OPS</div><p>Trust, safety and style-system operations.</p></div>
        <nav><b>Overview</b><span>Moderation</span><span>Age controls</span><span>AI quality</span><span>Style graph</span></nav>
        <small>INTERNAL · {process.env.NODE_ENV?.toUpperCase()}</small>
      </aside>
      <section>
        <header><div><span className="eyebrow">Trust & safety overview</span><h1>Style without the unsafe parts.</h1></div><span className="status">● {apiUrl ? "API connected" : "local preview"}</span></header>
        <div className="metrics">
          <article><strong>{queue.metrics.open}</strong><span>open reports</span><em className={queue.metrics.open ? "warn" : "ok"}>{queue.metrics.open ? "needs review" : "queue clear"}</em></article>
          <article><strong>{queue.metrics.reviewing}</strong><span>under review</span><em>target SLA &lt;24h</em></article>
          <article><strong>13+</strong><span>direct messaging</span><em className="ok">age gated</em></article>
          <article><strong>{STYLE_CATALOG.length}</strong><span>canonical styles</span><em>versioned ontology</em></article>
        </div>
        <div className="grid">
          <div className="panel queue">
            <div className="panelHead"><div><span className="eyebrow">Live queue</span><h2>Moderation reports</h2></div><code>{apiUrl ?? "API_URL missing"}</code></div>
            {queue.reports.length ? <div className="reportList">{queue.reports.slice(0, 8).map((report) => <article key={report.id}><div className={`reason reason-${report.reason.toLowerCase()}`}>{report.reason}</div><div><b>{report.targetType}</b><p>{report.details || "No additional details"}</p></div><time>{new Date(report.createdAt).toLocaleString("en")}</time><span className="state">{report.status}</span></article>)}</div> : <div className="empty"><i>✓</i><b>No reports waiting</b><span>New reports from posts, comments and messages appear here.</span></div>}
          </div>
          <div className="panel guardrails">
            <div className="panelHead"><div><span className="eyebrow">Release gates</span><h2>Safety controls</h2></div></div>
            {[['Under-13 open feed', 'OFF'], ['Under-13 direct chat', 'OFF'], ['Contact sharing under 16', 'FILTERED'], ['Image messages', 'OFF'], ['Public profile default', 'OFF'], ['OpenAI under-13 PII', 'BLOCKED']].map(([label, value]) => <div className="gate" key={label}><span>{label}</span><b>{value}</b></div>)}
          </div>
        </div>
        <div className="panel stylesPanel">
          <div className="panelHead"><div><span className="eyebrow">Style graph</span><h2>Current aesthetics</h2></div><code>v0.2</code></div>
          <div className="styles">{STYLE_CATALOG.slice(0, 12).map((style) => <div className="style" key={style.id}><div className="swatches">{style.palette.map((color) => <i key={color} style={{ background: color }} />)}</div><b>{style.names.en}</b><span>{style.names.ru}</span><small>{style.traits.slice(0, 3).join(" / ")}</small></div>)}</div>
        </div>
      </section>
    </main>
  );
}
