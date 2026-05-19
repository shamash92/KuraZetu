/* global React, AndroidDevice */
// KuraZetu — shared phone shell + primitives used across all mobile flows.
// Wraps AndroidDevice with our brand tokens; provides Disclaimer strip,
// Banner, OfflineChip, BottomTab, Sheet, FormField etc.

const phoneStyle = { borderColor: "var(--kz-line-strong)" };

// Wraps a screen body inside the Android frame, gives us a brand-tokened
// background. We override the AndroidDevice background via wrapper bg.
// Default dark=true because Ramani is dark-first.
function Phone({ children, dark = true, label }) {
  return (
    <div style={{ width: 360, height: 640, position: "relative" }}>
      <AndroidDevice
        width={360}
        height={640}
        dark={dark}
        title={undefined}
      >
        <div
          className="kz"
          style={{
            background: "var(--kz-bg)",
            minHeight: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </div>
      </AndroidDevice>
    </div>
  );
}

// Persistent "this is not IEBC" strip. Designed so screenshots can't crop
// it out cleanly — it sits flush with the OS status bar.
function Disclaimer({ tone = "muted" }) {
  return (
    <div
      className="kz-disclaimer"
      style={
        tone === "warn"
          ? { background: "var(--kz-warn-soft)", color: "var(--kz-warn)" }
          : {}
      }
    >
      <span>Citizen tally · Not IEBC</span>
    </div>
  );
}

// Top app bar — our own, since Material's default doesn't match the system.
function AppBar({ title, sub, back, action }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px 14px",
        borderBottom: "1px solid var(--kz-line)",
        background: "var(--kz-bg)",
      }}
    >
      {back && (
        <button
          aria-label="Back"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: 0,
            background: "transparent",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            color: "var(--kz-ink)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: "var(--kz-ink)", letterSpacing: -0.1 }}>
          {title}
        </div>
        {sub && (
          <div style={{ fontSize: 12, color: "var(--kz-ink-2)", marginTop: 2 }}>{sub}</div>
        )}
      </div>
      {action}
    </div>
  );
}

// Inline banner (info/warn/danger). Used for offline status, low-trust
// submission flags, etc. No left-bar accent — color the leading icon
// instead, and let the background tone carry the meaning.
function Banner({ tone = "info", title, children, icon }) {
  const palette = {
    info: ["--kz-info-soft", "--kz-info"],
    warn: ["--kz-warn-soft", "--kz-warn"],
    danger: ["--kz-danger-soft", "--kz-danger"],
    success: ["--kz-success-soft", "--kz-success"],
  }[tone];
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        padding: "12px 14px",
        background: `var(${palette[0]})`,
        borderRadius: 6,
        margin: "0 16px",
      }}
    >
      <div style={{ color: `var(${palette[1]})`, flex: "0 0 auto", marginTop: 1 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--kz-ink)", marginBottom: children ? 2 : 0 }}>
            {title}
          </div>
        )}
        {children && (
          <div style={{ fontSize: 12.5, color: "var(--kz-ink-2)", lineHeight: 1.45 }}>{children}</div>
        )}
      </div>
    </div>
  );
}

function Dot() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle cx="7" cy="7" r="3" />
    </svg>
  );
}

// Bottom tab bar — fixed at phone bottom inside content area.
function BottomTabs({ active = "home" }) {
  const tabs = [
    { id: "home", label: "Tally", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
    { id: "verify", label: "Verify", icon: "M9 12l2 2 4-4M12 3l9 4-1.5 9-7.5 5-7.5-5L3 7z" },
    { id: "submit", label: "Submit", icon: "M12 5v14M5 12h14" },
    { id: "me", label: "Profile", icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        borderTop: "1px solid var(--kz-line)",
        background: "var(--kz-bg)",
      }}
    >
      {tabs.map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
            padding: "8px 0 10px",
            color: t.id === active ? "var(--kz-ink)" : "var(--kz-ink-3)",
            position: "relative",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={t.icon} />
          </svg>
          <span style={{ fontSize: 10.5, fontWeight: t.id === active ? 600 : 500, letterSpacing: 0.02 }}>
            {t.label}
          </span>
          {t.id === active && (
            <span
              style={{
                position: "absolute",
                top: 0,
                width: 28,
                height: 2,
                borderRadius: 2,
                background: "var(--kz-ink)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Phone, Disclaimer, AppBar, Banner, BottomTabs, Dot });
