/* global React, DCSection, DCArtboard, DCPostIt, ChromeWindow, KenyaHexMap */
// Section 10 — Web PinVerify.
// Desktop verification surface. Two artboards:
// 1. Landing / "play" page (replaces current purple-gradient + trophy emoji)
// 2. Active verification — split view of map + station card + decision row

/* ── Shared nav (compact) ────────────────────────────────── */
function PVWNav() {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "16px 32px", borderBottom: "1px solid var(--kz-line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="5" fill="var(--kz-ink)" />
          <path d="M9 12l2 2 4-4" stroke="var(--kz-bg)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="19" cy="5" r="2.2" fill="var(--kz-accent)" />
        </svg>
        <div style={{ fontSize: 17, fontWeight: 800, color: "var(--kz-ink)", letterSpacing: -0.4 }}>Kura Zetu</div>
      </div>
      <div style={{ display: "flex", gap: 0, marginLeft: 28 }}>
        {[["Results", false], ["PinVerify", true], ["Contribute", false], ["About", false]].map(([t, active]) => (
          <div key={t} style={{ padding: "8px 14px", fontSize: 13.5, fontWeight: active ? 700 : 500, color: active ? "var(--kz-ink)" : "var(--kz-ink-2)", borderRadius: 6, background: active ? "var(--kz-bg-2)" : "transparent" }}>{t}</div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "var(--kz-ink-3)", letterSpacing: 0.06 }}>
          @n   m
        </div>
        <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "var(--kz-accent)", padding: "4px 10px", background: "var(--kz-accent-soft)", borderRadius: 4, fontWeight: 700, letterSpacing: 0.04 }}>
          12 HELPED
        </div>
      </div>
    </div>
  );
}

/* ── Landing — "play" page ──────────────────────────────── */
function PVWLanding() {
  return (
    <div style={{ background: "var(--kz-bg)", color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", minHeight: "100%" }}>
      {/* Disclaimer */}
      <div style={{ background: "var(--kz-bg-2)", borderBottom: "1px solid var(--kz-line)", padding: "6px 32px", fontFamily: "IBM Plex Mono", fontSize: 10.5, color: "var(--kz-warn)", letterSpacing: 0.08, textTransform: "uppercase", fontWeight: 600 }}>
        Citizen tally · This is not an IEBC system
      </div>

      <PVWNav />

      <div style={{ padding: "48px 32px 32px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--kz-accent)", fontWeight: 700, letterSpacing: 0.12, textTransform: "uppercase", marginBottom: 12 }}>
              PinVerify
            </div>
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -0.04 + "em", lineHeight: 1.0 }}>
              Help us know exactly where each polling station is.
            </div>
            <div style={{ fontSize: 15, color: "var(--kz-ink-2)", lineHeight: 1.55, marginTop: 18, maxWidth: 540 }}>
              19,830 polling stations still have no confirmed pin. Open a satellite view, check whether ours is right, drag it if it isn't. Five minutes, three stations, a real contribution.
            </div>

            {/* How */}
            <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["01", "If our pin is right, confirm it."],
                ["02", "If our pin is wrong, drag it to the right place."],
                ["03", "Not sure? Skip — that's also useful data."],
              ].map(([n, what]) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 14px", background: "var(--kz-bg-2)", borderRadius: 8 }}>
                  <div className="kz-mono" style={{ fontSize: 12, fontWeight: 700, color: "var(--kz-ink-3)", letterSpacing: 0.08, minWidth: 28 }}>{n}</div>
                  <div style={{ fontSize: 13.5, color: "var(--kz-ink)" }}>{what}</div>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 32 }}>
              <button style={{ background: "var(--kz-accent)", color: "var(--kz-accent-ink)", border: 0, padding: "22px 28px", borderRadius: 12, fontSize: 19, fontWeight: 800, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, letterSpacing: -0.3, boxShadow: "0 12px 32px rgba(217,119,87,0.25)" }}>
                <span>Start verifying — random stations</span>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
              <button style={{ background: "transparent", border: "1px solid var(--kz-line-strong)", color: "var(--kz-ink-2)", padding: "12px 22px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", alignSelf: "flex-start" }}>
                Or start in my ward →
              </button>
            </div>
          </div>

          {/* Stats column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 14, padding: 22 }}>
              <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, marginBottom: 8 }}>
                Coverage today
              </div>
              <div className="kz-mono" style={{ fontSize: 44, fontWeight: 700, color: "var(--kz-ink)", letterSpacing: -0.04, lineHeight: 1 }}>
                57<span style={{ color: "var(--kz-accent)" }}>%</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--kz-ink-2)", marginTop: 6 }}>
                26,401 of 46,231 stations confirmed.
              </div>
              <div style={{ height: 5, background: "var(--kz-bg)", borderRadius: 3, marginTop: 12, overflow: "hidden" }}>
                <div style={{ width: "57%", height: "100%", background: "var(--kz-accent)" }} />
              </div>
            </div>

            <div style={{ background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 14, padding: 22 }}>
              <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, marginBottom: 14 }}>
                Recent contributors
              </div>
              {[
                ["@f   n",     "Trans Nzoia · Sinyerere", "2 min"],
                ["@m      4", "Migori · Nyatike",      "8 min"],
                ["@s    w",    "Mombasa · Kisauni",     "14 min"],
                ["@c     4",  "Nairobi · Westlands",    "26 min"],
                ["@n   m",     "Laikipia · Nanyuki",      "now"],
              ].map(([who, where, when]) => (
                <div key={who} style={{ display: "flex", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--kz-line)", gap: 10 }}>
                  <div className="kz-mono" style={{ width: 70, color: who === "@n   m" ? "var(--kz-accent)" : "var(--kz-ink)", fontWeight: 600, fontSize: 12 }}>{who}</div>
                  <div style={{ flex: 1, fontSize: 12, color: "var(--kz-ink-2)" }}>{where}</div>
                  <div className="kz-mono" style={{ fontSize: 11, color: "var(--kz-ink-3)" }}>{when}</div>
                </div>
              ))}
              <div style={{ fontSize: 11, color: "var(--kz-ink-3)", marginTop: 10, lineHeight: 1.4 }}>
                No rankings. No scores. Everyone's contribution counts the same.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini hex map at bottom */}
      <div style={{ padding: "32px 32px 60px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 14, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700 }}>Where help is most needed</div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>Counties with the most un-pinned stations</div>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
              {[
                ["High need", "var(--kz-cand-1)"],
                ["Some gaps", "var(--kz-cand-3)"],
                ["Well-covered", "var(--kz-cand-2)"],
              ].map(([n, c]) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 12, background: c, borderRadius: 2 }} />
                  <span style={{ color: "var(--kz-ink-2)" }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ height: 280 }}>
            <KenyaHexMap selected="" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Active verification view ────────────────────────────── */
function PVWVerify() {
  return (
    <div style={{ background: "var(--kz-bg)", color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", minHeight: "100%" }}>
      {/* Disclaimer */}
      <div style={{ background: "var(--kz-bg-2)", borderBottom: "1px solid var(--kz-line)", padding: "6px 32px", fontFamily: "IBM Plex Mono", fontSize: 10.5, color: "var(--kz-warn)", letterSpacing: 0.08, textTransform: "uppercase", fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
        <span>Citizen tally · This is not an IEBC system</span>
        <span style={{ color: "var(--kz-ink-3)" }}>Station 3 of 5 · this session</span>
      </div>

      <PVWNav />

      {/* Sub-header */}
      <div style={{ padding: "16px 32px", borderBottom: "1px solid var(--kz-line)", display: "flex", alignItems: "center", gap: 16 }}>
        <button style={{ background: "transparent", border: "1px solid var(--kz-line)", color: "var(--kz-ink-2)", padding: "8px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
          ← Back to all
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", textTransform: "uppercase", letterSpacing: 0.06 }}>
            Trans Nzoia › Cherangany › Sinyerere Ward
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3, marginTop: 2 }}>
            Tumaini Primary School
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span className="kz-badge kz-badge--unverified">Pin needs review</span>
          <span style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "var(--kz-ink-3)" }}>· 3 prior pins</span>
        </div>
      </div>

      {/* Split: big map · sidebar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 0 }}>
        {/* Map */}
        <div style={{ position: "relative", height: 700, background: "#1a1816", overflow: "hidden" }}>
          {/* Faux satellite */}
          <svg viewBox="0 0 900 700" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="terrain" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <rect width="60" height="60" fill="#2a2620" />
                <path d="M 0 40 Q 15 30 30 40 T 60 40" fill="none" stroke="#3a342a" strokeWidth="1" />
                <path d="M -10 60 Q 15 50 30 60" fill="none" stroke="#3a342a" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="900" height="700" fill="url(#terrain)" />
            {/* roads */}
            <g fill="none" stroke="#5a4a3a" strokeWidth="6" strokeLinecap="round">
              <path d="M -10 360 Q 200 340 400 360 T 920 380" />
              <path d="M 540 -10 Q 530 200 540 380 T 560 720" />
            </g>
            {/* fields */}
            <g fill="#3a4a26" opacity="0.8">
              <rect x="100" y="150" width="180" height="120" />
              <rect x="320" y="120" width="160" height="100" />
              <rect x="640" y="180" width="200" height="160" />
              <rect x="50" y="450" width="220" height="120" />
              <rect x="380" y="480" width="160" height="160" />
              <rect x="620" y="500" width="180" height="180" />
            </g>
            {/* school complex — slight highlight */}
            <g transform="translate(420, 320)">
              <rect width="180" height="100" fill="#5a4a3a" />
              <rect x="20" y="20" width="60" height="14" fill="#a89880" />
              <rect x="20" y="44" width="60" height="14" fill="#a89880" />
              <rect x="100" y="20" width="60" height="38" fill="#a89880" />
              <rect x="20" y="68" width="140" height="20" fill="#a89880" />
            </g>

            {/* prior pins (3) */}
            {[[488, 354], [510, 360], [496, 372]].map(([x, y], i) => (
              <g key={i} transform={`translate(${x - 10}, ${y - 26})`}>
                <path d="M10 0C4.5 0 0 4 0 9.6 0 16.8 10 26 10 26S20 16.8 20 9.6C20 4 15.5 0 10 0z" fill="var(--kz-accent)" opacity="0.55" />
                <circle cx="10" cy="10" r="3" fill="#0d1c1f" />
              </g>
            ))}
            {/* consensus halo */}
            <circle cx="498" cy="362" r="60" fill="none" stroke="var(--kz-accent)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
            {/* New candidate pin (yours, draggable) */}
            <g transform="translate(488, 332)">
              <circle cx="10" cy="10" r="22" fill="rgba(74,141,118,0.2)" />
              <g transform="translate(0, -20)">
                <path d="M10 0C4.5 0 0 4 0 9.6 0 16.8 10 26 10 26S20 16.8 20 9.6C20 4 15.5 0 10 0z" fill="var(--kz-success)" />
                <circle cx="10" cy="10" r="3" fill="#0d1c1f" />
              </g>
            </g>
          </svg>

          {/* Map toolbar */}
          <div style={{ position: "absolute", top: 16, left: 16, display: "flex", flexDirection: "column", gap: 6 }}>
            <button style={{ width: 36, height: 36, borderRadius: 6, background: "rgba(13,28,31,0.9)", border: "1px solid var(--kz-line)", color: "var(--kz-ink)", fontFamily: "inherit", fontSize: 18, cursor: "pointer" }}>+</button>
            <button style={{ width: 36, height: 36, borderRadius: 6, background: "rgba(13,28,31,0.9)", border: "1px solid var(--kz-line)", color: "var(--kz-ink)", fontFamily: "inherit", fontSize: 18, cursor: "pointer" }}>−</button>
            <div style={{ height: 6 }} />
            <button style={{ width: 36, height: 36, borderRadius: 6, background: "rgba(13,28,31,0.9)", border: "1px solid var(--kz-line)", color: "var(--kz-ink)", display: "grid", placeItems: "center", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L8 14l4-4 4 4L12 2zM2 12l4-4-4 4 4 4L2 12zM12 22l-4-4 4 4 4-4-4 4zM22 12l-4 4 4-4-4-4 4 4z"/></svg>
            </button>
          </div>

          {/* Layer toggle */}
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", background: "rgba(13,28,31,0.9)", border: "1px solid var(--kz-line)", borderRadius: 6, overflow: "hidden" }}>
            {["Satellite", "Map"].map((l, i) => (
              <div key={l} style={{ padding: "8px 12px", fontSize: 12, fontWeight: 600, background: i === 0 ? "var(--kz-accent)" : "transparent", color: i === 0 ? "var(--kz-accent-ink)" : "var(--kz-ink)" }}>{l}</div>
            ))}
          </div>

          {/* Inline tooltip */}
          <div style={{ position: "absolute", top: 240, left: 480, background: "var(--kz-surface-light)", color: "var(--kz-ink-on-light)", padding: "10px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, boxShadow: "0 8px 20px rgba(0,0,0,0.4)", lineHeight: 1.4, maxWidth: 220 }}>
            <div style={{ fontSize: 9, color: "rgba(13,28,31,0.6)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700 }}>Your pin · 32 m from consensus</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>Drag to refine</div>
            <div style={{ position: "absolute", bottom: -5, left: 20, width: 10, height: 10, background: "var(--kz-surface-light)", transform: "rotate(45deg)" }} />
          </div>

          {/* Attribution */}
          <div style={{ position: "absolute", bottom: 8, right: 14, fontSize: 10, fontFamily: "IBM Plex Mono", color: "var(--kz-ink-3)", opacity: 0.7, letterSpacing: 0.06 }}>
            kurazetu · imagery © contributors
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ borderLeft: "1px solid var(--kz-line)", background: "var(--kz-bg)", height: 700, display: "flex", flexDirection: "column" }}>
          {/* Progress */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--kz-line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700 }}>Session progress</span>
              <span className="kz-mono" style={{ fontSize: 11, color: "var(--kz-ink-2)" }}>3 / 5</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} style={{ flex: 1, height: 6, borderRadius: 1, background: s <= 3 ? "var(--kz-accent)" : "var(--kz-bg-2)" }} />
              ))}
            </div>
          </div>

          {/* Station card */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--kz-line)" }}>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, marginBottom: 4 }}>
              Station to verify
            </div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Tumaini Primary School</div>
            <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "var(--kz-ink-3)", marginTop: 4 }}>
              Code 031234097002601
            </div>
            <div style={{ fontSize: 12, color: "var(--kz-ink-2)", marginTop: 8, lineHeight: 1.45 }}>
              3 contributors have pinned this station already. Their consensus is at <b style={{ color: "var(--kz-ink)" }}>1.13279, 35.13976</b>.
            </div>
          </div>

          {/* Existing pins */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--kz-line)" }}>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, marginBottom: 10 }}>
              Prior pins · 3
            </div>
            {[
              ["@f   n", "Aug 2", "exact"],
              ["@m      4", "Aug 3", "exact"],
              ["@c  r", "Aug 7", "10 m off"],
            ].map(([who, when, dist], i, arr) => (
              <div key={who} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--kz-line)" : 0, fontSize: 12 }}>
                <span className="kz-mono" style={{ color: "var(--kz-ink)" }}>{who}</span>
                <span style={{ color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>{when} · {dist}</span>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          {/* Decision row */}
          <div style={{ padding: "20px 24px", borderTop: "1px solid var(--kz-line)" }}>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, marginBottom: 10 }}>
              Your decision
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button style={{ background: "var(--kz-success)", color: "#0d1c1f", border: 0, padding: "14px 18px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Pin is correct</span>
              </button>
              <button style={{ background: "var(--kz-accent)", color: "var(--kz-accent-ink)", border: 0, padding: "14px 18px", borderRadius: 8, fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Save my correction</span>
              </button>
              <button style={{ background: "transparent", border: "1px solid var(--kz-line-strong)", color: "var(--kz-ink-2)", padding: "12px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Skip — not sure</span>
              </button>
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: "var(--kz-ink-3)", lineHeight: 1.45 }}>
              Decisions are reversible for 5 minutes. After that, two community votes can override yours.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WebPinVerifySection() {
  return (
    <DCSection id="10-web-pinverify" title="Web · PinVerify" subtitle="Replaces the purple-gradient + trophy-emoji 'Play PinVerify254' page. Same goal, dressed as civic infrastructure.">
      <DCArtboard id="landing" label="Landing · play" width={1280} height={1100}>
        <div data-brand="ramani" style={{ height: "100%" }}>
          <ChromeWindow url="kurazetu.com/pinverify" tabs={[{ title: "PinVerify — Kura Zetu" }]} width={1280} height={1100}>
            <PVWLanding />
          </ChromeWindow>
        </div>
      </DCArtboard>
      <DCArtboard id="verify" label="Active verification" width={1280} height={900}>
        <div data-brand="ramani" style={{ height: "100%" }}>
          <ChromeWindow url="kurazetu.com/pinverify/r/031234097002601" tabs={[{ title: "Tumaini Primary — PinVerify" }]} width={1280} height={900}>
            <PVWVerify />
          </ChromeWindow>
        </div>
      </DCArtboard>

      <DCPostIt top={-12} right={60} rotate={2} width={240}>
        Public leaderboards and points removed (clout risk on election infrastructure). The verification screen is the map-left + sidebar-right convention, with three honest options (correct / correction / skip) and an undo grace window. Contributions tracked privately on profile.
      </DCPostIt>
    </DCSection>
  );
}

window.WebPinVerifySection = WebPinVerifySection;
