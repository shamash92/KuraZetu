/* global React, DCSection, DCArtboard, DCPostIt, Phone, ScreenHeader, KenyaHexMap */
// Section 07 — Results dashboards (mobile).
// 5 screens: national, station detail with race-type tabs, community
// notes list, community notes submit, low-connectivity / stale state.

/* ── 1 · National — race-type tabs + map + leaderboard ─── */
function R1National() {
  const tabs = ["President", "Governor", "Senator", "Woman Rep", "MP", "MCA"];
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader back={false} title="Kenya" sub="Live · 4 min ago · 68.8% reporting" action={
          <button style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--kz-line)", color: "var(--kz-ink)", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>
          </button>
        }/>

        {/* Race tabs */}
        <div style={{ borderBottom: "1px solid var(--kz-line)", overflowX: "auto", whiteSpace: "nowrap" }}>
          <div style={{ display: "inline-flex", padding: "0 12px" }}>
            {tabs.map((t, i) => (
              <div key={t} style={{
                padding: "12px 14px",
                fontSize: 12.5, fontWeight: i === 0 ? 700 : 500,
                color: i === 0 ? "var(--kz-ink)" : "var(--kz-ink-3)",
                borderBottom: "2px solid " + (i === 0 ? "var(--kz-accent)" : "transparent"),
                marginBottom: -1,
                cursor: "pointer",
              }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="kz-watermark" style={{ height: 200, position: "relative", padding: "12px 14px 0" }}>
          <KenyaHexMap selected="Lkp" />
        </div>

        {/* Leaderboard */}
        <div style={{ padding: "8px 14px 0" }}>
          {[
            ["J. E. LONGOGGY", "Thirdway Alliance", 47.2, "var(--kz-cand-1)", "9,652,341"],
            ["UHURU MUIGAI", "Jubilee Party", 33.6, "var(--kz-cand-2)", "6,872,210"],
            ["RAILA AMOLO", "ODM", 14.1, "var(--kz-cand-3)", "2,883,994"],
            ["KAVINGA, J.", "Independent", 2.1, "var(--kz-cand-other)", "429,000"],
            ["+ 5 others", "", 3.0, "var(--kz-ink-3)", "612,210"],
          ].map(([n, p, pct, col, votes], i) => (
            <div key={n} style={{ padding: "8px 0", borderBottom: i < 4 ? "1px solid var(--kz-line)" : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ width: 8, height: 22, background: col, borderRadius: 1, flex: "0 0 auto" }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700 }}>{n}</div>
                    {p && <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)" }}>{p}</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="kz-mono" style={{ fontSize: 15, fontWeight: 700, color: "var(--kz-ink)" }}>{pct}%</div>
                  <div className="kz-mono" style={{ fontSize: 10, color: "var(--kz-ink-3)" }}>{votes}</div>
                </div>
              </div>
              <div style={{ height: 3, background: "var(--kz-bg-2)", marginTop: 6, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: pct + "%", height: "100%", background: col }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "10px 14px 14px", borderTop: "1px solid var(--kz-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "var(--kz-ink-3)", letterSpacing: 0.06 }}>
            54.2% community-verified
          </div>
          <button style={{ background: "var(--kz-accent)", color: "var(--kz-accent-ink)", border: 0, padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
            Find my station
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── 2 · Station detail w/ tabs ─────────────────────────── */
function R2Station() {
  const tabs = ["President", "Governor", "Senator", "MP", "MCA"];
  const rows = [
    ["LONGOGGY, J. E.", "Thirdway Alliance", 236, 44.3, "var(--kz-cand-1)"],
    ["UHURU, M.", "Jubilee Party", 188, 35.3, "var(--kz-cand-2)"],
    ["RAILA, A.", "ODM", 94, 17.6, "var(--kz-cand-3)"],
    ["KAVINGA, J.", "Independent", 12, 2.3, "var(--kz-cand-other)"],
    ["Rejected", "", 3, 0.5, "var(--kz-ink-3)"],
  ];
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Likii Primary School" sub="Kenya › Laikipia › East · Stream 1" />

        <div style={{ padding: "12px 18px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span className="kz-badge kz-badge--community">Community-verified</span>
            <span style={{ fontSize: 10.5, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>3 submissions match</span>
          </div>
          <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "var(--kz-ink-3)", marginTop: 8 }}>
            031164082006901 · 577 voters · 533 cast
          </div>
        </div>

        {/* Race tabs */}
        <div style={{ borderBottom: "1px solid var(--kz-line)", overflowX: "auto", whiteSpace: "nowrap", marginTop: 14 }}>
          <div style={{ display: "inline-flex", padding: "0 14px" }}>
            {tabs.map((t, i) => (
              <div key={t} style={{
                padding: "12px 12px",
                fontSize: 12.5, fontWeight: i === 0 ? 700 : 500,
                color: i === 0 ? "var(--kz-ink)" : "var(--kz-ink-3)",
                borderBottom: "2px solid " + (i === 0 ? "var(--kz-accent)" : "transparent"),
                marginBottom: -1,
              }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div style={{ padding: "10px 14px" }}>
          {rows.map(([name, party, votes, pct, col], i) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: i < 4 ? "1px solid var(--kz-line)" : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  <span style={{ width: 6, height: 22, background: col, borderRadius: 1, flex: "0 0 auto" }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
                    {party && <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)" }}>{party}</div>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div className="kz-mono" style={{ fontSize: 15, fontWeight: 700 }}>{votes}</div>
                  <div className="kz-mono" style={{ fontSize: 10, color: "var(--kz-ink-3)" }}>{pct}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Form 34A receipt */}
        <div style={{ margin: "0 14px", padding: "12px 14px", background: "var(--kz-bg-2)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 42, background: "repeating-linear-gradient(0deg, var(--kz-line) 0, var(--kz-line) 2px, var(--kz-bg) 2px, var(--kz-bg) 5px)", borderRadius: 3, flex: "0 0 auto" }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Form 34A · 2 pages</div>
            <div style={{ fontSize: 10, fontFamily: "IBM Plex Mono", color: "var(--kz-ink-3)" }}>by @n   m · 9 Aug 21:34</div>
          </div>
          <button className="kz-btn kz-btn--ghost" style={{ height: 36, padding: "0 12px", borderRadius: 6, fontSize: 12 }}>
            View
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--kz-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button style={{ background: "transparent", border: 0, color: "var(--kz-ink-3)", fontSize: 12, fontFamily: "inherit", cursor: "pointer", textDecoration: "underline" }}>
            Something looks wrong
          </button>
          <button style={{ background: "transparent", border: "1px solid var(--kz-line)", color: "var(--kz-ink-2)", fontSize: 12, fontFamily: "inherit", padding: "6px 12px", borderRadius: 6, cursor: "pointer" }}>
            Notes · 2
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── 3 · Community Notes — list ─────────────────────────── */
function R3Notes() {
  const notes = [
    { who: "@m      4", weight: 0.84, when: "1 h", reason: "Numbers don't add up", body: "Total cast = 533, but presidential votes sum to 530. Three missing somewhere on page 1." },
    { who: "@f   n", weight: 0.62, when: "3 h", reason: "Signatures missing", body: "No agent signature on page 2 — usually a procedural issue but worth flagging." },
    { who: "@c     4", weight: 0.18, when: "8 h", reason: "Possible irregularity", body: "Numbers seem high for this station compared to past elections.", flagged: true },
  ];
  return (
    <Phone dark>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Community Notes" sub="Likii Primary · Stream 1" />

        {/* Summary */}
        <div style={{ padding: "14px 18px 4px" }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>2 verified notes · 1 hidden</div>
          <div style={{ fontSize: 12, color: "var(--kz-ink-2)", marginTop: 4, lineHeight: 1.5 }}>
            Notes ranked by verification weight. We show notes from contributors with a track record. Low-weight or unsupported notes are hidden by default.
          </div>
        </div>

        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          {notes.map((n, i) => (
            <div key={i} style={{ background: n.flagged ? "transparent" : "var(--kz-bg-2)", border: "1px solid " + (n.flagged ? "var(--kz-line)" : "var(--kz-line)"), borderRadius: 12, padding: "12px 14px", opacity: n.flagged ? 0.5 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontFamily: "IBM Plex Mono", color: "var(--kz-warn)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.08 }}>
                    {n.reason}
                  </span>
                </div>
                <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>
                  weight {n.weight}
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--kz-ink)", lineHeight: 1.45 }}>
                {n.body}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div style={{ fontSize: 10.5, fontFamily: "IBM Plex Mono", color: "var(--kz-ink-3)" }}>
                  {n.who} · {n.when}
                </div>
                <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--kz-ink-3)" }}>
                  <span>Useful · 8</span>
                  <span>Disagree · 1</span>
                </div>
              </div>
              {n.flagged && (
                <div style={{ marginTop: 8, padding: "8px 10px", background: "var(--kz-danger-soft)", borderRadius: 6, fontSize: 11.5, color: "var(--kz-ink-2)", lineHeight: 1.4 }}>
                  Hidden by community. Tap to show.
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "12px 14px", borderTop: "1px solid var(--kz-line)" }}>
          <button className="kz-btn kz-btn--accent kz-btn--block" style={{ height: 50, borderRadius: 10 }}>
            Add a note
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── 4 · Community Notes — submit a note ────────────────── */
function R4Flag() {
  const reasons = [
    ["Blurry photo", "📷"],
    ["Numbers don't add up", "Σ"],
    ["Signatures missing", "✎"],
    ["Duplicate submission", "≡"],
    ["Possible irregularity", "!"],
    ["Other (write your own)", "+"],
  ];
  return (
    <Phone dark keyboard>
      <div className="kz-disclaimer">Citizen tally · Not IEBC</div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader title="Report a problem" sub="Likii Primary · Stream 1" />

        <div style={{ padding: "14px 18px 6px" }}>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
            Pick one reason. Add detail if you can.
          </div>
          <div style={{ fontSize: 12, color: "var(--kz-ink-2)", marginTop: 6, lineHeight: 1.5 }}>
            Notes are public. Your username appears; your phone number doesn't.
          </div>
        </div>

        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          {reasons.map(([r, sym], i) => (
            <div key={r} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: i === 1 ? "var(--kz-bg-2)" : "transparent", border: "1px solid " + (i === 1 ? "var(--kz-accent)" : "var(--kz-line)"), borderRadius: 10 }}>
              <div style={{ width: 28, height: 28, background: "var(--kz-bg-2)", borderRadius: 6, display: "grid", placeItems: "center", fontFamily: "IBM Plex Mono", fontSize: 13, fontWeight: 700, color: "var(--kz-ink-2)", flex: "0 0 auto" }}>
                {sym}
              </div>
              <div style={{ fontSize: 13.5, color: "var(--kz-ink)", fontWeight: i === 1 ? 600 : 500, flex: 1 }}>
                {r}
              </div>
              <div style={{ width: 18, height: 18, borderRadius: 9, border: "1.5px solid " + (i === 1 ? "var(--kz-accent)" : "var(--kz-line-strong)"), background: i === 1 ? "var(--kz-accent)" : "transparent", display: "grid", placeItems: "center" }}>
                {i === 1 && <div style={{ width: 6, height: 6, borderRadius: 3, background: "var(--kz-accent-ink)" }} />}
              </div>
            </div>
          ))}
        </div>

        {/* Detail field */}
        <div style={{ padding: "8px 14px 0" }}>
          <textarea readOnly value="Total cast = 533 but president votes sum to 530."
            style={{
              width: "100%", height: 70,
              padding: "10px 12px", boxSizing: "border-box",
              borderRadius: 10, border: "1.5px solid var(--kz-line-strong)",
              background: "var(--kz-bg-2)", color: "var(--kz-ink)",
              fontFamily: "inherit", fontSize: 13, lineHeight: 1.45,
              resize: "none",
            }} />
        </div>

        <div style={{ flex: 1 }} />
        <div style={{ padding: "12px 14px" }}>
          <button className="kz-btn kz-btn--accent kz-btn--block" style={{ height: 50, borderRadius: 10 }}>
            Submit note
          </button>
        </div>
      </div>
    </Phone>
  );
}

/* ── 5 · Low-connectivity stale data ─────────────────────── */
function R5Stale() {
  return (
    <Phone dark>
      <div className="kz-disclaimer" style={{ background: "var(--kz-warn-soft)", color: "var(--kz-warn)" }}>
        Offline · Last refresh 14 min ago · Not IEBC
      </div>
      <div style={{ background: "var(--kz-bg)", flex: 1, color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui", display: "flex", flexDirection: "column" }}>
        <ScreenHeader back={false} title="Kenya" sub="Showing stale data" action={
          <button style={{ width: 36, height: 36, borderRadius: 8, background: "transparent", border: "1px solid var(--kz-line)", color: "var(--kz-ink)", display: "grid", placeItems: "center", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 8v4l3 2"/></svg>
          </button>
        }/>

        {/* prominent stale banner */}
        <div style={{ margin: "12px 14px 0", padding: "14px 14px", background: "var(--kz-warn-soft)", borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: "var(--kz-warn)", fontWeight: 700, letterSpacing: 0.08, textTransform: "uppercase", fontFamily: "IBM Plex Mono", marginBottom: 6 }}>
            You're offline
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--kz-ink)", lineHeight: 1.4 }}>
            Showing the last numbers we saved 14 minutes ago.
          </div>
          <div style={{ fontSize: 12, color: "var(--kz-ink-2)", lineHeight: 1.5, marginTop: 6 }}>
            New tallies will appear automatically when your connection returns. No spinner — we'll just refresh.
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="kz-btn kz-btn--ghost" style={{ flex: 1, height: 42, borderRadius: 8, fontSize: 12 }}>
              View saved snapshot
            </button>
            <button className="kz-btn kz-btn--accent" style={{ flex: 1, height: 42, borderRadius: 8, fontSize: 12 }}>
              Try again
            </button>
          </div>
        </div>

        {/* Faded data */}
        <div style={{ padding: "10px 14px 0", opacity: 0.65 }}>
          <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700, marginBottom: 8 }}>
            As of 21:20 · Stale
          </div>
          {[
            ["LONGOGGY", 47.2, "var(--kz-cand-1)"],
            ["UHURU", 33.6, "var(--kz-cand-2)"],
            ["RAILA", 14.1, "var(--kz-cand-3)"],
          ].map(([n, p, col]) => (
            <div key={n} style={{ padding: "6px 0", borderBottom: "1px solid var(--kz-line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 6, height: 18, background: col, borderRadius: 1 }} />
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{n}</div>
                </div>
                <div className="kz-mono" style={{ fontSize: 15, fontWeight: 700 }}>{p}%</div>
              </div>
              <div style={{ height: 3, background: "var(--kz-bg-2)", marginTop: 4, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: p + "%", height: "100%", background: col }} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ padding: "10px 14px 14px", borderTop: "1px solid var(--kz-line)", background: "var(--kz-bg-2)" }}>
          <div style={{ fontSize: 11, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", letterSpacing: 0.06 }}>
            Background sync is ON. We'll refresh as soon as your network returns.
          </div>
        </div>
      </div>
    </Phone>
  );
}

function ResultsSection() {
  return (
    <DCSection id="07-results" title="Results · mobile" subtitle="National → station drill, race-type tabs, Community Notes (ranked + author-private), low-connectivity stale state.">
      <DCArtboard id="nat" label="1 · National" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><R1National /></div>
      </DCArtboard>
      <DCArtboard id="station" label="2 · Station + race tabs" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><R2Station /></div>
      </DCArtboard>
      <DCArtboard id="notes" label="3 · Community Notes" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><R3Notes /></div>
      </DCArtboard>
      <DCArtboard id="flag" label="4 · Add a note" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><R4Flag /></div>
      </DCArtboard>
      <DCArtboard id="stale" label="5 · Offline / stale" width={360} height={640}>
        <div data-brand="ramani" style={{ height: "100%" }}><R5Stale /></div>
      </DCArtboard>

      <DCPostIt top={-12} right={60} rotate={2} width={240}>
        Race-type tabs on every results view (President / Gov / Sen / WR / MP / MCA). Community Notes ranked by contributor track-record, low-weight hidden by default. Offline state shows last-saved numbers at 65% opacity so the user knows they're stale.
      </DCPostIt>
    </DCSection>
  );
}

window.ResultsSection = ResultsSection;
