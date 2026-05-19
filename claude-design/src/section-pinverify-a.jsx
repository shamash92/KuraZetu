/* global React, DCSection, DCArtboard, DCPostIt, Phone, AppBar */
// Section 04 — PinVerify direction A: snap-to-known + walk-to-confirm.
// The "low cognitive load" direction. User searches by school name (not
// code), GPS pre-fills, app prompts user to physically walk to entrance,
// long-press to commit. Consensus shown only at the end.
//
// 5 screens · all Ramani · all data-brand=ramani.

/* ── Stylized satellite-ish map background ─────────────────────
   Drawn in SVG so we don't reference any third-party tile vendor.
   Roads in sand, building footprints in lifted forest, contour
   hatches behind everything. Read as "map" without pretending to
   be Google Maps. */
function MapBg({ children, zoom = 1 }) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#0a1518" }}>
      <svg viewBox="0 0 360 480" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
        {/* contour hatching */}
        <defs>
          <pattern id="contour" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform={`scale(${zoom})`}>
            <path d="M0 20 Q10 14 20 20 T40 20" fill="none" stroke="#162a2e" strokeWidth="0.8" />
            <path d="M0 40 Q10 34 20 40 T40 40" fill="none" stroke="#162a2e" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="360" height="480" fill="url(#contour)" />

        {/* building footprints (cluster around center) */}
        <g fill="#1a2f33" stroke="#243f44" strokeWidth="0.6">
          <rect x="120" y="180" width="36" height="24" rx="2" />
          <rect x="170" y="170" width="48" height="18" rx="2" />
          <rect x="160" y="200" width="60" height="30" rx="2" />
          <rect x="232" y="186" width="22" height="44" rx="2" />
          <rect x="100" y="220" width="44" height="20" rx="2" />
          <rect x="184" y="246" width="40" height="22" rx="2" />
          <rect x="60" y="240" width="30" height="14" rx="2" />
          <rect x="240" y="260" width="34" height="24" rx="2" />
          <rect x="280" y="140" width="20" height="14" rx="2" />
          <rect x="44" y="180" width="22" height="16" rx="2" />
        </g>

        {/* roads — sand-colored, gentle curves */}
        <g fill="none" stroke="#3a4f53" strokeWidth="2" strokeLinecap="round">
          <path d="M -10 200 Q 60 192 130 200 T 360 196" />
          <path d="M -10 280 Q 80 274 160 280 T 360 286" />
          <path d="M 80 -10 Q 88 60 84 130 T 92 380" />
          <path d="M 220 -10 Q 226 80 230 160 T 234 480" />
          <path d="M 300 -10 Q 304 120 312 220 T 316 480" />
        </g>
        {/* highlighted road */}
        <path d="M -10 240 Q 80 234 180 240 T 360 246"
          fill="none" stroke="#4a6065" strokeWidth="4" strokeLinecap="round" />

        {/* school polygon — slightly highlighted */}
        <path d="M 168 198 L 230 192 L 240 240 L 220 254 L 174 256 Z"
          fill="rgba(217,119,87,0.06)" stroke="rgba(217,119,87,0.4)" strokeWidth="1" strokeDasharray="3 2" />
      </svg>
      {children}
    </div>
  );
}

/* ── Reusable: header with back ───────────────────────────────── */
function ScreenHeader({ back = true, title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 12px", background: "var(--kz-bg)", borderBottom: "1px solid var(--kz-line)", color: "var(--kz-ink)" }}>
      {back && (
        <button style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: 0, color: "currentColor", display: "grid", placeItems: "center", cursor: "pointer", marginLeft: -8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.2 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", marginTop: 2, letterSpacing: 0.04 }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}
window.ScreenHeader = ScreenHeader;
window.MapBg = MapBg;

/* ── 1 · Task hub ──────────────────────────────────────────── */
function PVATaskHub() {
  const tasks = [
    { n: 5, title: "Near you", note: "Stations within walking distance", accent: "var(--kz-cand-1)" },
    { n: 23, title: "Your ward · Nanyuki", note: "Missing pins to map", accent: "var(--kz-cand-2)" },
    { n: 12, title: "Disputed", note: "Two pins more than 80m apart", accent: "var(--kz-cand-3)" },
  ];
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>

        {/* Greeting hero — full title at top of page */}
        <div style={{ padding: "24px 18px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: "var(--kz-accent)", fontWeight: 700, letterSpacing: 0.1, textTransform: "uppercase" }}>
              Mambo Wanjiku!
            </div>
            <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "var(--kz-ink-3)", padding: "4px 10px", border: "1px solid var(--kz-line)", borderRadius: 4, fontWeight: 600 }}>
              12 helped
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.05, color: "var(--kz-ink)", whiteSpace: "nowrap" }}>
            Help us pin the map.
          </div>
        </div>

        {/* Stat headline */}
        <div style={{ padding: "12px 18px 22px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div className="kz-mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.04, color: "var(--kz-ink)" }}>
              57<span style={{ color: "var(--kz-accent)" }}>%</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--kz-ink-2)", fontWeight: 500 }}>
              of 46,231 stations confirmed.
            </div>
          </div>
          <div style={{ height: 4, background: "var(--kz-bg-2)", borderRadius: 2, marginTop: 10, overflow: "hidden", border: "1px solid var(--kz-line)" }}>
            <div style={{ width: "57%", height: "100%", background: "var(--kz-accent)" }} />
          </div>
        </div>

        {/* Task rows — radically simplified */}
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column" }}>
          {tasks.map((t, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "20px 4px",
              borderTop: "1px solid var(--kz-line)",
              borderBottom: i === tasks.length - 1 ? "1px solid var(--kz-line)" : 0,
              cursor: "pointer",
            }}>
              <div className="kz-mono" style={{
                fontSize: 44, fontWeight: 700, color: t.accent,
                letterSpacing: -0.04, lineHeight: 0.9,
                width: 72, textAlign: "left",
              }}>{t.n}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--kz-ink)", letterSpacing: -0.2 }}>
                  {t.title}
                </div>
                <div style={{ fontSize: 12.5, color: "var(--kz-ink-3)", marginTop: 3 }}>
                  {t.note}
                </div>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--kz-ink-3)" strokeWidth="2" strokeLinecap="round" style={{ flex: "0 0 auto" }}><path d="M9 6l6 6-6 6"/></svg>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />
      </div>
    </Phone>
  );
}

/* ── 2 · Find station (search by name) ──────────────────────── */
function PVAFind() {
  const results = [
    { name: "Likii Primary School", code: "031164082006901", dist: "240 m", state: "verified" },
    { name: "Likii Secondary School", code: "031164082007302", dist: "310 m", state: "unverified" },
    { name: "Nanyuki Sports Ground", code: "031164082004105", dist: "1.2 km", state: "disputed" },
    { name: "Lariak Forest Center", code: "031164082008401", dist: "2.8 km", state: "no-pin" },
  ];
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Find your station" sub="Nanyuki · Laikipia East" />

        {/* Search input */}
        <div style={{ padding: "12px 14px 8px" }}>
          <div style={{ position: "relative" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--kz-ink-3)" }}><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>
            <input style={{
              width: "100%", height: 48,
              padding: "0 16px 0 40px",
              borderRadius: 12, border: "1.5px solid var(--kz-accent)",
              background: "var(--kz-bg-2)", color: "var(--kz-ink)",
              fontFamily: "inherit", fontSize: 15,
            }} value="Likii" readOnly />
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", letterSpacing: 0.04 }}>
              ⌫
            </span>
          </div>
          <div style={{ fontSize: 11, color: "var(--kz-ink-3)", marginTop: 6, lineHeight: 1.4, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--kz-success)" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="var(--kz-success)" stroke="none"/></svg>
            Sorted by distance · GPS ±6 m
          </div>
        </div>

        {/* Results */}
        <div style={{ padding: "8px 14px 0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {results.map((r, i) => {
              const states = {
                verified: ["var(--kz-success)", "Verified"],
                unverified: ["var(--kz-ink-3)", "Needs pin"],
                disputed: ["var(--kz-warn)", "Disputed"],
                "no-pin": ["var(--kz-danger)", "No pin"],
              };
              const [c, label] = states[r.state];
              return (
                <div key={i} style={{ background: i === 0 ? "var(--kz-bg-2)" : "transparent", border: "1px solid " + (i === 0 ? "var(--kz-accent)" : "var(--kz-line)"), borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>{r.dist}</div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, alignItems: "center" }}>
                    <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>{r.code}</div>
                    <span style={{ fontSize: 10, color: c, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.08 }}>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "12px 14px", borderTop: "1px solid var(--kz-line)" }}>
          <button className="kz-btn kz-btn--accent kz-btn--block" style={{ height: 52, borderRadius: 12, fontSize: 15 }}>
            Pick Likii Primary School →
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── 3 · Walking to station ───────────────────────────────── */
function PVAWalk() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column", position: "relative" }}>
        <ScreenHeader title="Walk to the entrance" sub="Likii Primary School · 031164082006901" />

        {/* Map view */}
        <div style={{ flex: 1, position: "relative" }}>
          <MapBg>
            {/* GPS dot (you) */}
            <div style={{ position: "absolute", left: 90, top: 290, transform: "translate(-50%, -50%)" }}>
              <div style={{ width: 120, height: 120, borderRadius: 60, background: "rgba(74,141,118,0.18)", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", animation: "pulse 2s ease-out infinite" }} />
              <div style={{ width: 60, height: 60, borderRadius: 30, background: "rgba(74,141,118,0.3)", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} />
              <div style={{ width: 18, height: 18, borderRadius: 9, background: "var(--kz-success)", boxShadow: "0 0 0 3px #0a1518", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} />
            </div>

            {/* Station marker */}
            <div style={{ position: "absolute", left: 200, top: 220, transform: "translate(-50%, -100%)" }}>
              <svg width="32" height="38" viewBox="0 0 32 38" fill="none">
                <path d="M16 0C7.2 0 0 6.8 0 15.2 0 26 16 38 16 38S32 26 32 15.2C32 6.8 24.8 0 16 0z" fill="var(--kz-accent)" />
                <circle cx="16" cy="15" r="6" fill="#0a1518" />
              </svg>
            </div>

            {/* distance line */}
            <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              <line x1="90" y1="290" x2="200" y2="220" stroke="var(--kz-accent)" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.7" />
            </svg>

            <div style={{ position: "absolute", top: 248, left: 110, padding: "4px 10px", background: "var(--kz-bg)", border: "1px solid var(--kz-accent)", borderRadius: 99, fontSize: 11, fontFamily: "IBM Plex Mono", color: "var(--kz-accent)", fontWeight: 600 }}>
              48 m
            </div>
          </MapBg>

          {/* Zoom controls */}
          <div style={{ position: "absolute", top: 14, right: 14, display: "flex", flexDirection: "column", gap: 6 }}>
            <button style={{ width: 36, height: 36, borderRadius: 10, background: "var(--kz-bg)", border: "1px solid var(--kz-line)", color: "var(--kz-ink)", fontSize: 18, fontFamily: "inherit", cursor: "pointer" }}>+</button>
            <button style={{ width: 36, height: 36, borderRadius: 10, background: "var(--kz-bg)", border: "1px solid var(--kz-line)", color: "var(--kz-ink)", fontSize: 18, fontFamily: "inherit", cursor: "pointer" }}>−</button>
            <button style={{ width: 36, height: 36, borderRadius: 10, background: "var(--kz-bg)", border: "1px solid var(--kz-line)", color: "var(--kz-success)", display: "grid", placeItems: "center", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" fill="currentColor"/><circle cx="12" cy="12" r="9"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3"/></svg>
            </button>
          </div>
        </div>

        {/* Bottom sheet — walking instructions */}
        <div style={{ background: "var(--kz-bg-2)", borderTop: "1px solid var(--kz-line)", padding: "16px 18px 14px", borderRadius: "20px 20px 0 0", margin: "-20px 0 0", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: "var(--kz-accent)", fontWeight: 700, letterSpacing: 0.08, textTransform: "uppercase", fontFamily: "IBM Plex Mono" }}>
              Step 2 of 3
            </div>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>
              GPS ±6 m
            </div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.2, marginBottom: 4 }}>
            You're 48 m away.
          </div>
          <div style={{ fontSize: 12.5, color: "var(--kz-ink-2)", lineHeight: 1.45 }}>
            Walk closer to the school. We'll unlock the confirm button when you're within 40 m — enough room for compounds with multiple streams.
          </div>

          <button style={{
            width: "100%", height: 52, marginTop: 12,
            borderRadius: 12, border: "1.5px solid var(--kz-line-strong)",
            background: "transparent", color: "var(--kz-ink-3)",
            fontFamily: "inherit", fontSize: 14, fontWeight: 600,
            cursor: "not-allowed", letterSpacing: -0.1,
          }} disabled>
            Confirm I'm at the station
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── 4 · At station — tap + explicit confirm ─────────────── */
function PVAConfirm() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column", position: "relative" }}>
        <ScreenHeader title="At the entrance" sub="Likii Primary School" />

        <div style={{ flex: 1, position: "relative" }}>
          <MapBg>
            {/* GPS dot — now overlapping building */}
            <div style={{ position: "absolute", left: 200, top: 220, transform: "translate(-50%, -50%)" }}>
              <div style={{ width: 90, height: 90, borderRadius: 45, background: "rgba(74,141,118,0.22)", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} />
              <div style={{ width: 22, height: 22, borderRadius: 11, background: "var(--kz-success)", boxShadow: "0 0 0 4px #0a1518", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} />
            </div>
            {/* Existing pin (the one being confirmed) */}
            <div style={{ position: "absolute", left: 212, top: 196, transform: "translate(-50%, -100%)" }}>
              <svg width="28" height="34" viewBox="0 0 32 38" fill="none">
                <path d="M16 0C7.2 0 0 6.8 0 15.2 0 26 16 38 16 38S32 26 32 15.2C32 6.8 24.8 0 16 0z" fill="var(--kz-accent)" />
                <circle cx="16" cy="15" r="5" fill="#0a1518" />
              </svg>
            </div>
          </MapBg>
        </div>

        {/* Tap then confirm */}
        <div style={{ background: "var(--kz-bg-2)", borderTop: "1px solid var(--kz-line)", padding: "18px 18px 16px", borderRadius: "20px 20px 0 0", margin: "-20px 0 0", position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: "var(--kz-success)", fontWeight: 700, letterSpacing: 0.08, textTransform: "uppercase", fontFamily: "IBM Plex Mono" }}>
              You're at the station · 12 m
            </div>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>
              GPS ±4 m
            </div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.1, marginBottom: 8 }}>
            Ready when you are. Confirm the pin?
          </div>
          <div style={{ fontSize: 12, color: "var(--kz-ink-2)", lineHeight: 1.45, marginBottom: 14 }}>
            Confirming saves this pin to the public record. A second tap protects against accidents.
          </div>

          {/* Pressable button — show pressed state mid-fill */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button style={{ flex: 1, height: 56, borderRadius: 12, border: "1.5px solid var(--kz-line-strong)", background: "transparent", color: "var(--kz-ink)", fontFamily: "inherit", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              Wait — not yet
            </button>
            <button style={{ flex: 1.6, height: 56, borderRadius: 12, border: 0, background: "var(--kz-accent)", color: "var(--kz-accent-ink)", fontFamily: "inherit", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 24px rgba(217,119,87,0.3)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Yes, save the pin</span>
            </button>
          </div>

          <button style={{ background: "transparent", border: 0, color: "var(--kz-ink-2)", fontSize: 12.5, fontFamily: "inherit", cursor: "pointer", textDecoration: "underline" }}>
            Wrong place? Let us know.
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── 5 · Confirmed + consensus visualization ──────────────── */
function PVAReceipt() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Pin confirmed" sub="Asante — added to your contributions" />

        {/* Big pin visualization */}
        <div style={{ flex: 1, position: "relative", padding: "16px 14px 0" }}>
          <div style={{ background: "var(--kz-bg-2)", borderRadius: 16, padding: 16, position: "relative", height: 280, overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0 }}>
              <MapBg zoom={1.6} />
            </div>

            {/* Consensus cloud — many small dots around the centroid */}
            <div style={{ position: "absolute", inset: 0 }}>
              {[
                [186, 132, 0.4], [196, 144, 0.6], [180, 152, 0.45], [202, 156, 0.5],
                [188, 168, 0.55], [212, 168, 0.42], [194, 178, 0.7], [206, 180, 0.4],
                [184, 188, 0.5], [218, 192, 0.55], [198, 200, 0.6],
              ].map(([x, y, op], i) => (
                <div key={i} style={{ position: "absolute", left: x, top: y, width: 7, height: 7, borderRadius: 4, background: `rgba(217,119,87,${op})` }} />
              ))}
              {/* My pin — highlighted */}
              <div style={{ position: "absolute", left: 200 - 14, top: 174 - 30 }}>
                <svg width="28" height="34" viewBox="0 0 32 38" fill="none">
                  <path d="M16 0C7.2 0 0 6.8 0 15.2 0 26 16 38 16 38S32 26 32 15.2C32 6.8 24.8 0 16 0z" fill="var(--kz-success)" />
                  <circle cx="16" cy="15" r="5" fill="#0a1518" />
                </svg>
              </div>
            </div>

            {/* Inline legend */}
            <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, padding: "8px 10px", background: "rgba(13,28,31,0.94)", border: "1px solid var(--kz-line)", borderRadius: 8, display: "flex", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: 5, background: "var(--kz-success)" }} />
                <span style={{ fontSize: 10.5, color: "var(--kz-ink)" }}>Your pin</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: 5, background: "var(--kz-accent)", opacity: 0.6 }} />
                <span style={{ fontSize: 10.5, color: "var(--kz-ink)" }}>Other contributors · 11</span>
              </div>
            </div>
          </div>

          {/* Receipt card */}
          <div style={{ background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 14, padding: "14px 14px", marginTop: 12 }}>
            <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, marginBottom: 4 }}>
              Local receipt
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>Likii Primary School</div>
            <div style={{ fontSize: 11, color: "var(--kz-ink-2)", fontFamily: "IBM Plex Mono" }}>
              ‐1.04081, 36.96412 · ±4 m · 21:34 EAT
            </div>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", marginTop: 4 }}>
              sha · 8b3e9f…2c4a · @n   m
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, padding: "12px 14px", borderTop: "1px solid var(--kz-line)" }}>
          <button className="kz-btn kz-btn--ghost" style={{ flex: 1, height: 50 }}>
            Done
          </button>
          <button className="kz-btn kz-btn--accent" style={{ flex: 1.4, height: 50 }}>
            Pin another nearby
          </button>
        </div>
      </div>
    </Phone>
  );
}

function PinVerifyASection() {
  return (
    <DCSection id="04-pinverify-a" title="PinVerify · Direction A · Snap-to-known + walk-to-confirm"
      subtitle="Search-by-name (no codes), GPS pre-fill, 40 m walk-to-station gating, tap + explicit confirm, landmark fallback when GPS is poor.">
      <DCArtboard id="hub" label="1 · Task hub" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><PVATaskHub /></div>
      </DCArtboard>
      <DCArtboard id="find" label="2 · Find station" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><PVAFind /></div>
      </DCArtboard>
      <DCArtboard id="walk" label="3 · Walk to entrance" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><PVAWalk /></div>
      </DCArtboard>
      <DCArtboard id="confirm" label="4 · Tap + confirm" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><PVAConfirm /></div>
      </DCArtboard>
      <DCArtboard id="receipt" label="5 · Consensus + receipt" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><PVAReceipt /></div>
      </DCArtboard>

      <DCPostIt top={-12} right={60} rotate={2} width={250}>
        <b>Direction A — lower cognitive load.</b> Search-by-name not code. 40 m radius (compound-friendly). Tap + explicit confirm replaces hold-to-commit (discoverable). Landmark fallback when GPS is poor. Consensus shown only after submit so it doesn't anchor your judgment.
      </DCPostIt>
    </DCSection>
  );
}

window.PinVerifyASection = PinVerifyASection;
