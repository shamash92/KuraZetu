/* ============================================================
   KuraZetu — Mesh patch system (shared by every *-perk.html page).

   Usage:
     <div class="mesh-layer" id="meshLayer"></div>
     <script src="src/perk-mesh.js"></script>
     <script>
       initPerkMesh([
         { x: 80, y: 60, w: 1320, h: 760, s: 130, jitter: 34, alpha: 0.16,
           fade: "radial", anchor: [0.5, 0.5], delay: 200, dur: 1600,
           animate: "load" },
         // ...
       ]);
     </script>

   animate is either "load" (fire on page load) or "scroll" (fire when
   the patch scrolls into view via IntersectionObserver). Lines stagger
   outward from the anchor point so the patch feels hand-drawn.
   ============================================================ */

window.initPerkMesh = function (PATCHES, layerId) {
  const NS = "http://www.w3.org/2000/svg";
  const hash = (x, y) => {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  };

  function buildPatch(cfg, idx) {
    // Two flavors: "hex" (default) is the curvy honeycomb used through-
    // out the page. "grid" is the architectural plot used in the footer:
    // irregular horizontal + vertical lines forming rectangles of varying
    // sizes, with a few coordinate labels.
    return (cfg.kind === "grid") ? buildGridPatch(cfg, idx) : buildHexPatch(cfg, idx);
  }

  function buildGridPatch(cfg, idx) {
    // Architectural plot — irregular H + V lines forming rectangles of
    // varying sizes. Same draw-in animation as hex (stroke-dashoffset).
    const NS = "http://www.w3.org/2000/svg";
    const { x, y, w, h, alpha, fade, anchor } = cfg;

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "mesh-patch");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.style.left = x + "px";
    svg.style.top = y + "px";
    svg.style.width = w + "px";
    svg.style.height = h + "px";

    // Fade mask (same machinery as hex patches).
    const defs = document.createElementNS(NS, "defs");
    const gradId = `gg-${idx}`, maskId = `gm-${idx}`;
    let grad;
    if (fade === "radial") {
      grad = document.createElementNS(NS, "radialGradient");
      grad.setAttribute("id", gradId);
      grad.setAttribute("cx", "50%"); grad.setAttribute("cy", "50%"); grad.setAttribute("r", "55%");
      grad.innerHTML = `
        <stop offset="0"    stop-color="#fff" stop-opacity="1"/>
        <stop offset="0.6"  stop-color="#fff" stop-opacity="1"/>
        <stop offset="1"    stop-color="#fff" stop-opacity="0"/>`;
    } else {
      const dirMap = {
        left:  { x1:"0%", x2:"100%", y1:"50%", y2:"50%", stops:"1,0" },
        right: { x1:"0%", x2:"100%", y1:"50%", y2:"50%", stops:"0,1" },
        top:   { x1:"50%", x2:"50%", y1:"0%",  y2:"100%", stops:"1,0" },
        bottom:{ x1:"50%", x2:"50%", y1:"0%",  y2:"100%", stops:"0,1" },
      };
      const d = dirMap[fade] || dirMap.top;
      grad = document.createElementNS(NS, "linearGradient");
      grad.setAttribute("id", gradId);
      grad.setAttribute("x1", d.x1); grad.setAttribute("x2", d.x2);
      grad.setAttribute("y1", d.y1); grad.setAttribute("y2", d.y2);
      const [a, b] = d.stops.split(",");
      grad.innerHTML = `
        <stop offset="0"    stop-color="#fff" stop-opacity="${a}"/>
        <stop offset="0.5"  stop-color="#fff" stop-opacity="${(0.7).toFixed(2)}"/>
        <stop offset="1"    stop-color="#fff" stop-opacity="${b}"/>`;
    }
    const mask = document.createElementNS(NS, "mask");
    mask.setAttribute("id", maskId);
    mask.innerHTML = `<rect width="${w}" height="${h}" fill="url(#${gradId})"/>`;
    defs.appendChild(grad); defs.appendChild(mask);
    svg.appendChild(defs);

    const g = document.createElementNS(NS, "g");
    g.setAttribute("mask", `url(#${maskId})`);
    g.style.opacity = String(Math.min(1, alpha / 0.16));
    svg.appendChild(g);

    // Irregular line positions — proportions chosen so the resulting
    // rectangles vary in size (not a uniform grid).
    const hStops = (cfg.hStops || [0.08, 0.22, 0.34, 0.48, 0.60, 0.74, 0.88]).map(t => t * h);
    const vStops = (cfg.vStops || [0.04, 0.13, 0.22, 0.34, 0.46, 0.58, 0.68, 0.78, 0.88, 0.96]).map(t => t * w);

    // Some "emphasized" rectangles (slight fill) — picked deterministically.
    const emphRects = cfg.emphRects || [
      [vStops[1], hStops[1], vStops[3] - vStops[1], hStops[3] - hStops[1]],
      [vStops[5], hStops[3], vStops[7] - vStops[5], hStops[5] - hStops[3]],
      [vStops[2], hStops[4], vStops[4] - vStops[2], hStops[6] - hStops[4]],
    ];

    // Render emphasized fills first (under the lines).
    emphRects.forEach(([rx, ry, rw, rh]) => {
      const r = document.createElementNS(NS, "rect");
      r.setAttribute("x", rx); r.setAttribute("y", ry);
      r.setAttribute("width", rw); r.setAttribute("height", rh);
      r.setAttribute("fill", "var(--mesh-ink)");
      r.setAttribute("fill-opacity", "0.25");
      r.style.opacity = "0";
      r.style.transition = "opacity 600ms ease-out var(--delay, 0ms)";
      r._cx = rx + rw / 2; r._cy = ry + rh / 2;
      r._isRect = true;
      g.appendChild(r);
    });

    const lines = [];
    hStops.forEach((py) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", `M0 ${py.toFixed(1)} L${w} ${py.toFixed(1)}`);
      p._cx = w / 2; p._cy = py;
      g.appendChild(p);
      lines.push(p);
    });
    vStops.forEach((px) => {
      const p = document.createElementNS(NS, "path");
      p.setAttribute("d", `M${px.toFixed(1)} 0 L${px.toFixed(1)} ${h}`);
      p._cx = px; p._cy = h / 2;
      g.appendChild(p);
      lines.push(p);
    });

    // Coordinate labels at a few intersections — engineer's plot feel.
    const labels = document.createElementNS(NS, "g");
    labels.setAttribute("mask", `url(#${maskId})`);
    labels.setAttribute("font-family", "IBM Plex Mono, monospace");
    labels.setAttribute("font-size", "9");
    labels.setAttribute("fill", "var(--mute)");
    labels.setAttribute("opacity", "0.6");
    labels.setAttribute("letter-spacing", "0.16em");
    const labelTexts = cfg.labels || [
      { x: vStops[1] + 8, y: hStops[1] - 6, t: "A-12" },
      { x: vStops[3] + 8, y: hStops[2] - 6, t: "1.13° N" },
      { x: vStops[5] + 8, y: hStops[4] - 6, t: "B-04 · 47.2K" },
      { x: vStops[7] + 8, y: hStops[5] - 6, t: "SECTOR 09" },
      { x: vStops[2] + 8, y: hStops[6] - 6, t: "35.14° E" },
    ];
    labelTexts.forEach((l) => {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", l.x); t.setAttribute("y", l.y);
      t.textContent = l.t;
      labels.appendChild(t);
    });
    svg.appendChild(labels);

    const anchorPx = [w * anchor[0], h * anchor[1]];
    const maxDist = Math.hypot(w, h);

    function prepare(el) {
      if (el._isRect) {
        el.style.setProperty("--delay", "200ms");
        return;
      }
      let L;
      try { L = el.getTotalLength(); } catch (e) { L = 200; }
      el.style.setProperty("--len", L.toFixed(1));
      const dist = Math.hypot(el._cx - anchorPx[0], el._cy - anchorPx[1]);
      const t = Math.min(1, dist / maxDist);
      const stagger = t * (cfg.dur - 400);
      el.style.setProperty("--delay", (cfg.delay + stagger).toFixed(0) + "ms");
      el.style.transition =
        `stroke-dashoffset 900ms cubic-bezier(0.22, 0.61, 0.36, 1) var(--delay, 0ms), ` +
        `opacity 360ms ease-out var(--delay, 0ms)`;
    }

    svg._prepare = () => {
      lines.forEach(prepare);
      g.querySelectorAll("rect").forEach(r => {
        r.style.setProperty("--delay", (cfg.delay + cfg.dur * 0.4).toFixed(0) + "ms");
      });
      // Labels fade in late.
      labels.style.opacity = "0";
      labels.style.transition = `opacity 500ms ease-out ${(cfg.delay + cfg.dur * 0.6).toFixed(0)}ms`;
    };
    svg._postDraw = () => {
      labels.style.opacity = "0.6";
      g.querySelectorAll("rect").forEach(r => r.style.opacity = "1");
    };
    return svg;
  }

  function buildHexPatch(cfg, idx) {
    const { x, y, w, h, s, jitter: jAmp, alpha, fade, anchor } = cfg;
    const hexW = s * Math.sqrt(3);
    const rowStep = s * 1.5;

    // Per-patch vertex + edge caches so cells in the same patch share
    // boundaries (no overlap) but patches don't share with each other.
    const vcache = new Map();
    const ecache = new Map();
    const vert = (vx, vy) => {
      const kx = Math.round(vx * 10) / 10;
      const ky = Math.round(vy * 10) / 10;
      const key = kx + "," + ky;
      if (vcache.has(key)) return vcache.get(key);
      const a1 = (hash(kx + idx * 7.3, ky + idx * 1.7) - 0.5) * jAmp;
      const a2 = (hash(ky + idx * 3.1, kx + idx * 5.9) - 0.5) * jAmp;
      const v = [kx + a1, ky + a2];
      vcache.set(key, v);
      return v;
    };
    const mid = (p0, p1) => {
      const k = [p0[0].toFixed(1), p0[1].toFixed(1),
                 p1[0].toFixed(1), p1[1].toFixed(1)].sort().join("|");
      if (ecache.has(k)) return ecache.get(k);
      const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
      const len = Math.hypot(dx, dy) || 1;
      const px = -dy / len, py = dx / len;
      const seed = hash(p0[0] + p1[0] * 0.37 + idx * 9,
                        p0[1] * 0.71 + p1[1] + idx * 3);
      const off = (seed - 0.5) * len * 0.14;
      const v = [(p0[0] + p1[0]) / 2 + px * off,
                 (p0[1] + p1[1]) / 2 + py * off];
      ecache.set(k, v);
      return v;
    };

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "mesh-patch");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.style.left = x + "px";
    svg.style.top = y + "px";
    svg.style.width = w + "px";
    svg.style.height = h + "px";

    // Build a fade mask so the patch dissolves toward the configured edge.
    const defs = document.createElementNS(NS, "defs");
    const gradId = `pg-${idx}`, maskId = `pm-${idx}`;
    let grad;
    if (fade === "radial") {
      grad = document.createElementNS(NS, "radialGradient");
      grad.setAttribute("id", gradId);
      grad.setAttribute("cx", "50%"); grad.setAttribute("cy", "50%"); grad.setAttribute("r", "55%");
      grad.innerHTML = `
        <stop offset="0"    stop-color="#fff" stop-opacity="1"/>
        <stop offset="0.55" stop-color="#fff" stop-opacity="1"/>
        <stop offset="1"    stop-color="#fff" stop-opacity="0"/>`;
    } else {
      const dirMap = {
        left:  { x1:"0%", x2:"100%", y1:"50%", y2:"50%", stops:"1,0" },
        right: { x1:"0%", x2:"100%", y1:"50%", y2:"50%", stops:"0,1" },
        top:   { x1:"50%", x2:"50%", y1:"0%",  y2:"100%", stops:"1,0" },
        bottom:{ x1:"50%", x2:"50%", y1:"0%",  y2:"100%", stops:"0,1" },
      };
      const d = dirMap[fade] || dirMap.left;
      grad = document.createElementNS(NS, "linearGradient");
      grad.setAttribute("id", gradId);
      grad.setAttribute("x1", d.x1); grad.setAttribute("x2", d.x2);
      grad.setAttribute("y1", d.y1); grad.setAttribute("y2", d.y2);
      const [a, b] = d.stops.split(",");
      grad.innerHTML = `
        <stop offset="0"    stop-color="#fff" stop-opacity="${a}"/>
        <stop offset="0.55" stop-color="#fff" stop-opacity="${a==='1'?1:(Number(b)*0.6).toFixed(2)}"/>
        <stop offset="1"    stop-color="#fff" stop-opacity="${b}"/>`;
    }
    const mask = document.createElementNS(NS, "mask");
    mask.setAttribute("id", maskId);
    mask.innerHTML = `<rect width="${w}" height="${h}" fill="url(#${gradId})"/>`;
    defs.appendChild(grad); defs.appendChild(mask);
    svg.appendChild(defs);

    // Mesh group + dots group — both masked.
    const g = document.createElementNS(NS, "g");
    g.setAttribute("mask", `url(#${maskId})`);
    g.style.opacity = String(Math.min(1, alpha / 0.16));
    svg.appendChild(g);
    const dots = document.createElementNS(NS, "g");
    dots.setAttribute("mask", `url(#${maskId})`);
    svg.appendChild(dots);

    const paths = [];
    const dotEls = [];
    const cEnd = Math.ceil(w / hexW) + 1;
    const rows = Math.ceil(h / rowStep) + 2;

    for (let r = -1; r < rows; r++) {
      for (let c = -1; c <= cEnd; c++) {
        const cx = c * hexW + (r % 2 === 0 ? 0 : hexW / 2);
        const cy = r * rowStep;
        const verts = [];
        for (let i = 0; i < 6; i++) {
          const ang = (Math.PI / 3) * i + Math.PI / 2;
          verts.push(vert(cx + s * Math.cos(ang), cy + s * Math.sin(ang)));
        }
        const mids = [];
        for (let i = 0; i < 6; i++) mids.push(mid(verts[i], verts[(i+1)%6]));
        let d = "M" + mids[0][0].toFixed(1) + " " + mids[0][1].toFixed(1);
        for (let i = 0; i < 6; i++) {
          const v = verts[(i+1)%6], nx = mids[(i+1)%6];
          d += " Q" + v[0].toFixed(1) + " " + v[1].toFixed(1)
            +  " " + nx[0].toFixed(1) + " " + nx[1].toFixed(1);
        }
        d += " Z";
        const path = document.createElementNS(NS, "path");
        path.setAttribute("d", d);
        path._cx = cx; path._cy = cy;
        g.appendChild(path);
        paths.push(path);

        if (hash(c * 2.1 + idx * 11, r * 5.5 + idx * 4) > 0.88) {
          const ox = (hash(c * 4.4, r * 6.6 + idx) - 0.5) * 18;
          const oy = (hash(c * 8.2 + idx, r * 1.3) - 0.5) * 18;
          const dot = document.createElementNS(NS, "circle");
          dot.setAttribute("cx", (cx + ox).toFixed(1));
          dot.setAttribute("cy", (cy + oy).toFixed(1));
          dot.setAttribute("r", "1.6");
          dot._cx = cx + ox; dot._cy = cy + oy;
          dots.appendChild(dot);
          dotEls.push(dot);
        }
      }
    }

    const anchorPx = [w * anchor[0], h * anchor[1]];
    const maxDist = Math.hypot(w, h);

    function prepare(el, isDot) {
      let L;
      if (isDot) L = 2 * Math.PI * 1.6;
      else { try { L = el.getTotalLength(); } catch (e) { L = 200; } }
      el.style.setProperty("--len", L.toFixed(1));
      const dist = Math.hypot(el._cx - anchorPx[0], el._cy - anchorPx[1]);
      const t = Math.min(1, dist / maxDist);
      const stagger = t * (cfg.dur - 400);
      el.style.setProperty("--delay", (cfg.delay + stagger).toFixed(0) + "ms");
      const indDur = isDot ? 240 : 700;
      el.style.transition =
        `stroke-dashoffset ${indDur}ms cubic-bezier(0.22, 0.61, 0.36, 1) var(--delay, 0ms), ` +
        `opacity 360ms ease-out var(--delay, 0ms)`;
    }

    svg._prepare = () => { paths.forEach(p => prepare(p, false)); dotEls.forEach(d => prepare(d, true)); };
    return svg;
  }

  const layer = document.getElementById(layerId || "meshLayer");
  if (!layer) return;
  const built = PATCHES.map((cfg, i) => {
    const svg = buildPatch(cfg, i);
    layer.appendChild(svg);
    return { svg, cfg };
  });

  requestAnimationFrame(() => {
    built.forEach(({ svg }) => svg._prepare && svg._prepare());
    built.forEach(({ svg, cfg }) => {
      if (cfg.animate === "load") requestAnimationFrame(() => svg.classList.add("is-drawn"));
    });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add("is-drawn");
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: "-10% 0px -10% 0px", threshold: 0.05 });
      built.forEach(({ svg, cfg }) => { if (cfg.animate === "scroll") io.observe(svg); });
    } else {
      built.forEach(({ svg }) => svg.classList.add("is-drawn"));
    }
  });
};

// ============================================================
// initPerkFooterGrid — square-ruled-book grid for the canonical
// footer. Lives INSIDE the <footer> as an SVG so it can never be
// clipped by page-height math. Generates irregular horizontal +
// vertical lines, a couple of emphasis rectangles, and a few
// coordinate labels. Animates in via stroke-dashoffset when the
// footer scrolls into view.
// ============================================================
window.initPerkFooterGrid = function () {
  const NS = "http://www.w3.org/2000/svg";
  document.querySelectorAll("footer.kz-footer").forEach(function (footer) {
    if (footer.querySelector(".footer-grid")) return; // idempotent

    const W = 1400, H = 480;

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "footer-grid");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");

    // Fade mask — opaque at bottom, fading toward the top edge so
    // the grid emerges from the page-end like footing on a chart.
    const defs = document.createElementNS(NS, "defs");
    defs.innerHTML = `
      <linearGradient id="fg-fade" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">
        <stop offset="0"    stop-color="#fff" stop-opacity="0"/>
        <stop offset="0.55" stop-color="#fff" stop-opacity="0.75"/>
        <stop offset="1"    stop-color="#fff" stop-opacity="1"/>
      </linearGradient>
      <mask id="fg-mask">
        <rect width="${W}" height="${H}" fill="url(#fg-fade)"/>
      </mask>`;
    svg.appendChild(defs);

    const g = document.createElementNS(NS, "g");
    g.setAttribute("mask", "url(#fg-mask)");
    svg.appendChild(g);

    // Irregular line positions — rectangles vary noticeably in height.
    const hStops = [40, 110, 200, 270, 360, 430];
    const vStops = [80, 200, 380, 560, 780, 1000, 1180, 1320];

    // Emphasis rectangles — pick a couple of irregular cells.
    const emphRects = [
      [vStops[1], hStops[1], vStops[3] - vStops[1], hStops[3] - hStops[1]],
      [vStops[5], hStops[2], vStops[7] - vStops[5], hStops[4] - hStops[2]],
      [vStops[3], hStops[3], vStops[5] - vStops[3], hStops[5] - hStops[3]],
    ];
    emphRects.forEach(function (r) {
      const rect = document.createElementNS(NS, "rect");
      rect.setAttribute("class", "emph");
      rect.setAttribute("x", r[0]); rect.setAttribute("y", r[1]);
      rect.setAttribute("width", r[2]); rect.setAttribute("height", r[3]);
      g.appendChild(rect);
    });

    const lines = [];
    hStops.forEach(function (y) {
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", 0); l.setAttribute("x2", W);
      l.setAttribute("y1", y); l.setAttribute("y2", y);
      l._cx = W / 2; l._cy = y; l._len = W;
      g.appendChild(l);
      lines.push(l);
    });
    vStops.forEach(function (x) {
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", x); l.setAttribute("x2", x);
      l.setAttribute("y1", 0); l.setAttribute("y2", H);
      l._cx = x; l._cy = H / 2; l._len = H;
      g.appendChild(l);
      lines.push(l);
    });

    // Coordinate labels — feel like an engineer's plot.
    const labels = [
      { x: vStops[1] + 10, y: hStops[1] - 8, t: "A-12" },
      { x: vStops[3] + 10, y: hStops[2] - 8, t: "1.13\u00B0 N" },
      { x: vStops[5] + 10, y: hStops[4] - 8, t: "B-04 \u00B7 47.2K" },
      { x: vStops[2] + 10, y: hStops[5] + 18, t: "SECTOR 09" },
      { x: vStops[6] + 10, y: hStops[3] - 8, t: "35.14\u00B0 E" },
    ];
    labels.forEach(function (l) {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("class", "coord");
      t.setAttribute("x", l.x); t.setAttribute("y", l.y);
      t.textContent = l.t;
      g.appendChild(t);
    });

    // Stamp the SVG into the footer as the FIRST child.
    footer.insertBefore(svg, footer.firstChild);

    // Wire up the per-line stagger from the bottom-center anchor so
    // lines closer to the anchor draw first (feels like the grid is
    // settling onto the page from the bottom).
    const focal = [W * 0.5, H * 1.0];
    const maxDist = Math.hypot(W, H);
    lines.forEach(function (l) {
      l.style.setProperty("--len", l._len);
      const dist = Math.hypot(l._cx - focal[0], l._cy - focal[1]);
      const delay = (dist / maxDist) * 700;
      l.style.setProperty("--delay", delay.toFixed(0) + "ms");
    });
    // Emphasis rects + labels fade in at the END of the stagger.
    svg.querySelectorAll("rect.emph").forEach(function (r) {
      r.style.setProperty("--delay", "800ms");
    });
    svg.querySelectorAll("text.coord").forEach(function (t) {
      t.style.setProperty("--delay", "950ms");
    });

    // Trigger draw-in when the footer scrolls into view.
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            svg.classList.add("is-drawn");
            io.unobserve(e.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
      io.observe(footer);
    } else {
      svg.classList.add("is-drawn");
    }
  });
};

// Auto-initialise on script load so pages don't have to call it manually.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () { window.initPerkFooterGrid(); });
} else {
  window.initPerkFooterGrid();
}
