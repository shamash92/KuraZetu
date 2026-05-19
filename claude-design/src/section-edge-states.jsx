/* global React, DCSection, DCArtboard, DCPostIt, Phone, ScreenHeader, MapBg */
// Section 11 — Edge states.
// 8 missing-state screens added after the review debate:
//   S1 Location denied (Form 34A)
//   S2 Camera denied (Form 34A)
//   S3 GPS poor → landmark mode (PinVerify A)
//   S4 OTP send-fail / wrong number (onboarding)
//   S5 No nearby stations / no matches (PinVerify A)
//   S6 No Community Notes yet (Results)
//   S7 Discard draft confirm (Form 34A)
//   S8 Account recovery (12-word phrase)

/* ── S1 · Location denied ─────────────────────────────── */
function S1LocationDenied() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Location turned off" sub="We can still take your submission" />

        <div style={{ padding: "22px 22px 0", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 11, color: "var(--kz-warn)", fontFamily: "IBM Plex Mono", fontWeight: 700, letterSpacing: 0.1, textTransform: "uppercase" }}>
            Lower-trust submission
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.1, marginTop: 6 }}>
            Without GPS, anyone could submit any station's tally. We'll still publish — but with a note.
          </div>
          <div style={{ fontSize: 13, color: "var(--kz-ink-2)", lineHeight: 1.5, marginTop: 12 }}>
            Two paths from here. Either is fine. Most users pick the first.
          </div>

          {/* Two paths */}
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ padding: "14px 14px", border: "1px solid var(--kz-accent)", borderRadius: 12, background: "var(--kz-bg-2)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Open settings, turn on location</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--kz-accent)" strokeWidth="2.4" strokeLinecap="round"><path d="M7 17L17 7M9 7h8v8"/></svg>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--kz-ink-2)", marginTop: 4, lineHeight: 1.4 }}>
                Best for trust. We'll capture once when you take the photo.
              </div>
            </div>

            <div style={{ padding: "14px 14px", border: "1px solid var(--kz-line)", borderRadius: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Pick the station manually</div>
              <div style={{ fontSize: 11.5, color: "var(--kz-ink-2)", marginTop: 4, lineHeight: 1.4 }}>
                You'll search by name. Submission goes through — flagged as <span className="kz-mono" style={{ color: "var(--kz-warn)" }}>NO-GPS</span>.
              </div>
            </div>
          </div>

          {/* Explainer */}
          <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: "var(--kz-bg-2)", fontSize: 11.5, color: "var(--kz-ink-2)", lineHeight: 1.5 }}>
            We use location <b style={{ color: "var(--kz-ink)" }}>once</b> at capture — never tracked, never shared. The KuraZetu data pledge applies even if you say no.
          </div>
        </div>

        <div style={{ padding: "12px 16px 14px", display: "flex", gap: 8 }}>
          <button className="kz-btn kz-btn--ghost" style={{ flex: 1, height: 50, borderRadius: 10 }}>Pick manually</button>
          <button className="kz-btn kz-btn--accent" style={{ flex: 1.4, height: 50, borderRadius: 10 }}>Open settings →</button>
        </div>
      </div>
    </Phone>
  );
}

/* ── S2 · Camera denied ──────────────────────────────── */
function S2CameraDenied() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Camera blocked" sub="We need it to photograph the Form 34A" />

        <div style={{ padding: "22px 22px 0", flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Visual */}
          <div style={{ height: 140, borderRadius: 14, background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", display: "grid", placeItems: "center", marginBottom: 22 }}>
            <div style={{ width: 64, height: 50, borderRadius: 6, border: "2px solid var(--kz-ink-3)", background: "var(--kz-bg)", position: "relative" }}>
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: 22, height: 22, borderRadius: 11, border: "2px solid var(--kz-ink-3)" }} />
              <div style={{ position: "absolute", left: -10, top: -10, width: 84, height: 70, borderTop: "2px solid var(--kz-danger)", borderLeft: "2px solid var(--kz-danger)", borderRadius: 8, transform: "rotate(45deg)", transformOrigin: "center", display: "none" }} />
              <div style={{ position: "absolute", inset: -8 }}>
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="10" y1="10" x2="90" y2="90" stroke="var(--kz-danger)" strokeWidth="3.5" strokeLinecap="round" /></svg>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.15 }}>
            We can't open the camera right now.
          </div>
          <div style={{ fontSize: 13, color: "var(--kz-ink-2)", lineHeight: 1.55, marginTop: 8 }}>
            The Form 34A photo is what makes a submission verifiable. Without it, the tally has nothing to back it up.
          </div>

          {/* Steps */}
          <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 12, background: "var(--kz-bg-2)" }}>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, marginBottom: 6 }}>
              On most Androids
            </div>
            {[
              "Open Settings.",
              "Apps · Kura Zetu · Permissions.",
              "Allow Camera.",
            ].map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "4px 0", fontSize: 12.5 }}>
                <div className="kz-mono" style={{ color: "var(--kz-accent)", width: 22 }}>{String(i + 1).padStart(2, "0")}</div>
                <div>{step}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "14px 16px 14px", display: "flex", gap: 8 }}>
          <button className="kz-btn kz-btn--ghost" style={{ flex: 1, height: 50, borderRadius: 10 }}>Not now</button>
          <button className="kz-btn kz-btn--accent" style={{ flex: 1.4, height: 50, borderRadius: 10 }}>Open settings →</button>
        </div>
      </div>
    </Phone>
  );
}

/* ── S3 · GPS poor → landmark mode ───────────────────── */
function S3GPSPoor() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="GPS signal is poor" sub="Likii Primary School" />

        <div style={{ padding: "20px 20px 0", flex: 1 }}>
          <div style={{ fontSize: 11, color: "var(--kz-warn)", fontFamily: "IBM Plex Mono", fontWeight: 700, letterSpacing: 0.1, textTransform: "uppercase" }}>
            Accuracy ±48 m
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.15, marginTop: 4 }}>
            Help us locate the station by what you can see.
          </div>
          <div style={{ fontSize: 12.5, color: "var(--kz-ink-2)", lineHeight: 1.5, marginTop: 8 }}>
            Skip GPS this time. Answer three landmark questions and we'll triangulate from your description plus other verifiers' pins.
          </div>

          {/* Questions */}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { q: "What does the entrance face?", opts: ["A main road", "A side path", "A field / open ground", "Unsure"], sel: 0 },
              { q: "Closest landmark?", opts: ["Church", "Football pitch", "Market / shops", "Other building"], sel: 2 },
              { q: "Roof color you can see?", opts: ["Iron sheets · grey", "Iron sheets · red", "Tiled", "Mixed / unsure"], sel: 0 },
            ].map((row, i) => (
              <div key={i} style={{ padding: "12px 14px", background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--kz-ink)", marginBottom: 8 }}>{row.q}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {row.opts.map((o, j) => {
                    const sel = j === row.sel;
                    return (
                      <div key={o} style={{
                        padding: "6px 11px",
                        fontSize: 11.5, fontWeight: 600,
                        color: sel ? "var(--kz-accent-ink)" : "var(--kz-ink-2)",
                        background: sel ? "var(--kz-accent)" : "transparent",
                        border: "1px solid " + (sel ? "var(--kz-accent)" : "var(--kz-line-strong)"),
                        borderRadius: 4,
                      }}>{o}</div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "14px 16px 14px" }}>
          <button className="kz-btn kz-btn--accent kz-btn--block" style={{ height: 52, borderRadius: 10, fontSize: 15 }}>
            Save landmark answers
          </button>
          <div style={{ textAlign: "center", marginTop: 8, fontSize: 11.5, color: "var(--kz-ink-3)" }}>
            Or <span style={{ color: "var(--kz-accent)", fontWeight: 600 }}>try GPS again</span> when you're outside.
          </div>
        </div>
      </div>
    </Phone>
  );
}

/* ── S4 · OTP wrong number / fail ────────────────────── */
function S4OTPFail() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 22px 0", flex: 1, display: "flex", flexDirection: "column" }}>
          <button style={{ width: 36, height: 36, borderRadius: 999, border: 0, background: "transparent", display: "grid", placeItems: "center", marginLeft: -8, color: "var(--kz-ink)", cursor: "pointer" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>

          <div style={{ fontSize: 11, color: "var(--kz-warn)", fontFamily: "IBM Plex Mono", fontWeight: 700, letterSpacing: 0.1, textTransform: "uppercase", marginTop: 14 }}>
            Code didn't arrive
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1, marginTop: 6 }}>
            We sent it 3 minutes ago. Sometimes the network is slow.
          </h1>

          {/* Why it might have failed */}
          <div style={{ marginTop: 18, padding: "12px 14px", background: "var(--kz-bg-2)", borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, marginBottom: 8 }}>
              Things to try
            </div>
            {[
              "Check for a recent SMS from Kura Zetu.",
              "Make sure +254 712 345 678 is the right number.",
              "Walk outside or toward a window — better signal.",
              "Wait a few more minutes — SMS can be delayed.",
            ].map((t, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "4px 0", fontSize: 12.5, color: "var(--kz-ink-2)" }}>
                <div style={{ color: "var(--kz-accent)", flex: "0 0 auto" }}>·</div>
                <div>{t}</div>
              </div>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 10, background: "var(--kz-info-soft)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: "var(--kz-ink-2)" }}>Phone <b className="kz-mono" style={{ color: "var(--kz-ink)" }}>+254 712 345 678</b></div>
            <button style={{ background: "transparent", border: 0, color: "var(--kz-accent)", fontFamily: "inherit", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Change</button>
          </div>
        </div>

        <div style={{ padding: "14px 16px 14px", display: "flex", gap: 8 }}>
          <button className="kz-btn kz-btn--ghost" style={{ flex: 1, height: 50, borderRadius: 10 }}>Get help</button>
          <button className="kz-btn kz-btn--accent" style={{ flex: 1.4, height: 50, borderRadius: 10 }}>Send code again</button>
        </div>
      </div>
    </Phone>
  );
}

/* ── S5 · No nearby stations / no matches ────────────── */
function S5NoMatches() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Find your station" sub="Nanyuki · Laikipia East" />

        <div style={{ padding: "14px 14px" }}>
          <div style={{ position: "relative" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--kz-ink-3)" }}><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>
            <input style={{ width: "100%", height: 48, padding: "0 16px 0 40px", borderRadius: 12, border: "1.5px solid var(--kz-line-strong)", background: "var(--kz-bg-2)", color: "var(--kz-ink)", fontFamily: "inherit", fontSize: 15 }} value="Mwakirembe" readOnly />
          </div>
        </div>

        {/* Empty state */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 12, background: "var(--kz-bg-2)", display: "grid", placeItems: "center", border: "1px solid var(--kz-line)", marginBottom: 18 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--kz-ink-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6"/></svg>
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 }}>
            Nothing matches "Mwakirembe" near you.
          </div>
          <div style={{ fontSize: 13, color: "var(--kz-ink-2)", lineHeight: 1.55, marginTop: 8, maxWidth: 280 }}>
            Try a shorter name, or the school motto. Stations can also be listed under their old names.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 22, width: "100%" }}>
            <button className="kz-btn kz-btn--accent kz-btn--block" style={{ height: 50, borderRadius: 10 }}>
              Search by code instead
            </button>
            <button className="kz-btn kz-btn--ghost kz-btn--block" style={{ height: 50, borderRadius: 10 }}>
              Browse all in Nanyuki ward
            </button>
            <button style={{ background: "transparent", border: 0, color: "var(--kz-accent)", fontFamily: "inherit", fontSize: 13, fontWeight: 600, marginTop: 4, cursor: "pointer" }}>
              Report a missing station →
            </button>
          </div>
        </div>
      </div>
    </Phone>
  );
}

/* ── S6 · No Community Notes yet ─────────────────────── */
function S6NoNotes() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Community Notes" sub="Likii Primary · Stream 1" />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px 24px", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: 14, background: "var(--kz-bg-2)", display: "grid", placeItems: "center", border: "1px solid var(--kz-line)", marginBottom: 18 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--kz-ink-3)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 01-1.0 4 8.5 8.5 0 01-7.6 4.6 8.4 8.4 0 01-4-1l-5 1.5 1.6-4.7A8.4 8.4 0 013 11.5 8.5 8.5 0 0111.5 3a8.4 8.4 0 016 2.5 8.5 8.5 0 013.5 6z"/></svg>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 }}>
            Quiet here.
          </div>
          <div style={{ fontSize: 13, color: "var(--kz-ink-2)", lineHeight: 1.55, marginTop: 8, maxWidth: 280 }}>
            No notes yet for this station. Notes are for flagging issues with the Form 34A — like missing signatures or numbers that don't add up.
          </div>

          <button className="kz-btn kz-btn--accent kz-btn--block" style={{ height: 50, borderRadius: 10, marginTop: 22 }}>
            Add the first note
          </button>
          <button style={{ background: "transparent", border: 0, color: "var(--kz-ink-3)", fontFamily: "inherit", fontSize: 12.5, marginTop: 10, cursor: "pointer", textDecoration: "underline" }}>
            What counts as a note?
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── S7 · Discard draft confirm (sheet) ──────────────── */
function S7DiscardDraft() {
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column", position: "relative" }}>
        {/* Background — the review screen, dimmed */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.35, pointerEvents: "none" }}>
          <ScreenHeader title="Review and submit" sub="Step 4 of 4" />
          <div style={{ padding: "16px 18px 6px" }}>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 }}>
              What you'll publish to the public tally.
            </div>
          </div>
          <div style={{ margin: "14px 14px 0", padding: "14px 14px", background: "var(--kz-bg-2)", borderRadius: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Likii Primary School · Stream 1</div>
            <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "var(--kz-ink-3)", marginTop: 2 }}>
              031164082006901 · Laikipia East
            </div>
          </div>
        </div>

        {/* Dim layer */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(13,28,31,0.6)", backdropFilter: "blur(4px)" }} />

        {/* Confirm sheet bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--kz-bg-2)", padding: "20px 22px 18px", borderRadius: "20px 20px 0 0", border: "1px solid var(--kz-line)", borderBottom: 0 }}>
          <div style={{ width: 38, height: 4, borderRadius: 2, background: "var(--kz-line-strong)", margin: "0 auto 16px" }} />
          <div style={{ fontSize: 11, color: "var(--kz-danger)", fontFamily: "IBM Plex Mono", fontWeight: 700, letterSpacing: 0.1, textTransform: "uppercase", marginBottom: 6 }}>
            Discard this draft?
          </div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 }}>
            You'll lose the photos and the typed-in numbers.
          </div>
          <div style={{ fontSize: 12.5, color: "var(--kz-ink-2)", lineHeight: 1.5, marginTop: 8 }}>
            Captured 21:34 · 2 photos · 2.6 MB. We won't publish anything. Discarding only removes it from your phone.
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button className="kz-btn kz-btn--ghost" style={{ flex: 1, height: 52, borderRadius: 10 }}>Keep draft</button>
            <button style={{ flex: 1.2, height: 52, borderRadius: 10, border: 0, background: "var(--kz-danger)", color: "#fff", fontFamily: "inherit", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              Yes, discard
            </button>
          </div>
        </div>
      </div>
    </Phone>
  );
}

/* ── S8 · Account recovery (12-word phrase) ──────────── */
function S8Recovery() {
  const words = ["mvua", "kura", "askari", "shamba", "njia", "macho", "moto", "ndege", "samaki", "jiwe", "mtoto", "barabara"];
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Recovery phrase" sub="Save this. We can't get it back." />

        <div style={{ padding: "18px 18px 6px" }}>
          <div style={{ fontSize: 11, color: "var(--kz-warn)", fontFamily: "IBM Plex Mono", fontWeight: 700, letterSpacing: 0.1, textTransform: "uppercase" }}>
            Important
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.15, marginTop: 4 }}>
            12 words. Write them down on paper, in order.
          </div>
          <div style={{ fontSize: 12.5, color: "var(--kz-ink-2)", lineHeight: 1.5, marginTop: 8 }}>
            If you lose this phone or your SIM card, these words are the only way back into your contributions. Don't screenshot, don't share, don't save in WhatsApp.
          </div>
        </div>

        {/* Grid of words */}
        <div style={{ margin: "16px 16px 0", padding: "14px 14px", background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {words.map((w, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "8px 10px", background: "var(--kz-bg)", borderRadius: 6 }}>
                <span className="kz-mono" style={{ fontSize: 10, color: "var(--kz-ink-3)", width: 16 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 13.5, fontWeight: 600, color: "var(--kz-ink)" }}>{w}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: "12px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, color: "var(--kz-ink-3)" }}>
          <span>Copy isn't allowed.</span>
          <span style={{ fontFamily: "IBM Plex Mono", letterSpacing: 0.04 }}>kzr · v1 · BIP-39 wordlist (sw)</span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "14px 16px 14px", display: "flex", gap: 8 }}>
          <button className="kz-btn kz-btn--ghost" style={{ flex: 1, height: 52, borderRadius: 10 }}>Show next time</button>
          <button className="kz-btn kz-btn--accent" style={{ flex: 1.4, height: 52, borderRadius: 10 }}>I've written it down →</button>
        </div>
      </div>
    </Phone>
  );
}

function EdgeStatesSection() {
  return (
    <DCSection id="11-edge-states" title="Edge states · what was missing"
      subtitle="8 screens added after the review-debate: permission-denied paths, GPS fallback, OTP fail, empty states, destructive-action confirm, account recovery.">
      <DCArtboard id="loc-deny" label="S1 · Location denied" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><S1LocationDenied /></div>
      </DCArtboard>
      <DCArtboard id="cam-deny" label="S2 · Camera denied" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><S2CameraDenied /></div>
      </DCArtboard>
      <DCArtboard id="gps-poor" label="S3 · GPS poor → landmark mode" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><S3GPSPoor /></div>
      </DCArtboard>
      <DCArtboard id="otp-fail" label="S4 · OTP didn't arrive" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><S4OTPFail /></div>
      </DCArtboard>
      <DCArtboard id="no-matches" label="S5 · No matches" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><S5NoMatches /></div>
      </DCArtboard>
      <DCArtboard id="no-notes" label="S6 · No notes yet" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><S6NoNotes /></div>
      </DCArtboard>
      <DCArtboard id="discard" label="S7 · Discard draft" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><S7DiscardDraft /></div>
      </DCArtboard>
      <DCArtboard id="recovery" label="S8 · Recovery phrase" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><S8Recovery /></div>
      </DCArtboard>

      <DCPostIt top={-12} right={60} rotate={2} width={250}>
        Permission paths are <i>two-door</i> not one — every "denied" screen offers a graceful manual path so a rural user without GPS or camera permission can still contribute. Recovery phrase is a Kiswahili BIP-39 wordlist subset, written on paper. Discard draft uses a destructive-confirm sheet, never a one-tap kill.
      </DCPostIt>
    </DCSection>
  );
}

window.EdgeStatesSection = EdgeStatesSection;
