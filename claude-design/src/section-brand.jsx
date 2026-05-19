/* global React, DCSection, DCArtboard, DCPostIt, Phone */
// Section 01 — Brand direction · Ramani (chosen).
// Six artboards establishing the world: spec, country map, county
// drill-in, station detail, list-view (proves it works off-map),
// dark-mode/map-night.

/* ── Kenya hex-grid (47 county abstraction) ─────────────────── */
// Manual axial layout — close enough to the country's silhouette
// to read as Kenya without pretending to be a cartographic map.
const KENYA_HEXES = [
  // top — north tier
  [3, 0, "Trk", 1],
  [4, 0, "Mar", 1],
  [5, 0, "Mnd", 3],
  // row 1
  [2, 1, "WPo", 2], [3, 1, "Sam", 2], [4, 1, "Isi", 1], [5, 1, "Wjr", 3],
  // row 2 — widest middle
  [1, 2, "TrN"], [2, 2, "UGi", 2], [3, 2, "Bgo", 2], [4, 2, "Lkp", 1], [5, 2, "Mru", 1], [6, 2, "Grs", 3],
  // row 3
  [1, 3, "Bgm", 2], [2, 3, "Nnd", 2], [3, 3, "Nku", 2], [4, 3, "Nyd", 1], [5, 3, "Emb", 1], [6, 3, "Ktu", 0],
  // row 4
  [0, 4, "Bsi", 2], [1, 4, "Kkg", 2], [2, 4, "Vhg", 2], [3, 4, "Ksu", 2], [4, 4, "Krc", 2], [5, 4, "Mks", 0],
  // row 5
  [1, 5, "Mig", 2], [2, 5, "Ksi", 2], [3, 5, "Nyr", 2], [4, 5, "Bmt", 2], [5, 5, "Nrk", 2],
  // row 6 — south
  [3, 6, "Kjd", 0], [4, 6, "Mku", 0], [5, 6, "Tav", 0],
  // coast strip
  [6, 6, "Klf", 3], [7, 6, "Tan", 3],
  [7, 7, "Mbs", 3], [7, 5, "Lam", 3], [6, 5, "Kwl", 3],
  // capital cluster
  [4, 4.5, "Nai", 2],
];

function Hex({ x, y, label, leader, selected, size = 22 }) {
  const colors = ["var(--kz-cand-other)", "var(--kz-cand-1)", "var(--kz-cand-2)", "var(--kz-cand-3)"];
  const fill = leader == null ? "var(--kz-no-data)" : colors[leader];
  const w = size * 1.732;
  const h = size * 2;
  const points = [
    [w / 2, 0],
    [w, h / 4],
    [w, (3 * h) / 4],
    [w / 2, h],
    [0, (3 * h) / 4],
    [0, h / 4],
  ].map((p) => p.join(",")).join(" ");
  return (
    <g transform={`translate(${x}, ${y})`}>
      <polygon points={points} fill={fill} />
      {selected && (
        <polygon points={points} fill="none" stroke="#f3ecd8" strokeWidth="1.6" />
      )}
      <text x={w / 2} y={h / 2 + 4} textAnchor="middle"
        fontSize={leader == null ? 7 : 8}
        fontFamily="IBM Plex Mono, monospace"
        fontWeight="600"
        fill={leader === 0 || leader == null ? "#a8b0b4" : "rgba(13,28,31,0.85)"}>
        {label}
      </text>
    </g>
  );
}

function KenyaHexMap({ selected = "Lkp" }) {
  const cellW = 38;
  const cellH = 44;
  const xs = KENYA_HEXES.map(([c]) => c);
  const ys = KENYA_HEXES.map(([, r]) => r);
  const cols = Math.max(...xs) + 1;
  const rows = Math.max(...ys) + 1;
  const w = cols * cellW + 60;
  const h = rows * cellH + 30;
  return (
    <svg viewBox={`-20 -10 ${w} ${h}`} width="100%" height="100%" style={{ display: "block" }}>
      {KENYA_HEXES.map(([col, row, label, leader], i) => {
        const x = col * cellW + (row % 2 ? cellW / 2 : 0);
        const y = row * cellH;
        return <Hex key={i} x={x} y={y} label={label} leader={leader} selected={label === selected} />;
      })}
    </svg>
  );
}

window.KenyaHexMap = KenyaHexMap;
window.Hex = Hex;
window.KENYA_HEXES = KENYA_HEXES;

/* ── Spec board ─────────────────────────────────────────────── */
function RamaniSpec() {
  return (
    <div style={{ background: "var(--kz-bg)", color: "var(--kz-ink)", height: "100%", padding: "26px 24px", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.14, fontWeight: 700 }}>
        Brand · chosen
      </div>
      <div style={{ fontSize: 60, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 0.9, margin: "6px 0 4px" }}>
        Ramani.
      </div>
      <div style={{ fontSize: 14, color: "var(--kz-ink-2)", lineHeight: 1.4, marginBottom: 14 }}>
        Map-first. The country IS the dashboard. Data lives on the land.
      </div>

      <div style={{ background: "var(--kz-bg-2)", borderRadius: 14, padding: 12, marginBottom: 14, height: 200 }}>
        <KenyaHexMap selected="Nai" />
      </div>

      <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700, marginBottom: 6 }}>
        Palette
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[
          ["forest", "var(--kz-bg)"],
          ["sand", "var(--kz-ink)"],
          ["cand 1", "var(--kz-cand-1)"],
          ["cand 2", "var(--kz-cand-2)"],
          ["cand 3", "var(--kz-cand-3)"],
        ].map(([k, c], i) => (
          <div key={i} style={{ flex: 1, height: 38, borderRadius: 8, background: c, display: "grid", placeItems: "end center", padding: "0 0 4px", fontSize: 9, fontFamily: "IBM Plex Mono", color: i === 0 ? "#a8b0b4" : "#0d1c1f", border: i === 0 ? "1px solid var(--kz-line)" : "none" }}>
            {k}
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ fontSize: 12.5, color: "var(--kz-ink-2)", lineHeight: 1.55 }}>
        {[
          ["Surface", "Forest-deep app bg. Sand reserved for highlight callouts."],
          ["Geography", "47-hex abstraction of counties. Tap to drill."],
          ["Type", "Public Sans for UI, IBM Plex Mono for codes/tallies/coords."],
          ["Voice", "Curious, exploratory. 'Show me my county.'"],
        ].map(([k, v], i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "5px 0", borderBottom: i < 3 ? "1px solid var(--kz-line)" : "none" }}>
            <div style={{ width: 86, fontSize: 10.5, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 700 }}>{k}</div>
            <div style={{ flex: 1, color: "var(--kz-ink-2)" }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Country map ────────────────────────────────────────────── */
function RamaniMap() {
  return (
    <Phone dark>
      <div style={{ background: "var(--kz-bg)", flex: 1, display: "flex", flexDirection: "column", color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui" }}>
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--kz-line)" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", letterSpacing: 0.1, textTransform: "uppercase" }}>President · Aug 2027</div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2, marginTop: 2 }}>Kenya</div>
          </div>
          <div style={{ display: "flex", gap: 6, fontSize: 10, fontFamily: "IBM Plex Mono" }}>
            <div style={{ padding: "4px 8px", border: "1px solid var(--kz-cand-1)", color: "var(--kz-cand-1)", borderRadius: 99, fontWeight: 600 }}>Pres</div>
            <div style={{ padding: "4px 8px", border: "1px solid var(--kz-line)", color: "var(--kz-ink-3)", borderRadius: 99 }}>Gov</div>
            <div style={{ padding: "4px 8px", border: "1px solid var(--kz-line)", color: "var(--kz-ink-3)", borderRadius: 99 }}>MP</div>
          </div>
        </div>

        <div style={{ flex: 1, position: "relative", padding: "10px 14px 0" }}>
          <KenyaHexMap selected="Lkp" />
          {/* Callout */}
          <div style={{ position: "absolute", top: 70, right: 40, background: "var(--kz-surface-light)", color: "var(--kz-ink-on-light)", padding: "8px 12px", borderRadius: 10, fontSize: 11, fontWeight: 600, boxShadow: "0 8px 20px rgba(0,0,0,0.4)", lineHeight: 1.3, transform: "translateX(8px)" }}>
            <div style={{ fontSize: 9, color: "rgba(13,28,31,0.6)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700 }}>Laikipia</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>LONGOGGY <span className="kz-mono">52.1%</span></div>
            <div style={{ position: "absolute", bottom: -5, left: 14, width: 10, height: 10, background: "var(--kz-surface-light)", transform: "rotate(45deg)" }} />
          </div>
          {/* Legend */}
          <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, padding: "10px 12px", background: "rgba(20,37,41,0.94)", borderRadius: 10, border: "1px solid var(--kz-line)", backdropFilter: "blur(8px)" }}>
            <div style={{ fontSize: 9.5, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700, marginBottom: 6 }}>Leading by county</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                ["LONGOGGY", "var(--kz-cand-1)", "9"],
                ["UHURU", "var(--kz-cand-2)", "21"],
                ["RAILA", "var(--kz-cand-3)", "7"],
                ["No data", "var(--kz-no-data)", "10"],
              ].map(([n, c, ct]) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 12, background: c, borderRadius: 3 }} />
                  <span style={{ fontSize: 11, color: "var(--kz-ink)", fontWeight: 600 }}>{n}</span>
                  <span style={{ fontSize: 10, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>{ct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "8px 16px", borderTop: "1px solid var(--kz-line)", background: "var(--kz-bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono", color: "var(--kz-warn)", letterSpacing: 0.1, textTransform: "uppercase", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            Citizen tally · Not IEBC
          </div>
          <div style={{ fontSize: 10, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>68.8% reporting</div>
        </div>
      </div>
    </Phone>
  );
}

/* ── County drill ───────────────────────────────────────────── */
function RamaniDrill() {
  return (
    <Phone dark>
      <div style={{ background: "var(--kz-bg)", flex: 1, display: "flex", flexDirection: "column", color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui" }}>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid var(--kz-line)" }}>
          <button style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: 0, color: "var(--kz-ink)", display: "grid", placeItems: "center", cursor: "pointer", marginLeft: -6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", letterSpacing: 0.08, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
            <span>Kenya</span>
            <span>›</span>
            <span style={{ color: "var(--kz-ink)" }}>Laikipia</span>
          </div>
        </div>

        <div style={{ padding: "16px 20px 12px" }}>
          <div style={{ fontSize: 11, color: "var(--kz-cand-1)", fontFamily: "IBM Plex Mono", letterSpacing: 0.1, textTransform: "uppercase", fontWeight: 700, marginBottom: 12 }}>
            Laikipia · leading
          </div>
          <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.0 }}>
            J. E. LONGOGGY
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 12 }}>
            <div style={{ fontFamily: "IBM Plex Mono", fontSize: 38, fontWeight: 700, letterSpacing: "-0.04em", color: "var(--kz-cand-1)", lineHeight: 1 }}>52.1%</div>
            <div style={{ textAlign: "right" }}>
              <div className="kz-mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--kz-ink)", letterSpacing: -0.02 }}>184,322</div>
              <div style={{ fontSize: 11, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", marginTop: 2 }}>votes · of 354,012</div>
            </div>
          </div>
        </div>

        <div style={{ padding: "0 16px 14px" }}>
          <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700, marginBottom: 8 }}>
            Constituencies · 5
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              ["Laikipia East", "LONGOGGY", "58.4%", "var(--kz-cand-1)", 312, 332],
              ["Laikipia West", "LONGOGGY", "61.2%", "var(--kz-cand-1)", 401, 412],
              ["Laikipia North", "UHURU", "48.9%", "var(--kz-cand-2)", 198, 245],
              ["Laikipia Central", "LONGOGGY", "44.1%", "var(--kz-cand-1)", 220, 256],
              ["Nyahururu", "—", "—", "var(--kz-no-data)", 0, 312],
            ].map(([name, lead, pct, col, done, total]) => (
              <div key={name} style={{ background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 12, padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: col }} />
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                  </div>
                  <div style={{ fontFamily: "IBM Plex Mono", fontSize: 13, fontWeight: 700, color: col }}>{pct}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>{lead}</div>
                  <div style={{ fontSize: 10.5, color: done === 0 ? "var(--kz-warn)" : "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>
                    {done === 0 ? "0 / " + total + " · not reporting" : done + " / " + total + " stations"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--kz-line)", display: "flex", alignItems: "center", gap: 12, background: "var(--kz-bg-2)" }}>
          <div style={{ width: 56, height: 56, background: "var(--kz-bg)", borderRadius: 8, padding: 6 }}>
            <KenyaHexMap selected="Lkp" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 700 }}>You're zoomed into</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>Laikipia · Rift Valley</div>
          </div>
          <button style={{ background: "var(--kz-accent)", color: "var(--kz-accent-ink)", border: 0, padding: "8px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            Zoom out
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── Station detail (proves Ramani works for individual records) ── */
function RamaniStation() {
  return (
    <Phone dark>
      <div style={{ background: "var(--kz-bg)", flex: 1, display: "flex", flexDirection: "column", color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui" }}>
        <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid var(--kz-line)" }}>
          <button style={{ width: 32, height: 32, borderRadius: 8, background: "transparent", border: 0, color: "var(--kz-ink)", display: "grid", placeItems: "center", cursor: "pointer", marginLeft: -6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", letterSpacing: 0.08, textTransform: "uppercase" }}>Kenya › Laikipia › Laikipia East</div>
          </div>
        </div>

        {/* Station header */}
        <div style={{ padding: "16px 20px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="kz-badge kz-badge--community" style={{ height: 22, padding: "0 9px", fontSize: 10.5, fontWeight: 700, background: "var(--kz-success-soft)", color: "var(--kz-success)", letterSpacing: 0.04 }}>Community-verified</span>
            <span style={{ fontSize: 10.5, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>3 submissions match</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.1 }}>
            Likii Primary School
          </div>
          <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "var(--kz-ink-3)", marginTop: 4 }}>
            031164082006901 · STR 1 · 577 voters
          </div>
        </div>

        {/* Vote rows */}
        <div style={{ margin: "0 16px", borderRadius: 14, background: "var(--kz-surface)", border: "1px solid var(--kz-line)", overflow: "hidden" }}>
          {[
            ["LONGOGGY, J. E.", "Thirdway Alliance", 236, "var(--kz-cand-1)"],
            ["UHURU, M.", "Jubilee Party", 188, "var(--kz-cand-2)"],
            ["RAILA, A.", "ODM", 94, "var(--kz-cand-3)"],
            ["KAVINGA, J.", "Independent", 12, "var(--kz-cand-other)"],
            ["Rejected ballots", "", 3, "var(--kz-ink-3)"],
          ].map(([name, party, votes, col], i, arr) => {
            const total = 236 + 188 + 94 + 12;
            const pct = typeof votes === "number" && i < 4 ? (votes / total) * 100 : 0;
            return (
              <div key={i} style={{ padding: "10px 14px", borderBottom: i < arr.length - 1 ? "1px solid var(--kz-line)" : 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{ width: 4, height: 18, background: col, borderRadius: 2, flex: "0 0 auto" }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--kz-ink)" }}>{name}</div>
                      {party && <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)" }}>{party}</div>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="kz-mono" style={{ fontSize: 16, fontWeight: 700, color: "var(--kz-ink)" }}>{votes}</div>
                    {i < 4 && <div className="kz-mono" style={{ fontSize: 10, color: "var(--kz-ink-3)" }}>{pct.toFixed(1)}%</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Form 34A receipt */}
        <div style={{ margin: "14px 16px 0", padding: "12px 14px", background: "var(--kz-bg-2)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 50, background: "repeating-linear-gradient(0deg, var(--kz-line), var(--kz-line) 2px, var(--kz-bg) 2px, var(--kz-bg) 5px)", borderRadius: 4, flex: "0 0 auto" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--kz-ink)" }}>Form 34A · 2 pages · captured Aug 9 21:34</div>
            <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono", color: "var(--kz-ink-3)", marginTop: 2 }}>sha256 · a4f1c7…d09b · by @n   m</div>
          </div>
          <button style={{ background: "transparent", border: "1px solid var(--kz-line-strong)", color: "var(--kz-ink)", padding: "6px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            View
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Disclaimer */}
        <div style={{ padding: "8px 16px", borderTop: "1px solid var(--kz-line)", background: "var(--kz-bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono", color: "var(--kz-warn)", letterSpacing: 0.1, textTransform: "uppercase", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            Citizen tally · Not IEBC
          </div>
          <button style={{ background: "transparent", border: 0, color: "var(--kz-ink-3)", fontSize: 10.5, fontFamily: "IBM Plex Mono", cursor: "pointer" }}>Report…</button>
        </div>
      </div>
    </Phone>
  );
}

function BrandSection() {
  return (
    <DCSection id="01-brand" title="Brand · Ramani" subtitle="Locked. v1 of the brand exploration is archived in brand-archive-v1.html.">
      <DCArtboard id="ramani-spec" label="Spec" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}>
          <RamaniSpec />
        </div>
      </DCArtboard>
      <DCArtboard id="ramani-map" label="Country map" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}>
          <RamaniMap />
        </div>
      </DCArtboard>
      <DCArtboard id="ramani-drill" label="County drill" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}>
          <RamaniDrill />
        </div>
      </DCArtboard>
      <DCArtboard id="ramani-station" label="Station detail" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}>
          <RamaniStation />
        </div>
      </DCArtboard>

      <DCPostIt top={-12} right={60} rotate={2} width={230}>
        Ramani chosen. The country is the dashboard — geography first, lists second. Earth-tone candidate territory palette is mapped to the cartographic data layer; UI accent (terracotta) echoes leading candidate.
      </DCPostIt>
    </DCSection>
  );
}

window.BrandSection = BrandSection;
