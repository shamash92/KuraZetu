/* global React, DCSection, DCArtboard, DCPostIt, Phone, ScreenHeader, MapBg */
// Section 06 — Form 34A capture. The heart of the product.
// Required order: location → camera → OCR → review → receipt.
// 8 screens including offline-queued and a torn-form edge case.

/* ── 1 · Why we need location (calm permission ask) ─────── */
function F1Location() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Submit a Form 34A" sub="Step 1 of 4 · Confirm location" />

        <div style={{ padding: "24px 22px 0", flex: 1, display: "flex", flexDirection: "column" }}>
          {/* visual */}
          <div style={{ height: 180, position: "relative", borderRadius: 14, overflow: "hidden", background: "var(--kz-bg-2)" }}>
            <MapBg />
            {/* pulse */}
            <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}>
              <div style={{ width: 90, height: 90, borderRadius: 45, background: "rgba(74,141,118,0.18)" }} />
              <div style={{ width: 22, height: 22, borderRadius: 11, background: "var(--kz-success)", boxShadow: "0 0 0 4px #0a1518", position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} />
            </div>
          </div>

          <div style={{ marginTop: 22 }}>
            <div style={{ fontSize: 11, color: "var(--kz-accent)", fontWeight: 700, letterSpacing: 0.1, textTransform: "uppercase", marginBottom: 6 }}>
              Why we ask
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.15 }}>
              We need to know which station's form this is — before you photograph it.
            </div>
            <div style={{ fontSize: 13, color: "var(--kz-ink-2)", lineHeight: 1.55, marginTop: 10 }}>
              Your GPS coordinates are sent <b style={{ color: "var(--kz-ink)" }}>once</b>, when you press capture, to confirm you're physically at the station. We never track you.
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            {[
              ["Captured once", "Only at the moment of capture, not after."],
              ["Never sold", "Open-source pledge — see /privacy."],
              ["Manual fallback", "Refused permission? Submit, but the entry is flagged as lower-trust."],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--kz-line)" }}>
                <div style={{ width: 6, height: 6, borderRadius: 1, background: "var(--kz-accent)", marginTop: 6, flex: "0 0 auto" }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--kz-ink)" }}>{k}</div>
                  <div style={{ fontSize: 11.5, color: "var(--kz-ink-2)", lineHeight: 1.45, marginTop: 1 }}>{v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="kz-btn kz-btn--accent kz-btn--block" style={{ height: 54, borderRadius: 10, fontSize: 15 }}>
            Allow location, just once
          </button>
          <button style={{ height: 44, background: "transparent", border: 0, color: "var(--kz-ink-2)", fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>
            Submit without location (will be flagged)
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── 2 · Camera capture with guides + torch ──────────────── */
function F2Capture() {
  return (
    <Phone dark>
      <div style={{ background: "#000", flex: 1, color: "#f3ecd8", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* faux camera scene — paper on dark surface */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <svg viewBox="0 0 360 640" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0 }}>
            <defs>
              <linearGradient id="papergrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#e8dec3" />
                <stop offset="1" stopColor="#cdbf99" />
              </linearGradient>
              <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill="#2a2722" />
                <circle cx="3" cy="3" r="0.5" fill="#1c1a16" />
              </pattern>
            </defs>
            <rect width="360" height="640" fill="url(#hatch)" />
            {/* paper, slightly skewed */}
            <g transform="translate(50, 130) rotate(-3)">
              <rect width="260" height="380" fill="url(#papergrad)" rx="2" />
              {/* faux header */}
              <rect x="14" y="14" width="232" height="14" fill="#3a342b" />
              <rect x="14" y="34" width="170" height="6" fill="#3a342b" opacity="0.7" />
              <rect x="14" y="44" width="120" height="6" fill="#3a342b" opacity="0.5" />
              {/* table */}
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <g key={i} transform={`translate(14, ${72 + i * 32})`}>
                  <rect width="232" height="24" fill="none" stroke="#3a342b" strokeWidth="0.8" />
                  <rect x="6" y="6" width="100" height="6" fill="#3a342b" opacity="0.7" />
                  <rect x="160" y="6" width="50" height="6" fill="#3a342b" />
                </g>
              ))}
              {/* signature */}
              <rect x="14" y="320" width="100" height="20" fill="none" stroke="#3a342b" strokeWidth="0.6" />
              <path d="M22 332 Q40 322 55 332 T 100 330" stroke="#1a1a16" fill="none" strokeWidth="1.2" />
            </g>
          </svg>
        </div>

        {/* viewfinder overlay */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* dim corners */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 60%, rgba(0,0,0,0.55) 100%)" }} />

          {/* corner brackets — large */}
          {[
            { top: 110, left: 26, rotate: 0 },
            { top: 110, right: 26, rotate: 90 },
            { bottom: 130, right: 26, rotate: 180 },
            { bottom: 130, left: 26, rotate: 270 },
          ].map((p, i) => (
            <div key={i} style={{ position: "absolute", top: p.top, bottom: p.bottom, left: p.left, right: p.right, width: 28, height: 28, transform: `rotate(${p.rotate}deg)` }}>
              <div style={{ width: 28, height: 3, background: "var(--kz-accent)" }} />
              <div style={{ width: 3, height: 28, background: "var(--kz-accent)" }} />
            </div>
          ))}
        </div>

        {/* TOP bar */}
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#f3ecd8", zIndex: 2 }}>
          <button style={{ width: 36, height: 36, borderRadius: 18, background: "rgba(0,0,0,0.5)", border: 0, color: "#fff", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
          <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "#f3ecd8", letterSpacing: 0.08, textTransform: "uppercase" }}>
            Page 1 of 2 · 12.3 MP
          </div>
          <button style={{ width: 36, height: 36, borderRadius: 18, background: "var(--kz-accent)", border: 0, color: "#0d1c1f", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 3l1 4M12 21l1-4M21 12l-4-1M3 12l4 1M5 5l3 3M19 5l-3 3M5 19l3-3M19 19l-3-3"/></svg>
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* Tip */}
        <div style={{ margin: "0 16px 12px", padding: "10px 14px", background: "rgba(13,28,31,0.85)", color: "#f3ecd8", borderRadius: 10, fontSize: 12, fontWeight: 500, lineHeight: 1.45, backdropFilter: "blur(10px)", zIndex: 2, display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--kz-success)" strokeWidth="2" strokeLinecap="round"><path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <span>Looks clear. Hold steady for sharper text.</span>
        </div>

        {/* Capture row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 32px 28px", zIndex: 2 }}>
          {/* Last page thumb */}
          <div style={{ width: 48, height: 56, borderRadius: 6, border: "1.5px solid #f3ecd8", background: "repeating-linear-gradient(0deg, #cdbf99 0, #cdbf99 2px, #e8dec3 2px, #e8dec3 6px)", position: "relative" }}>
            <div style={{ position: "absolute", top: -4, right: -6, width: 18, height: 18, borderRadius: 9, background: "var(--kz-success)", color: "#0a1518", fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center", fontFamily: "IBM Plex Mono" }}>1</div>
          </div>

          {/* Big shutter */}
          <button style={{ width: 78, height: 78, borderRadius: 39, background: "var(--kz-accent)", border: "5px solid #f3ecd8", boxShadow: "0 0 0 4px rgba(217,119,87,0.25)", cursor: "pointer" }} />

          {/* Done button */}
          <button style={{ width: 60, height: 56, borderRadius: 8, background: "rgba(243,236,216,0.1)", border: "1px solid rgba(243,236,216,0.3)", color: "#f3ecd8", fontSize: 11, fontWeight: 700, letterSpacing: 0.08, textTransform: "uppercase", fontFamily: "IBM Plex Mono", cursor: "pointer" }}>
            Done
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── 3 · Blur retake (edge case) ─────────────────────────── */
function F3Retake() {
  return (
    <Phone dark>
      <div style={{ background: "#000", flex: 1, color: "#f3ecd8", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* Faux blurry paper */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", filter: "blur(3px)" }}>
          <svg viewBox="0 0 360 640" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
            <rect width="360" height="640" fill="#1a1a18" />
            <g transform="translate(50, 130) rotate(-3)">
              <rect width="260" height="380" fill="#cdbf99" />
              <rect x="14" y="14" width="232" height="14" fill="#3a342b" />
              <rect x="14" y="34" width="170" height="6" fill="#3a342b" opacity="0.7" />
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={i} transform={`translate(14, ${72 + i * 32})`}>
                  <rect width="232" height="24" fill="none" stroke="#3a342b" strokeWidth="0.8" />
                </g>
              ))}
            </g>
          </svg>
        </div>

        {/* Red overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(214,84,84,0.18)", pointerEvents: "none" }} />

        <div style={{ flex: 1 }} />

        {/* Bottom sheet */}
        <div style={{ background: "var(--kz-bg)", borderTop: "1px solid var(--kz-line)", borderRadius: "16px 16px 0 0", padding: "18px 18px 14px", zIndex: 2 }}>
          <div style={{ fontSize: 11, color: "var(--kz-danger)", fontWeight: 700, letterSpacing: 0.1, textTransform: "uppercase", fontFamily: "IBM Plex Mono", marginBottom: 6 }}>
            Photo too blurry
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.2, letterSpacing: -0.2 }}>
            We can't read the tallies. Let's try again.
          </div>
          <div style={{ fontSize: 12.5, color: "var(--kz-ink-2)", lineHeight: 1.5, marginTop: 8 }}>
            Try moving your phone closer. Make sure the paper is flat and well-lit. Turn on the torch if it's after sunset.
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="kz-btn kz-btn--ghost" style={{ flex: 1, height: 50, borderRadius: 10 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ marginRight: 6 }}><path d="M5 12a7 7 0 0114 0M19 12v-3M19 12l2 2M19 12l-2 2"/></svg>
              Use it anyway
            </button>
            <button className="kz-btn kz-btn--accent" style={{ flex: 1.4, height: 50, borderRadius: 10 }}>
              Retake page 1
            </button>
          </div>
        </div>
      </div>
    </Phone>
  );
}

/* ── 4 · OCR preview — confirm or edit ───────────────────── */
function F4OCR() {
  const rows = [
    ["LONGOGGY, J. E.", "Thirdway Alliance", 236, "high"],
    ["UHURU, M.", "Jubilee Party", 188, "high"],
    ["RAILA, A.", "ODM", 94, "high"],
    ["KAVINGA, J.", "Independent", 12, "high"],
    ["WAINAINA, M.", "Independent", 0, "mid"],
    ["Rejected ballots", "", 3, "high"],
  ];
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Confirm the tallies" sub="Step 3 of 4 · OCR · Likii Primary · Stream 1" />

        {/* Faux scan thumb strip */}
        <div style={{ display: "flex", gap: 8, padding: "12px 14px", overflowX: "auto" }}>
          {[1, 2].map((p) => (
            <div key={p} style={{ width: 64, height: 84, borderRadius: 6, background: "repeating-linear-gradient(0deg, #2a2722 0, #2a2722 2px, #cdbf99 2px, #cdbf99 6px)", position: "relative", flex: "0 0 auto", border: "1px solid var(--kz-line)" }}>
              <div style={{ position: "absolute", top: -4, right: -4, width: 18, height: 18, borderRadius: 9, background: "var(--kz-success)", color: "#0a1518", fontSize: 11, fontWeight: 700, display: "grid", placeItems: "center", fontFamily: "IBM Plex Mono" }}>{p}</div>
            </div>
          ))}
          <button style={{ width: 64, height: 84, borderRadius: 6, border: "1.5px dashed var(--kz-line-strong)", background: "transparent", color: "var(--kz-ink-2)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", flex: "0 0 auto" }}>
            + Add<br />page
          </button>
        </div>

        <div style={{ padding: "0 16px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700 }}>
            What we read
          </div>
          <div style={{ fontSize: 11, color: "var(--kz-success)", fontFamily: "IBM Plex Mono", fontWeight: 600 }}>
            OCR · 0.94
          </div>
        </div>

        {/* Rows */}
        <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map(([name, party, votes, conf], i) => {
            const isLow = conf === "mid";
            return (
              <div key={i} style={{ background: "var(--kz-bg-2)", border: "1px solid " + (isLow ? "var(--kz-warn)" : "var(--kz-line)"), borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--kz-ink)" }}>{name}</div>
                  {party && <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)" }}>{party}</div>}
                  {isLow && <div style={{ fontSize: 10, color: "var(--kz-warn)", fontFamily: "IBM Plex Mono", fontWeight: 600, marginTop: 2 }}>OCR unsure · please check</div>}
                </div>
                <input value={votes} readOnly style={{
                  width: 70, height: 38, padding: "0 10px",
                  background: isLow ? "var(--kz-warn-soft)" : "var(--kz-bg)",
                  border: "1.5px solid " + (isLow ? "var(--kz-warn)" : "var(--kz-line-strong)"),
                  borderRadius: 6,
                  color: "var(--kz-ink)",
                  fontFamily: "IBM Plex Mono", fontSize: 17, fontWeight: 700,
                  textAlign: "right", letterSpacing: -0.02,
                }} />
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div style={{ margin: "10px 14px 0", padding: "12px 14px", background: "var(--kz-bg-2)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "var(--kz-ink-2)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 700 }}>
            Total cast / registered
          </div>
          <div style={{ fontFamily: "IBM Plex Mono", fontSize: 16, fontWeight: 700, color: "var(--kz-accent)", letterSpacing: -0.02 }}>
            533 / 577
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "14px 16px 14px" }}>
          <button className="kz-btn kz-btn--accent kz-btn--block" style={{ height: 54, borderRadius: 10, fontSize: 15 }}>
            Numbers look right →
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── 5 · Review + submit ─────────────────────────────────── */
function F5Review() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Review and submit" sub="Step 4 of 4 · Will be visible to everyone" />

        <div style={{ padding: "16px 18px 6px" }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 }}>
            What you'll publish to the public tally.
          </div>
        </div>

        {/* Station card */}
        <div style={{ margin: "14px 14px 0", padding: "14px 14px", background: "var(--kz-bg-2)", borderRadius: 12 }}>
          <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, fontFamily: "IBM Plex Mono", marginBottom: 4 }}>
            Station
          </div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Likii Primary School · Stream 1</div>
          <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "var(--kz-ink-3)", marginTop: 2 }}>
            031164082006901 · Laikipia East
          </div>
        </div>

        {/* Upload manifest */}
        <div style={{ margin: "10px 14px 0", padding: "10px 14px", background: "var(--kz-bg-2)", borderRadius: 12 }}>
          <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, fontFamily: "IBM Plex Mono", marginBottom: 8 }}>
            Will be uploaded
          </div>
          {[
            ["Page 1 photo", "1.4 MB"],
            ["Page 2 photo", "1.2 MB"],
            ["Numbers (12 rows)", "0.4 KB"],
            ["GPS coordinates", "0.1 KB"],
          ].map(([what, size]) => (
            <div key={what} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--kz-line)", fontSize: 12 }}>
              <span style={{ color: "var(--kz-ink)" }}>{what}</span>
              <span style={{ color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>{size}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", fontSize: 12, fontWeight: 700 }}>
            <span>Total · Approx data cost <span style={{ color: "var(--kz-ink-3)", fontWeight: 500 }}>KES 1.20</span></span>
            <span style={{ color: "var(--kz-accent)", fontFamily: "IBM Plex Mono" }}>2.6 MB</span>
          </div>
        </div>

        {/* Privacy / submit-when-online */}
        <div style={{ margin: "10px 14px 0", padding: "12px 14px", background: "var(--kz-success-soft)", borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--kz-success)" strokeWidth="2.2" strokeLinecap="round"><path d="M12 2L4 6v6c0 5 8 10 8 10s8-5 8-10V6l-8-4z"/></svg>
          <div style={{ flex: 1, fontSize: 12.5, color: "var(--kz-ink-2)", lineHeight: 1.5 }}>
            Your phone number is <b style={{ color: "var(--kz-ink)" }}>not</b> in this submission. Your username appears on the receipt as <span className="kz-mono" style={{ color: "var(--kz-ink)" }}>@n   m</span>.
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="kz-btn kz-btn--accent kz-btn--block" style={{ height: 56, borderRadius: 10, fontSize: 15.5 }}>
            Submit my tally
          </button>
          <button style={{ height: 44, background: "transparent", border: 0, color: "var(--kz-ink-2)", fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>
            Save as draft (don't publish yet)
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── 6 · Receipt ─────────────────────────────────────────── */
function F6Receipt() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>

        {/* Big celebration */}
        <div style={{ padding: "28px 22px 14px" }}>
          <div style={{ fontSize: 13, color: "var(--kz-success)", fontFamily: "IBM Plex Mono", fontWeight: 700, letterSpacing: 0.1, textTransform: "uppercase", marginBottom: 6 }}>
            Submitted · receipt below
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.0 }}>
            Asante.<br />Your tally is now public.
          </div>
        </div>

        {/* Receipt paper */}
        <div style={{ margin: "0 16px", background: "var(--kz-surface-light)", color: "var(--kz-ink-on-light)", borderRadius: 8, padding: "18px 18px", boxShadow: "0 12px 32px rgba(0,0,0,0.4)", position: "relative" }}>
          <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "rgba(13,28,31,0.5)", textTransform: "uppercase", letterSpacing: 0.12, fontWeight: 700, textAlign: "center", marginBottom: 10 }}>
            ── citizen tally · receipt ──
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.2, lineHeight: 1.1 }}>Likii Primary School</div>
              <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "rgba(13,28,31,0.7)", marginTop: 2 }}>
                Stream 1 · 031164082006901
              </div>
            </div>
            {/* faux QR */}
            <div style={{ width: 64, height: 64, background: "#0d1c1f", padding: 4, borderRadius: 2, flex: "0 0 auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 1, height: "100%", width: "100%" }}>
                {Array.from({ length: 64 }, (_, i) => <div key={i} style={{ background: Math.random() > 0.5 ? "#f3ecd8" : "#0d1c1f" }} />)}
              </div>
            </div>
          </div>

          {/* Vote rows in receipt */}
          <div style={{ borderTop: "1px dashed rgba(13,28,31,0.3)", paddingTop: 8, marginTop: 4 }}>
            {[
              ["LONGOGGY", "236"],
              ["UHURU", "188"],
              ["RAILA", "94"],
              ["KAVINGA", "12"],
              ["Rejected", "3"],
            ].map(([n, v]) => (
              <div key={n} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontFamily: "IBM Plex Mono", padding: "2px 0", color: "var(--kz-ink-on-light)" }}>
                <span>{n}</span><span>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: "1px dashed rgba(13,28,31,0.3)", paddingTop: 8, marginTop: 8, fontSize: 10.5, fontFamily: "IBM Plex Mono", color: "rgba(13,28,31,0.7)", lineHeight: 1.6 }}>
            <div>by @n   m · 9 Aug 2027 21:34 EAT</div>
            <div>sha256: a4f1c7e9…d09b</div>
            <div>kurazetu.com/s/031164082006901</div>
          </div>

          <div style={{ fontSize: 9, fontFamily: "IBM Plex Mono", color: "rgba(13,28,31,0.6)", textTransform: "uppercase", letterSpacing: 0.12, fontWeight: 700, textAlign: "center", marginTop: 10 }}>
            ── this is not iebc · citizen tally ──
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "14px 14px 14px", display: "flex", gap: 8 }}>
          <button className="kz-btn kz-btn--ghost" style={{ flex: 1, height: 50, borderRadius: 10 }}>
            Share receipt
          </button>
          <button className="kz-btn kz-btn--accent" style={{ flex: 1.4, height: 50, borderRadius: 10 }}>
            See station live →
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── 7 · Queued (offline) ──────────────────────────────── */
function F7Queued() {
  return (
    <Phone dark>
      <div className="kz-disclaimer" style={{ background: "var(--kz-warn-soft)", color: "var(--kz-warn)" }}>
        Offline · Citizen tally · Not IEBC
      </div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Saved on this phone" sub="Will publish when you're back online" />

        <div style={{ padding: "22px 22px 0" }}>
          <div style={{ fontSize: 11, color: "var(--kz-warn)", fontFamily: "IBM Plex Mono", fontWeight: 700, letterSpacing: 0.1, textTransform: "uppercase" }}>
            Queued · 1 submission
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.1, marginTop: 6 }}>
            Your tally is safe. Don't close the app.
          </div>
          <div style={{ fontSize: 13, color: "var(--kz-ink-2)", lineHeight: 1.5, marginTop: 8 }}>
            We've saved the form, the numbers, and the location. As soon as your connection returns, we'll publish — even if you've locked the screen.
          </div>
        </div>

        {/* Status card */}
        <div style={{ margin: "18px 16px 0", background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 12, padding: "14px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Likii Primary · Stream 1</div>
            <div style={{ fontSize: 11, color: "var(--kz-warn)", fontFamily: "IBM Plex Mono", letterSpacing: 0.08, fontWeight: 600 }}>WAITING</div>
          </div>
          {[
            ["Captured", "21:34 · 2 photos"],
            ["Network", "Offline · last seen 14 min ago"],
            ["Next retry", "In 0:24 (auto)"],
            ["When publishes", "Within 1 min of reconnect"],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--kz-line)", fontSize: 12 }}>
              <span style={{ color: "var(--kz-ink-2)" }}>{k}</span>
              <span style={{ color: "var(--kz-ink)", fontFamily: "IBM Plex Mono" }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Tip */}
        <div style={{ margin: "12px 16px 0", padding: "10px 14px", background: "var(--kz-info-soft)", borderRadius: 10, fontSize: 11.5, color: "var(--kz-ink-2)", lineHeight: 1.5 }}>
          <b style={{ color: "var(--kz-ink)" }}>Tip:</b> walk a few metres toward a road or window — networks reach further outside.
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "12px 14px 14px", display: "flex", gap: 8 }}>
          <button className="kz-btn kz-btn--ghost" style={{ flex: 1, height: 50, borderRadius: 10 }}>
            View saved
          </button>
          <button className="kz-btn kz-btn--accent" style={{ flex: 1.4, height: 50, borderRadius: 10 }}>
            Try again now
          </button>
        </div>
      </div>
    </Phone>
  );
}

function Form34ASection() {
  return (
    <DCSection id="06-form34a" title="Form 34A capture" subtitle="The heart of the product. Location first, calm permission ask, camera with guides, OCR confirm, receipt, offline queue, blur-retake edge case.">
      <DCArtboard id="loc" label="1 · Why we need location" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><F1Location /></div>
      </DCArtboard>
      <DCArtboard id="cam" label="2 · Camera + guides" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><F2Capture /></div>
      </DCArtboard>
      <DCArtboard id="retake" label="3 · Blur — retake" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><F3Retake /></div>
      </DCArtboard>
      <DCArtboard id="ocr" label="4 · OCR confirm" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><F4OCR /></div>
      </DCArtboard>
      <DCArtboard id="review" label="5 · Review + submit" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><F5Review /></div>
      </DCArtboard>
      <DCArtboard id="receipt" label="6 · Receipt" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><F6Receipt /></div>
      </DCArtboard>
      <DCArtboard id="queued" label="7 · Offline / queued" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><F7Queued /></div>
      </DCArtboard>

      <DCPostIt top={-12} right={60} rotate={2} width={250}>
        Location <b>first</b>, not last — without it the submission is flagged. Camera has corner brackets sized to A4 + blur detection at capture. OCR row borders go ochre on low confidence, never red (red = error, ochre = needs your eyes). Receipt has a QR + sha256 + screenshot-resilient disclaimers top and bottom.
      </DCPostIt>
    </DCSection>
  );
}

window.Form34ASection = Form34ASection;
