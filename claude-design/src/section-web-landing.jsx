/* global React, DCSection, DCArtboard, DCPostIt, ChromeWindow, KenyaHexMap */
// Section 09 — Web landing page (desktop).
// One large artboard. Public-facing marketing surface. Keeps the
// "What KuraZetu IS / IS NOT" table from current site (it's the most
// honest thing the product does) and cuts everything else that reads
// as launch-progress kanban.

function WL_Nav() {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "20px 32px", borderBottom: "1px solid var(--kz-line)", background: "var(--kz-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="5" fill="var(--kz-ink)" />
          <path d="M9 12l2 2 4-4" stroke="var(--kz-bg)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="19" cy="5" r="2.2" fill="var(--kz-accent)" />
        </svg>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--kz-ink)", letterSpacing: -0.4 }}>Kura Zetu</div>
          <div className="kz-mono" style={{ fontSize: 9, color: "var(--kz-ink-3)", letterSpacing: 0.16, marginTop: 1, textTransform: "uppercase" }}>Powered by Kiongozi</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 0, marginLeft: 32 }}>
        {["Results", "PinVerify", "Contribute", "About", "API"].map((t, i) => (
          <div key={t} style={{ padding: "10px 16px", fontSize: 14, fontWeight: 500, color: i === 0 ? "var(--kz-ink)" : "var(--kz-ink-2)" }}>{t}</div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button style={{ background: "transparent", border: "1px solid var(--kz-line)", color: "var(--kz-ink)", padding: "10px 18px", borderRadius: 6, fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
          Sign in
        </button>
        <button style={{ background: "var(--kz-accent)", color: "var(--kz-accent-ink)", border: 0, padding: "10px 18px", borderRadius: 6, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>
          Get the app
        </button>
      </div>
    </div>
  );
}

function WL_Landing() {
  return (
    <div style={{ background: "var(--kz-bg)", color: "var(--kz-ink)", fontFamily: "Public Sans, system-ui" }}>

      {/* Disclaimer */}
      <div style={{ background: "var(--kz-bg-2)", borderBottom: "1px solid var(--kz-line)", padding: "6px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "IBM Plex Mono", fontSize: 10.5, color: "var(--kz-warn)", letterSpacing: 0.08, textTransform: "uppercase", fontWeight: 600 }}>
        <span>Citizen tally · This is not an IEBC system</span>
        <span style={{ color: "var(--kz-ink-3)" }}>Open source · MIT · github.com/shamash92/kurazetu</span>
      </div>

      <WL_Nav />

      {/* Hero */}
      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 56, padding: "72px 32px 72px", maxWidth: 1280, margin: "0 auto", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--kz-accent)", fontWeight: 700, letterSpacing: 0.12, textTransform: "uppercase", marginBottom: 12 }}>
            For the 2027 election
          </div>
          <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -0.04 + "em", lineHeight: 1.0 }}>
            The count,<br />
            <span style={{ color: "var(--kz-accent)" }}>uploaded by you.</span>
          </div>
          <div style={{ fontSize: 17, color: "var(--kz-ink-2)", lineHeight: 1.55, marginTop: 22, maxWidth: 520 }}>
            You photograph the Form 34A. We aggregate and verify. Anyone can see.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 30 }}>
            <button style={{ background: "var(--kz-accent)", color: "var(--kz-accent-ink)", border: 0, padding: "16px 24px", borderRadius: 8, fontSize: 15, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10 }}>
              See live results
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
            <button style={{ background: "transparent", border: "1px solid var(--kz-line-strong)", color: "var(--kz-ink)", padding: "16px 24px", borderRadius: 8, fontSize: 15, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
              Download Android
            </button>
          </div>
          <div style={{ marginTop: 22, fontSize: 12, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono", letterSpacing: 0.04 }}>
            iOS coming · Web works on any browser
          </div>
        </div>

        {/* Hero map */}
        <div style={{ background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 16, padding: 18, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700 }}>
              Live preview
            </div>
            <div style={{ fontSize: 11, color: "var(--kz-success)", fontFamily: "IBM Plex Mono", letterSpacing: 0.08, fontWeight: 600 }}>
              68.8% reporting
            </div>
          </div>
          <div style={{ height: 320, position: "relative" }}>
            <KenyaHexMap selected="Nai" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--kz-line)", paddingTop: 12, marginTop: 6, fontSize: 12 }}>
            <div className="kz-mono" style={{ color: "var(--kz-ink-2)" }}>
              31,847 / 46,231 stations
            </div>
            <div className="kz-mono" style={{ color: "var(--kz-accent)" }}>
              LONGOGGY 47.2% LEADING
            </div>
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div style={{ background: "var(--kz-bg-2)", borderTop: "1px solid var(--kz-line)", borderBottom: "1px solid var(--kz-line)", padding: "32px 32px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 32 }}>
          {[
            ["46,231", "Polling stations covered"],
            ["47", "Counties · all of Kenya"],
            ["18,422", "Citizen verifiers signed up"],
            ["0.94", "Average OCR confidence"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="kz-mono" style={{ fontSize: 38, fontWeight: 700, color: "var(--kz-ink)", letterSpacing: -0.04 }}>{n}</div>
              <div style={{ fontSize: 12, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* What it IS / IS NOT — kept from current site */}
      <div style={{ padding: "96px 32px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ textAlign: "center", maxWidth: 760, margin: "0 auto" }}>
          <div style={{ fontSize: 12, color: "var(--kz-accent)", fontWeight: 700, letterSpacing: 0.12, textTransform: "uppercase", marginBottom: 22 }}>
            Read this first
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -0.04 + "em", lineHeight: 1.1 }}>
            What KuraZetu is. And just as importantly — what it is <span style={{ color: "var(--kz-accent)" }}>not.</span>
          </div>
          <div style={{ fontSize: 16, color: "var(--kz-ink-2)", marginTop: 24, lineHeight: 1.6 }}>
            We are not the IEBC. We are not a political party. We are not legal authority. We are a parallel record built by citizens, for citizens.
          </div>
        </div>

        <div style={{ marginTop: 56, border: "1px solid var(--kz-line)", borderRadius: 16, background: "var(--kz-bg-2)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 1fr", padding: "16px 24px", background: "var(--kz-bg)", borderBottom: "1px solid var(--kz-line)", fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, gap: 24 }}>
            <div>Aspect</div>
            <div style={{ color: "var(--kz-success)" }}>What it IS</div>
            <div style={{ color: "var(--kz-warn)" }}>What it is NOT</div>
          </div>
          {[
            ["Purpose", "A citizen-driven platform to increase transparency and accountability.", "Not a system to legally challenge election results."],
            ["Nature", "An open-source system built for collaboration.", "Not an official government or IEBC system."],
            ["Approach", "A tool for civic empowerment, not political affiliation.", "Not a partisan or politically-affiliated project."],
            ["Function", "A platform for education, participation, and digital oversight.", "Not a means to announce or declare election results."],
            ["Role", "A supplementary tool for civic engagement and transparency.", "Not a replacement for legal electoral processes."],
          ].map(([a, is, isnt], i, arr) => (
            <div key={a} style={{ display: "grid", gridTemplateColumns: "240px 1fr 1fr", padding: "20px 24px", borderBottom: i < arr.length - 1 ? "1px solid var(--kz-line)" : 0, gap: 24, alignItems: "flex-start" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--kz-ink)" }}>{a}</div>
              <div style={{ fontSize: 13.5, color: "var(--kz-ink)", lineHeight: 1.5, display: "flex", gap: 10 }}>
                <span style={{ color: "var(--kz-success)", flex: "0 0 auto", marginTop: 2 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                </span>
                <span>{is}</span>
              </div>
              <div style={{ fontSize: 13.5, color: "var(--kz-ink)", lineHeight: 1.5, display: "flex", gap: 10 }}>
                <span style={{ color: "var(--kz-warn)", flex: "0 0 auto", marginTop: 2 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6"/></svg>
                </span>
                <span>{isnt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{ padding: "72px 32px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--kz-accent)", fontWeight: 700, letterSpacing: 0.12, textTransform: "uppercase", marginBottom: 12 }}>
              How it works
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.05 }}>
              From the paper on the wall, to the public dashboard, in four steps.
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          {[
            ["01", "Pin your station", "Confirm where your polling station physically is, with GPS + community consensus."],
            ["02", "Photograph the Form 34A", "Capture both pages with the in-app camera. We check focus and brightness."],
            ["03", "Confirm the numbers", "Our OCR reads the tallies. You correct any digits before publishing."],
            ["04", "Submit and share", "Your tally is published with a hash you can prove later. Everyone sees it."],
          ].map(([n, t, d]) => (
            <div key={n} style={{ background: "var(--kz-bg-2)", border: "1px solid var(--kz-line)", borderRadius: 14, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="kz-mono" style={{ fontSize: 12, color: "var(--kz-accent)", letterSpacing: 0.1, fontWeight: 700 }}>{n}</div>
              <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.2, lineHeight: 1.2 }}>{t}</div>
              <div style={{ fontSize: 13, color: "var(--kz-ink-2)", lineHeight: 1.5 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Why trust */}
      <div style={{ padding: "72px 32px", background: "var(--kz-bg-2)", borderTop: "1px solid var(--kz-line)", borderBottom: "1px solid var(--kz-line)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 56 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--kz-accent)", fontWeight: 700, letterSpacing: 0.12, textTransform: "uppercase", marginBottom: 12 }}>
                Why trust it
              </div>
              <div style={{ fontSize: 36, fontWeight: 400, letterSpacing: -0.5, lineHeight: 1.15, color: "var(--kz-ink-2)" }}>
                Every number on this site has a <b style={{ fontWeight: 800, color: "var(--kz-ink)" }}>Form 34A</b> behind it. Every Form 34A has a <b style={{ fontWeight: 800, color: "var(--kz-ink)" }}>community verifier</b> behind it.
              </div>
            </div>
            <div>
              {[
                ["Open source", "All code on GitHub. All bugs in the open."],
                ["Hashed receipts", "Every submission gets a sha256 hash. Tampered numbers fail the check."],
                ["Community-verified", "Two independent submissions per station before a number rolls up."],
                ["Independent audit", "Quarterly audits by Kenyan civil-society partners."],
                ["No partisan ties", "MIT-licensed. No party affiliation. Funded by the diaspora."],
              ].map(([t, d]) => (
                <div key={t} style={{ display: "grid", gridTemplateColumns: "160px 1fr", padding: "14px 0", borderBottom: "1px solid var(--kz-line)", gap: 24, alignItems: "flex-start" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--kz-ink)" }}>{t}</div>
                  <div style={{ fontSize: 13.5, color: "var(--kz-ink-2)", lineHeight: 1.5 }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Big CTA */}
      <div style={{ padding: "72px 32px", maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ background: "var(--kz-accent)", color: "var(--kz-accent-ink)", borderRadius: 18, padding: "44px 44px 40px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 36, alignItems: "center" }}>
          <div>
            <div className="kz-mono" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.12, textTransform: "uppercase", opacity: 0.75 }}>
              Get involved
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -0.04 + "em", lineHeight: 1.05, marginTop: 10 }}>
              Your phone. Your polling station.<br />Your verified Form 34A.
            </div>
            <div style={{ fontSize: 14.5, lineHeight: 1.55, marginTop: 12, opacity: 0.85, maxWidth: 540 }}>
              Sign up with your phone number. No password. No email. No name. We send a 6-digit code. That's it.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button style={{ background: "var(--kz-ink)", color: "var(--kz-bg)", border: 0, padding: "18px 24px", borderRadius: 10, fontSize: 16, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Download for Android</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
            <button style={{ background: "transparent", color: "var(--kz-accent-ink)", border: "1.5px solid rgba(13,28,31,0.3)", padding: "18px 24px", borderRadius: 10, fontSize: 16, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>iOS — notify me when ready</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </button>
            <button style={{ background: "transparent", color: "var(--kz-accent-ink)", border: 0, padding: "8px 0 0", fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", textDecoration: "underline", textAlign: "left" }}>
              Just browse without signing up →
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "40px 32px 56px", borderTop: "1px solid var(--kz-line)", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 36 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="5" fill="var(--kz-ink)" />
                <path d="M9 12l2 2 4-4" stroke="var(--kz-bg)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="19" cy="5" r="2.2" fill="var(--kz-accent)" />
              </svg>
              <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}>Kura Zetu</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--kz-ink-3)", lineHeight: 1.6, maxWidth: 320 }}>
              A non-partisan, open-source citizen-tech project. Powered by Kiongozi. Built in Nairobi.
            </div>
          </div>
          {[
            ["Product", ["Live results", "Find my station", "PinVerify", "Get the app"]],
            ["Project", ["GitHub", "Documentation", "Public API", "Contribute"]],
            ["About", ["Privacy", "Terms", "Funding", "Press"]],
          ].map(([title, links]) => (
            <div key={title}>
              <div style={{ fontSize: 11, color: "var(--kz-ink-3)", textTransform: "uppercase", letterSpacing: 0.08, fontWeight: 700, marginBottom: 12 }}>{title}</div>
              {links.map((l) => (
                <div key={l} style={{ fontSize: 13.5, color: "var(--kz-ink-2)", padding: "5px 0" }}>{l}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--kz-line)", marginTop: 28, paddingTop: 18, display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--kz-ink-3)", fontFamily: "IBM Plex Mono" }}>
          <div>© 2027 Kura Zetu · MIT licensed · Not affiliated with IEBC</div>
          <div>Built in Nairobi · Designed for elections, not against them.</div>
        </div>
      </div>
    </div>
  );
}

function WebLandingSection() {
  return (
    <DCSection id="09-web-landing" title="Web · Landing page" subtitle="Replaces the current landing. Keeps the 'What it IS / IS NOT' table — it's the most honest thing on the site. Cuts the launch-progress kanban.">
      <DCArtboard id="landing" label="Landing · 1280" width={1280} height={2600}>
        <div data-brand="ramani" style={{ height: "100%" }}>
          <ChromeWindow url="kurazetu.com" tabs={[{ title: "Kura Zetu — Election results, uploaded by you." }]} width={1280} height={2600}>
            <WL_Landing />
          </ChromeWindow>
        </div>
      </DCArtboard>

      <DCPostIt top={-12} right={60} rotate={2} width={240}>
        Hero pairs the headline with a live Kenya map, not a phone mockup. Stats are real metrics (stations, counties, contributors) not "5x faster verification" marketing claims. Big terracotta sign-up card replaces the "Join the Movement" sprawl.
      </DCPostIt>
    </DCSection>
  );
}

window.WebLandingSection = WebLandingSection;
