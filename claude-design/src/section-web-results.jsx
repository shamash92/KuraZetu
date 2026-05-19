/* global React, DCSection, DCArtboard, DCPostIt, ChromeWindow, KenyaHexMap */
// Section 08 — Web results dashboard (desktop).
// Two artboards: the National view (default landing) and a Station
// detail page. Both wrapped in a browser chrome.

/* ── Reused wordmark for nav ─────────────────────────────── */
function WebWordmark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="var(--kz-ink)" />
        <path d="M9 12l2 2 4-4" stroke="var(--kz-bg)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="19" cy="5" r="2.2" fill="var(--kz-accent)" />
      </svg>
      <div style={{ fontSize: 17, fontWeight: 800, color: "var(--kz-ink)", letterSpacing: -0.4 }}>
        Kura Zetu
      </div>
    </div>
  );
}

/* ── Web page wrapper (Ramani themed) ────────────────────── */
function WebPage({ children }) {
  return (
    <div style={{ background: "var(--kz-bg)", minHeight: "100%", color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui" }}>
      {/* Persistent disclaimer strip */}
      <div style={{ background: "var(--kz-bg-2)", borderBottom: "1px solid var(--kz-line)", padding: "6px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "IBM Plex Mono", fontSize: 10.5, color: "var(--kz-warn)", letterSpacing: 0.08, textTransform: "uppercase", fontWeight: 600 }}>
        <span>Citizen tally · This is not an IEBC system</span>
        <span style={{ color: "var(--kz-ink-3)" }}>Live · 4 min ago · 68.8% of 46,231 stations reporting</span>
      </div>
      {children}
    </div>
  );
}

/* ── Nav ─────────────────────────────────────────────────── */
function WebNav({ active = "Results" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, padding: "16px 24px", borderBottom: "1px solid var(--kz-line)" }}>
      <WebWordmark />
      <div style={{ display: "flex", gap: 4, marginLeft: 18 }}>
        {["Results", "PinVerify", "Contribute", "About", "API"].map((t) => (
          <div key={t} style={{
            padding: "8px 12px", fontSize: 13.5, fontWeight: active === t ? 700 : 500,
            color: active === t ? "var(--kz-ink)" : "var(--kz-ink-2)",
            borderRadius: 6, cursor: "pointer",
            background: active === t ? "var(--kz-bg-2)" : "transparent",
          }}>{t}</div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ position: "relative", width: 320 }}>
        <input placeholder="Search station, ward, or constituency"
          style={{
            width: "100%", height: 36, padding: "0 12px 0 36px", boxSizing: "border-box",
            background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)",
            borderRadius: 6, color: "var(--kz-ink)", fontFamily: "inherit", fontSize: 13,
          }}/>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--kz-ink-3)" }}><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, fontFamily: "IBM Plex Mono", color: "var(--kz-success)", padding: "4px 10px", background: "var(--kz-success-soft)", borderRadius: 4, fontWeight: 600 }}>
          You · @njokim
        </span>
      </div>
    </div>
  );
}

/* ── Race tabs ──────────────────────────────────────────── */
function RaceTabs({ active = "President" }) {
  return (
    <div style={{ display: "flex", gap: 0, padding: "0 24px", borderBottom: "1px solid var(--kz-line)" }}>
      {["President", "Governor", "Senator", "Woman Rep", "MP", "MCA"].map((t) => (
        <div key={t} style={{
          padding: "14px 18px",
          fontSize: 13, fontWeight: active === t ? 700 : 500,
          color: active === t ? "var(--kz-ink)" : "var(--kz-ink-3)",
          borderBottom: "2px solid " + (active === t ? "var(--kz-accent)" : "transparent"),
          cursor: "pointer", marginBottom: -1,
        }}>
          {t} {active === t && <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: "var(--kz-ink-3)", marginLeft: 6 }}>· 47K stations</span>}
        </div>
      ))}
    </div>
  );
}

/* ── National (default landing) ─────────────────────────── */
function WebResultsNational() {
  return (
    <WebPage>
      <WebNav active="Results" />
      <RaceTabs active="President" />

      {/* Hero */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24, padding: "24px" }}>
        {/* Left column */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700 }}>
                Kenya · President · Aug 2027
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.0, marginTop: 6 }}>
                National tally
              </div>
            </div>
            <div style={{ textAlign: "right", fontFamily: "IBM Plex Mono", fontSize: 11, color: "var(--kz-ink-3)" }}>
              <div>Last updated <b style={{ color: "var(--kz-ink-2)" }}>21:34 EAT</b></div>
              <div>Refreshes every 30 s</div>
            </div>
          </div>

          {/* Leader callout */}
          <div className="kz-watermark" style={{ marginTop: 18, background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--kz-cand-1)", fontFamily: "IBM Plex Mono", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700 }}>
                  Leading nationally
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -0.5, marginTop: 4 }}>
                  J. E. LONGOGGY
                </div>
                <div style={{ fontSize: 13, color: "var(--kz-ink-2)", marginTop: 2 }}>
                  Thirdway Alliance Kenya
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="kz-mono" style={{ fontSize: 56, fontWeight: 700, letterSpacing: -0.05, color: "var(--kz-ink)", lineHeight: 0.9 }}>
                  47.2<span style={{ fontSize: 20, color: "var(--kz-ink-2)" }}>%</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--kz-ink-2)", fontFamily: "IBM Plex Mono", marginTop: 4 }}>
                  9,652,341 votes
                </div>
              </div>
            </div>

            {/* Stacked bar */}
            <div style={{ height: 12, display: "flex", background: "var(--kz-bg)", borderRadius: 4, overflow: "hidden", marginTop: 18 }}>
              {[
                [47.2, "var(--kz-cand-1)"],
                [33.6, "var(--kz-cand-2)"],
                [14.1, "var(--kz-cand-3)"],
                [5.1, "var(--kz-cand-other)"],
              ].map(([p, c], i) => (
                <div key={i} style={{ width: p + "%", height: "100%", background: c }} />
              ))}
            </div>

            {/* Reporting / verified split */}
            <div style={{ display: "flex", gap: 18, marginTop: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700 }}>Stations reporting</div>
                <div className="kz-mono" style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>31,847 / 46,231</div>
                <div style={{ height: 3, background: "var(--kz-bg)", marginTop: 6, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: "68.8%", height: "100%", background: "var(--kz-accent)" }} />
                </div>
                <div style={{ fontSize: 10.5, color: "var(--kz-accent)", marginTop: 4, fontFamily: "IBM Plex Mono", fontWeight: 600 }}>68.8% reported</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700 }}>Community-verified</div>
                <div className="kz-mono" style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>25,065 / 46,231</div>
                <div style={{ height: 3, background: "var(--kz-bg)", marginTop: 6, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ width: "54.2%", height: "100%", background: "var(--kz-success)" }} />
                </div>
                <div style={{ fontSize: 10.5, color: "var(--kz-success)", marginTop: 4, fontFamily: "IBM Plex Mono", fontWeight: 600 }}>54.2% verified</div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="kz-watermark" style={{ marginTop: 18, background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 14, padding: "18px 20px 14px", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700 }}>
                  Leading by county
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>
                  47 counties · drill down by clicking
                </div>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
                {[
                  ["LONGOGGY", "var(--kz-cand-1)", "9"],
                  ["UHURU", "var(--kz-cand-2)", "21"],
                  ["RAILA", "var(--kz-cand-3)", "7"],
                  ["No data", "var(--kz-no-data)", "10"],
                ].map(([n, c, ct]) => (
                  <div key={n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 12, height: 12, background: c, borderRadius: 2 }} />
                    <span style={{ color: "var(--kz-ink)", fontWeight: 600 }}>{n}</span>
                    <span className="kz-mono" style={{ color: "var(--kz-ink-3)" }}>{ct}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: 320, position: "relative" }}>
              <KenyaHexMap selected="Lkp" />
              {/* watermark */}
              <div style={{ position: "absolute", bottom: 6, right: 8, fontFamily: "IBM Plex Mono", fontSize: 10, color: "var(--kz-ink-3)", letterSpacing: 0.08, textTransform: "uppercase", opacity: 0.6 }}>
                kurazetu · citizen tally
              </div>
            </div>
          </div>

          {/* Candidate leaderboard table */}
          <div className="kz-watermark" style={{ marginTop: 18, background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700 }}>
                All candidates · President
              </div>
            </div>
            {[
              ["1", "J. E. LONGOGGY", "Thirdway Alliance", 47.2, "9,652,341", "var(--kz-cand-1)", "+0.3"],
              ["2", "UHURU MUIGAI", "Jubilee Party", 33.6, "6,872,210", "var(--kz-cand-2)", "−0.2"],
              ["3", "RAILA AMOLO", "ODM", 14.1, "2,883,994", "var(--kz-cand-3)", "+0.1"],
              ["4", "JAPHETH KAVINGA", "Independent", 2.1, "429,000", "var(--kz-cand-other)", "—"],
              ["5", "MICHAEL WAINAINA", "Independent", 1.7, "347,500", "var(--kz-cand-other)", "—"],
              ["—", "+ 4 others", "", 1.3, "265,710", "var(--kz-ink-3)", "—"],
            ].map(([rank, name, party, pct, votes, col, delta], i, arr) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "32px 1fr 1fr 80px 100px 80px", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--kz-line)" : 0, fontSize: 13 }}>
                <div className="kz-mono" style={{ color: "var(--kz-ink-3)", fontWeight: 600 }}>{rank}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 4, height: 22, background: col, borderRadius: 1 }} />
                  <div style={{ fontWeight: 700 }}>{name}</div>
                </div>
                <div style={{ color: "var(--kz-ink-2)", fontSize: 12 }}>{party}</div>
                <div className="kz-mono" style={{ fontWeight: 700, textAlign: "right" }}>{pct}%</div>
                <div className="kz-mono" style={{ color: "var(--kz-ink-2)", textAlign: "right" }}>{votes}</div>
                <div className="kz-mono" style={{ color: delta.startsWith("+") ? "var(--kz-success)" : delta.startsWith("−") ? "var(--kz-warn)" : "var(--kz-ink-3)", textAlign: "right" }}>{delta}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Activity feed */}
          <div style={{ background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, marginBottom: 12 }}>
              Recent community activity
            </div>
            {[
              { who: "@f   n", what: "verified", where: "Nyahururu Hall", when: "2 min", icon: "✓" },
              { who: "@m      4", what: "flagged", where: "Migori Sec School", when: "4 min", icon: "!" },
              { who: "@k   4", what: "submitted Form 34A", where: "Kabarnet Polytechnic", when: "6 min", icon: "+" },
              { who: "@c  r", what: "verified", where: "Likii Primary · Stream 1", when: "12 min", icon: "✓" },
              { who: "@s    w", what: "disputed pin", where: "Old Naivasha Hall", when: "18 min", icon: "?" },
              { who: "@n   m", what: "verified", where: "Eron Primary", when: "22 min", icon: "✓" },
            ].map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: i < 5 ? "1px solid var(--kz-line)" : 0 }}>
                <div style={{ width: 22, height: 22, borderRadius: 4, background: "var(--kz-bg)", color: "var(--kz-accent)", display: "grid", placeItems: "center", flex: "0 0 auto", fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 700 }}>{a.icon}</div>
                <div style={{ flex: 1, fontSize: 12.5, lineHeight: 1.4 }}>
                  <span className="kz-mono" style={{ color: "var(--kz-accent)" }}>{a.who}</span>
                  <span style={{ color: "var(--kz-ink-2)" }}> {a.what} </span>
                  <b>{a.where}</b>
                  <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", marginTop: 2 }}>{a.when} ago</div>
                </div>
              </div>
            ))}
          </div>

          {/* Trending notes */}
          <div style={{ background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 14, padding: "16px 18px", marginTop: 18 }}>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, marginBottom: 12 }}>
              Trending Community Notes
            </div>
            {[
              { where: "Nairobi · 12 stations", what: "Numbers don't add up", weight: 0.84 },
              { where: "Kisumu Central", what: "Signatures missing", weight: 0.78 },
              { where: "Mombasa · CBD", what: "Two streams in one form", weight: 0.71 },
              { where: "Eldoret North", what: "Wrong stream code", weight: 0.55 },
            ].map((n, i, arr) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--kz-line)" : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: "var(--kz-warn)", fontFamily: "IBM Plex Mono", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.06 }}>
                    {n.what}
                  </span>
                  <span style={{ fontSize: 10.5, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>w {n.weight}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--kz-ink)" }}>{n.where}</div>
              </div>
            ))}
            <button style={{ width: "100%", marginTop: 10, background: "transparent", border: "1px solid var(--kz-line)", color: "var(--kz-ink-2)", padding: "8px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              All notes →
            </button>
          </div>

          {/* Find my station */}
          <div style={{ background: "var(--kz-accent)", color: "var(--kz-accent-ink)", borderRadius: 14, padding: "16px 18px", marginTop: 18 }}>
            <div style={{ fontSize: 11, fontFamily: "IBM Plex Mono", letterSpacing: 0.08, fontWeight: 700, textTransform: "uppercase", opacity: 0.8 }}>
              See your station
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, marginTop: 4, lineHeight: 1.2 }}>
              Find your polling station and see its tally.
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <input placeholder="School or area name" style={{ flex: 1, height: 38, padding: "0 12px", boxSizing: "border-box", background: "rgba(0,0,0,0.12)", border: 0, borderRadius: 6, color: "var(--kz-accent-ink)", fontFamily: "inherit", fontSize: 13 }} />
              <button style={{ height: 38, padding: "0 14px", background: "var(--kz-ink)", color: "var(--kz-bg)", border: 0, borderRadius: 6, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
                Find
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "20px 24px", borderTop: "1px solid var(--kz-line)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11.5, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", letterSpacing: 0.04 }}>
        <div>kurazetu · open source · MIT · github.com/shamash92/kurazetu</div>
        <div>Updated 9 Aug 2027 21:34 EAT · Powered by Kiongozi · Data from community</div>
      </div>
    </WebPage>
  );
}

/* ── Station detail page ───────────────────────────────── */
function WebResultsStation() {
  return (
    <WebPage>
      <WebNav active="Results" />

      {/* Breadcrumb */}
      <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--kz-line)", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", letterSpacing: 0.04, textTransform: "uppercase", fontWeight: 600 }}>
        <span>Kenya</span><span>›</span>
        <span>Laikipia</span><span>›</span>
        <span>Laikipia East</span><span>›</span>
        <span>Nanyuki Ward</span><span>›</span>
        <span style={{ color: "var(--kz-ink)" }}>Likii Primary School · Stream 1</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, padding: "24px" }}>
        {/* Left */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span className="kz-badge kz-badge--community">Community-verified · 3 submissions match</span>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1.0 }}>
            Likii Primary School
          </div>
          <div style={{ fontSize: 13, color: "var(--kz-ink-2)", marginTop: 6 }}>
            Stream 1 · <span className="kz-mono">031164082006901</span> · 577 registered voters · 533 cast
          </div>

          {/* Race tabs */}
          <div style={{ marginTop: 18, display: "flex", borderBottom: "1px solid var(--kz-line)" }}>
            {["President", "Governor", "Senator", "Woman Rep", "MP", "MCA"].map((t, i) => (
              <div key={t} style={{
                padding: "12px 16px", fontSize: 13, fontWeight: i === 0 ? 700 : 500,
                color: i === 0 ? "var(--kz-ink)" : "var(--kz-ink-3)",
                borderBottom: "2px solid " + (i === 0 ? "var(--kz-accent)" : "transparent"),
                marginBottom: -1,
              }}>{t}</div>
            ))}
          </div>

          {/* Vote rows */}
          <div className="kz-watermark" style={{ marginTop: 16, background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 12, overflow: "hidden" }}>
            {[
              ["LONGOGGY, J. E.", "Thirdway Alliance Kenya", 236, 44.3, "var(--kz-cand-1)"],
              ["UHURU MUIGAI", "Jubilee Party", 188, 35.3, "var(--kz-cand-2)"],
              ["RAILA AMOLO", "ODM", 94, 17.6, "var(--kz-cand-3)"],
              ["KAVINGA, J.", "Independent", 12, 2.3, "var(--kz-cand-other)"],
              ["Rejected ballots", "", 3, 0.5, "var(--kz-ink-3)"],
            ].map(([n, p, v, pct, col], i, arr) => (
              <div key={n} style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "1fr 200px 100px 100px", gap: 14, alignItems: "center", borderBottom: i < arr.length - 1 ? "1px solid var(--kz-line)" : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 6, height: 28, background: col, borderRadius: 1, flex: "0 0 auto" }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{n}</div>
                    {p && <div style={{ fontSize: 11, color: "var(--kz-ink-3)" }}>{p}</div>}
                  </div>
                </div>
                <div style={{ height: 6, background: "var(--kz-bg)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: pct + "%", height: "100%", background: col }} />
                </div>
                <div className="kz-mono" style={{ fontSize: 17, fontWeight: 700, textAlign: "right" }}>{v}</div>
                <div className="kz-mono" style={{ fontSize: 12, color: "var(--kz-ink-2)", textAlign: "right" }}>{pct}%</div>
              </div>
            ))}
          </div>

          {/* Form 34A images */}
          <div style={{ marginTop: 18, background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700 }}>Source Form 34A · 2 pages</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>Captured by @n   m · 9 Aug 21:34 EAT</div>
              </div>
              <button style={{ background: "transparent", border: "1px solid var(--kz-line)", color: "var(--kz-ink-2)", padding: "8px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Download originals
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[1, 2].map((p) => (
                <div key={p} style={{ height: 220, borderRadius: 6, background: "repeating-linear-gradient(0deg, #2a2722 0, #2a2722 3px, #cdbf99 3px, #cdbf99 8px)", position: "relative", border: "1px solid var(--kz-line)" }}>
                  <div style={{ position: "absolute", top: 8, left: 8, fontSize: 11, fontFamily: "IBM Plex Mono", color: "var(--kz-bg)", background: "rgba(243,236,216,0.9)", padding: "2px 8px", borderRadius: 3, fontWeight: 700 }}>
                    Page {p}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Verification trail */}
          <div style={{ background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, marginBottom: 12 }}>
              Verification trail
            </div>
            {[
              ["@n   m", "submitted", "21:34", "var(--kz-accent)"],
              ["@m      4", "verified", "22:08", "var(--kz-success)"],
              ["@c  r", "verified", "22:14", "var(--kz-success)"],
            ].map(([who, what, when, c], i, arr) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--kz-line)" : 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: c, flex: "0 0 auto" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5 }}>
                    <span className="kz-mono" style={{ color: c, fontWeight: 600 }}>{who}</span>
                    <span style={{ color: "var(--kz-ink-2)" }}> {what}</span>
                  </div>
                </div>
                <div className="kz-mono" style={{ fontSize: 10.5, color: "var(--kz-ink-3)" }}>{when}</div>
              </div>
            ))}
          </div>

          {/* Community Notes */}
          <div style={{ background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 12, padding: "16px 18px", marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700 }}>
                Community Notes · 2
              </div>
              <a style={{ fontSize: 11, color: "var(--kz-accent)", fontWeight: 600 }}>Add note</a>
            </div>
            {[
              { what: "Numbers don't add up", who: "@m      4", body: "Total cast = 533 but presidential votes sum to 530.", weight: 0.84 },
              { what: "Signatures missing", who: "@f   n", body: "No agent signature on page 2 — usually procedural.", weight: 0.62 },
            ].map((n, i, arr) => (
              <div key={i} style={{ padding: "10px 0", borderBottom: i < arr.length - 1 ? "1px solid var(--kz-line)" : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 10.5, fontFamily: "IBM Plex Mono", color: "var(--kz-warn)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 700 }}>
                    {n.what}
                  </span>
                  <span style={{ fontSize: 10.5, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>w {n.weight}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--kz-ink)", lineHeight: 1.45 }}>{n.body}</div>
                <div style={{ fontSize: 10.5, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", marginTop: 4 }}>{n.who}</div>
              </div>
            ))}
          </div>

          {/* Permalink */}
          <div style={{ background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 12, padding: "16px 18px", marginTop: 16 }}>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, marginBottom: 8 }}>
              Permalink &amp; share
            </div>
            <div style={{ fontSize: 11.5, fontFamily: "IBM Plex Mono", color: "var(--kz-ink)", padding: "8px 10px", background: "var(--kz-bg)", borderRadius: 6, marginBottom: 8, wordBreak: "break-all" }}>
              kurazetu.com/s/031164082006901
            </div>
            <button className="kz-btn kz-btn--ghost" style={{ width: "100%", height: 40, borderRadius: 6, fontSize: 12 }}>
              Copy link
            </button>
          </div>
        </div>
      </div>
    </WebPage>
  );
}

function WebResultsSection() {
  return (
    <DCSection id="08-web-results" title="Web · Results dashboard" subtitle="Two desktop artboards: national view (default landing) and a station detail page.">
      <DCArtboard id="national" label="National dashboard" width={1280} height={1640}>
        <div data-brand="ramani" style={{ height: "100%" }}>
          <ChromeWindow url="kurazetu.com/results" tabs={[{ title: "Kura Zetu — Results" }]} width={1280} height={1640}>
            <WebResultsNational />
          </ChromeWindow>
        </div>
      </DCArtboard>
      <DCArtboard id="station" label="Station detail" width={1280} height={1200}>
        <div data-brand="ramani" style={{ height: "100%" }}>
          <ChromeWindow url="kurazetu.com/s/031164082006901" tabs={[{ title: "Likii Primary · Stream 1 — Kura Zetu" }]} width={1280} height={1200}>
            <WebResultsStation />
          </ChromeWindow>
        </div>
      </DCArtboard>

      <DCPostIt top={-12} right={60} rotate={2} width={250}>
        Replaces the current Bootstrap-y dashboard. Two-column layout (main + sidebar) at 1280+. Map + leaderboard + activity feed on the national. Permalink-friendly station page with verification trail and Community Notes inline.
      </DCPostIt>
    </DCSection>
  );
}

window.WebResultsSection = WebResultsSection;
