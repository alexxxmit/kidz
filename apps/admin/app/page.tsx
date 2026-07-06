import { STYLE_CATALOG } from "@kidz/domain";

const apiUrl = process.env.API_URL ?? "Not configured";

export default function Dashboard() {
  return (
    <main>
      <aside>
        <div>
          <div className="mark">KIDZ/OPS</div>
          <p>Style system and operational health.</p>
        </div>
        <div className="rail"><i /><i /><i /><i /></div>
        <small>INTERNAL · STAGING</small>
      </aside>
      <section>
        <header>
          <div><span className="eyebrow">System overview</span><h1>The wardrobe has structure.</h1></div>
          <span className="status">● configuration</span>
        </header>
        <div className="metrics">
          <article><strong>{STYLE_CATALOG.length}</strong><span>canonical styles</span></article>
          <article><strong>2</strong><span>locales online</span></article>
          <article><strong>0–18</strong><span>adaptive age range</span></article>
        </div>
        <div className="panel">
          <div className="panelHead"><h2>Style graph · v0.1</h2><code>{apiUrl}</code></div>
          <div className="styles">
            {STYLE_CATALOG.map((style) => (
              <div className="style" key={style.id}>
                <div className="swatches">{style.palette.map((color) => <i key={color} style={{ background: color }} />)}</div>
                <b>{style.names.en}</b><span>{style.names.ru}</span><small>{style.traits.join(" / ")}</small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
