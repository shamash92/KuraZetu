/* global React, AndroidDevice */
// THEME B · DAFTARI YA WANANCHI — citizen passbook / chama ledger
// Mental model: a chama keeps a hand-written passbook; each contribution
// gets a rubber stamp from the treasurer; the book lives in the same
// drawer as the title deed and the school report card.
// Palette is cream paper, ledger ruling, dark brown ink, stamp red,
// passbook-cover green.

const DFT = {
  ink:    "#2A1F14",
  ink2:   "#4A382A",
  paper:  "#F4ECDB",
  paper2: "#E9DEC4",
  rule:   "#C9B999",
  stamp:  "#B23A2D",
  cover:  "#2D5C3E",
  cover2: "#1F4630",
  accent: "#C68A2E",
  muted:  "#8A7D66",
  serif:  "'IBM Plex Serif', Georgia, serif",
  display:"'DM Serif Display', Georgia, serif",
  hand:   "'Caveat', cursive",
  mono:   "'IBM Plex Mono', ui-monospace, monospace",
  sans:   "'IBM Plex Sans', system-ui, sans-serif",
};

// ─── phone shell ────────────────────────────────────────────────
function DaftariPhone({ children, dark = false }) {
  return (
    <div style={{ width: 360, height: 720, position: "relative" }}>
      <AndroidDevice width={360} height={720} dark={dark} title={undefined}>
        <div className="kz" style={{
          background: dark ? DFT.cover2 : DFT.paper,
          color: dark ? DFT.paper : DFT.ink,
          minHeight: "100%", display: "flex", flexDirection: "column",
          fontFamily: DFT.serif,
        }}>
          {children}
        </div>
      </AndroidDevice>
    </div>
  );
}

function DaftariDisclaimer({ dark = false }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "5px 14px",
      background: dark ? DFT.cover : DFT.cover,
      color: DFT.paper,
      fontFamily: DFT.mono, fontSize: 10, letterSpacing: 0.8,
    }}>
      <span>DAFTARI YA WANANCHI · SI IEBC</span>
      <span style={{ opacity: 0.7 }}>UNOFFICIAL CITIZEN TALLY</span>
    </div>
  );
}

// Ledger ruling — used as a background pattern on passbook pages
function ledgerBg(color = DFT.rule, opacity = 0.35) {
  return `repeating-linear-gradient(
    to bottom,
    transparent 0 27px,
    ${color}${Math.round(opacity*255).toString(16).padStart(2,'0')} 27px 28px
  )`;
}

// ─── the rubber stamp ───────────────────────────────────────────
// Drawn with concentric SVG circles and offset/rotation to look hand-pressed.
function Stamp({ size = 92, rotate = -8, code = "KZ·4A7F", date = "08·08·27", verified = true }) {
  const r1 = size/2 - 1.5;
  const r2 = size/2 - 6;
  const r3 = size/2 - 12;
  const cx = size/2;
  return (
    <div style={{
      width: size, height: size, transform: `rotate(${rotate}deg)`,
      filter: "url(#stampInk)", position: "relative",
    }}>
      {/* the ink filter — defined once globally below */}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
        <circle cx={cx} cy={cx} r={r1} fill="none" stroke={DFT.stamp} strokeWidth={1.4} />
        <circle cx={cx} cy={cx} r={r2} fill="none" stroke={DFT.stamp} strokeWidth={1.0} />
        {/* center icon */}
        <g fill={DFT.stamp}>
          <polygon points={`${cx},${cx - r3 * 0.55} ${cx + r3*0.18},${cx - r3*0.18} ${cx + r3*0.55},${cx - r3*0.18} ${cx + r3*0.28},${cx + r3*0.10} ${cx + r3*0.40},${cx + r3*0.55} ${cx},${cx + r3*0.25} ${cx - r3*0.40},${cx + r3*0.55} ${cx - r3*0.28},${cx + r3*0.10} ${cx - r3*0.55},${cx - r3*0.18} ${cx - r3*0.18},${cx - r3*0.18}`} />
        </g>
        {/* arc text — top */}
        <defs>
          <path id={`arc-top-${code}`} d={`M ${cx - r2 + 8} ${cx} A ${r2 - 8} ${r2 - 8} 0 0 1 ${cx + r2 - 8} ${cx}`} />
          <path id={`arc-bot-${code}`} d={`M ${cx - r2 + 8} ${cx + 1} A ${r2 - 8} ${r2 - 8} 0 0 0 ${cx + r2 - 8} ${cx + 1}`} />
        </defs>
        <text fill={DFT.stamp} fontFamily={DFT.mono} fontSize={size * 0.115} fontWeight={700} letterSpacing={1.4}>
          <textPath href={`#arc-top-${code}`} startOffset="50%" textAnchor="middle">
            {verified ? "VERIFIED · KURAZETU" : "PENDING · KURAZETU"}
          </textPath>
        </text>
        <text fill={DFT.stamp} fontFamily={DFT.mono} fontSize={size * 0.10} fontWeight={500} letterSpacing={1.2}>
          <textPath href={`#arc-bot-${code}`} startOffset="50%" textAnchor="middle">
            {code} · {date}
          </textPath>
        </text>
      </svg>
    </div>
  );
}

// SVG defs hosted once for the stamp ink-bleed effect
function StampDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs>
        <filter id="stampInk" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="1.2" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.92" />
          </feComponentTransfer>
        </filter>
      </defs>
    </svg>
  );
}

// ════════════════════════════════════════════════════════════════
// Passbook page — the atom
// ════════════════════════════════════════════════════════════════
function PassbookPage({ scale = 1 }) {
  return (
    <div style={{
      width: 260, background: DFT.paper, position: "relative",
      border: `1px solid ${DFT.ink}22`, borderRadius: 2,
      boxShadow: "0 18px 36px -22px rgba(42,31,20,0.45), 0 2px 0 rgba(42,31,20,0.06)",
      transform: `scale(${scale})`, transformOrigin: "top left",
      overflow: "hidden", fontFamily: DFT.serif,
    }}>
      {/* Cover-stripe header */}
      <div style={{ background: DFT.cover, color: DFT.paper, padding: "10px 14px" }}>
        <div style={{ fontFamily: DFT.mono, fontSize: 9.5, letterSpacing: 1.4, opacity: 0.75 }}>
          DAFTARI YA WANANCHI · No. 04127
        </div>
        <div style={{ fontFamily: DFT.display, fontSize: 18, letterSpacing: -0.2, lineHeight: 1.1, marginTop: 2 }}>
          M. Wanjiku
        </div>
      </div>

      {/* Page body — ledger ruled */}
      <div style={{ padding: "12px 14px", background: ledgerBg(DFT.rule, 0.55), backgroundColor: DFT.paper }}>
        <div style={{
          display: "grid", gridTemplateColumns: "30px 1fr auto", columnGap: 8,
          fontFamily: DFT.mono, fontSize: 9.5, color: DFT.muted, letterSpacing: 1,
          paddingBottom: 4, borderBottom: `1px solid ${DFT.rule}`,
        }}>
          <span>#</span><span>STATION · KITUO</span><span>STAMP</span>
        </div>

        <Row n="01" station="Kilimani Pri. · 03" date="08·08" code="4A7F" />
        <Row n="02" station="Ngong Hills · 07" date="08·08" code="9C12" />
        <Row n="03" station="Kawangware S. · 02" date="08·08" code="2D71" pending />
        <Row n="04" station="—" date="" code="" empty />
      </div>

      {/* Footer signature */}
      <div style={{ padding: "8px 14px 14px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontFamily: DFT.mono, fontSize: 8.5, color: DFT.muted, letterSpacing: 1 }}>
            MWEKA HAZINA · TREASURER
          </div>
          <div style={{ fontFamily: DFT.hand, fontSize: 22, color: DFT.ink2, marginTop: -2 }}>
            M. Wanjiku
          </div>
        </div>
        <div style={{ fontFamily: DFT.mono, fontSize: 9, color: DFT.muted, textAlign: "right" }}>
          kurazetu.ke/d/<br />04127
        </div>
      </div>
    </div>
  );
}

function Row({ n, station, date, code, pending, empty }) {
  return (
    <div style={{
      height: 28, display: "grid", gridTemplateColumns: "30px 1fr auto",
      columnGap: 8, alignItems: "center", borderBottom: `1px solid ${DFT.rule}`,
    }}>
      <span style={{ fontFamily: DFT.mono, fontSize: 11, color: DFT.muted }}>{n}</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 12, color: DFT.ink, lineHeight: 1.1 }}>
        <span style={{ fontFamily: DFT.serif, fontWeight: 500 }}>{station}</span>
        <span style={{ fontFamily: DFT.mono, fontSize: 9.5, color: DFT.muted }}>{date}</span>
      </div>
      <div style={{ width: 32, height: 24, position: "relative", display: "flex", justifyContent: "flex-end" }}>
        {empty ? <span style={{ fontFamily: DFT.hand, fontSize: 18, color: DFT.muted }}>—</span> :
         pending ? (
           <span style={{
             fontFamily: DFT.mono, fontSize: 8, color: DFT.accent,
             border: `1px solid ${DFT.accent}`, padding: "1px 4px", borderRadius: 2,
             letterSpacing: 0.4,
           }}>2/3</span>
         ) : (
           <div style={{ position: "absolute", right: -8, top: -10 }}>
             <Stamp size={36} rotate={-7} code={code} date="08·08" />
           </div>
         )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Brand identity card
// ════════════════════════════════════════════════════════════════
function DaftariBrandCard() {
  return (
    <div style={{
      width: "100%", height: "100%", background: DFT.paper, color: DFT.ink,
      padding: "32px 32px 28px", boxSizing: "border-box", position: "relative",
      fontFamily: DFT.serif, overflow: "hidden",
    }}>
      <StampDefs />
      {/* Header strip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontFamily: DFT.mono, fontSize: 11, letterSpacing: 1.4, color: DFT.muted }}>
          DIRECTION B · 01 / 05
        </div>
        <div style={{ fontFamily: DFT.mono, fontSize: 11, letterSpacing: 1.4, color: DFT.muted }}>
          BRAND ID
        </div>
      </div>

      {/* Wordmark — passbook cover */}
      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "auto 1fr", gap: 16, alignItems: "stretch" }}>
        <div style={{
          background: DFT.cover, color: DFT.paper, borderRadius: 3,
          padding: "16px 18px 14px", minWidth: 220, position: "relative", overflow: "hidden",
        }}>
          <div style={{ fontFamily: DFT.mono, fontSize: 9.5, letterSpacing: 1.6, opacity: 0.7 }}>
            JAMHURI YA RAIA
          </div>
          <div style={{ fontFamily: DFT.display, fontSize: 26, lineHeight: 1.05, marginTop: 6, letterSpacing: -0.4 }}>
            Daftari ya<br />Wananchi
          </div>
          <div style={{ marginTop: 8, fontFamily: DFT.mono, fontSize: 9.5, letterSpacing: 1.2, opacity: 0.75 }}>
            CITIZEN PASSBOOK · KZ
          </div>
          <div style={{
            position: "absolute", right: -22, bottom: -22, width: 96, height: 96,
            borderRadius: 999, border: `1.5px solid ${DFT.paper}`, opacity: 0.18,
          }} />
        </div>

        <div style={{ alignSelf: "center", fontSize: 16, color: DFT.ink2, fontWeight: 400, fontFamily: DFT.serif, lineHeight: 1.4 }}>
          A pasbuku you fill in across the country. Every Form 34A is a
          <i> stamp</i>; every stamp is yours.
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 28, marginTop: 26 }}>
        {/* LEFT */}
        <div>
          <DFTLabel>Palette</DFTLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 10 }}>
            {[
              ["Cover",  DFT.cover,  "#2D5C3E"],
              ["Paper",  DFT.paper,  "#F4ECDB"],
              ["Stamp",  DFT.stamp,  "#B23A2D"],
              ["Ink",    DFT.ink,    "#2A1F14"],
              ["Gold",   DFT.accent, "#C68A2E"],
            ].map(([n, c, hex]) => (
              <div key={n}>
                <div style={{ height: 56, background: c, borderRadius: 3, border: "1px solid rgba(0,0,0,0.08)" }} />
                <div style={{ fontFamily: DFT.mono, fontSize: 10, marginTop: 6 }}>{n}</div>
                <div style={{ fontFamily: DFT.mono, fontSize: 9.5, color: DFT.muted }}>{hex}</div>
              </div>
            ))}
          </div>

          <DFTLabel style={{ marginTop: 22 }}>Type</DFTLabel>
          <div style={{ marginTop: 8, display: "grid", rowGap: 8 }}>
            <TypeRow text="Daftari ya Wananchi" font={DFT.display} note="DM Serif Display · display" size={26} />
            <TypeRow text="Andika fomu mpya" font={DFT.serif} note="IBM Plex Serif · body 600" weight={600} />
            <TypeRow text="M. Wanjiku · mweka hazina" font={DFT.hand} note="Caveat · sign / mark" size={22} />
            <TypeRow text="KZ·4A7F·08·08·27" font={DFT.mono} note="IBM Plex Mono · codes" size={13} />
          </div>

          <DFTLabel style={{ marginTop: 22 }}>Theme grammar</DFTLabel>
          <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "100px 1fr", rowGap: 7, fontSize: 13 }}>
            <GrLab>Verb</GrLab>
            <div><b>Andika · Stamp.</b> "Andika fomu" / record the form.</div>
            <GrLab>Artefact</GrLab>
            <div><b>Stempu</b> · a stamped row in your passbook.</div>
            <GrLab>Identity</GrLab>
            <div><b>Mweka Hazina</b> · treasurer of your county.</div>
            <GrLab>Daily hook</GrLab>
            <div>Empty rows. The book wants stamps.</div>
            <GrLab>Atom</GrLab>
            <div>The passbook page — stamped, signed, screenshot-able.</div>
          </div>
        </div>

        {/* RIGHT — atom */}
        <div>
          <DFTLabel>The atom · pasbuku</DFTLabel>
          <div style={{ marginTop: 10 }}>
            <PassbookPage />
          </div>
        </div>
      </div>

      {/* Footer — the sentence */}
      <div style={{
        position: "absolute", left: 32, right: 32, bottom: 24,
        paddingTop: 14, borderTop: `1px dashed ${DFT.rule}`,
        fontFamily: DFT.serif, fontSize: 13, color: DFT.ink2,
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
      }}>
        <span>
          <span style={{ color: DFT.muted }}>"</span>
          It's a <b>chama for the country</b> — kila kituo ni mchango, the book is the receipt.
          <span style={{ color: DFT.muted }}>"</span>
        </span>
        <span style={{ color: DFT.muted, fontFamily: DFT.mono, fontSize: 11 }}>— 22, Eldoret</span>
      </div>
    </div>
  );
}

function DFTLabel({ children, style = {} }) {
  return (
    <div style={{
      fontFamily: DFT.mono, fontSize: 10.5, letterSpacing: 1.4,
      color: DFT.muted, textTransform: "uppercase", ...style,
    }}>{children}</div>
  );
}
function GrLab({ children }) {
  return (
    <div style={{ fontFamily: DFT.mono, fontSize: 11, color: DFT.muted, letterSpacing: 0.6 }}>
      {String(children).toUpperCase()}
    </div>
  );
}
function TypeRow({ text, font, note, size = 18, weight = 400 }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
      <span style={{ fontFamily: font, fontSize: size, fontWeight: weight, color: DFT.ink, lineHeight: 1 }}>{text}</span>
      <span style={{ fontFamily: DFT.mono, fontSize: 10, color: DFT.muted, marginLeft: "auto" }}>{note}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Onboarding 1/3 — Welcome (cover open)
// ════════════════════════════════════════════════════════════════
function DaftariOb1() {
  return (
    <DaftariPhone dark={true}>
      <StampDefs />
      <DaftariDisclaimer dark />
      <div style={{ flex: 1, padding: "28px 22px 22px", display: "flex", flexDirection: "column", color: DFT.paper }}>
        <div style={{ fontFamily: DFT.mono, fontSize: 11, color: "#B5D1BE", letterSpacing: 1.4 }}>
          KURAZETU · 01 / 03
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ fontFamily: DFT.mono, fontSize: 10, letterSpacing: 1.6, opacity: 0.7 }}>
            JAMHURI YA RAIA · CITIZEN REPUBLIC
          </div>
          <div style={{ fontFamily: DFT.display, fontSize: 56, lineHeight: 0.95, letterSpacing: -1, marginTop: 6 }}>
            Daftari<br />ya Wananchi.
          </div>
          <div style={{ marginTop: 12, fontFamily: DFT.serif, fontSize: 17, lineHeight: 1.4, color: "#E5DEC9" }}>
            A passbook the country fills in together. Stamp a form, stamp a station,
            <span style={{ fontFamily: DFT.hand, fontSize: 22, color: DFT.paper }}> &nbsp;and sign your book.</span>
          </div>
        </div>

        {/* Floating passbook + stamps */}
        <div style={{ flex: 1, position: "relative", marginTop: 14 }}>
          <div style={{ position: "absolute", right: -14, top: 0, transform: "rotate(5deg)" }}>
            <PassbookPage scale={0.78} />
          </div>
          <div style={{ position: "absolute", left: 8, bottom: 30 }}>
            <Stamp size={88} rotate={-15} code="KZ·4A7F" date="08·08·27" />
          </div>
          <div style={{ position: "absolute", left: 92, bottom: 8 }}>
            <Stamp size={62} rotate={9} code="KZ·9C12" date="08·08·27" />
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: "grid", rowGap: 10 }}>
          <button style={{
            background: DFT.paper, color: DFT.ink,
            fontFamily: DFT.serif, fontWeight: 600, fontSize: 16,
            padding: "16px 18px", borderRadius: 3,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>Fungua Daftari · <i>Open your passbook</i></span>
            <span style={{ fontFamily: DFT.mono, fontSize: 18 }}>→</span>
          </button>
          <button style={{
            background: "transparent", color: DFT.paper,
            fontFamily: DFT.serif, fontWeight: 500, fontSize: 14,
            padding: "12px 18px", borderRadius: 3, textAlign: "center",
            border: `1px solid ${DFT.paper}55`,
          }}>
            I already have a passbook
          </button>
        </div>
      </div>
    </DaftariPhone>
  );
}

// ════════════════════════════════════════════════════════════════
// Onboarding 2/3 — How it works (three rows being filled)
// ════════════════════════════════════════════════════════════════
function DaftariOb2() {
  return (
    <DaftariPhone>
      <StampDefs />
      <DaftariDisclaimer />
      <div style={{ padding: "22px 22px 14px" }}>
        <div style={{ fontFamily: DFT.mono, fontSize: 11, color: DFT.muted, letterSpacing: 1.4 }}>
          KURAZETU · 02 / 03
        </div>
        <h2 style={{
          marginTop: 12, fontFamily: DFT.display, fontSize: 30, lineHeight: 1.05,
          letterSpacing: -0.5, color: DFT.ink, textWrap: "balance",
        }}>
          Three rows.<br />One book per citizen.
        </h2>
        <p style={{ marginTop: 8, fontSize: 13.5, color: DFT.ink2, lineHeight: 1.55, maxWidth: 290, fontFamily: DFT.serif }}>
          Every station you record becomes a stamp in your daftari. Three citizens
          stamp the same row before the country sees the count.
        </p>
      </div>

      {/* Ledger spread */}
      <div style={{
        margin: "8px 22px 0", background: DFT.paper,
        border: `1px solid ${DFT.ink}22`, borderRadius: 3,
        boxShadow: "0 8px 20px -16px rgba(42,31,20,0.35)",
        overflow: "hidden",
      }}>
        <div style={{ background: DFT.cover, color: DFT.paper, padding: "8px 14px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: DFT.mono, fontSize: 9.5, letterSpacing: 1.4 }}>HOW · JINSI</span>
          <span style={{ fontFamily: DFT.mono, fontSize: 9.5, letterSpacing: 1.4 }}>3 STEPS</span>
        </div>
        <div style={{ padding: "10px 14px", background: ledgerBg(DFT.rule, 0.55), backgroundColor: DFT.paper }}>
          <StepRow n="01" verb="Piga picha" body="Snap the Form 34A. The book reads it for you." stampCode="4A7F" stampRotate={-8} verified />
          <StepRow n="02" verb="Andika" body="Confirm the numbers. Stamp the row." stampCode="9C12" stampRotate={6} pending />
          <StepRow n="03" verb="Tia saini" body="Three citizens sign. The page is sealed." stampCode="—" stampRotate={0} empty />
        </div>
        <div style={{ padding: "8px 14px 12px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div style={{ fontFamily: DFT.mono, fontSize: 10, color: DFT.muted, letterSpacing: 1 }}>SIGNED BY</div>
          <div style={{ fontFamily: DFT.hand, fontSize: 22, color: DFT.ink2, marginTop: -4 }}>M. Wanjiku</div>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ padding: "0 22px 22px" }}>
        <button style={{
          width: "100%", background: DFT.cover, color: DFT.paper,
          fontFamily: DFT.serif, fontWeight: 600, fontSize: 16,
          padding: "16px 18px", borderRadius: 3,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          Endelea · Continue
          <span style={{ fontFamily: DFT.mono, fontSize: 18 }}>→</span>
        </button>
        <div style={{ marginTop: 10, fontFamily: DFT.mono, fontSize: 10.5, color: DFT.muted, textAlign: "center" }}>
          STEP 2 of 3 · ●●○
        </div>
      </div>
    </DaftariPhone>
  );
}

function StepRow({ n, verb, body, stampCode, stampRotate, verified, pending, empty }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "26px 1fr 58px", columnGap: 10,
      alignItems: "center", padding: "10px 0",
      borderBottom: `1px solid ${DFT.rule}`,
    }}>
      <div style={{ fontFamily: DFT.mono, fontSize: 11, color: DFT.muted }}>{n}</div>
      <div>
        <div style={{ fontFamily: DFT.serif, fontSize: 15, fontWeight: 600, color: DFT.ink }}>{verb}</div>
        <div style={{ fontFamily: DFT.serif, fontSize: 12.5, color: DFT.ink2, lineHeight: 1.35 }}>{body}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {verified
          ? <Stamp size={50} rotate={stampRotate} code={stampCode} date="08·08" />
          : pending
            ? <span style={{
                fontFamily: DFT.mono, fontSize: 9, color: DFT.accent,
                border: `1px solid ${DFT.accent}`, padding: "2px 6px", borderRadius: 2,
                letterSpacing: 0.6,
              }}>2 / 3</span>
            : <span style={{ fontFamily: DFT.hand, fontSize: 24, color: DFT.muted }}>—</span>
        }
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Onboarding 3/3 — Sign your book
// ════════════════════════════════════════════════════════════════
function DaftariOb3() {
  return (
    <DaftariPhone>
      <StampDefs />
      <DaftariDisclaimer />
      <div style={{ padding: "22px 22px 14px" }}>
        <div style={{ fontFamily: DFT.mono, fontSize: 11, color: DFT.muted, letterSpacing: 1.4 }}>
          KURAZETU · 03 / 03
        </div>
        <h2 style={{
          marginTop: 12, fontFamily: DFT.display, fontSize: 28, lineHeight: 1.1,
          letterSpacing: -0.4, color: DFT.ink, textWrap: "balance",
        }}>
          Andika jina lako.<br />Sign your book.
        </h2>
        <p style={{ marginTop: 6, fontSize: 13, color: DFT.ink2, lineHeight: 1.5, maxWidth: 290, fontFamily: DFT.serif }}>
          You become a <b>Mweka Hazina</b> — citizen treasurer.
          Your number lives on the book. Your phone stays yours.
        </p>
      </div>

      {/* Sign card */}
      <div style={{
        margin: "8px 22px 0", background: DFT.paper,
        border: `1px solid ${DFT.ink}22`, borderRadius: 3, overflow: "hidden",
        boxShadow: "0 8px 20px -16px rgba(42,31,20,0.35)",
      }}>
        <div style={{ background: DFT.cover, color: DFT.paper, padding: "10px 14px" }}>
          <div style={{ fontFamily: DFT.mono, fontSize: 9.5, letterSpacing: 1.4, opacity: 0.7 }}>
            DAFTARI No. — issued on sign-in
          </div>
          <div style={{ fontFamily: DFT.display, fontSize: 22, lineHeight: 1, letterSpacing: -0.3, marginTop: 4 }}>
            Mweka Hazina
          </div>
        </div>

        <div style={{ padding: "16px 14px", background: ledgerBg(DFT.rule, 0.45), backgroundColor: DFT.paper }}>
          <div style={{ fontFamily: DFT.mono, fontSize: 9.5, letterSpacing: 1.2, color: DFT.muted }}>
            NAMBARI YA SIMU · PHONE
          </div>
          <div style={{
            marginTop: 6, fontFamily: DFT.mono, fontSize: 18, color: DFT.ink, letterSpacing: 1,
            paddingBottom: 6, borderBottom: `1.5px solid ${DFT.ink}55`,
          }}>
            +254 712 304 |
          </div>

          <div style={{ marginTop: 14, fontFamily: DFT.mono, fontSize: 9.5, letterSpacing: 1.2, color: DFT.muted }}>
            SAINI YAKO · YOUR MARK
          </div>
          <div style={{
            marginTop: 6, height: 60, position: "relative",
            borderBottom: `1.5px solid ${DFT.ink}55`,
          }}>
            <div style={{
              position: "absolute", left: 0, bottom: 6,
              fontFamily: DFT.hand, fontSize: 38, color: DFT.ink, lineHeight: 1,
            }}>
              M. Wanjiku
            </div>
            <div style={{ position: "absolute", right: -6, top: -8 }}>
              <Stamp size={64} rotate={-12} code="KZ·NEW" date="08·08·27" verified={false} />
            </div>
          </div>

          <div style={{
            marginTop: 14, fontFamily: DFT.serif, fontSize: 11.5, color: DFT.ink2, lineHeight: 1.5,
          }}>
            By signing you accept the <b>unofficial-data disclaimer</b> — KuraZetu is a
            citizen passbook, not an IEBC publication.
          </div>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ padding: "0 22px 22px" }}>
        <button style={{
          width: "100%", background: DFT.stamp, color: DFT.paper,
          fontFamily: DFT.serif, fontWeight: 600, fontSize: 16,
          padding: "16px 18px", borderRadius: 3,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          Bana saini · Stamp my book
          <span style={{ fontFamily: DFT.mono, fontSize: 18 }}>→</span>
        </button>
      </div>
    </DaftariPhone>
  );
}

// ════════════════════════════════════════════════════════════════
// Pitch card
// ════════════════════════════════════════════════════════════════
function DaftariPitchCard() {
  return (
    <div style={{
      width: "100%", height: "100%", background: DFT.cover, color: DFT.paper,
      padding: "32px 32px 28px", boxSizing: "border-box", position: "relative",
      fontFamily: DFT.serif, overflow: "hidden",
    }}>
      <StampDefs />
      <div style={{ fontFamily: DFT.mono, fontSize: 11, color: "#E7C672", letterSpacing: 1.4 }}>
        DIRECTION B · THE PITCH
      </div>
      <h1 style={{
        marginTop: 14, fontFamily: DFT.display, fontSize: 56, fontWeight: 400,
        letterSpacing: -1.2, lineHeight: 0.95,
      }}>
        Daftari ya<br/>Wananchi.
      </h1>

      <p style={{ marginTop: 18, fontFamily: DFT.serif, fontSize: 18, lineHeight: 1.4, fontWeight: 400, maxWidth: 460, color: "#EBE3CC" }}>
        A passbook the country fills in together — one row per polling station,
        one stamp per Form 34A, one signature per citizen.
        The receipt isn't a code, it's <i>your page</i>.
      </p>

      <div style={{
        marginTop: 22, padding: "14px 16px",
        background: "rgba(255,255,255,0.08)", borderLeft: `3px solid ${DFT.accent}`,
        borderRadius: 2, fontSize: 13, lineHeight: 1.55, color: "#E5DEC9", maxWidth: 480,
      }}>
        <b style={{ color: DFT.paper }}>Cultural grammar:</b> the chama passbook —
        women-led organising, school report cards, savings groups, the title-deed-in-the-drawer
        kind of trust. Quiet, paper, communal. The opposite of broadcast politics.
      </div>

      <div style={{
        position: "absolute", left: 32, right: 32, bottom: 88,
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14,
        fontFamily: DFT.mono, fontSize: 12,
      }}>
        <DftStat label="Verb"     value="Andika" />
        <DftStat label="Artefact" value="Stempu" />
        <DftStat label="Identity" value="Mweka Hazina" />
        <DftStat label="Daily hook" value="Empty rows" />
      </div>

      <div style={{
        position: "absolute", left: 32, right: 32, bottom: 22,
        paddingTop: 16, borderTop: `1px dashed ${DFT.paper}33`,
        fontFamily: DFT.serif, fontSize: 13, color: DFT.paper,
      }}>
        <span style={{ opacity: 0.65 }}>"</span>
        Ni kama chama ya nchi nzima — kila mtu ana book yake, kila kituo ni mchango.
        <span style={{ opacity: 0.65 }}>"</span>
        <div style={{ marginTop: 6, opacity: 0.65, fontFamily: DFT.mono, fontSize: 11 }}>— 22, Eldoret</div>
      </div>

      {/* Floating stamps decoration */}
      <div style={{ position: "absolute", right: 30, top: 38, opacity: 0.85 }}>
        <Stamp size={120} rotate={-12} code="KZ·4A7F" date="08·08·27" />
      </div>
    </div>
  );
}

function DftStat({ label, value }) {
  return (
    <div style={{ borderTop: `1px solid ${DFT.paper}33`, paddingTop: 8 }}>
      <div style={{ color: "#B5D1BE", fontSize: 10.5, letterSpacing: 1.2 }}>{label.toUpperCase()}</div>
      <div style={{ color: DFT.paper, fontSize: 16, fontWeight: 600, marginTop: 2, fontFamily: DFT.serif }}>{value}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Section
// ════════════════════════════════════════════════════════════════
function DaftariSection() {
  return (
    <DCSection
      id="02-daftari"
      title="B · DAFTARI YA WANANCHI — citizen passbook"
      subtitle="Stamp a form. Stamp a station. Sign your book."
    >
      <DCArtboard id="dft-pitch" label="B · pitch" width={560} height={640}>
        <DaftariPitchCard />
      </DCArtboard>
      <DCArtboard id="dft-brand" label="B · brand identity" width={720} height={640}>
        <DaftariBrandCard />
      </DCArtboard>
      <DCArtboard id="dft-ob1" label="B · onboarding 1/3 · welcome" width={360} height={720}>
        <DaftariOb1 />
      </DCArtboard>
      <DCArtboard id="dft-ob2" label="B · onboarding 2/3 · how it works" width={360} height={720}>
        <DaftariOb2 />
      </DCArtboard>
      <DCArtboard id="dft-ob3" label="B · onboarding 3/3 · sign your book" width={360} height={720}>
        <DaftariOb3 />
      </DCArtboard>
    </DCSection>
  );
}

Object.assign(window, { DaftariSection });
