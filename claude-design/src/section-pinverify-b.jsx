/* global React, DCSection, DCArtboard, DCPostIt, Phone, ScreenHeader, MapBg */
// Section 05 — PinVerify direction B: consensus pin-cloud.
// The "higher transparency, higher friction" direction. The user is
// shown all existing community pins UPFRONT and is asked to agree or
// disagree with the consensus. If they disagree, they drag and explain.
// More work per pin, but every pin is implicitly an audit of the others.

/* ── Shared consensus cloud renderer (positioned in a 360×220 box) ── */
function ConsensusCloud({ centroid = { x: 180, y: 110 }, you, pins, selected }) {
  return (
    <svg viewBox="0 0 360 220" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
      {/* glow around centroid */}
      <circle cx={centroid.x} cy={centroid.y} r="46"
        fill="rgba(217,119,87,0.06)" stroke="rgba(217,119,87,0.25)" strokeDasharray="4 3" />

      {pins.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={p.size || 4.5}
            fill={`rgba(217,119,87,${p.weight || 0.5})`} />
        </g>
      ))}
      {/* centroid pin */}
      <g transform={`translate(${centroid.x - 14}, ${centroid.y - 30})`}>
        <path d="M14 0C6.3 0 0 6 0 13.3 0 22.7 14 33 14 33S28 22.7 28 13.3C28 6 21.7 0 14 0z"
          fill="var(--kz-accent)" />
        <circle cx="14" cy="13" r="5" fill="#0a1518" />
      </g>
      {you && (
        <g transform={`translate(${you.x - 9}, ${you.y - 9})`}>
          <circle cx="9" cy="9" r="13" fill="rgba(74,141,118,0.25)" />
          <circle cx="9" cy="9" r="7" fill="var(--kz-success)" stroke="#0a1518" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

const CLOUD_PINS = [
  { x: 168, y: 96, weight: 0.55 },
  { x: 178, y: 102, weight: 0.7 },
  { x: 188, y: 100, weight: 0.6 },
  { x: 172, y: 112, weight: 0.65 },
  { x: 184, y: 116, weight: 0.55 },
  { x: 192, y: 118, weight: 0.5 },
  { x: 200, y: 110, weight: 0.45 },
  { x: 176, y: 124, weight: 0.5 },
  { x: 188, y: 128, weight: 0.6 },
  { x: 196, y: 126, weight: 0.4 },
  { x: 164, y: 108, weight: 0.4 },
];

/* ── 1 · Station landing (show what we know already) ─────── */
function PVBLanding() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Likii Primary School" sub="Laikipia East · Nanyuki Ward" />

        {/* Map */}
        <div style={{ height: 220, position: "relative", margin: "12px 14px 0", borderRadius: 14, overflow: "hidden", background: "var(--kz-bg-2)" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <MapBg />
          </div>
          <div style={{ position: "absolute", inset: 0 }}>
            <ConsensusCloud pins={CLOUD_PINS} centroid={{ x: 184, y: 112 }} />
          </div>
        </div>

        {/* Stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "12px 14px 0" }}>
          {[
            ["11", "Pins", "var(--kz-ink)"],
            ["±18 m", "Spread", "var(--kz-success)"],
            ["98%", "Agree", "var(--kz-accent)"],
          ].map(([n, l, c]) => (
            <div key={l} style={{ background: "var(--kz-bg-2)", borderRadius: 10, padding: "10px 12px" }}>
              <div className="kz-mono" style={{ fontSize: 22, fontWeight: 700, color: c, letterSpacing: -0.02 }}>{n}</div>
              <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 700, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ padding: "14px 18px 0" }}>
          <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700, marginBottom: 6 }}>
            What the community says
          </div>
          <div style={{ fontSize: 14, color: "var(--kz-ink)", lineHeight: 1.5 }}>
            11 verifiers have pinned this station. They agree within a 18 m radius — that's a strong consensus.
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Disagree / agree buttons */}
        <div style={{ padding: "12px 14px 14px", borderTop: "1px solid var(--kz-line)" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="kz-btn kz-btn--ghost" style={{ flex: 1, height: 52, borderRadius: 10 }}>
              I disagree
            </button>
            <button className="kz-btn kz-btn--accent" style={{ flex: 1.4, height: 52, borderRadius: 10 }}>
              I agree
            </button>
          </div>
          <div style={{ marginTop: 8, textAlign: "center", fontSize: 11.5, color: "var(--kz-ink-3)" }}>
            Or <span style={{ color: "var(--kz-accent)", fontWeight: 600 }}>skip</span> if you're unsure.
          </div>
        </div>
      </div>
    </Phone>
  );
}

/* ── 2 · Disagreement — drag to your spot ────────────────── */
function PVBDisagree() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Where should it be?" sub="Likii Primary School" />

        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <MapBg />
          <div style={{ position: "absolute", inset: 0 }}>
            <ConsensusCloud pins={CLOUD_PINS} centroid={{ x: 184, y: 220 }}
              you={{ x: 260, y: 280 }} />
          </div>

          {/* Distance label */}
          <div style={{ position: "absolute", top: 230, left: 200, padding: "4px 10px", background: "var(--kz-bg)", borderRadius: 4, fontSize: 11, fontFamily: "IBM Plex Mono", color: "var(--kz-warn)", fontWeight: 600, border: "1px solid var(--kz-warn)" }}>
            72 m from consensus
          </div>
        </div>

        {/* Bottom sheet */}
        <div style={{ background: "var(--kz-bg-2)", borderTop: "1px solid var(--kz-line)", padding: "16px 18px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 11, color: "var(--kz-warn)", fontWeight: 700, letterSpacing: 0.08, textTransform: "uppercase", fontFamily: "IBM Plex Mono" }}>
              You're disagreeing
            </div>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>
              GPS ±5 m
            </div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.2, marginBottom: 4, lineHeight: 1.25 }}>
            Drag the green pin to where the entrance actually is.
          </div>
          <div style={{ fontSize: 12, color: "var(--kz-ink-2)", lineHeight: 1.5 }}>
            Disagreements ≥ 50 m open a dispute. Other verifiers will be asked to break the tie. Tell us why below.
          </div>

          {/* Reason chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
            {[
              ["Wrong building", true],
              ["Wrong school", false],
              ["Different stream", false],
              ["Renamed station", false],
            ].map(([label, sel]) => (
              <div key={label} style={{
                padding: "6px 12px",
                background: sel ? "var(--kz-accent)" : "transparent",
                color: sel ? "var(--kz-accent-ink)" : "var(--kz-ink-2)",
                border: "1px solid " + (sel ? "var(--kz-accent)" : "var(--kz-line-strong)"),
                borderRadius: 4,
                fontSize: 12, fontWeight: 600,
                fontFamily: "inherit",
              }}>{label}</div>
            ))}
          </div>

          <button className="kz-btn kz-btn--accent kz-btn--block" style={{ marginTop: 14, height: 52, borderRadius: 10 }}>
            Submit dissenting pin
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── 3 · Dispute view — split pin clusters ───────────────── */
function PVBDispute() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Disputed location" sub="Old Naivasha Hall · Naivasha" />

        {/* Two-cluster map */}
        <div style={{ height: 240, position: "relative", margin: "12px 14px 0", borderRadius: 14, overflow: "hidden", background: "var(--kz-bg-2)" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <MapBg />
          </div>
          <svg viewBox="0 0 360 240" style={{ position: "absolute", inset: 0 }} preserveAspectRatio="xMidYMid slice">
            {/* cluster A */}
            <circle cx="110" cy="120" r="36" fill="rgba(217,119,87,0.1)" stroke="rgba(217,119,87,0.4)" strokeDasharray="4 3" />
            {[[100, 110, 0.5], [116, 116, 0.6], [108, 124, 0.5], [120, 128, 0.55], [102, 130, 0.4], [124, 118, 0.45]].map(([x, y, w], i) => (
              <circle key={"A" + i} cx={x} cy={y} r="5" fill={`rgba(217,119,87,${w})`} />
            ))}
            <text x="110" y="170" textAnchor="middle" fontSize="11" fontFamily="IBM Plex Mono" fill="var(--kz-cand-1)" fontWeight="700">CLUSTER A · 6</text>

            {/* cluster B */}
            <circle cx="250" cy="120" r="32" fill="rgba(74,141,118,0.1)" stroke="rgba(74,141,118,0.4)" strokeDasharray="4 3" />
            {[[244, 112, 0.5], [256, 116, 0.5], [248, 124, 0.45], [260, 128, 0.55], [252, 130, 0.4]].map(([x, y, w], i) => (
              <circle key={"B" + i} cx={x} cy={y} r="5" fill={`rgba(74,141,118,${w})`} />
            ))}
            <text x="250" y="170" textAnchor="middle" fontSize="11" fontFamily="IBM Plex Mono" fill="var(--kz-success)" fontWeight="700">CLUSTER B · 5</text>

            {/* dashed connector */}
            <line x1="146" y1="120" x2="218" y2="120" stroke="var(--kz-warn)" strokeWidth="1.5" strokeDasharray="6 3" />
            <text x="182" y="115" textAnchor="middle" fontSize="10" fontFamily="IBM Plex Mono" fill="var(--kz-warn)" fontWeight="700">82 M</text>
          </svg>
        </div>

        {/* Reasoning */}
        <div style={{ padding: "12px 18px 0" }}>
          <div style={{ fontSize: 11, color: "var(--kz-warn)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700 }}>
            Disputed
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3, marginTop: 4 }}>
            11 verifiers · two clusters · 82 m apart
          </div>
          <div style={{ fontSize: 12.5, color: "var(--kz-ink-2)", lineHeight: 1.5, marginTop: 6 }}>
            This often happens when two streams of the same school share a compound. Visit in person to help us break the tie.
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "12px 14px 14px", borderTop: "1px solid var(--kz-line)", display: "flex", gap: 8 }}>
          <button className="kz-btn kz-btn--ghost" style={{ flex: 1, height: 50, borderRadius: 10 }}>
            Maybe later
          </button>
          <button className="kz-btn kz-btn--accent" style={{ flex: 1.4, height: 50, borderRadius: 10 }}>
            Resolve in person
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── 4 · Receipt ─────────────────────────────────────────── */
function PVBReceipt() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Vote recorded" />

        <div style={{ padding: "24px 24px 8px" }}>
          <div style={{ fontSize: 13, color: "var(--kz-success)", fontFamily: "IBM Plex Mono", fontWeight: 700, letterSpacing: 0.1, textTransform: "uppercase" }}>
            Asante
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.05, marginTop: 6 }}>
            You agreed with the community.
          </div>
          <div style={{ fontSize: 13.5, color: "var(--kz-ink-2)", lineHeight: 1.5, marginTop: 8 }}>
            Likii Primary School is now confirmed by <b style={{ color: "var(--kz-ink)" }}>12 verifiers</b>. A single agreement from someone within 20 m of the consensus lifts certainty from <span className="kz-mono" style={{ color: "var(--kz-accent)" }}>0.91 → 0.93</span>.
          </div>
        </div>

        {/* Receipt card */}
        <div style={{ margin: "16px 16px 0", background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, fontFamily: "IBM Plex Mono", marginBottom: 8 }}>
            Verification trail
          </div>
          {[
            ["@n   m", "AGREE", "now"],
            ["@m      v", "AGREE", "2 h"],
            ["@f   n", "AGREE", "1 d"],
            ["@c     4", "DISAGREE", "3 d"],
            ["+ 8 more", "", ""],
          ].map(([who, vote, when], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 4 ? "1px solid var(--kz-line)" : 0, alignItems: "center" }}>
              <div style={{ fontSize: 12.5, color: "var(--kz-ink)", fontFamily: i === 4 ? "inherit" : "IBM Plex Mono" }}>{who}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {vote && <span style={{ fontSize: 10, color: vote === "AGREE" ? "var(--kz-success)" : "var(--kz-warn)", fontWeight: 700, letterSpacing: 0.08, fontFamily: "IBM Plex Mono" }}>{vote}</span>}
                {when && <span style={{ fontSize: 10.5, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>{when}</span>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", gap: 8, padding: "14px 14px" }}>
          <button className="kz-btn kz-btn--ghost" style={{ flex: 1, height: 50, borderRadius: 10 }}>
            Done
          </button>
          <button className="kz-btn kz-btn--accent" style={{ flex: 1.4, height: 50, borderRadius: 10 }}>
            Verify another station
          </button>
        </div>
      </div>
    </Phone>
  );
}

function PinVerifyBSection() {
  return (
    <DCSection id="05-pinverify-b" title="PinVerify · Direction B · Consensus-first pin cloud"
      subtitle="Show all prior pins upfront. User agrees, disagrees, or skips. Disagreements ≥ 50 m open a dispute.">
      <DCArtboard id="landing" label="1 · Landing — see the cloud" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><PVBLanding /></div>
      </DCArtboard>
      <DCArtboard id="disagree" label="2 · Drag to disagree" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><PVBDisagree /></div>
      </DCArtboard>
      <DCArtboard id="dispute" label="3 · Two-cluster dispute" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><PVBDispute /></div>
      </DCArtboard>
      <DCArtboard id="receipt" label="4 · Trail + receipt" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><PVBReceipt /></div>
      </DCArtboard>

      <DCPostIt top={-12} right={60} rotate={2} width={240}>
        <b>Direction B — higher transparency, higher friction.</b> Show consensus upfront. Each pin is an audit. Best for power users / repeat verifiers, not first-timers.<br/><br/>
        <b>My recommendation: ship A first.</b> Add B in v2 as "Power mode" once you have repeat users.
      </DCPostIt>
    </DCSection>
  );
}

window.PinVerifyBSection = PinVerifyBSection;
