# SEO Audit: kurazetu.com Google Search Result

Date: 2026-05-19
Scope: Improve the SERP snippet shown for `kurazetu.com`, with priority on surfacing the APK / app download as a prominent action.

---

## 1. What the current SERP looks like

Brand panel + 4 sitelinks:

1. **Launching KuraZetu** — "Launching KuraZetu. Setting things up... This may take a..."
2. **Login** — "Kura Zetu Portal. Gain access to your personalized dashboard..."
3. **Loading Counties** — "Dev Tip: If counties aren't loading, make sure your data scripts..."
4. **pinVerify254 Game** — "Help verify the locations of polling centers across Kenya and..."

Meta description on the brand panel: the generic homepage description.

The two biggest problems are visible at a glance:

- Two of the four sitelinks are **loading screens / dev scaffolding** that leaked into the public crawl.
- There is **no Download sitelink at all**, even though `/ui/download-apk/` exists in `sitemap.xml`.

---

## 2. Root causes (verified in the codebase)

### 2.1 "Launching KuraZetu / Setting things up..." is the SPA splash

File: `src/ui/templates/ui/index.html` lines 71-94.

The Django template renders a full-page loading screen with the text:

```
Launching KuraZetu
Setting things up...
This may take a moment the first time as we set things up.
Future visits will be much faster!
```

The React bundle then hides this screen on load via `hideLoadingShowRoot()` (lines 99-106).

Googlebot does render JS, but:

- It indexes the **initial HTML response first**, then queues the rendered version.
- For lower-authority URLs it may never come back for the rendered pass, or may use the pre-render snapshot as the snippet source.
- The visible `<h2>Launching KuraZetu</h2>` and `<p>Setting things up...</p>` are the most prominent text in the raw HTML, so Google picks them.

This is why the homepage sitelink description is the loading text instead of the real hero copy.

### 2.2 "Loading Counties / Dev Tip..." is a React component leaked to prod

File: `src/ui/src/auth/signup/LoadingScreen.tsx` lines 22-69.

The component renders:

```
Loading Counties
Tallying election results...
💡 Dev Tip: If counties aren't loading, make sure your data scripts have been executed properly.
```

Two issues:

1. **The "Dev Tip" copy was never meant for users**, let alone Google. It's an internal hint for developers when seed scripts haven't been run. Shipping it to production is embarrassing and signals low quality to anyone searching.
2. The page this component lives on is **publicly crawlable** (some route under signup / counties loading). Even though it's a transient screen, Google crawled and cached it.

### 2.3 No Download page in `ui/templates`

Only `src/ui/templates/ui/index.html` exists. `/ui/download-apk/` is listed in `sitemap.xml` but I could not find a dedicated template or view that serves a real, content-rich HTML page for download. It's almost certainly served by the same SPA shell, which means:

- Google sees the same generic "Launching KuraZetu / Setting things up..." HTML for the download URL as it does for the homepage.
- There is no unique `<title>`, no unique meta description, no schema, no anchor text on the homepage pointing to it with the word "Download".

Result: Google has no reason to promote it as a sitelink.

### 2.4 Site-wide `<title>` is just "Kura Zetu"

File: `src/templates/base.html` line 6.

```html
<title>Kura Zetu</title>
```

Every page inherits this unless overridden. Google's brand panel title is fine, but per-page titles are flat across the entire site, so Google cannot tell the Login page from the Game page from the Download page when ranking sitelinks.

### 2.5 Meta description does not mention "Download" or "App"

File: `src/templates/base.html` line 14.

```
Kura Zetu is a community-powered platform that empowers every Kenyan to verify,
tally, and track election results directly from polling stations. Built for
transparency and accountability.
```

Decent for a brand description, but contains zero call-to-action and zero keywords for the actions users actually want to take (download the app, verify a polling center, view live results).

### 2.6 `sitemap.xml` includes the login page, no internal weighting

File: `src/templates/sitemap.xml`.

- `/accounts/login/` has `priority=0.8`. Login pages are low-value for organic searchers and should not be promoted as sitelinks.
- `/ui/download-apk/` has the same `priority=0.9` as `/ui/game/`, even though the game page is the one Google decided to feature instead. Priority alone is a weak signal; **anchor text and internal link count matter more**.

### 2.7 `robots.txt` does not block dev / loading routes

File: `src/templates/robots.txt`.

The whole `/` is allowed except API data endpoints. The signup loading route (where `LoadingScreen.tsx` lives) is fully crawlable.

### 2.8 No structured data

No `Organization`, `WebSite` (`SearchAction` for sitelinks searchbox), or `MobileApplication` / `SoftwareApplication` JSON-LD on any page. Without `MobileApplication` schema with `downloadUrl`, Google has no machine-readable signal that a downloadable app exists.

### 2.9 Favicon

`base.html:18` points to `kurazetu.s3.eu-west-1.amazonaws.com/static/images/logo/favicon.ico`. The SERP shows a generic globe icon, so either:

- The favicon URL is not being fetched by Google (CDN/CORS/redirect issue), or
- The file is missing / wrong format. Google needs at least 48x48 PNG or SVG for the brand panel.

---

## 3. Fix plan, ranked by impact

### Priority 1: Stop indexing dev / loading content

**a) Remove the "Dev Tip" text outright.** It should never be in a production bundle.

- Edit `src/ui/src/auth/signup/LoadingScreen.tsx` lines 50-74 to either delete the block, or gate it behind `if (process.env.NODE_ENV !== 'production')`.
- Pushing this to prod removes the leak. After redeploy, request reindex of any URL where Google has cached it.

**b) Make the SPA splash invisible to crawlers.**

Option 1 (cheapest): server-render real hero copy in `src/ui/templates/ui/index.html` so the first paint contains the actual page content, not loading text. The current splash is inside `{% block content %}` and is the only visible HTML for crawlers.

Option 2: keep the splash but render a hidden static block above it with the real page content (h1, paragraph, CTA links) so Google indexes that as the page body. The splash can remain visually on top.

Option 3 (heavier): move to a real SSR setup (Next.js, Django + react-ssr, or a pre-render service). Not necessary if Option 1 is done well.

**c) Block known loading-only routes via `robots.txt` or `noindex`.**

Add to `src/templates/robots.txt`:

```
Disallow: /ui/loading/
Disallow: /accounts/ui/signup/loading/
```

Or add `<meta name="robots" content="noindex">` on those routes via Django views.

### Priority 2: Build a real Download page

Goal: Make `/ui/download-apk/` a separate, content-rich page so Google features it.

Concrete steps:

1. Add a Django template `src/ui/templates/ui/download.html` (or a dedicated path) that extends `base.html` and **overrides `{% block title %}` and the meta description block**:

   ```html
   {% block title %}<title>Download the Kura Zetu App | Verify Kenya Election Results</title>{% endblock %}
   ```

   Meta description, page-specific:
   ```
   Download the Kura Zetu Android app and become a virtual polling-station agent.
   Tally, verify, and track Kenya election results in real time.
   ```

2. Server-render real content on the page (do not rely on the SPA shell): app screenshots, "Download APK" button, install instructions, file size, version. Google needs **on-page text** that says "Download Kura Zetu" repeatedly so it can match the sitelink label.

3. Link to this page from the homepage header nav with anchor text **"Download"** (not "Get it" or "App"). Anchor text is the single strongest signal for which sitelink label Google picks.

4. Link to it from the footer of every page, also with anchor text "Download".

5. Add to `sitemap.xml` with `priority=1.0` and `changefreq=weekly`. Bump homepage priority above it only if you want homepage to win; otherwise leave equal.

### Priority 3: Demote the Login sitelink

Users searching "kura zetu" almost never want the login page. Options:

- Add `<meta name="robots" content="noindex,follow">` on `/accounts/login/`. The page still works, but it stops competing for a sitelink slot.
- Remove it from `sitemap.xml` (`src/templates/sitemap.xml` lines 9-13).
- Reduce internal links to it. Currently it is likely linked from every page header. Consider linking only when the user is logged out, or replacing with a more useful action.

### Priority 4: Unique titles + descriptions per page

In `base.html`, the `{% block title %}` and meta description blocks should be overridden by every page template. Build a pattern:

- Homepage: `Kura Zetu — Verify Kenya Election Results from Every Polling Station`
- Download: `Download the Kura Zetu App | Verify Kenya Election Results`
- Game: `pinVerify254 — Help Map Every Polling Center in Kenya`
- Results: `Live Kenya Election Results, Polling Station by Polling Station`

Keep titles under ~60 characters where possible. Each page needs its own meta description, ~150-160 characters, with a verb at the start.

### Priority 5: Structured data (JSON-LD)

Add to `base.html` after the meta tags:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Kura Zetu",
  "url": "https://kurazetu.com/",
  "logo": "https://kurazetu.s3.eu-west-1.amazonaws.com/static/images/logo/icon.png",
  "sameAs": [
    "https://twitter.com/shamash92_"
  ]
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://kurazetu.com/",
  "name": "Kura Zetu",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://kurazetu.com/search?q={query}",
    "query-input": "required name=query"
  }
}
</script>
```

(Only add `SearchAction` if a real `/search?q=` route exists. If not, drop it.)

On the download page, add `MobileApplication` schema:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  "name": "Kura Zetu",
  "operatingSystem": "Android",
  "applicationCategory": "UtilitiesApplication",
  "downloadUrl": "https://kurazetu.com/ui/download-apk/",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
</script>
```

This is what powers app-style rich results in some queries.

### Priority 6: Favicon

Verify `https://kurazetu.s3.eu-west-1.amazonaws.com/static/images/logo/favicon.ico` actually loads and is a valid favicon (>= 48x48). Recommend serving a 192x192 PNG instead of ICO:

```html
<link rel="icon" type="image/png" sizes="192x192" href=".../favicon-192.png" />
<link rel="apple-touch-icon" sizes="180x180" href=".../apple-touch-icon.png" />
```

Generic globe icon in the SERP usually means Google could not fetch it or it was too small.

### Priority 7: Request reindex via Google Search Console

After deploying the above:

1. Open GSC for `kurazetu.com`.
2. Use **URL Inspection** on the homepage, the download page, and any URL that currently shows the dev/loading text. Click "Request Indexing" on each.
3. Submit the updated `sitemap.xml`.
4. In **Search results** > Performance, monitor for the new sitelinks over the next 2-6 weeks. Sitelinks are picked algorithmically; you cannot force them, but the changes above are the highest-leverage signals.

---

## 4. Quick wins (do these first, in this order)

1. **Delete the "Dev Tip" block** in `src/ui/src/auth/signup/LoadingScreen.tsx`. One-line scope, immediate prod win.
2. **Server-render real homepage hero copy** in `src/ui/templates/ui/index.html` above the loading splash, so Google stops indexing "Setting things up...".
3. **Build the dedicated `/download/` page** (real Django template, real on-page text, prominent in nav).
4. **Add `noindex` to `/accounts/login/`** and remove it from the sitemap.
5. **Override `{% block title %}` and meta description** on the download, game, and homepage templates.
6. **Add Organization + WebSite + MobileApplication JSON-LD.**
7. **Verify favicon** loads and is sized correctly.
8. **Request reindex** in GSC.

---

## 5. What is NOT directly controllable

- The exact sitelinks Google shows. Google picks them from internal link structure, anchor text, traffic, and page authority. You cannot manually set them in modern GSC. You can only feed strong signals.
- Whether Google chooses meta description vs auto-generated snippet. Sometimes it ignores your meta description if it thinks the page body answers the query better. The fix is to make the on-page H1/lead text match the description.
- Speed of reindex. Can be hours, can be weeks.

---

## 6. Files to touch (concrete list)

| File | Change |
|---|---|
| `src/ui/src/auth/signup/LoadingScreen.tsx` | Delete "Dev Tip" block (lines 50-74). |
| `src/ui/templates/ui/index.html` | Add server-rendered hero/H1/paragraph above loading splash. Override title block. |
| `src/ui/templates/ui/download.html` (new) | Real download page: title, meta description, on-page copy, JSON-LD. |
| `src/ui/views.py` (or wherever) | New view to render `download.html` at `/ui/download-apk/`. |
| `src/templates/base.html` | Add Organization + WebSite JSON-LD blocks. Verify favicon. |
| `src/templates/sitemap.xml` | Remove `/accounts/login/`. Reorder priorities to push Download. |
| `src/templates/robots.txt` | Disallow known loading/dev routes. |
| Login view template | Add `<meta name="robots" content="noindex,follow">`. |

End of report.
