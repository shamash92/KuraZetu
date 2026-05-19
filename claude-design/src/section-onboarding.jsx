/* global React, DCSection, DCArtboard, DCPostIt, Phone, Disclaimer, AppBar, BottomTabs */
// Section 03 — Onboarding + signup.
// 6 screens · phone-first · disclaimer-led. All artboards wrapped in
// [data-brand="ramani"]. Status bar comes from AndroidDevice; Disclaimer
// strip sits right under it so it can't be cropped out of a screenshot.

function KZLogomark({ size = 36 }) {
  // Original mark: a folded ballot square with a check. Geometric, no
  // photographic illustration, no party-color reference.
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect x="2" y="2" width="36" height="36" rx="8" fill="var(--kz-ink)" />
      <path d="M14 19l4 4 8-9" stroke="var(--kz-bg)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="32" cy="8" r="3.5" fill="var(--kz-accent)" />
    </svg>
  );
}

function Wordmark({ inline }) {
  return (
    <div style={{ display: inline ? "inline-flex" : "flex", alignItems: "center", gap: 10 }}>
      <KZLogomark size={28} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{ fontSize: 19, fontWeight: 800, color: "var(--kz-ink)", letterSpacing: -0.5 }}>
          Kura Zetu
        </span>
        <span className="kz-mono" style={{ fontSize: 9, color: "var(--kz-ink-2)", letterSpacing: 0.18, marginTop: 1, textTransform: "uppercase" }}>
          Tally · Verify · Trust
        </span>
      </div>
    </div>
  );
}

// ── Screen 1 — Splash + language picker ──────────────────────
function ScreenLanguage() {
  return (
    <Phone>
      <Disclaimer />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "32px 24px" }}>
        <div style={{ marginTop: 20 }}>
          <KZLogomark size={44} />
          <div style={{ fontSize: 30, fontWeight: 800, color: "var(--kz-ink)", letterSpacing: -0.8, marginTop: 24, lineHeight: 1.05 }}>
            Karibu.
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, color: "var(--kz-ink-2)", letterSpacing: -0.8, lineHeight: 1.05 }}>
            Welcome.
          </div>
          <p style={{ fontSize: 14.5, color: "var(--kz-ink-2)", marginTop: 14, lineHeight: 1.5 }}>
            Chagua lugha yako kuendelea.<br/>
            Choose your language to continue.
          </p>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button className="kz-btn kz-btn--block" style={{
            background: "var(--kz-surface)",
            border: "1.5px solid var(--kz-line-strong)",
            color: "var(--kz-ink)",
            justifyContent: "space-between",
            padding: "0 18px",
            height: 56,
          }}>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Kiswahili</span>
              <span style={{ fontSize: 11.5, color: "var(--kz-ink-2)", fontWeight: 400 }}>Lugha ya msingi</span>
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>

          <button className="kz-btn kz-btn--block" style={{
            background: "var(--kz-ink)",
            color: "var(--kz-bg)",
            justifyContent: "space-between",
            padding: "0 18px",
            height: 56,
          }}>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>English</span>
              <span style={{ fontSize: 11.5, opacity: 0.7, fontWeight: 400 }}>Default language</span>
            </span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>

          <button style={{
            height: 44, background: "transparent", border: 0,
            color: "var(--kz-ink-2)", fontFamily: "inherit", fontSize: 13,
            cursor: "pointer", marginTop: 4,
          }}>
            Sheng? Tap to request →
          </button>
        </div>
      </div>
    </Phone>
  );
}

// ── Screen 2 — One promise ──────────────────────────────────
function ScreenPromise() {
  return (
    <Phone>
      <Disclaimer />
      <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 11, color: "var(--kz-ink-2)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700 }}>
          1 of 3
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--kz-ink)", letterSpacing: -0.7, lineHeight: 1.1, marginTop: 8 }}>
          Your phone. Your polling station. Your verified Form 34A.
        </h1>
        <p style={{ fontSize: 14.5, color: "var(--kz-ink-2)", marginTop: 14, lineHeight: 1.55 }}>
          The day after voting, you photograph the Form 34A posted outside your station. We aggregate, verify, and publish — so anyone can see what was counted.
        </p>

        {/* visual: stylised receipt */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 0" }}>
          <div style={{
            width: 200, background: "var(--kz-surface)",
            border: "1px solid var(--kz-line)", borderRadius: 4,
            padding: "16px 16px 18px",
            boxShadow: "var(--kz-e-2)", transform: "rotate(-2deg)",
            position: "relative",
          }}>
            <div className="kz-mono" style={{ fontSize: 10, color: "var(--kz-ink-2)", textTransform: "uppercase", letterSpacing: 0.1 }}>
              Form 34A · captured
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--kz-ink)", margin: "6px 0" }}>
              Likii Primary School
            </div>
            <div className="kz-mono" style={{ fontSize: 10, color: "var(--kz-ink-3)" }}>031164082006901</div>
            <div style={{ height: 1, background: "var(--kz-line)", margin: "10px 0" }} />
            {[["LONGOGGY", "236"], ["UHURU", "188"], ["RAILA", "94"]].map(([n, v]) => (
              <div key={n} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--kz-ink)", padding: "2px 0" }}>
                <span>{n}</span><span className="kz-mono">{v}</span>
              </div>
            ))}
            <div style={{ height: 1, background: "var(--kz-line)", margin: "8px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "var(--kz-accent)" }}>
              <span>VERIFIED ✓</span><span className="kz-mono">sha256: a4f1…</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--kz-ink)" }} />
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--kz-line)" }} />
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--kz-line)" }} />
        </div>
        <button className="kz-btn kz-btn--primary kz-btn--block">Continue</button>
      </div>
    </Phone>
  );
}

// ── Screen 3 — What it is NOT ───────────────────────────────
function ScreenDisclaimer() {
  return (
    <Phone>
      <Disclaimer tone="warn" />
      <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 11, color: "var(--kz-ink-2)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700 }}>
          2 of 3
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--kz-ink)", letterSpacing: -0.7, lineHeight: 1.1, marginTop: 8 }}>
          What KuraZetu is — and is not.
        </h1>

        <div style={{ marginTop: 18, border: "1px solid var(--kz-line)", borderRadius: 10, background: "var(--kz-surface)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ padding: "12px 14px", borderRight: "1px solid var(--kz-line)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: 7, background: "var(--kz-accent)", display: "grid", placeItems: "center", color: "var(--kz-bg)", fontSize: 9, fontWeight: 700 }}>✓</span>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--kz-ink)" }}>IS</div>
              </div>
              {[
                "A citizen-led parallel tally.",
                "Open source, non-partisan, non-profit.",
                "A check on official results.",
              ].map(t => (
                <div key={t} style={{ fontSize: 11.5, color: "var(--kz-ink-2)", padding: "5px 0", lineHeight: 1.4 }}>{t}</div>
              ))}
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: 7, background: "var(--kz-danger)", display: "grid", placeItems: "center", color: "#fff", fontSize: 9, fontWeight: 700 }}>×</span>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--kz-ink)" }}>IS NOT</div>
              </div>
              {[
                "An official IEBC system.",
                "Affiliated with any party.",
                "A legal challenge to results.",
              ].map(t => (
                <div key={t} style={{ fontSize: 11.5, color: "var(--kz-ink-2)", padding: "5px 0", lineHeight: 1.4 }}>{t}</div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 14, padding: "12px 14px", background: "var(--kz-warn-soft)",
          borderRadius: 8, fontSize: 12, color: "var(--kz-ink)", lineHeight: 1.5,
        }}>
          The official tally is run by the <b>Independent Electoral and Boundaries Commission (IEBC)</b>. KuraZetu publishes a parallel citizen count for transparency.
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--kz-line)" }} />
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--kz-ink)" }} />
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--kz-line)" }} />
        </div>
        <button className="kz-btn kz-btn--primary kz-btn--block">I understand — continue</button>
      </div>
    </Phone>
  );
}

// ── Screen 4 — Data & privacy ───────────────────────────────
function ScreenPrivacy() {
  const rows = [
    { what: "Your phone number", why: "To sync your submissions across devices.", how: "Hashed. Never shared." },
    { what: "Your location, once", why: "To confirm you're at the polling station.", how: "Coordinates only. Not tracked." },
    { what: "Form 34A photos", why: "Public record — anyone can verify your tally.", how: "Stored openly under your station code." },
  ];
  return (
    <Phone>
      <Disclaimer />
      <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 11, color: "var(--kz-ink-2)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700 }}>
          3 of 3
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--kz-ink)", letterSpacing: -0.6, lineHeight: 1.15, marginTop: 8 }}>
          What we ask for. And why.
        </h1>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((r, i) => (
            <div key={i} className="kz-card" style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--kz-ink)" }}>{r.what}</div>
              <div style={{ fontSize: 12, color: "var(--kz-ink-2)", marginTop: 3, lineHeight: 1.4 }}>{r.why}</div>
              <div style={{ fontSize: 11, color: "var(--kz-accent)", marginTop: 6, fontWeight: 600 }}>{r.how}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <a style={{ fontSize: 12.5, color: "var(--kz-accent)", fontWeight: 600, marginBottom: 12, textDecoration: "underline" }}>
          Full data &amp; privacy policy
        </a>

        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--kz-line)" }} />
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--kz-line)" }} />
          <span style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--kz-ink)" }} />
        </div>
        <button className="kz-btn kz-btn--primary kz-btn--block">Get started</button>
      </div>
    </Phone>
  );
}

// ── Screen 5 — Phone-first auth (replaces password) ──────────
function ScreenAuthPhone() {
  return (
    <Phone>
      <Disclaimer />
      <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
        <button style={{
          width: 36, height: 36, borderRadius: 999, border: 0,
          background: "transparent", display: "grid", placeItems: "center",
          marginLeft: -8, color: "var(--kz-ink)", cursor: "pointer",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--kz-ink)", letterSpacing: -0.6, lineHeight: 1.15, marginTop: 16 }}>
          What's your phone number?
        </h1>
        <p style={{ fontSize: 13.5, color: "var(--kz-ink-2)", marginTop: 8, lineHeight: 1.5 }}>
          We'll text a 6-digit code. No password, no email, no name needed yet.
        </p>

        <div style={{ marginTop: 24 }}>
          <label style={{ fontSize: 11.5, color: "var(--kz-ink-2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.06 }}>
            Mobile number
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <div className="kz-input kz-mono" style={{ width: 76, display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto", background: "var(--kz-bg-2)" }}>
              +254
            </div>
            <input className="kz-input kz-mono" placeholder="7XX XXX XXX" style={{ fontSize: 18, letterSpacing: 0.5 }} />
          </div>
          <div style={{ fontSize: 11.5, color: "var(--kz-ink-3)", marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            Safaricom, Airtel, and Telkom numbers supported.
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <button className="kz-btn kz-btn--accent kz-btn--block" style={{ marginBottom: 8 }}>Send code</button>
        <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--kz-ink-2)" }}>
          <span style={{ color: "var(--kz-accent)", fontWeight: 600 }}>Skip — browse tallies</span>
        </div>
      </div>
    </Phone>
  );
}

// ── Screen 6 — OTP + biometric prompt ───────────────────────
function ScreenOTP() {
  const digits = ["7","2","3","_","_","_"];
  return (
    <Phone>
      <Disclaimer />
      <div style={{ flex: 1, padding: "28px 24px", display: "flex", flexDirection: "column" }}>
        <button style={{
          width: 36, height: 36, borderRadius: 999, border: 0,
          background: "transparent", display: "grid", placeItems: "center",
          marginLeft: -8, color: "var(--kz-ink)", cursor: "pointer",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>

        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--kz-ink)", letterSpacing: -0.5, lineHeight: 1.15, marginTop: 16 }}>
          Enter the 6-digit code we just sent.
        </h1>
        <p style={{ fontSize: 13, color: "var(--kz-ink-2)", marginTop: 8, lineHeight: 1.5 }}>
          To <b className="kz-mono">+254 712 345 678</b>. <a style={{ color: "var(--kz-accent)" }}>Wrong number?</a>
        </p>

        <div style={{ display: "flex", gap: 8, marginTop: 22, justifyContent: "space-between" }}>
          {digits.map((d, i) => (
            <div key={i} style={{
              flex: 1, height: 56, borderRadius: 10,
              border: i === 3 ? "2px solid var(--kz-accent)" : "1.5px solid var(--kz-line-strong)",
              background: d === "_" ? "var(--kz-surface)" : "var(--kz-bg-2)",
              fontFamily: "IBM Plex Mono, monospace",
              fontSize: 26, fontWeight: 600,
              color: d === "_" ? "var(--kz-ink-3)" : "var(--kz-ink)",
              display: "grid", placeItems: "center",
            }}>{d === "_" ? "" : d}</div>
          ))}
        </div>

        <div style={{ marginTop: 18, padding: "10px 12px", background: "var(--kz-bg-2)", borderRadius: 8, fontSize: 12, color: "var(--kz-ink-2)", display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
          Resend code in 0:42
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "14px", border: "1.5px dashed var(--kz-line-strong)", borderRadius: 10, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--kz-accent-soft)", color: "var(--kz-accent)", display: "grid", placeItems: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 11c1.6 0 3-1.4 3-3s-1.4-3-3-3-3 1.4-3 3 1.4 3 3 3zM5 21v-1a7 7 0 0114 0v1"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--kz-ink)" }}>Use fingerprint next time?</div>
              <div style={{ fontSize: 11, color: "var(--kz-ink-2)" }}>Optional. You can skip.</div>
            </div>
            <div style={{ width: 36, height: 22, borderRadius: 11, background: "var(--kz-accent)", padding: 2, display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: 18, height: 18, borderRadius: 9, background: "#fff" }} />
            </div>
          </div>
        </div>

        <button className="kz-btn kz-btn--primary kz-btn--block">Verify and continue</button>
      </div>
    </Phone>
  );
}

function OnboardingSection() {
  return (
    <DCSection id="03-onboarding" title="Onboarding + signup" subtitle="6 screens · disclaimer-led · phone-first auth (no password) · biometric optional.">
      <DCArtboard id="lang" label="1 · Language pick" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><ScreenLanguage /></div>
      </DCArtboard>
      <DCArtboard id="promise" label="2 · One promise" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><ScreenPromise /></div>
      </DCArtboard>
      <DCArtboard id="disclaimer" label="3 · The disclaimer" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><ScreenDisclaimer /></div>
      </DCArtboard>
      <DCArtboard id="privacy" label="4 · Data &amp; privacy" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><ScreenPrivacy /></div>
      </DCArtboard>
      <DCArtboard id="phone" label="5 · Phone (no password)" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><ScreenAuthPhone /></div>
      </DCArtboard>
      <DCArtboard id="otp" label="6 · OTP + biometric" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><ScreenOTP /></div>
      </DCArtboard>

      <DCPostIt top={-12} right={60} rotate={2} width={220}>
        Three-screen onboarding (1·promise, 2·disclaimer, 3·privacy), <b>language as zero-step</b>. Then 2-screen auth: phone + OTP. <b>No password.</b> Optional biometric. Anonymous browse is always one tap away.
      </DCPostIt>
    </DCSection>
  );
}

window.OnboardingSection = OnboardingSection;
window.KZLogomark = KZLogomark;
window.Wordmark = Wordmark;
