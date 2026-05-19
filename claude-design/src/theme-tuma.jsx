/* global React, AndroidDevice */
// THEME A · TUMA — civic transaction
// Mental model: when a Kenyan sends money, the act ends in a confirmation
// code on a paper-coloured screen. We borrow that paradigm — receipt,
// trail, code — without borrowing any specific brand's visual language.
// Palette is deep ink-navy + paper cream + a sparing cashier-orange accent.

const TUMA = {
  ink:    "#0E1B2C",   // near-black navy
  ink2:   "#1B2A3F",
  line:   "#2F3F55",
  paper:  "#F4EEDF",
  paper2: "#EAE2CE",
  accent: "#F2B441",   // accent
  accent2:"#E8651A",   // alarm/processing
  ok:     "#2E7D5B",
  muted:  "#6B7587",
  sans:   "'IBM Plex Sans', system-ui, sans-serif",
  mono:   "'IBM Plex Mono', ui-monospace, monospace",
};

// ─── tiny phone shell ───────────────────────────────────────────
function TumaPhone({ children, dark = false }) {
  return (
    <div style={{ width: 360, height: 720, position: "relative" }}>
      <AndroidDevice width={360} height={720} dark={dark} title={undefined}>
        <div className="kz" style={{
          background: dark ? TUMA.ink : TUMA.paper,
          color: dark ? TUMA.paper : TUMA.ink,
          minHeight: "100%", display: "flex", flexDirection: "column",
          fontFamily: TUMA.sans,
        }}>
          {children}
        </div>
      </AndroidDevice>
    </div>
  );
}

// Persistent NOT-IEBC strip — engineered to survive cropping by sitting
// flush against the OS chrome at the top of every screen.
function TumaDisclaimer({ dark = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "6px 14px",
      background: dark ? "#000" : TUMA.ink,
      color: dark ? TUMA.accent : TUMA.paper,
      fontFamily: TUMA.mono, fontSize: 10.5, letterSpacing: 0.6,
    }}>
      <span style={{
        display: "inline-block", width: 6, height: 6, borderRadius: 999,
        background: TUMA.accent,
      }} />
      <span>CITIZEN TALLY · SI IEBC · UNOFFICIAL</span>
    </div>
  );
}

// Perforated edge for the receipt aesthetic
function TumaPerf({ color = TUMA.paper, height = 12 }) {
  return (
    <div style={{
      height, background: `radial-gradient(circle at 6px ${height/2}px, transparent 4px, ${color} 4.5px)`,
      backgroundSize: "12px 100%",
    }} />
  );
}

// ════════════════════════════════════════════════════════════════
// Brand identity card
// ════════════════════════════════════════════════════════════════
function TumaBrandCard() {
  return (
    <div style={{
      width: "100%", height: "100%", background: TUMA.paper, color: TUMA.ink,
      fontFamily: TUMA.sans, padding: "32px 32px 28px", boxSizing: "border-box",
      position: "relative", overflow: "hidden",
    }}>
      {/* Header strip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontFamily: TUMA.mono, fontSize: 11, letterSpacing: 1.4, color: TUMA.muted }}>
          DIRECTION A · 01 / 05
        </div>
        <div style={{ fontFamily: TUMA.mono, fontSize: 11, letterSpacing: 1.4, color: TUMA.muted }}>
          BRAND ID
        </div>
      </div>

      {/* Wordmark lockup */}
      <div style={{ marginTop: 22, display: "flex", alignItems: "baseline", gap: 14 }}>
        <div style={{
          fontFamily: TUMA.mono, fontSize: 64, fontWeight: 700, letterSpacing: -2,
          lineHeight: 0.9, color: TUMA.ink,
        }}>
          TUMA<span style={{ color: TUMA.accent2 }}>.</span>
        </div>
        <div style={{ fontSize: 12.5, color: TUMA.muted, fontFamily: TUMA.mono, letterSpacing: 0.4 }}>
          a KuraZetu thing
        </div>
      </div>
      <div style={{ marginTop: 4, fontSize: 16, color: TUMA.ink2, fontWeight: 500, maxWidth: 440 }}>
        Send the form. Get a code. Watch the country tally itself.
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 28, marginTop: 28 }}>
        {/* LEFT */}
        <div>
          {/* Palette */}
          <SectionLabel>Palette</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 10 }}>
            {[
              ["Ink",    TUMA.ink,    "#0E1B2C", "fg"],
              ["Paper",  TUMA.paper,  "#F4EEDF", "bg"],
              ["Accent", TUMA.accent, "#F2B441", "code"],
              ["Alarm",  TUMA.accent2,"#E8651A", "warn"],
              ["OK",     TUMA.ok,     "#2E7D5B", "ok"],
            ].map(([n, c, hex, role]) => (
              <div key={n}>
                <div style={{ height: 56, background: c, borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)" }} />
                <div style={{ fontFamily: TUMA.mono, fontSize: 10, marginTop: 6, color: TUMA.ink }}>{n}</div>
                <div style={{ fontFamily: TUMA.mono, fontSize: 9.5, color: TUMA.muted }}>{hex}</div>
              </div>
            ))}
          </div>

          {/* Type */}
          <SectionLabel style={{ marginTop: 24 }}>Type</SectionLabel>
          <div style={{ marginTop: 8, display: "grid", rowGap: 8 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontFamily: TUMA.mono, fontSize: 28, fontWeight: 700, color: TUMA.ink }}>TUMA</span>
              <span style={{ fontFamily: TUMA.mono, fontSize: 10, color: TUMA.muted }}>Plex Mono · 700 · -1px</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontFamily: TUMA.sans, fontSize: 22, fontWeight: 600, color: TUMA.ink }}>Tuma fomu yako</span>
              <span style={{ fontFamily: TUMA.mono, fontSize: 10, color: TUMA.muted }}>Plex Sans · 600</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontFamily: TUMA.mono, fontSize: 14, color: TUMA.ink }}>KZ · 4A7F · C19</span>
              <span style={{ fontFamily: TUMA.mono, fontSize: 10, color: TUMA.muted }}>Plex Mono · 500 · codes</span>
            </div>
          </div>

          {/* Verb / artefact / identity */}
          <SectionLabel style={{ marginTop: 22 }}>Theme grammar</SectionLabel>
          <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "100px 1fr", rowGap: 7, fontSize: 13 }}>
            <div style={{ fontFamily: TUMA.mono, fontSize: 11, color: TUMA.muted }}>VERB</div>
            <div><b>Tuma</b> · send. "Tuma fomu" / "Send the form."</div>
            <div style={{ fontFamily: TUMA.mono, fontSize: 11, color: TUMA.muted }}>ARTEFACT</div>
            <div><b>Cheti</b> · the confirmation receipt with code.</div>
            <div style={{ fontFamily: TUMA.mono, fontSize: 11, color: TUMA.muted }}>IDENTITY</div>
            <div><b>Mtumaji</b> · sender. Numbered: KZ-MTUMAJI-04127.</div>
            <div style={{ fontFamily: TUMA.mono, fontSize: 11, color: TUMA.muted }}>DAILY HOOK</div>
            <div>Your <i>statement</i> — stations near you still unsent.</div>
            <div style={{ fontFamily: TUMA.mono, fontSize: 11, color: TUMA.muted }}>ATOM</div>
            <div>The cheti — code + station + tally, screenshot-resilient.</div>
          </div>
        </div>

        {/* RIGHT — the atom */}
        <div>
          <SectionLabel>The atom · cheti</SectionLabel>
          <div style={{ marginTop: 10 }}>
            <CheTI />
          </div>
        </div>
      </div>

      {/* Footer — the sentence */}
      <div style={{
        position: "absolute", left: 32, right: 32, bottom: 24,
        paddingTop: 14, borderTop: `1px dashed ${TUMA.line}33`,
        fontFamily: TUMA.mono, fontSize: 11.5, color: TUMA.ink,
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
      }}>
        <span>
          <span style={{ color: TUMA.muted }}>"</span>
          It's <b>M-Pesa for the election</b> — you send the form, you get a code, kila mtu anaona kila kitu.
          <span style={{ color: TUMA.muted }}>"</span>
        </span>
        <span style={{ color: TUMA.muted }}>— 22, Eldoret</span>
      </div>
    </div>
  );
}

function SectionLabel({ children, style = {} }) {
  return (
    <div style={{
      fontFamily: TUMA.mono, fontSize: 10.5, letterSpacing: 1.4,
      color: TUMA.muted, textTransform: "uppercase", ...style,
    }}>{children}</div>
  );
}

// The shareable atom — drawn as a paper receipt.
function CheTI({ scale = 1 }) {
  return (
    <div style={{
      background: TUMA.paper, border: `1px solid ${TUMA.ink}22`,
      borderRadius: 4, padding: 0, position: "relative",
      boxShadow: "0 18px 36px -22px rgba(14,27,44,0.45), 0 2px 0 rgba(14,27,44,0.06)",
      transform: `scale(${scale})`, transformOrigin: "top left",
      width: 260,
    }}>
      <TumaPerf color={TUMA.paper} height={10} />
      <div style={{ padding: "8px 16px 16px" }}>
        <div style={{
          fontFamily: TUMA.mono, fontSize: 10, letterSpacing: 1.2,
          color: TUMA.muted, display: "flex", justifyContent: "space-between",
        }}>
          <span>KZ · CHETI</span>
          <span>08·08·2027 14:22</span>
        </div>
        <div style={{ marginTop: 10, fontFamily: TUMA.mono, fontSize: 11, color: TUMA.muted }}>
          STATION
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: TUMA.ink, lineHeight: 1.3 }}>
          Kilimani Primary · Stream 03
        </div>
        <div style={{ fontFamily: TUMA.mono, fontSize: 11, color: TUMA.muted }}>
          290.04.012.03 · Dagoretti N
        </div>

        <div style={{ borderTop: `1px dashed ${TUMA.ink}33`, margin: "12px 0 10px" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 4, fontSize: 12.5 }}>
          <span>Candidate A</span><span style={{ fontFamily: TUMA.mono }}>312</span>
          <span>Candidate B</span><span style={{ fontFamily: TUMA.mono }}>278</span>
          <span>Candidate C</span><span style={{ fontFamily: TUMA.mono }}> 41</span>
          <span style={{ color: TUMA.muted }}>Rejected</span><span style={{ fontFamily: TUMA.mono, color: TUMA.muted }}>  9</span>
        </div>
        <div style={{ borderTop: `1px dashed ${TUMA.ink}33`, margin: "10px 0 10px" }} />
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "baseline",
          fontFamily: TUMA.mono, fontSize: 11, color: TUMA.muted,
        }}>
          <span>CONFIRMATION</span>
          <span style={{ color: TUMA.ink }}>VERIFIED · 3 of 3</span>
        </div>
        <div style={{
          marginTop: 6, fontFamily: TUMA.mono, fontSize: 22, fontWeight: 700,
          letterSpacing: 2, color: TUMA.ink,
        }}>
          KZ·4A7F·C19
        </div>
        <div style={{
          marginTop: 12, padding: "6px 8px", background: TUMA.ink, color: TUMA.accent,
          fontFamily: TUMA.mono, fontSize: 9, letterSpacing: 0.8, textAlign: "center",
        }}>
          CITIZEN TALLY · SI IEBC · KURAZETU.KE/V/4A7F-C19
        </div>
      </div>
      <TumaPerf color={TUMA.paper} height={10} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Onboarding 1/3 — Welcome
// ════════════════════════════════════════════════════════════════
function TumaOb1() {
  return (
    <TumaPhone dark={true}>
      <TumaDisclaimer dark />
      <div style={{ flex: 1, padding: "28px 22px 22px", display: "flex", flexDirection: "column", color: TUMA.paper }}>
        <div style={{ fontFamily: TUMA.mono, fontSize: 11, color: "#7F8DA3", letterSpacing: 1.4 }}>
          KURAZETU · 01 / 03
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: TUMA.mono, fontSize: 84, fontWeight: 700, letterSpacing: -3, lineHeight: 0.85 }}>
            Tuma<span style={{ color: TUMA.accent2 }}>.</span>
          </div>
          <div style={{ marginTop: 14, fontSize: 22, lineHeight: 1.28, fontWeight: 500, textWrap: "balance" }}>
            Piga picha ya Fomu 34A.<br />
            Pokea cheti. <span style={{ color: TUMA.accent }}>Kura yako inahesabika.</span>
          </div>
          <div style={{ marginTop: 14, fontSize: 13.5, color: "#B6C3D8", lineHeight: 1.55, maxWidth: 280 }}>
            46,229 vituo. Mmoja wenu kila mahali. We tally the country together —
            every form sent leaves a receipt anyone can verify.
          </div>
        </div>

        {/* Floating cheti preview */}
        <div style={{ flex: 1, position: "relative", marginTop: 12 }}>
          <div style={{
            position: "absolute", right: -18, top: 6,
            transform: "rotate(4deg)",
          }}>
            <CheTI scale={0.78} />
          </div>
          <div style={{
            position: "absolute", right: 90, top: 38,
            transform: "rotate(-6deg)", opacity: 0.6,
            filter: "saturate(0.9)",
          }}>
            <CheTI scale={0.62} />
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: "grid", rowGap: 10 }}>
          <button style={{
            background: TUMA.accent, color: TUMA.ink,
            fontFamily: TUMA.sans, fontWeight: 700, fontSize: 16,
            padding: "16px 18px", borderRadius: 4, textAlign: "left",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            Anza · Get started
            <span style={{ fontFamily: TUMA.mono, fontSize: 18 }}>→</span>
          </button>
          <button style={{
            background: "transparent", color: TUMA.paper,
            fontFamily: TUMA.sans, fontWeight: 500, fontSize: 14,
            padding: "14px 18px", borderRadius: 4, textAlign: "center",
            border: `1px solid ${TUMA.line}`,
          }}>
            I have a code &nbsp;·&nbsp; <span style={{ fontFamily: TUMA.mono }}>KZ·____·___</span>
          </button>
        </div>
      </div>
    </TumaPhone>
  );
}

// ════════════════════════════════════════════════════════════════
// Onboarding 2/3 — How it works (receipt grammar)
// ════════════════════════════════════════════════════════════════
function TumaOb2() {
  const steps = [
    { n: "01", title: "Piga picha", sub: "Snap the Form 34A at your polling station.", meta: "~10s · offline OK" },
    { n: "02", title: "Confirm", sub: "Check the numbers OCR pulled. Fix any.", meta: "auto · editable" },
    { n: "03", title: "Tuma", sub: "Send. You get a code. Three citizens verify it.", meta: "cheti · KZ·····" },
  ];
  return (
    <TumaPhone dark={false}>
      <TumaDisclaimer />
      <div style={{ padding: "24px 22px 16px" }}>
        <div style={{ fontFamily: TUMA.mono, fontSize: 11, color: TUMA.muted, letterSpacing: 1.4 }}>
          KURAZETU · 02 / 03
        </div>
        <h2 style={{ marginTop: 14, fontSize: 28, lineHeight: 1.15, fontWeight: 700, letterSpacing: -0.6, textWrap: "balance" }}>
          Three taps to a citizen tally.
        </h2>
        <p style={{ marginTop: 10, fontSize: 13.5, color: TUMA.ink2, lineHeight: 1.55, maxWidth: 280 }}>
          KuraZetu turns every Form 34A into a public receipt.
          Once sent, your station's tally lives on the ledger — code-stamped, citizen-verified, hard to deny.
        </p>
      </div>

      {/* Receipt of steps */}
      <div style={{
        margin: "6px 22px 0", background: TUMA.paper2,
        border: `1px solid ${TUMA.ink}1A`, borderRadius: 4, padding: "2px 0 0",
      }}>
        <TumaPerf color={TUMA.paper2} height={10} />
        <div style={{ padding: "0 14px 8px" }}>
          <div style={{
            fontFamily: TUMA.mono, fontSize: 10.5, color: TUMA.muted,
            letterSpacing: 1.2, display: "flex", justifyContent: "space-between",
            paddingBottom: 8, borderBottom: `1px dashed ${TUMA.ink}33`,
          }}>
            <span>HOW IT WORKS</span>
            <span>3 STEPS</span>
          </div>
          {steps.map((s, i) => (
            <div key={s.n} style={{
              padding: "12px 0",
              borderBottom: i === steps.length - 1 ? "none" : `1px dashed ${TUMA.ink}22`,
              display: "grid", gridTemplateColumns: "34px 1fr auto", columnGap: 12, alignItems: "baseline",
            }}>
              <div style={{ fontFamily: TUMA.mono, fontSize: 12, color: TUMA.accent2, fontWeight: 700 }}>
                {s.n}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: TUMA.ink }}>{s.title}</div>
                <div style={{ fontSize: 12.5, color: TUMA.ink2, marginTop: 2 }}>{s.sub}</div>
              </div>
              <div style={{ fontFamily: TUMA.mono, fontSize: 10.5, color: TUMA.muted }}>{s.meta}</div>
            </div>
          ))}
          <div style={{
            marginTop: 4, paddingTop: 10, borderTop: `1px dashed ${TUMA.ink}33`,
            fontFamily: TUMA.mono, fontSize: 11, color: TUMA.ink,
            display: "flex", justifyContent: "space-between",
          }}>
            <span>TOTAL</span>
            <span style={{ fontWeight: 700 }}>~ 90 seconds · once</span>
          </div>
        </div>
        <TumaPerf color={TUMA.paper2} height={10} />
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ padding: "0 22px 22px" }}>
        <button style={{
          width: "100%", background: TUMA.ink, color: TUMA.paper,
          fontFamily: TUMA.sans, fontWeight: 700, fontSize: 16,
          padding: "16px 18px", borderRadius: 4,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          Endelea · Continue
          <span style={{ fontFamily: TUMA.mono, fontSize: 18 }}>→</span>
        </button>
        <div style={{ marginTop: 10, fontFamily: TUMA.mono, fontSize: 10.5, color: TUMA.muted, textAlign: "center" }}>
          STEP 2 of 3 · ●●○
        </div>
      </div>
    </TumaPhone>
  );
}

// ════════════════════════════════════════════════════════════════
// Onboarding 3/3 — Sign in (phone number, transactional)
// ════════════════════════════════════════════════════════════════
function TumaOb3() {
  return (
    <TumaPhone dark={false}>
      <TumaDisclaimer />
      <div style={{ padding: "24px 22px 16px" }}>
        <div style={{ fontFamily: TUMA.mono, fontSize: 11, color: TUMA.muted, letterSpacing: 1.4 }}>
          KURAZETU · 03 / 03
        </div>
        <h2 style={{ marginTop: 14, fontSize: 26, lineHeight: 1.18, fontWeight: 700, letterSpacing: -0.5 }}>
          Pata kitambulisho chako.
        </h2>
        <p style={{ marginTop: 8, fontSize: 13.5, color: TUMA.ink2, lineHeight: 1.55, maxWidth: 290 }}>
          You become <b>Mtumaji KZ-#####</b>. The number is yours;
          your phone number stays private. Every cheti you send carries it.
        </p>
      </div>

      {/* Number field — deliberately transactional */}
      <div style={{ padding: "0 22px", marginTop: 4 }}>
        <div style={{ fontFamily: TUMA.mono, fontSize: 10.5, color: TUMA.muted, letterSpacing: 1.2 }}>
          NAMBARI YA SIMU · PHONE
        </div>
        <div style={{
          marginTop: 6, background: TUMA.paper2, border: `1px solid ${TUMA.ink}22`,
          borderRadius: 4, padding: "12px 14px",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontFamily: TUMA.mono, fontSize: 16, color: TUMA.ink, opacity: 0.55 }}>+254</span>
          <span style={{ width: 1, height: 22, background: `${TUMA.ink}22` }} />
          <span style={{ fontFamily: TUMA.mono, fontSize: 18, color: TUMA.ink, letterSpacing: 1 }}>
            712 304 |
          </span>
        </div>
        <div style={{ marginTop: 6, fontSize: 11.5, color: TUMA.muted, fontFamily: TUMA.mono }}>
          We'll text an OTP. No password. No name required.
        </div>

        {/* Mtumaji preview chip */}
        <div style={{
          marginTop: 22, background: TUMA.ink, color: TUMA.paper,
          borderRadius: 4, padding: "16px 16px", position: "relative",
        }}>
          <div style={{ fontFamily: TUMA.mono, fontSize: 10.5, color: "#7F8DA3", letterSpacing: 1.2 }}>
            YOUR HANDLE · PREVIEW
          </div>
          <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontFamily: TUMA.mono, fontSize: 22, fontWeight: 700, letterSpacing: 0.4 }}>
              KZ-MTUMAJI-04127
            </span>
            <span style={{ fontFamily: TUMA.mono, fontSize: 10, color: TUMA.accent }}>NEW</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12.5, color: "#B6C3D8" }}>
            Pseudonymous by default. Auditable, not identifiable.
          </div>
        </div>

        {/* Lang toggle */}
        <div style={{
          marginTop: 18, display: "flex", gap: 0,
          border: `1px solid ${TUMA.ink}33`, borderRadius: 4, overflow: "hidden",
          fontFamily: TUMA.mono, fontSize: 12,
        }}>
          {["EN", "SW", "SHENG"].map((l, i) => (
            <div key={l} style={{
              flex: 1, padding: "10px 0", textAlign: "center",
              background: i === 1 ? TUMA.ink : "transparent",
              color: i === 1 ? TUMA.paper : TUMA.ink,
              borderLeft: i === 0 ? "none" : `1px solid ${TUMA.ink}22`,
            }}>{l}</div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ padding: "0 22px 22px" }}>
        <button style={{
          width: "100%", background: TUMA.accent, color: TUMA.ink,
          fontFamily: TUMA.sans, fontWeight: 700, fontSize: 16,
          padding: "16px 18px", borderRadius: 4,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          Tuma OTP
          <span style={{ fontFamily: TUMA.mono, fontSize: 18 }}>→</span>
        </button>
        <div style={{ marginTop: 10, fontFamily: TUMA.mono, fontSize: 10.5, color: TUMA.muted, textAlign: "center" }}>
          By continuing you accept the unofficial-data disclaimer.
        </div>
      </div>
    </TumaPhone>
  );
}

// ════════════════════════════════════════════════════════════════
// Pitch card
// ════════════════════════════════════════════════════════════════
function TumaPitchCard() {
  return (
    <div style={{
      width: "100%", height: "100%", background: TUMA.ink, color: TUMA.paper,
      padding: "32px 32px 28px", boxSizing: "border-box", position: "relative",
      fontFamily: TUMA.sans, overflow: "hidden",
    }}>
      <div style={{ fontFamily: TUMA.mono, fontSize: 11, color: TUMA.accent, letterSpacing: 1.4 }}>
        DIRECTION A · THE PITCH
      </div>
      <h1 style={{
        marginTop: 14, fontFamily: TUMA.mono, fontSize: 56, fontWeight: 700,
        letterSpacing: -2, lineHeight: 0.9,
      }}>
        TUMA<span style={{ color: TUMA.accent2 }}>.</span>
      </h1>
      <p style={{ marginTop: 18, fontSize: 19, lineHeight: 1.32, fontWeight: 500, textWrap: "balance", maxWidth: 460 }}>
        Every Form 34A is a <span style={{ color: TUMA.accent }}>send</span>.
        Every send returns a <span style={{ color: TUMA.accent }}>code</span>.
        Every code can be verified by anyone, anywhere, against the public ledger.
      </p>

      <div style={{
        marginTop: 22, padding: "16px 16px", border: `1px solid ${TUMA.line}`,
        borderLeft: `3px solid ${TUMA.accent}`, borderRadius: 2,
        fontSize: 13.5, lineHeight: 1.55, color: "#D7E1F0", maxWidth: 480,
      }}>
        <b style={{ color: TUMA.paper }}>Cultural grammar:</b> the most-trusted UX in Kenya
        is the act of sending money and receiving a confirmation. Trust is borne by the
        paper trail, not by the issuer. KuraZetu inherits that grammar — without
        inheriting anyone's brand — so the civic act feels routine, traceable, and yours.
      </div>

      <div style={{
        position: "absolute", left: 32, right: 32, bottom: 88,
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14,
        fontFamily: TUMA.mono, fontSize: 12,
      }}>
        <Stat label="Verb"     value="Tuma" />
        <Stat label="Artefact" value="Cheti" />
        <Stat label="Identity" value="Mtumaji" />
        <Stat label="Daily hook" value="Your statement" />
      </div>

      <div style={{
        position: "absolute", left: 32, right: 32, bottom: 22,
        paddingTop: 16, borderTop: `1px dashed ${TUMA.line}`,
        fontFamily: TUMA.mono, fontSize: 12, color: TUMA.paper,
      }}>
        <span style={{ color: TUMA.muted }}>"</span>
        Iko like M-Pesa lakini ya kura — unatuma fomu, unapata code, the whole country can check.
        <span style={{ color: TUMA.muted }}>"</span>
        <div style={{ marginTop: 6, color: TUMA.muted }}>— what a 22-year-old in Eldoret would actually say</div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ borderTop: `1px solid ${TUMA.line}`, paddingTop: 8 }}>
      <div style={{ color: TUMA.muted, fontSize: 10.5, letterSpacing: 1.2 }}>{label.toUpperCase()}</div>
      <div style={{ color: TUMA.paper, fontSize: 16, fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Section
// ════════════════════════════════════════════════════════════════
function TumaSection() {
  return (
    <DCSection
      id="01-tuma"
      title="A · TUMA — civic transaction"
      subtitle="Send the form. Get a code. The country tallies itself."
    >
      <DCArtboard id="tuma-pitch" label="A · pitch" width={560} height={640}>
        <TumaPitchCard />
      </DCArtboard>
      <DCArtboard id="tuma-brand" label="A · brand identity" width={720} height={640}>
        <TumaBrandCard />
      </DCArtboard>
      <DCArtboard id="tuma-ob1" label="A · onboarding 1/3 · welcome" width={360} height={720}>
        <TumaOb1 />
      </DCArtboard>
      <DCArtboard id="tuma-ob2" label="A · onboarding 2/3 · how it works" width={360} height={720}>
        <TumaOb2 />
      </DCArtboard>
      <DCArtboard id="tuma-ob3" label="A · onboarding 3/3 · identity" width={360} height={720}>
        <TumaOb3 />
      </DCArtboard>
    </DCSection>
  );
}

Object.assign(window, { TumaSection });
