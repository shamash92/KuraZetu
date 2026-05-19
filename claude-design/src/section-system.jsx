/* global React, DCSection, DCArtboard */
// Section 02 — Design system spec.
// Type scale · color · semantic + verification states · components · spacing.
// All artboards are wrapped in [data-brand="ramani"] (recommended).

function SwatchCard({ name, token, value, dark }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
      <div style={{ width: 36, height: 36, borderRadius: 6, background: value, border: "1px solid rgba(0,0,0,.08)", flex: "0 0 auto" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--kz-ink)" }}>{name}</div>
        <div className="kz-mono" style={{ fontSize: 10.5, color: "var(--kz-ink-2)" }}>{token}</div>
      </div>
    </div>
  );
}

function TypeRow({ size, name, sample, mono, weight = 500, lh = 1.2 }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--kz-line)" }}>
      <div className="kz-mono" style={{ width: 64, fontSize: 11, color: "var(--kz-ink-2)" }}>{size}</div>
      <div style={{ flex: 1, fontSize: parseInt(size), fontFamily: mono ? "IBM Plex Mono, monospace" : "Public Sans, system-ui", fontWeight: weight, lineHeight: lh, color: "var(--kz-ink)", fontVariantNumeric: "tabular-nums" }}>
        {sample}
      </div>
      <div style={{ width: 100, fontSize: 11, color: "var(--kz-ink-3)", textAlign: "right" }}>{name}</div>
    </div>
  );
}

function TypeBoard() {
  return (
    <div data-brand="ramani" style={{ background: "var(--kz-bg)", height: "100%", padding: "24px 24px", fontFamily: "Public Sans, system-ui", overflow: "hidden" }}>
      <div style={{ fontSize: 11, color: "var(--kz-ink-2)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700 }}>Type</div>
      <h2 style={{ fontSize: 22, color: "var(--kz-ink)", letterSpacing: -0.4, margin: "4px 0 4px", fontWeight: 700 }}>
        Public Sans + IBM Plex Mono
      </h2>
      <p style={{ fontSize: 12.5, color: "var(--kz-ink-2)", marginBottom: 16, lineHeight: 1.45 }}>
        Free · tabular figures · full Latin Extended including Kiswahili diacritics. Mono used for codes &amp; tallies only.
      </p>
      <TypeRow size="38px" name="Display" sample="Kura Zetu" weight={700} lh={1.0} />
      <TypeRow size="24px" name="Title" sample="National tally — Aug 2027" weight={700} lh={1.1} />
      <TypeRow size="17px" name="Subhead" sample="Selecta polling-station" weight={600} />
      <TypeRow size="15px" name="Body" sample="Ñandu njema · diacritics safi · &Auml;&ouml;" weight={400} lh={1.4} />
      <TypeRow size="13px" name="Caption" sample="Hakuna data ya kituo hiki bado." weight={500} />
      <TypeRow size="20px" name="Tally" sample="9,652,341 votes · 47.2%" mono weight={500} />
      <TypeRow size="13px" name="Code" sample="031164082006901 · STREAM 1" mono weight={400} />
    </div>
  );
}

function ColorBoard() {
  return (
    <div data-brand="ramani" style={{ background: "var(--kz-bg)", height: "100%", padding: "24px 24px", fontFamily: "Public Sans, system-ui", overflow: "auto" }}>
      <div style={{ fontSize: 11, color: "var(--kz-ink-2)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700 }}>Color · Ramani</div>
      <h2 style={{ fontSize: 22, color: "var(--kz-ink)", letterSpacing: -0.4, margin: "4px 0 16px", fontWeight: 700 }}>
        Tokens
      </h2>

      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--kz-ink-2)", textTransform: "uppercase", letterSpacing: 0.08, marginBottom: 4 }}>Surfaces</div>
      <SwatchCard name="Background · forest" token="--kz-bg" value="#0d1c1f" />
      <SwatchCard name="Lifted" token="--kz-bg-2" value="#142529" />
      <SwatchCard name="Sand callout" token="--kz-surface-light" value="#f3ecd8" />

      <div style={{ height: 10 }} />
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--kz-ink-2)", textTransform: "uppercase", letterSpacing: 0.08, marginBottom: 4 }}>Ink</div>
      <SwatchCard name="Ink · sand" token="--kz-ink" value="#f3ecd8" />
      <SwatchCard name="Ink-2" token="--kz-ink-2" value="#a8b0b4" />
      <SwatchCard name="Ink-3" token="--kz-ink-3" value="#6c8084" />

      <div style={{ height: 10 }} />
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--kz-ink-2)", textTransform: "uppercase", letterSpacing: 0.08, marginBottom: 4 }}>Territory (map)</div>
      <SwatchCard name="Candidate 1" token="--kz-cand-1" value="#d97757" />
      <SwatchCard name="Candidate 2" token="--kz-cand-2" value="#4f8d76" />
      <SwatchCard name="Candidate 3" token="--kz-cand-3" value="#c4a653" />
      <SwatchCard name="No data" token="--kz-no-data" value="#25383c" />

      <div style={{ height: 10 }} />
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--kz-ink-2)", textTransform: "uppercase", letterSpacing: 0.08, marginBottom: 4 }}>Semantic</div>
      <SwatchCard name="Accent · terracotta" token="--kz-accent" value="#d97757" />
      <SwatchCard name="Success · eucalyptus" token="--kz-success" value="#4f8d76" />
      <SwatchCard name="Warn · savanna gold" token="--kz-warn" value="#c4a653" />
      <SwatchCard name="Danger · brick" token="--kz-danger" value="#d65454" />
    </div>
  );
}

function VerificationBoard() {
  const rows = [
    { name: "Unverified", cls: "kz-badge--unverified", desc: "Submitted, no second source yet. Default state for fresh Form 34A captures.", icon: "—" },
    { name: "Community-verified", cls: "kz-badge--community", desc: "Two or more independent submissions agree on tallies & form image hash matches.", icon: "✓" },
    { name: "Disputed", cls: "kz-badge--disputed", desc: "Submissions disagree, or a flagged Community Note has weight ≥ 0.5.", icon: "?" },
    { name: "Flagged", cls: "kz-badge--flagged", desc: "Moderator-confirmed issue (torn form, possible irregularity, etc.). Removed from rollups.", icon: "!" },
  ];
  return (
    <div data-brand="ramani" style={{ background: "var(--kz-bg)", height: "100%", padding: "24px 24px", fontFamily: "Public Sans, system-ui" }}>
      <div style={{ fontSize: 11, color: "var(--kz-ink-2)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700 }}>Verification states</div>
      <h2 style={{ fontSize: 22, color: "var(--kz-ink)", letterSpacing: -0.4, margin: "4px 0 4px", fontWeight: 700 }}>
        Four states, never ambiguous
      </h2>
      <p style={{ fontSize: 12.5, color: "var(--kz-ink-2)", marginBottom: 14, lineHeight: 1.45 }}>
        Color + glyph. Never color alone — important for AA and for users with monochrome devices.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r) => (
          <div key={r.name} style={{ display: "flex", gap: 12, padding: "10px 12px", border: "1px solid var(--kz-line)", borderRadius: 8, background: "var(--kz-surface)" }}>
            <span className={`kz-badge ${r.cls}`} style={{ height: 22, fontSize: 11 }}>
              {r.name}
            </span>
            <div style={{ flex: 1, fontSize: 11.5, color: "var(--kz-ink-2)", lineHeight: 1.45 }}>{r.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComponentsBoard() {
  return (
    <div data-brand="ramani" style={{ background: "var(--kz-bg)", height: "100%", padding: "24px 24px", fontFamily: "Public Sans, system-ui", overflow: "auto" }}>
      <div style={{ fontSize: 11, color: "var(--kz-ink-2)", textTransform: "uppercase", letterSpacing: 0.1, fontWeight: 700 }}>Components</div>
      <h2 style={{ fontSize: 22, color: "var(--kz-ink)", letterSpacing: -0.4, margin: "4px 0 14px", fontWeight: 700 }}>
        Buttons, inputs, banners
      </h2>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <button className="kz-btn kz-btn--primary">Primary</button>
        <button className="kz-btn kz-btn--accent">Accent</button>
        <button className="kz-btn kz-btn--ghost">Ghost</button>
        <button className="kz-btn kz-btn--danger">Danger</button>
      </div>

      <input className="kz-input" placeholder="Search by school name or code" style={{ marginBottom: 8 }} />
      <input className="kz-input kz-mono" placeholder="0254 7XX XXX XXX" style={{ marginBottom: 14 }} />

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <span className="kz-badge kz-badge--unverified">Unverified</span>
        <span className="kz-badge kz-badge--community">Verified</span>
        <span className="kz-badge kz-badge--disputed">Disputed</span>
        <span className="kz-badge kz-badge--flagged">Flagged</span>
      </div>

      <div style={{
        background: "var(--kz-warn-soft)",
        borderRadius: 6,
        padding: "12px 14px",
        marginBottom: 10,
      }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--kz-warn)", textTransform: "uppercase", letterSpacing: 0.08, fontFamily: "IBM Plex Mono", fontSize: 11 }}>
          OFFLINE
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--kz-ink)", marginTop: 4 }}>You're offline</div>
        <div style={{ fontSize: 12, color: "var(--kz-ink-2)", marginTop: 2 }}>
          Last refreshed 14 min ago. Submission queued — will sync when you reconnect.
        </div>
      </div>

      <div className="kz-card" style={{ padding: 14, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--kz-ink)" }}>Likii Primary School</div>
          <span className="kz-badge kz-badge--community" style={{ fontSize: 10.5 }}>✓ Verified</span>
        </div>
        <div className="kz-mono" style={{ fontSize: 11, color: "var(--kz-ink-2)", marginTop: 4 }}>
          031164082006901 · STREAM 1
        </div>
      </div>
    </div>
  );
}

function SystemSection() {
  return (
    <DCSection id="02-system" title="Design system" subtitle="Tokens implemented in src/tokens.css — apply to Tailwind via CSS vars, mirror to RN as a JSON token file.">
      <DCArtboard id="type" label="Type scale" width={520} height={560}>
        <TypeBoard />
      </DCArtboard>
      <DCArtboard id="color" label="Color · Ramani" width={360} height={560}>
        <ColorBoard />
      </DCArtboard>
      <DCArtboard id="verify" label="Verification states" width={420} height={560}>
        <VerificationBoard />
      </DCArtboard>
      <DCArtboard id="components" label="Components" width={420} height={560}>
        <ComponentsBoard />
      </DCArtboard>
    </DCSection>
  );
}

window.SystemSection = SystemSection;
