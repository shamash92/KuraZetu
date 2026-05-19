# Kura Zetu Legal + Ops Audit

**Scope:** Legal exposure, jurisdictional posture, operational security, and
the infra-level controls (kill switch, snapshots, freeze, app distribution,
video evidence). Companion to [`audit.md`](./audit.md) (backend security) and
[`voting-audit.md`](./voting-audit.md) (voting design + flows).

**Branch:** `backend-audit-2026-05`
**Date:** 2026-05-19
**Hosting confirmed:** outside Kenya (typical: Hetzner / DigitalOcean / AWS /
Vultr — see hosting section).

> **Not legal advice.** I am not a lawyer. Everything below is research from
> publicly available sources, general infosec practice, and the practice of
> other civic-tech projects. Treat as a starting checklist for a real lawyer
> to validate. Confirm every statute citation and reference before relying
> on it.

---

## 1. Rules you may be brushing right now

Ranked by likelihood of enforcement times severity, given a hosted public
site that already holds user data.

### 1.1 Kenya Data Protection Act 2019 — high probability of partial breach

You hold personal data of Kenyan residents:

- Phone numbers (every user account — `accounts/models.py`).
- ID numbers where set (`accounts/models.py:58`).
- Names and GPS coordinates of uploaders.
- Form 34A images that may contain presiding-officer signatures and party-agent
  names (third-party PII you ingested).

Required posture under the Act (verify exact thresholds with counsel):

- Register as a **Data Controller** with the Office of the Data Protection
  Commissioner (ODPC). Self-service portal at `odpc.go.ke`.
- Publish a **privacy policy** linked from every entry point of the site and
  the mobile app.
- Implement a **consent flow** at signup (a checkbox tied to the policy, not
  just the T&Cs).
- Designate a **Data Protection Officer** (DPO) if processing is large-scale
  or sensitive. Election-day data plausibly qualifies.
- Stand up a **data-subject access request (DSAR)** endpoint for users to
  request, correct, or delete their data.
- Document a **breach notification plan** — ODPC must be notified within 72
  hours of a known breach.

Penalty: up to **KES 5,000,000** or **1% of annual turnover**, whichever
higher, per violation. ODPC has been actively issuing fines in 2023-2024
(public examples: Mulla Pride, Whitebox Digital, Roma School, OPPO Kenya,
Regus). Civic-tech is not exempt.

### 1.2 Computer Misuse and Cybercrimes Act 2018 — medium probability, high severity

The two relevant sections:

- **Section 22**, "False publication" — knowingly publishing false or
  misleading data.
- **Section 23**, "Publication of false information" — causing panic, public
  disorder, or financial loss.

Penalty: fine up to **KES 5,000,000** or imprisonment up to **2 years**, or
both.

Both sections survived a constitutional challenge in *BAKE v AG* (2018) and
have been used aggressively against bloggers and activists. They are the
single biggest legal risk for any platform publishing unofficial election
data.

Mitigations to layer:

- Disclaimer language on every page, every API response, every share-image.
- The `claude-design` watermark approach already addresses screenshots.
- Avoid declarative phrasing ("X won county Y"). Publish ranges, confidence
  scores, contested-state badges.
- Never use IEBC logo, colours, or branding that could be argued to
  impersonate.
- Keep an internal log of every dataset version published — if a number is
  later corrected, you can show that you corrected it transparently.

### 1.3 Elections Act 2011 and IEBC Act 2011 — borderline, not the top risk

IEBC has the **statutory monopoly on announcing official results**. It does
not have a monopoly on tallying. NMG, KTN, Citizen TV, and others have
parallel-tallied every cycle without prosecution. The line a court would
draw:

- You must not claim to be official.
- You must not impersonate IEBC visually or in language.
- You must not provably interfere with the actual count.

As long as those lines are clear, parallel tallying has precedent and is
defensible. The risk vector is a hostile AG stretching "interference with
the electoral process" (Election Offences Act 2016, Section 12) — untested
in court for civic-tech.

### 1.4 Election Offences Act 2016 — medium risk during election

- Section 7: false statements about a candidate. Defamation risk if your
  platform shows incorrect totals and a candidate loses.
- Section 14: prevention of elections. Big stretch but available to a
  hostile prosecutor.

Mitigations: contested-state UI, no "winner" declaration on the platform,
visible per-station provenance.

### 1.5 Companies Act / NGO Coordination Act / PBO Act — probable breach

Operating a public platform as an unregistered individual:

- All liability lands on you personally.
- Any donations received without an entity = personal income, taxable, and
  optically grey.
- Any aspirant corporate revenue without an entity = unregistered business
  + KRA exposure.
- VAT registration becomes mandatory once turnover crosses **KES 5,000,000**
  per year.

### 1.6 Hosting jurisdiction — moderate risk, manageable

You confirmed hosting is outside Kenya. Good. Provider-specific posture:

- **Hetzner (Germany)** — strong record refusing government overreach,
  hosted in EU/GDPR jurisdiction. Recommended.
- **DigitalOcean (US/EU)** — fine; require lawful court orders, log requests.
- **AWS Frankfurt** — EU jurisdiction; more services, more compliance papers.
- **Vultr** — broadly OK; less public history of takedown handling.

Risk: KE state cannot directly seize the box but can:

- Pressure your provider via diplomatic channels (rare; usually requires
  treaty cooperation).
- Order Kenyan ISPs to block your domain at the edge (precedent: 2017
  internet throttling).
- Issue a summons for you personally if you are in Kenya, then compel you to
  hand over access.

This is why personal OPSEC (section 6) is as important as where the server
sits.

### 1.7 KICA — low probability

Section 29, "improper use of licensed telco system", historically used
against bloggers. A web platform sitting on third-party infrastructure is a
stretch for this section but worth tracking.

### 1.8 Trademark — not breaking, but exposed

"Kura Zetu" is Swahili for "Our Votes". Generic phrase, weakly registrable.
Anyone can clone the name and visual identity unless you register a mark
with **KIPI** (Kenya Industrial Property Institute). Cost: roughly **KES
15,000-30,000**. Without it you have no legal grounds against trojan clones
(see section 8). Worth doing.

### 1.9 Children's data — possible breach

DPA requires parental consent for processing minors' data. Phone signup
does not verify age. Anyone under 18 who signs up creates a compliance gap.

Mitigations:

- Age attestation checkbox at signup (legal cover, not airtight).
- A hard cutoff via age question with rejection below 18.
- Optional ID-number-based age inference if ID is collected.

### 1.10 SMS and email outreach — low risk now, rising at launch

Magic-link emails to party HQ for the aspirant flow are transactional and
fine. Bulk SMS to users triggers KICA marketing rules + DPA marketing rules.
Get consent + offer opt-out.

---

## 2. Legal-entity options

Each is a real option; trade-offs are honest.

### A. Personal hobby (current default)

| Pro | Con |
|---|---|
| Zero cost, fast | Total personal liability |
| No filings | ODPC registration in your own name |
| | Your home address ends up on every legal paper |
| | No legal shield, no asset separation |

**Verdict:** acceptable for pre-launch dev only. Move off this by launch.

### B. Kenya non-profit

Two sub-options:

- **Society** (Societies Act, 1968).
  - Cost: **KES 7,000-15,000** to register at the Registrar of Societies.
  - Timeline: 1-3 months.
  - Oversight: loose. Annual filings simple.
- **Public Benefit Organization** under PBO Act 2013.
  - Cost: **KES 50,000+** in fees and consulting.
  - Timeline: 6+ months.
  - More credibility with donors; more compliance burden; PBO Authority
    can deregister you (subject to political pressure).

Both can hold a Kenyan bank account and a KRA TIN.

### C. Foreign foundation

- **Estonia e-Residency + OÜ** — about **EUR 300** setup, 1-2 weeks. Strong
  rule of law, EU jurisdiction.
- **Open Collective Foundation** (US fiscal sponsor) — free to join, they
  handle accounting, ~10% of donations as fee.
- **US 501(c)(3)** standalone — ~USD 1,500-3,000 + ongoing filings. Slower.

| Pro | Con |
|---|---|
| Hardest for KE state to seize | KE donor optics weaker |
| Strong jurisdictional shield | Doesn't help with KE DPA compliance for KE users |
| | Adds dual-jurisdiction accounting |

### D. Hybrid (recommended)

KE Society for local operations + foreign foundation holding IP, signing
keys, and reserves. Standard structure for civic-tech projects facing state
pressure (used by Code for Africa-style projects, by uMzansi in South
Africa, etc.).

Cost: roughly **KES 20,000-50,000 per year** in admin on top of single-entity
costs.

### E. Fiscal sponsorship (cheapest credible option)

Find an existing registered KE NGO willing to act as fiscal sponsor.
Candidates worth approaching:

- **TISA (The Institute for Social Accountability)**.
- **Mzalendo Trust** (parliamentary monitoring).
- **Code for Africa Kenya**.
- **KICTANet** (digital rights advocacy).
- **InformAction / KIDDP** (civic engagement).

They accept donations on your behalf, you operate under their umbrella,
they take a fee (usually 5-10%). Pros: no registration cost, instant
standing. Cons: limited autonomy, dependent on sponsor's reputation +
survival.

### Recommended path for "broke"

1. Register a **Society** yourself (KES 7-15k) — minimum legal entity.
2. While waiting, approach a fiscal sponsor (E) for the interim.
3. Defer foreign foundation until you have funding to justify it.

---

## 3. Pro bono and free legal options in Kenya

**Verify each is still active and accepting cases before relying on them.**
Reputations and offerings change.

### 3.1 Digital-rights specialists (most relevant)

| Organisation | Focus | Contact path |
|---|---|---|
| **Article 19 Eastern Africa** | Digital rights, freedom of expression, cyber law. Defended bloggers + civic-tech cases. | `africa@article19.org` / `article19.org/regional-office/eastern-africa` |
| **KICTANet** | Digital rights advocacy. Connects civic-tech to legal network. | `info@kictanet.or.ke` / `kictanet.or.ke` |
| **Bloggers Association of Kenya (BAKE)** | Defended bloggers under Section 22/23 CMCA. Maintains a legal-defence fund. | `bakekenya.org` |
| **CIPIT (Centre for IP and IT Law, Strathmore University)** | University-based, takes pro bono digital rights work + amicus briefs. | `cipit.strathmore.edu` |
| **Defenders Coalition Kenya** | Supports human rights defenders facing prosecution. Covers digital activists. | `defenderscoalition.org` |
| **Mzalendo Trust** | Civic tech, parliamentary monitoring. Has legal advisors on retainer for partners. | `mzalendo.com` |
| **Lawyers Hub** | Youth-led legal-tech NGO. Friendly to civic-tech founders. | `lawyershub.org` |

### 3.2 Broader pro bono / legal aid

| Organisation | Notes |
|---|---|
| **Law Society of Kenya (LSK) Pro Bono Programme** | LSK refers cases to member firms doing pro bono. Apply via the LSK secretariat. |
| **Kituo cha Sheria** | Free general legal aid. Less digital-specialised but useful triage. `kituochasheria.or.ke` |
| **National Legal Aid Service (NLAS)** | Government legal aid. Bureaucratic; not first choice. |
| **ICJ-Kenya** | Constitutional + public-interest litigation. May take strategic cases. `icj-kenya.org` |
| **Katiba Institute** | Constitutional + civic litigation. `katibainstitute.org` |

### 3.3 Funder-attached counsel (if you ever take a grant)

- **Luminate** — civic-tech funder, retains counsel for grantees in some cases.
- **Hivos East Africa** — similar.
- **Open Society Foundations (Africa)** — strategic litigation funding.
- **Internews / Internet Society Kenya** — occasional legal support for partners.

### 3.4 Individual lawyers known for cyber + civic work

Publicly named based on reputation. Verify currency before approaching.

| Name | Firm | Focus | Reach via |
|---|---|---|---|
| **Mercy Mutemi** | Nzili & Sumbi Advocates | Cyber rights, Meta cases, digital civil liberties. Strongest single name in the space. | LinkedIn / `nzili.co.ke` |
| **Demas Kiprono** | Article 19 Kenya + private practice | Section 22/23 CMCA; outspoken on cyber law | Article 19 |
| **Waikwa Wanyoike** | Katiba Institute | Constitutional litigation, civic-interest cases | `katibainstitute.org` |
| **Bobby Mkangi** | Private practice | Constitutional law, election law commentary | Public profile |
| **Charles Kanjama** | Muma & Kanjama | Election-law specialist (politically conservative — depends on alignment) | Firm site |
| **John Khaminwa SC** | Khaminwa & Khaminwa | Veteran human rights lawyer; likely too expensive but worth a referral ask | Firm site |

### 3.5 Honest realistic ask

You will likely get **one** pro bono lawyer for a 1-2 hour consult plus an
opinion letter. You will not get a full retainer free. Aim for:

1. **One pro bono opinion letter** clearing the basic legality of parallel
   tallying as designed (~2 hours of counsel time).
2. **ODPC self-registration** — do it yourself online at `odpc.go.ke`. Small
   fee, no lawyer needed.
3. **Society registration** — do it yourself at the Registrar of Societies.
   Forms are public, no lawyer needed.
4. **Counsel-on-call agreement** — small monthly retainer (KES 5,000-15,000)
   for the election month only. Negotiate with a junior advocate from the
   Lawyers Hub or KICTANet circle.

Minimum-viable legal posture: roughly **KES 30,000** plus your own time.

### 3.6 First email to send

Cold-email Article 19 EA or Mercy Mutemi with:

- 1-paragraph project summary.
- The kill chain you closed in `audit.md` round 2.
- The legal exposure summary in section 1 of this file.
- Your budget (zero).
- Your ask: pre-launch legal opinion + retainer-on-call for incidents.

Worst case they refer you elsewhere. Best case they take it pro bono because
it is a high-profile public-interest matter.

---

## 4. Personal OPSEC

Separable from entity choice. Do these regardless of structure.

### 4.1 Devices and access

- **Separate dev machine** for Kura Zetu. Full-disk encryption (FileVault,
  LUKS, BitLocker). Not your daily-driver laptop.
- **Separate phone number** for project comms. Not your M-Pesa number.
- **Hardware 2FA key (YubiKey)** on GitHub, AWS, DNS registrar, password
  manager. SMS 2FA is broken by SIM swap.
- **Password manager** with a separate vault for project secrets. Bitwarden
  self-hosted or 1Password Teams.
- **PGP-signed commits** so a GitHub takeover can't silently push code with
  your name. Public key on the website.
- **PGP-encrypted email** for sensitive comms (Proton Mail, Tutanota).

### 4.2 Identity hygiene

- **Don't post specific dev work on public socials** — pattern-of-life intel
  for an adversary.
- **Co-director or co-founder named publicly** — don't be the only face on
  the project. Spreads legal + personal risk.
- **Identify a Kenyan lawyer for arrest scenarios now**, not after arrest.
  Pre-arranged bail money is a real consideration during elections.
- **Travel posture** — consider being outside Kenya for the most sensitive
  72 hours of the count if your role is operationally critical. Not paranoia
  — this has happened to civic-tech founders elsewhere.

### 4.3 Domain and DNS

- Register the domain **outside the .ke TLD** (avoid KENIC — too easy to
  seize). Use Namecheap, Gandi, or Cloudflare Registrar.
- **DNSSEC enabled** on the domain.
- **Registrar lock + 2FA** on the registrar account.
- **Lookalike domains** bought preemptively: `kuraz3tu.ke`, `kura-zetu.ke`,
  `kurazetu.com`, `kurazetu.org`, `kurazetu.app`. Null-route or redirect to
  official site.

### 4.4 Source-code custody

- **Mirror to three places**: GitHub + GitLab + Codeberg. Push on every
  release.
- **Periodic git bundle upload to Internet Archive**.
- **At least two GitHub org admins** so a single account takeover doesn't
  lock you out.

### 4.5 Press + transparency

- **Transparency report**: every legal request you receive published on the
  website. Sets a precedent + signals to courts that abuse will be visible.
- **Pre-written press statements** ready before the election for these
  scenarios:
  - Arrest of founder or staff.
  - Takedown demand from KE state.
  - "Destabilising the election" accusation.
  - Funding-source accusation ("funded by party X").
  - Compromise / data breach.

Election day is not the time to draft these.

---

## 5. Hosting + jurisdiction (you are outside Kenya)

Provider-specific recommendations for civic-tech under pressure:

| Provider | Verdict |
|---|---|
| **Hetzner (Falkenstein / Helsinki)** | Cheapest credible option. Strong public record refusing overreach. EU jurisdiction, GDPR. Recommended. |
| **AWS Frankfurt** | EU jurisdiction. More services + compliance papers. More expensive. |
| **DigitalOcean Frankfurt / Amsterdam** | Middle ground. Fine. |
| **Vultr** | Generally OK. Less public history on takedown handling. |
| **AWS Cape Town** | Avoid. SADC cooperation with KE state too close. |
| **Any KE provider** | Avoid for the database tier. OK for static frontend behind Cloudflare. |

In front of whichever provider:

- **Cloudflare CDN + WAF** absorbs takedown requests at edge, requires US
  legal process to reveal origin. Free tier is enough for most needs.
- **TLS pinning in the NATIVE app** — prevents MITM on hostile Kenyan
  networks. Needs an Expo dev client or a custom native module.

DPA note: even if hosted in EU, you still process KE residents' data, so
Kenya DPA still applies. Hosting jurisdiction protects you from server
seizure, not from KE legal exposure.

---

## 6. Kill switch (VPS level)

Two-layer design. Implementable in 1-2 days.

### 6.1 Soft switch — read-only mode

Add a single-row `PlatformState` table:

```python
class PlatformState(models.Model):
    MODE_CHOICES = [
        ("normal", "Normal"),
        ("read_only", "Read-only"),
        ("maintenance", "Maintenance"),
        ("hard_kill", "Hard kill"),
    ]
    mode = models.CharField(max_length=20, choices=MODE_CHOICES, default="normal")
    activated_at = models.DateTimeField(auto_now=True)
    activated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    signatures = models.JSONField(default=list)  # PGP signatures from board members
    note = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["id"], condition=models.Q(id=1),
                name="single_platform_state_row",
            ),
        ]
```

Middleware reads from a 1-second cache and:

- `normal` — everything works.
- `read_only` — 403 on any non-GET; existing data stays public.
- `maintenance` — 503 on everything except a static "we're back soon" page.
- `hard_kill` — middleware refuses to start; backend dies.

Activation paths:

- Django admin (single admin, fast, used for routine maintenance).
- Signed POST endpoint requiring 2-of-3 PGP signatures from board members
  (used for true incidents).

### 6.2 Hard switch — VPS shutdown

A second tiny VPS (different provider, different region) hosts a
heartbeat endpoint. The main app systemd timer hits it hourly:

- Endpoint returns `{"kill": false}` under normal conditions.
- Each board member has a private kill URL. When two of three URLs are hit
  inside a 60-minute window, the heartbeat flips to `{"kill": true}`.
- On `kill: true` the main app runs `systemctl poweroff`.
- **Dead-man's mode:** if the heartbeat endpoint is unreachable for more
  than 72 hours, the main app defaults to `kill: true`. Window is generous
  on purpose; tighten only during election week.

Trade-offs to remember:

- Hard kill is irreversible without manual console access. If you are
  detained, the public loses access to the platform unless someone else
  restores it.
- Soft kill (read-only) preserves the public data while blocking writes.
- Default to **soft** for almost every incident; reserve hard kill for
  catastrophic compromise.

---

## 7. Fake-clone protection

### 7.1 Play Store (primary distribution)

- Register developer account with verified business identity (your KE
  Society or fiscal sponsor).
- Enroll in **Google Play App Signing** — Google holds the signing key, you
  hold the upload key. If the upload key is compromised, Google can rotate.
- Squat lookalike Play Store listing names if available.

### 7.2 Sideload (real risk in Kenya)

- Publish **SHA-256 of every APK release** on the front page of the website.
- Cross-publish the SHA on the official Twitter/X account at release time.
- User-facing message: "If you sideload, verify the hash."
- Realistic: about 30% of users won't verify. Accept it; focus on the 70%
  that will.

### 7.3 Domain + universal links

- Buy lookalike domains preemptively (see section 4.3).
- **Universal links** (`https://kurazetu.ke/...`) verified via
  `.well-known/assetlinks.json` on the official domain. Phishing apps
  can't claim the domain.

### 7.4 In-app self-integrity check

On launch:

- App hashes its own APK signature + manifest.
- POSTs to `/api/integrity/check`.
- Server compares to known-good list.
- On mismatch, app shows a banner: "This may not be the official app.
  Verify at kurazetu.ke/verify."

Doesn't prevent malware; warns the user. Cheap.

### 7.5 Reproducible builds (F-Droid model)

Hard with Expo. Possible with bare React Native + locked toolchain. High
effort, low payoff for civic-tech at this stage. **Defer.** Signed APK +
published SHA is the pragmatic minimum.

### 7.6 Trademark

Register "Kura Zetu" with **KIPI** for roughly **KES 15,000-30,000**.
Without it you have no legal grounds against trojan clones. Worth doing.

---

## 8. Offline capture + delayed upload

### 8.1 Local queue (NATIVE)

Expo SQLite encrypted with a device-stored key (Keychain / Keystore).

```ts
type QueuedSubmission = {
  id: string;                    // client uuid
  stationCode: string;
  capturedAt: string;            // ISO, from camera EXIF
  capturedLatLon: [number, number];
  imageUri: string;              // local file path
  imageSha256: string;           // computed on capture
  voteVector: Record<string, number>;
  extras: { rejected: number; disputed: number; valid: number; objected: number };
  nonce: string | null;          // empty if offline at capture time
  attempts: number;
  lastError: string | null;
  state: 'queued' | 'uploading' | 'failed' | 'accepted';
};
```

### 8.2 Capture-time vs upload-time

- Nonce fetched at capture if online; at upload if offline.
- EXIF timestamp + GPS are the truth source for "when + where captured".
- Server check:
  - `captured_at` within `[cycle.counting_window_start, cycle.counting_window_end]`.
  - `captured_lat_lon` within 40 m of station boundary.

### 8.3 Anti-tamper on `captured_at`

Risk: user backdates the device clock, captures a fake image, uploads later.

Mitigations:

- Cross-reference against device's last-seen-online server timestamp. If
  device was online at `T1` and `captured_at < T1`, soft-flag for review.
- Hard cap: max **3 offline-queued submissions per user per cycle**.
- Hard cap: `now - captured_at <= 72 hours`. Older submissions auto-reject.

### 8.4 Upload UX

- Persistent local notification while queue non-empty.
- Per-item state visible.
- Background sync on connectivity (Expo BackgroundFetch + Android
  WorkManager).
- Resumable multipart upload (tus.io or S3 multipart).
- User can cancel queued items.
- After successful upload, image stays local 14 days for re-verification
  appeals (matches `audit.html` spec).

---

## 9. DB freeze + snapshots

### 9.1 Freeze (at `cycle.petition_freeze_at`)

App layer:

- Middleware rejects writes to `PollingStation*Results`,
  `PollingStation*Extras`, `Accreditation`, `PollingCenterVerification`.

DB layer:

- Postgres role for Django app: `kurazetu_app`. At freeze, revoke
  INSERT/UPDATE/DELETE on result tables.
- Separate role `kurazetu_freeze_admin` retained for court-ordered
  corrections; password split 2-of-3 between board members.
- Cron job at freeze flips perms automatically.

### 9.2 Snapshot tiers

| Layer | What | Frequency | Retention | Storage |
|---|---|---|---|---|
| Postgres logical (`pg_dump`) | Full SQL dump | Daily quiet, hourly counting, 15-min peak | Hourly 24h, daily 30d, weekly 1y, per-cycle forever | Local + off-VPS |
| Postgres physical (WAL) | Continuous archive | Continuous | 30d | Off-VPS (B2 / S3) |
| VPS filesystem snapshot | Full image | Daily + on-demand pre-deploy | 7d | Provider native (Hetzner/DO snapshot) |
| Encrypted off-site | Logical dump + form 34A media | Daily | Per-cycle forever | Backblaze B2 + Hetzner StorageBox (two different providers) |

Encrypt off-site backups with `age` or `gpg`. Symmetric key held in 2-of-3
split (Shamir's Secret Sharing or three sealed envelopes).

### 9.3 Validation

- **Monthly restore test** on a scratch VPS. An untested backup is not a
  backup.
- Document the restore procedure. Practice it.

### 9.4 Immutable / write-once backups

Backblaze B2 Object Lock with retention. Prevents an attacker with VPS
access from also deleting your backups.

---

## 10. Time windows (`ElectionCycle`)

User confirmed: counting typically runs 18:00 election day to next morning,
with northern counties running 36+ hours.

### 10.1 Schema

```python
class ElectionCycle(models.Model):
    name = models.CharField(max_length=64, unique=True)            # e.g. "2027-general"
    polls_open_at = models.DateTimeField()
    polls_close_at = models.DateTimeField()
    counting_window_start = models.DateTimeField()
    counting_window_end = models.DateTimeField()                    # default +72h, generous
    petition_freeze_at = models.DateTimeField()
    archive_at = models.DateTimeField()                             # PII-stripped public dataset

    # Optional per-county override of counting_window_end
    counting_window_overrides = models.JSONField(default=dict)      # { "001": "2027-08-12T06:00:00Z" }

    is_active = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["is_active"], condition=models.Q(is_active=True),
                name="only_one_active_cycle",
            ),
        ]
```

### 10.2 What's gated by what window

| Window | Allowed |
|---|---|
| Before `polls_open_at` | Account signup, accreditation, PinVerify. No result uploads. |
| `polls_open_at` to `polls_close_at` | All above + community notes. No result uploads. |
| `counting_window_start` to `counting_window_end` | Above + result uploads (the only window where this is allowed). |
| `counting_window_end` to `petition_freeze_at` | Late offline-captured uploads (with EXIF timestamp inside the counting window). Pin/accreditation changes blocked. |
| After `petition_freeze_at` | Read-only mode. Archive being prepared. |
| After `archive_at` | PII-stripped public dataset live. |

---

## 11. Video evidence — push back

User idea: vertical TikTok-style videos of each station's announcement,
record-only, no gallery select, users vote highest video persists, others
drop.

### 11.1 Real cost

| Assumption | Value |
|---|---|
| Stations | 47,000 |
| Avg uploads per station | 5 |
| Clip length capped | 60s |
| Resolution / bitrate | 720p / 2 Mbps → ~15 MB |
| Raw total | ~3.5 TB |
| With 3x replication / backup | ~10 TB |
| Backblaze B2 storage | ~USD 50 / month |
| Realistic monthly (storage + transcode + egress) | USD 200-500 / month during peak |

Storage is manageable. **The bandwidth + complexity costs are the killers.**

### 11.2 Hidden costs

- **Upload bandwidth on rural 3G**: 15 MB clip = 2+ minutes per attempt;
  failure rate high.
- **Server-side transcoding**: ffmpeg pipeline + HLS streaming. CPU
  intensive. Outsource to **Cloudflare Stream** if you do this.
- **Doxxing**: faces of voters, agents, officials. Kenya DPA + public-space
  recording is grey law.
- **Voice ID** of officials; harassment vector.
- **Deepfake** announcement videos within 2 years are trivial. You will
  host fake evidence and may not detect it.
- **Engineering cost**: ~6 weeks full-time.

### 11.3 Scoped-down v0 (recommended)

**Audio-only** announcement clip:

- 30s audio, max 500 KB compressed (OGG / WAV).
- Storage: 47k × 5 × 500 KB ≈ 120 GB total — trivial.
- Bandwidth on 3G: <5 s upload — reliable.
- AI transcription (Whisper API, ~USD 0.006/min) cross-references the
  spoken totals with the digits in the form 34A submission.
- Privacy risk lower than video (voices identifiable but no faces).
- No transcoding pipeline.

### 11.4 If you insist on video later

Hard constraints:

- Camera API only, never gallery picker.
- 30 s max, 480p max. Cuts storage roughly 4x.
- Mandatory consent screen pre-record.
- Server-side face blur (`mediapipe`) before public display.
- Top-1 per station retained after voting (not top-3). Cuts storage 5x.
- Cloudflare Stream for delivery.
- 1 video per station per user.
- Audio fingerprint dedup so same announcement uploaded 10x streams once.

### 11.5 Recommendation

Build **audio-only v0** for first election. Defer video to cycle N+1
contingent on funding + a face-blur pipeline that actually works.

---

## 12. Open public API (replace the "media / NGO accounts" idea)

Decision recorded in `voting-audit.md`: drop multi-tier institutional
accounts. Replace with one open public API. Anyone — media, NGO, citizen,
academic — gets identical access.

Surface:

- `GET /api/public/results/?since=<ts>&level=<level>` — paginated,
  rate-limited, no auth.
- Daily JSON + CSV bulk dump at a stable URL.
- Optional webhooks tier (signed callbacks) for any consumer that
  registers — no institutional check needed.

Press release framing: "We do not validate institutions because we cannot
fairly do so. Every consumer gets the same data on the same terms."

---

## 13. Suggested operational priority order

1. **This week**
   - ODPC self-registration as Data Controller.
   - Draft + publish a privacy policy and link from app + site.
   - Apply for Society registration at the Registrar of Societies.
   - Cold-email Article 19 EA + Mercy Mutemi for a pro bono opinion letter.
   - Confirm hosting jurisdiction details (which provider, which region).
2. **Next 1-2 weeks**
   - Implement `PlatformState` + middleware (soft kill switch).
   - Implement `ElectionCycle` model + window-gated upload middleware.
   - Wire `django-simple-history` on result + extras + accreditation tables.
   - Buy lookalike domains and KIPI trademark filing.
3. **Next 4-6 weeks**
   - Hard kill switch via heartbeat + 2-of-3 board member trigger.
   - Backup pipeline (logical + WAL + filesystem + off-site).
   - Offline-queue support in NATIVE.
   - Audio-only announcement clip v0.
   - Lookalike-domain redirects + in-app integrity check.
4. **Pre-election (3 months out)**
   - Mock election dry-run with at least 1,000 real users.
   - Load test simulating 470,000 POSTs over 6 hours.
   - Restore-from-backup drill.
   - Counsel-on-call retainer signed for election month.
   - Press kit drafted and reviewed.
   - Public donor / governance disclosure page live.
5. **Election week**
   - Dead-man heartbeat window tightened to 24 hours.
   - On-call rotation active.
   - Status page live.
   - Daily Merkle root publication started.
