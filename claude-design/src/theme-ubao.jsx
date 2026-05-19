/* global React, AndroidDevice */
// THEME C · UBAO — public scoreboard / matatu route-board
// Mental model: the country's tally lives on a giant mechanical board —
// matatu route boards × stadium split-flap × airport departures.
// Civic-as-spectacle. The act of posting a Form 34A is "bandika" — to
// paste it up on the board, in public, where every citizen can see.

const UB = {
  bg:     "#0B0B0D",
  bg2:    "#15161A",
  flap:   "#1E1F23",
  flapHi: "#2A2C32",
  amber:  "#F7B500",
  amber2: "#FFD25A",
  white:  "#F4F2EB",
  red:    "#E2502F",
  green:  "#3DDC84",
  muted:  "#7A7D87",
  line:   "#2A2C32",
  disp:   "'Bebas Neue', 'Arial Narrow', sans-serif",
  mono:   "'JetBrains Mono', ui-monospace, monospace",
  sans:   "'IBM Plex Sans', system-ui, sans-serif",
};

// ─── phone shell ────────────────────────────────────────────────
function UbaoPhone({ children, dark = true }) {
  return (
    <div style={{ width: 360, height: 720, position: "relative" }}>
      <AndroidDevice width={360} height={720} dark={dark} title={undefined}>
        <div className="kz" style={{
          background: UB.bg, color: UB.white,
          minHeight: "100%", display: "flex", flexDirection: "column",
          fontFamily: UB.sans,
        }}>
          {children}
        </div>
      </AndroidDevice>
    </div>
  );
}

function UbaoDisclaimer() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "5px 12px", background: "#000",
      color: UB.amber,
      fontFamily: UB.mono, fontSize: 10, letterSpacing: 1.2,
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 6, height: 6, background: UB.amber, display: "inline-block", borderRadius: 1 }} />
        UBAO · CITIZEN TALLY · SI IEBC
      </span>
      <span style={{ color: UB.muted }}>UNOFFICIAL</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Split-flap primitives
// ════════════════════════════════════════════════════════════════

// A single split-flap "card" — black mechanical tile with a glyph.
// Mid-line seam to suggest the flip mechanism.
function Flap({ ch, w = 18, h = 26, color = UB.white, size = 22, weight = 600, bg = UB.flap }) {
  return (
    <span style={{
      display: "inline-block", width: w, height: h, background: bg,
      color, fontFamily: UB.disp, fontSize: size, fontWeight: weight,
      lineHeight: `${h}px`, textAlign: "center", position: "relative",
      borderRadius: 2, boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)",
      letterSpacing: 0, verticalAlign: "middle",
    }}>
      {/* mid seam */}
      <span style={{
        position: "absolute", left: 0, right: 0, top: "50%",
        height: 1, background: "rgba(0,0,0,0.65)",
      }} />
      {ch}
    </span>
  );
}

// A run of flaps with auto-letter rendering
function FlapText({ text, w = 17, h = 26, color = UB.white, size = 22, weight = 600, gap = 2, bg }) {
  const chars = String(text).split("");
  return (
    <span style={{ display: "inline-flex", gap }}>
      {chars.map((c, i) => (
        <Flap key={i} ch={c === " " ? "\u00A0" : c} w={c === " " ? Math.round(w*0.55) : w}
              h={h} color={color} size={size} weight={weight} bg={bg} />
      ))}
    </span>
  );
}

// Mechanical board row: code · destination · count · status
function BoardRow({ code, dest, count, status = "LIVE", muted = false }) {
  const c = muted ? UB.muted : UB.white;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "62px 1fr 70px 56px", columnGap: 8,
      alignItems: "center", padding: "5px 10px",
      borderBottom: `1px solid ${UB.line}`,
      background: muted ? "transparent" : "rgba(247,181,0,0.025)",
    }}>
      <div><FlapText text={code} w={11} h={20} size={16} color={c} /></div>
      <div><FlapText text={dest} w={11} h={20} size={16} color={c} /></div>
      <div style={{ textAlign: "right" }}>
        <FlapText text={count} w={11} h={20} size={16} color={muted ? UB.muted : UB.amber} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 4 }}>
        {status === "LIVE" ? (
          <>
            <span style={{ width: 6, height: 6, background: UB.green, borderRadius: 999, boxShadow: `0 0 6px ${UB.green}` }} />
            <span style={{ fontFamily: UB.mono, fontSize: 9.5, color: UB.green, letterSpacing: 0.6 }}>LIVE</span>
          </>
        ) : status === "WAIT" ? (
          <span style={{ fontFamily: UB.mono, fontSize: 9.5, color: UB.muted, letterSpacing: 0.6 }}>WAIT</span>
        ) : (
          <span style={{ fontFamily: UB.mono, fontSize: 9.5, color: UB.amber, letterSpacing: 0.6 }}>NEW</span>
        )}
      </div>
    </div>
  );
}

// The "atom" — a split-flap board card with one station's posting.
function UbaoCard({ scale = 1 }) {
  return (
    <div style={{
      width: 260, background: UB.bg, border: `1px solid ${UB.line}`,
      borderRadius: 4, padding: 0, transform: `scale(${scale})`, transformOrigin: "top left",
      boxShadow: "0 18px 32px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
      overflow: "hidden", fontFamily: UB.sans,
    }}>
      {/* Header rail */}
      <div style={{
        background: "#000", padding: "6px 12px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontFamily: UB.mono, fontSize: 9.5, color: UB.amber, letterSpacing: 1.2 }}>
          UBAO · POST No. 04127
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, background: UB.green, borderRadius: 999, boxShadow: `0 0 6px ${UB.green}` }} />
          <span style={{ fontFamily: UB.mono, fontSize: 9, color: UB.green, letterSpacing: 0.6 }}>LIVE</span>
        </div>
      </div>

      {/* Main flap headline — station */}
      <div style={{ padding: "12px 12px 8px" }}>
        <div style={{ fontFamily: UB.mono, fontSize: 9, color: UB.muted, letterSpacing: 1.2 }}>
          KITUO · STATION
        </div>
        <div style={{ marginTop: 6 }}>
          <FlapText text="KILIMANI 03" w={13} h={24} size={20} />
        </div>
        <div style={{ marginTop: 4, fontFamily: UB.mono, fontSize: 9.5, color: UB.muted, letterSpacing: 0.6 }}>
          290·04·012·03 · DAGORETTI N
        </div>
      </div>

      {/* Tally rows */}
      <div style={{ background: UB.bg2, margin: "0 0 0 0", padding: "6px 0", borderTop: `1px solid ${UB.line}` }}>
        <Tally name="CAND A" count="312" hi />
        <Tally name="CAND B" count="278" />
        <Tally name="CAND C" count="041" />
        <Tally name="REJ"    count="009" muted />
      </div>

      {/* Footer rail */}
      <div style={{
        padding: "8px 12px", background: "#000",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontFamily: UB.mono, fontSize: 9, color: UB.muted, letterSpacing: 0.6 }}>
          POSTED 14:22 · 3/3 SIGNED
        </div>
        <div style={{ fontFamily: UB.mono, fontSize: 9, color: UB.amber, letterSpacing: 0.8 }}>
          KZ·4A7F
        </div>
      </div>
      <div style={{
        padding: "5px 12px", background: UB.amber, color: "#000",
        fontFamily: UB.mono, fontSize: 8.5, letterSpacing: 1, textAlign: "center",
      }}>
        CITIZEN TALLY · SI IEBC · KURAZETU.KE/U/4A7F
      </div>
    </div>
  );
}

function Tally({ name, count, muted, hi }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "70px 1fr",
      padding: "3px 12px", alignItems: "center",
    }}>
      <div style={{ fontFamily: UB.mono, fontSize: 10, color: muted ? UB.muted : UB.white, letterSpacing: 1 }}>
        {name}
      </div>
      <div style={{ textAlign: "right" }}>
        <FlapText text={count} w={13} h={22} size={18} color={muted ? UB.muted : hi ? UB.amber : UB.white} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Brand identity card
// ════════════════════════════════════════════════════════════════
function UbaoBrandCard() {
  return (
    <div style={{
      width: "100%", height: "100%", background: UB.bg, color: UB.white,
      padding: "30px 32px 26px", boxSizing: "border-box", position: "relative",
      fontFamily: UB.sans, overflow: "hidden",
    }}>
      {/* Header strip */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontFamily: UB.mono, fontSize: 11, letterSpacing: 1.4, color: UB.muted }}>
          DIRECTION C · 01 / 05
        </div>
        <div style={{ fontFamily: UB.mono, fontSize: 11, letterSpacing: 1.4, color: UB.muted }}>
          BRAND ID
        </div>
      </div>

      {/* Wordmark */}
      <div style={{ marginTop: 18, display: "flex", alignItems: "flex-end", gap: 14 }}>
        <div style={{
          fontFamily: UB.disp, fontSize: 108, color: UB.white, lineHeight: 0.85, letterSpacing: 0,
        }}>
          UBAO<span style={{ color: UB.amber }}>.</span>
        </div>
        <div style={{ paddingBottom: 14 }}>
          <div style={{ fontFamily: UB.mono, fontSize: 11, color: UB.muted, letterSpacing: 1.4 }}>
            A KURAZETU THING
          </div>
          <div style={{ fontFamily: UB.disp, fontSize: 18, color: UB.amber, letterSpacing: 1, lineHeight: 1 }}>
            CITIZEN PUBLIC BOARD
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 15.5, color: "#D1D1D6", maxWidth: 460, lineHeight: 1.45 }}>
        Bandika fomu yako kwa ubao wa wananchi. Post every Form 34A to the public board —
        the country flips, station by station, in front of everyone.
      </div>

      {/* Two-column */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 28, marginTop: 22 }}>
        <div>
          <UBLabel>Palette</UBLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 10 }}>
            {[
              ["BG",     UB.bg,    "#0B0B0D"],
              ["FLAP",   UB.flap,  "#1E1F23"],
              ["AMBER",  UB.amber, "#F7B500"],
              ["WHITE",  UB.white, "#F4F2EB"],
              ["LIVE",   UB.green, "#3DDC84"],
            ].map(([n, c, hex]) => (
              <div key={n}>
                <div style={{ height: 56, background: c, borderRadius: 3, border: `1px solid ${UB.line}` }} />
                <div style={{ fontFamily: UB.mono, fontSize: 10, marginTop: 6, color: UB.white }}>{n}</div>
                <div style={{ fontFamily: UB.mono, fontSize: 9.5, color: UB.muted }}>{hex}</div>
              </div>
            ))}
          </div>

          <UBLabel style={{ marginTop: 22 }}>Type</UBLabel>
          <div style={{ marginTop: 8, display: "grid", rowGap: 8 }}>
            <UBType text="UBAO" font={UB.disp} note="Bebas Neue · display" size={36} weight={400} />
            <UBType text="BANDIKA FOMU" font={UB.disp} note="Bebas Neue · 28 · uppercase" size={28} color={UB.amber} />
            <UBType text="312 · 278 · 041" font={UB.mono} note="JetBrains Mono · digits" size={18} />
            <UBType text="Citizen tally, posted in public." font={UB.sans} note="Plex Sans · body" size={14} />
          </div>

          <UBLabel style={{ marginTop: 22 }}>Theme grammar</UBLabel>
          <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "100px 1fr", rowGap: 7, fontSize: 13 }}>
            <UBGr>Verb</UBGr>
            <div><b>Bandika</b> · post / paste up on the board.</div>
            <UBGr>Artefact</UBGr>
            <div><b>Tangazo</b> · the posted card with flap-headlined tally.</div>
            <UBGr>Identity</UBGr>
            <div><b>Mbandikaji</b> · poster. Listed on the board.</div>
            <UBGr>Daily hook</UBGr>
            <div>The board flips. Live ticker of new posts.</div>
            <UBGr>Atom</UBGr>
            <div>The split-flap card — distinctive, screenshot-loud.</div>
          </div>
        </div>

        <div>
          <UBLabel>The atom · tangazo</UBLabel>
          <div style={{ marginTop: 10 }}>
            <UbaoCard />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: "absolute", left: 32, right: 32, bottom: 22,
        paddingTop: 14, borderTop: `1px dashed ${UB.line}`,
        fontFamily: UB.mono, fontSize: 11.5, color: UB.white,
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
      }}>
        <span>
          <span style={{ color: UB.muted }}>"</span>
          Ni kama <b>scoreboard ya nchi</b> — flap, flap, flap, every station inakuja juu.
          <span style={{ color: UB.muted }}>"</span>
        </span>
        <span style={{ color: UB.muted }}>— 22, Eldoret</span>
      </div>
    </div>
  );
}

function UBLabel({ children, style = {} }) {
  return (
    <div style={{
      fontFamily: UB.mono, fontSize: 10.5, letterSpacing: 1.4,
      color: UB.amber, textTransform: "uppercase", ...style,
    }}>{children}</div>
  );
}
function UBGr({ children }) {
  return (
    <div style={{ fontFamily: UB.mono, fontSize: 11, color: UB.muted, letterSpacing: 0.6 }}>
      {String(children).toUpperCase()}
    </div>
  );
}
function UBType({ text, font, note, size = 18, weight = 500, color = UB.white }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
      <span style={{ fontFamily: font, fontSize: size, fontWeight: weight, color, lineHeight: 1 }}>{text}</span>
      <span style={{ fontFamily: UB.mono, fontSize: 10, color: UB.muted, marginLeft: "auto" }}>{note}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Onboarding 1/3 — Welcome (the board itself)
// ════════════════════════════════════════════════════════════════
function UbaoOb1() {
  return (
    <UbaoPhone>
      <UbaoDisclaimer />
      <div style={{ padding: "22px 18px 12px" }}>
        <div style={{ fontFamily: UB.mono, fontSize: 10.5, color: UB.muted, letterSpacing: 1.4 }}>
          KURAZETU · 01 / 03
        </div>
        <div style={{ marginTop: 14, fontFamily: UB.disp, fontSize: 64, color: UB.white, lineHeight: 0.86, letterSpacing: 0 }}>
          UBAO<span style={{ color: UB.amber }}>.</span>
        </div>
        <div style={{ marginTop: 6, fontFamily: UB.disp, fontSize: 24, color: UB.amber, lineHeight: 1, letterSpacing: 1.4 }}>
          BANDIKA FOMU.<br />
          POST THE COUNTRY.
        </div>
        <div style={{ marginTop: 12, fontFamily: UB.sans, fontSize: 13.5, color: "#C9CAD1", lineHeight: 1.5, maxWidth: 290 }}>
          Every Form 34A flips up on the citizen board. 46,229 stations.
          One country, posted in public.
        </div>
      </div>

      {/* The actual board */}
      <div style={{ margin: "14px 18px 0", background: UB.bg2, border: `1px solid ${UB.line}`, borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          background: "#000", padding: "6px 12px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontFamily: UB.mono, fontSize: 9.5, color: UB.amber, letterSpacing: 1.2 }}>
            UBAO WA WANANCHI · LIVE
          </span>
          <span style={{ fontFamily: UB.mono, fontSize: 9.5, color: UB.muted, letterSpacing: 0.8 }}>
            14:22 · 12,408 / 46,229
          </span>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "62px 1fr 70px 56px", columnGap: 8,
          padding: "5px 10px", borderBottom: `1px solid ${UB.line}`,
          fontFamily: UB.mono, fontSize: 9, color: UB.muted, letterSpacing: 1,
        }}>
          <span>CODE</span><span>STATION</span><span style={{ textAlign: "right" }}>TOTAL</span><span style={{ textAlign: "right" }}>ST</span>
        </div>
        <BoardRow code="4A7F" dest="KILIMANI 03"   count="  640" status="LIVE" />
        <BoardRow code="9C12" dest="NGONG H 07"    count="  712" status="LIVE" />
        <BoardRow code="2D71" dest="KAWANGWARE 02" count="  ---" status="WAIT" muted />
        <BoardRow code="8E03" dest="ELDORET S 01"  count="  588" status="NEW" />
      </div>

      <div style={{ flex: 1 }} />

      {/* Footer ticker + CTA */}
      <div style={{ padding: "12px 18px 20px" }}>
        <div style={{
          padding: "6px 10px", background: UB.bg2, border: `1px solid ${UB.line}`,
          borderRadius: 3, fontFamily: UB.mono, fontSize: 11, color: UB.amber, letterSpacing: 0.6,
          overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
        }}>
          + KZ·8E03 ELDORET S 01 posted · + KZ·9C12 NGONG H 07 verified · + KZ·4A7…
        </div>
        <button style={{
          marginTop: 12, width: "100%",
          background: UB.amber, color: "#000",
          fontFamily: UB.disp, fontWeight: 400, fontSize: 22, letterSpacing: 1.2,
          padding: "14px 16px", borderRadius: 3,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          ANZA · GET ON THE BOARD
          <span style={{ fontFamily: UB.mono, fontSize: 18 }}>→</span>
        </button>
      </div>
    </UbaoPhone>
  );
}

// ════════════════════════════════════════════════════════════════
// Onboarding 2/3 — How it works (three flap cards)
// ════════════════════════════════════════════════════════════════
function UbaoOb2() {
  const steps = [
    { n: "01", verb: "PIGA",    body: "Snap the Form 34A.",                meta: "~10s · OFFLINE OK" },
    { n: "02", verb: "BANDIKA", body: "Post it to the board.",             meta: "AUTO · OCR ASSIST" },
    { n: "03", verb: "FLIP",    body: "Three citizens sign. The flap drops.", meta: "3/3 SIGN · LIVE" },
  ];
  return (
    <UbaoPhone>
      <UbaoDisclaimer />
      <div style={{ padding: "22px 18px 6px" }}>
        <div style={{ fontFamily: UB.mono, fontSize: 10.5, color: UB.muted, letterSpacing: 1.4 }}>
          KURAZETU · 02 / 03
        </div>
        <h2 style={{
          marginTop: 12, fontFamily: UB.disp, fontSize: 38, color: UB.white,
          lineHeight: 0.95, letterSpacing: 0.4,
        }}>
          THREE FLAPS,<br />
          <span style={{ color: UB.amber }}>ONE CITIZEN BOARD.</span>
        </h2>
        <p style={{ marginTop: 8, fontSize: 13, color: "#C9CAD1", lineHeight: 1.5, maxWidth: 290 }}>
          Every form moves from your pocket to the public board in 90 seconds.
          No login. No politics. Just the count.
        </p>
      </div>

      <div style={{ padding: "10px 18px 6px", display: "grid", rowGap: 10 }}>
        {steps.map((s) => (
          <div key={s.n} style={{
            background: UB.bg2, border: `1px solid ${UB.line}`, borderRadius: 4,
            padding: "10px 12px",
            display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center",
          }}>
            <div>
              <div style={{ fontFamily: UB.mono, fontSize: 10, color: UB.muted, letterSpacing: 1 }}>
                STEP {s.n}
              </div>
              <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                <FlapText text={s.verb} w={16} h={28} size={22} color={UB.amber} />
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: UB.white, lineHeight: 1.35 }}>{s.body}</div>
            </div>
            <div style={{
              fontFamily: UB.mono, fontSize: 9.5, color: UB.muted, letterSpacing: 0.8,
              textAlign: "right", maxWidth: 80,
            }}>
              {s.meta}
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: "0 18px 20px" }}>
        <div style={{
          background: "#000", border: `1px solid ${UB.amber}66`, padding: "8px 12px",
          borderRadius: 3, fontFamily: UB.mono, fontSize: 11, color: UB.amber,
          letterSpacing: 0.6, display: "flex", justifyContent: "space-between",
        }}>
          <span>WHAT YOU GET</span>
          <span style={{ color: UB.white }}>A POST · YOUR NAME ON IT</span>
        </div>
        <button style={{
          marginTop: 10, width: "100%",
          background: UB.amber, color: "#000",
          fontFamily: UB.disp, fontWeight: 400, fontSize: 22, letterSpacing: 1.2,
          padding: "14px 16px", borderRadius: 3,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          ENDELEA · CONTINUE
          <span style={{ fontFamily: UB.mono, fontSize: 18 }}>→</span>
        </button>
        <div style={{ marginTop: 8, fontFamily: UB.mono, fontSize: 10.5, color: UB.muted, textAlign: "center", letterSpacing: 0.6 }}>
          STEP 2 of 3 · ●●○
        </div>
      </div>
    </UbaoPhone>
  );
}

// ════════════════════════════════════════════════════════════════
// Onboarding 3/3 — Pick your station + claim handle
// ════════════════════════════════════════════════════════════════
function UbaoOb3() {
  return (
    <UbaoPhone>
      <UbaoDisclaimer />
      <div style={{ padding: "22px 18px 6px" }}>
        <div style={{ fontFamily: UB.mono, fontSize: 10.5, color: UB.muted, letterSpacing: 1.4 }}>
          KURAZETU · 03 / 03
        </div>
        <h2 style={{
          marginTop: 12, fontFamily: UB.disp, fontSize: 36, color: UB.white,
          lineHeight: 0.95, letterSpacing: 0.4,
        }}>
          PICK YOUR<br />
          <span style={{ color: UB.amber }}>KITUO.</span>
        </h2>
        <p style={{ marginTop: 6, fontSize: 13, color: "#C9CAD1", lineHeight: 1.5, maxWidth: 290 }}>
          Where will you post from? You can change later — most Mbandikaji stick to
          where they voted.
        </p>
      </div>

      {/* Station search */}
      <div style={{ padding: "10px 18px 6px" }}>
        <div style={{
          background: UB.bg2, border: `1px solid ${UB.line}`, borderRadius: 3,
          padding: "10px 12px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={UB.muted} strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <span style={{ fontFamily: UB.mono, fontSize: 13, color: UB.white, letterSpacing: 0.4 }}>
            kilimani primary|
          </span>
        </div>
      </div>

      <div style={{ margin: "10px 18px 0", background: UB.bg2, border: `1px solid ${UB.line}`, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ background: "#000", padding: "6px 12px", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontFamily: UB.mono, fontSize: 9.5, color: UB.amber, letterSpacing: 1.2 }}>NEAR YOU · DAGORETTI</span>
          <span style={{ fontFamily: UB.mono, fontSize: 9.5, color: UB.muted, letterSpacing: 0.8 }}>4 RESULTS</span>
        </div>
        <BoardRow code="4A7F" dest="KILIMANI 03"   count="  ---" status="WAIT" />
        <BoardRow code="4A80" dest="KILIMANI 04"   count="  ---" status="WAIT" />
        <BoardRow code="5C19" dest="DAGORETTI 01"  count="  640" status="LIVE" muted />
        <BoardRow code="5D02" dest="DAGORETTI 02"  count="  712" status="LIVE" muted />
      </div>

      {/* Mbandikaji handle preview */}
      <div style={{
        margin: "12px 18px 0", padding: "10px 12px", background: "#000",
        border: `1px solid ${UB.amber}33`, borderRadius: 3,
      }}>
        <div style={{ fontFamily: UB.mono, fontSize: 9.5, color: UB.muted, letterSpacing: 1.2 }}>
          YOUR HANDLE · MBANDIKAJI
        </div>
        <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
          <FlapText text="KZ 04127" w={13} h={22} size={18} color={UB.amber} />
        </div>
        <div style={{ marginTop: 6, fontSize: 11.5, color: "#C9CAD1" }}>
          Pseudonymous. Your name lives on the board, not your number.
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <div style={{ padding: "12px 18px 20px" }}>
        <button style={{
          width: "100%", background: UB.amber, color: "#000",
          fontFamily: UB.disp, fontWeight: 400, fontSize: 22, letterSpacing: 1.2,
          padding: "14px 16px", borderRadius: 3,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          BANDIKA · POST FROM HERE
          <span style={{ fontFamily: UB.mono, fontSize: 18 }}>→</span>
        </button>
        <div style={{ marginTop: 8, fontFamily: UB.mono, fontSize: 10.5, color: UB.muted, textAlign: "center", letterSpacing: 0.6 }}>
          By continuing you accept the unofficial-data disclaimer.
        </div>
      </div>
    </UbaoPhone>
  );
}

// ════════════════════════════════════════════════════════════════
// Pitch card
// ════════════════════════════════════════════════════════════════
function UbaoPitchCard() {
  return (
    <div style={{
      width: "100%", height: "100%", background: UB.bg, color: UB.white,
      padding: "30px 32px 26px", boxSizing: "border-box", position: "relative",
      fontFamily: UB.sans, overflow: "hidden",
    }}>
      <div style={{ fontFamily: UB.mono, fontSize: 11, color: UB.amber, letterSpacing: 1.4 }}>
        DIRECTION C · THE PITCH
      </div>
      <div style={{ marginTop: 12, fontFamily: UB.disp, fontSize: 110, color: UB.white, lineHeight: 0.85 }}>
        UBAO<span style={{ color: UB.amber }}>.</span>
      </div>

      <p style={{ marginTop: 18, fontSize: 19, lineHeight: 1.32, color: "#D7D8DD", maxWidth: 460, textWrap: "balance" }}>
        Every Form 34A flips up on a public board. The country tallies itself
        in <span style={{ color: UB.amber }}>amber</span> on black, station by station,
        for everyone to watch.
      </p>

      <div style={{
        marginTop: 22, padding: "14px 16px",
        background: UB.bg2, borderLeft: `3px solid ${UB.amber}`,
        fontSize: 13, lineHeight: 1.55, color: "#C9CAD1", maxWidth: 480,
      }}>
        <b style={{ color: UB.white }}>Cultural grammar:</b> the matatu route board,
        the stadium scoreboard, the airport departures board, the village notice board.
        Civic-as-spectacle, mechanical, loud, communal. The opposite of a hidden tally.
      </div>

      {/* the atom — floating board card */}
      <div style={{ position: "absolute", right: 30, top: 32, transform: "rotate(-3deg)" }}>
        <UbaoCard scale={0.85} />
      </div>

      <div style={{
        position: "absolute", left: 32, right: 32, bottom: 88,
        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14,
        fontFamily: UB.mono, fontSize: 12,
      }}>
        <UBStat label="Verb"     value="Bandika" />
        <UBStat label="Artefact" value="Tangazo" />
        <UBStat label="Identity" value="Mbandikaji" />
        <UBStat label="Daily hook" value="The board flips" />
      </div>

      <div style={{
        position: "absolute", left: 32, right: 32, bottom: 22,
        paddingTop: 16, borderTop: `1px dashed ${UB.line}`,
        fontFamily: UB.mono, fontSize: 12, color: UB.white,
      }}>
        <span style={{ color: UB.muted }}>"</span>
        Iko like a <b>scoreboard ya nchi nzima</b> — flap flap flap, station inakuja juu live.
        <span style={{ color: UB.muted }}>"</span>
        <div style={{ marginTop: 6, color: UB.muted }}>— what a 22-year-old in Eldoret would actually say</div>
      </div>
    </div>
  );
}

function UBStat({ label, value }) {
  return (
    <div style={{ borderTop: `1px solid ${UB.line}`, paddingTop: 8 }}>
      <div style={{ color: UB.muted, fontSize: 10.5, letterSpacing: 1.2 }}>{label.toUpperCase()}</div>
      <div style={{ color: UB.white, fontSize: 16, fontWeight: 600, marginTop: 2 }}>{value}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// Section
// ════════════════════════════════════════════════════════════════
function UbaoSection() {
  return (
    <DCSection
      id="03-ubao"
      title="C · UBAO — civic public board"
      subtitle="Bandika fomu. Post the country. The board flips, station by station."
    >
      <DCArtboard id="ubao-pitch" label="C · pitch" width={560} height={640}>
        <UbaoPitchCard />
      </DCArtboard>
      <DCArtboard id="ubao-brand" label="C · brand identity" width={720} height={640}>
        <UbaoBrandCard />
      </DCArtboard>
      <DCArtboard id="ubao-ob1" label="C · onboarding 1/3 · welcome" width={360} height={720}>
        <UbaoOb1 />
      </DCArtboard>
      <DCArtboard id="ubao-ob2" label="C · onboarding 2/3 · how it works" width={360} height={720}>
        <UbaoOb2 />
      </DCArtboard>
      <DCArtboard id="ubao-ob3" label="C · onboarding 3/3 · pick station" width={360} height={720}>
        <UbaoOb3 />
      </DCArtboard>
    </DCSection>
  );
}

Object.assign(window, { UbaoSection });
