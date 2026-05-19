# Kura Zetu Governance

**Scope:** Separation of code stewardship from operational stewardship. The
core proposal: open-source contributors do **not** run the production
deployment; a credible non-partisan operator does. This file lays out the
model, the trade-offs, candidate operators, and the licensing /
trademark / governance plumbing that makes it work.

Companion to:

- [`audit.md`](./audit.md) — backend security findings.
- [`voting-audit.md`](./voting-audit.md) — voting design + flow diagrams.
- [`legal-and-ops-audit.md`](./legal-and-ops-audit.md) — legal exposure +
  OPSEC + ops controls.

**Branch:** `backend-audit-2026-05`
**Date:** 2026-05-19

> This document records a proposal and an in-progress conversation. Nothing
> in it represents an agreement with any named organisation. Reach out to
> partners independently to confirm anything below.

---

## 1. Problem this model solves

A single individual:

- Holding the trademark.
- Hosting the database.
- Signing the ODPC papers as Data Controller.
- Pushing every release.
- Being the legal target.

is the worst possible posture for an election-integrity platform that
launches at the same time the state has reason to be hostile. The risk is
not theoretical: civic-tech founders in Kenya, Uganda, and Tanzania have
been arrested, raided, or had their infrastructure seized in election
cycles within recent memory.

The proposed answer is to split responsibility:

- **Code stewardship** — open-source devs and a small foundation/trust
  hold the codebase, the trademark, the brand-licence authority, and
  long-term direction.
- **Operational stewardship** — a credible non-partisan NGO runs the
  production deployment for a single country and a single election cycle
  at a time, under licence from the foundation.

This pattern is standard for civic-tech infrastructure under pressure.
Direct precedents below.

---

## 2. What the split actually buys

| Benefit | How |
|---|---|
| Legal shield for devs | Operator NGO signs ODPC papers as Data Controller, holds the bank account, takes the court summons. Devs commit code; that is the limit of their exposure. |
| Replaceable operator | If the NGO is captured / sued / shuts down, the foundation re-licences the brand and code to a different operator. Project survives. |
| Pseudonymous contributors | Devs can contribute without putting their real name on the gun. Important for KE-resident contributors who fear retaliation. |
| Trust signal | Code is open and auditable. Data is run by an NGO with a public reputation. Two independent trust anchors instead of one. |
| Fundraising | Operator NGO can take grants from Luminate, Hivos, OSF, Internews without the foundation taking the legal hit. |
| Multi-deployment | Same code runs in Uganda 2026, Tanzania 2025. Each deployment a separate operator under separate licence. |
| Counter-narrative | "We are open-source devs. The data is run by NGO X. Direct operational questions to them." Deflects partisan accusations. |

## 3. What the split does NOT fix

- The hardest decision becomes **who is the NGO**. Picking wrong NGO is
  worse than no NGO.
- Every NGO is accused of partisanship eventually. Optics shifts to a new
  target; it does not vanish.
- Most KE NGOs lack the technical operational capacity to deploy Django +
  Postgres + Cloudflare + run incident response. Either the chosen NGO has
  a tech team or it partners with one that does.
- Coordination tax. Dev velocity rarely matches NGO velocity. Releases
  slow down. Security patches need pre-agreed expedited paths.
- Code-versus-data ownership ambiguity. The operator NGO holds the live
  database; the foundation holds the code. A clean exit clause is
  mandatory in the operator agreement.
- Partisan-fork risk. With permissive licences, a partisan actor can take
  the code, deploy it under a near-identical name, and confuse users.
  Trademark + brand licence is the mitigation.

---

## 4. Precedents worth reading before deciding

| Project | Model | Lesson |
|---|---|---|
| **Ushahidi** (Kenya, 2008→) | Open code, deployed by many orgs including Ushahidi itself | The single most directly relevant precedent. Read their governance documents and ops history. |
| **OpenStreetMap Foundation** | Foundation operates osm.org; anyone can deploy a fork | Brand + central data steward pattern |
| **Wikimedia Foundation** | Editors do content; Foundation runs servers | Editorial independence from infra |
| **Sahana Foundation** (disaster response) | Devs build; NGOs deploy per crisis | Per-deployment partner model |
| **DemocracyWorks** (US, voter info) | Open code + partner operators | Multi-tenant config externalised |
| **ELOG PVT** (Kenya, 2007→) | Coalition of CSOs runs parallel vote tally | Coalition is slow but high credibility |

---

## 5. Candidate operator landscape (Kenya)

Filter: technical capacity + non-partisan reputation + appetite for risk
+ financial cushion. Verify each independently before approach; reputations
shift.

| Organisation | Tech ops | Non-partisan | Appetite | Verdict |
|---|---|---|---|---|
| **Mzalendo Trust** | Strong (runs own platform) | High | Medium | Best fit. Approach first. |
| **ELOG (Elections Observation Group)** | Medium (runs PVT) | High, politically watched | High (parallel tally is their mandate) | Strong candidate; coalition decision-making is slow |
| **Ushahidi** | Strong | Medium (current leadership perception varies) | Medium | Solid technical partner; verify current leadership and election-stance |
| **Code for Africa Kenya** | Strong | High | Medium-low (multi-country org; unlikely to put themselves on the line for one country) | Possible co-operator with another lead |
| **TISA (The Institute for Social Accountability)** | Weak technical | High | Medium | Better as fiscal sponsor than as operator |
| **KICTANet** | Weak technical, strong policy | High | Low (advocates; does not operate) | Best as legal + policy partner, not operator |
| **CIPIT (Strathmore)** | Academic | High | Low | Technical audit partner, not operator |
| **InformAction / KIDDP** | Weak | Medium | Medium | Skip |

### 5.1 Current early conversations

### 5.2 Realistic short-list

Approach in this order, in parallel where possible:

1. **Mzalendo Trust** — most technically capable civic-tech operator with
   a non-partisan reputation.
2. **ELOG** — institutional mandate to do parallel tally; existing
   relationships with observers across counties.
3. **Kiongozi.org / AFOSI** — clarify scope before assuming operator role.
4. **Ushahidi** — secondary operator candidate; verify current posture.

Combine where possible: Mzalendo runs the platform, ELOG provides the
observer / accreditation pipeline, Kiongozi/AFOSI plays a code-stewardship
or advocacy role. No single body has to do everything.

---

## 6. Architecture: what changes in the code

### 6.1 Multi-tenant configuration

The codebase must stop assuming Kura Zetu Kenya is the deployment. Move
operator-specific values to environment variables surfaced through
`CommunityTally/settings/base.py`:

```python
DEPLOYMENT = {
    "operator_name": os.environ["KZ_OPERATOR_NAME"],
    "operator_legal_entity": os.environ["KZ_OPERATOR_ENTITY"],
    "operator_dpa_reg": os.environ["KZ_OPERATOR_DPA_REG"],
    "operator_contact": os.environ["KZ_OPERATOR_CONTACT"],
    "country_iso": os.environ["KZ_COUNTRY"],
    "election_authority_name": os.environ["KZ_EA_NAME"],
    "brand_licensed": os.environ.get("KZ_BRAND_LICENSED", "false") == "true",
}
```

Every public-facing page footer, every API response metadata block, and
the privacy policy template render values from `DEPLOYMENT`. No hardcoded
"Kura Zetu Kenya".

### 6.2 Reference deployment vs forks

- **Reference deployment** — the official KE deployment by the chosen NGO
  operator, with `KZ_BRAND_LICENSED=true`. Uses the registered Kura Zetu
  trademark.
- **Forks** — anyone can clone and deploy the code under a different name.
  The brand requires a written licence from the foundation; running with
  `KZ_BRAND_LICENSED=false` displays a footer notice "Independent
  deployment — not the official Kura Zetu Kenya tally."

### 6.3 Deployment guide as first-class documentation

Add `docs/how-to-guides/deploy-as-operator.md` covering:

- Required environment variables.
- Production checklist (`manage.py check --deploy`).
- ODPC / data-controller obligations for the operator's jurisdiction.
- Backup and restore drill steps.
- Kill-switch ownership and key holders.
- Incident response runbook template.

---

## 7. Licensing: relicense from MIT to AGPL-3.0

Current state: the repository ships under **MIT** (`LICENSE.md`).

Why this matters now:

- Under MIT, a partisan actor can take the code, modify it, run it as a
  closed-source partisan deployment, and is **not required** to publish
  their modifications. They can also strip attribution beyond keeping the
  copyright notice in their source.
- Under AGPL-3.0, anyone who runs a public deployment of a derivative
  **must publish their modifications**, including network-served
  derivatives. A partisan fork would have to publish its own code,
  exposing what it changed.

AGPL-3.0 is the de-facto standard for civic-tech under exactly this concern
(Mastodon, Element / Matrix, NextCloud, Sentry, MongoDB Community
historically, Plausible Analytics, Mautic).

### 7.1 Trade-offs

| Trade | MIT (current) | AGPL-3.0 (proposed) |
|---|---|---|
| Anyone can deploy | Yes | Yes |
| Anyone can deploy without sharing changes | Yes | No |
| Friendly to corporate adoption | More | Less |
| Suitable for civic-tech with partisan-fork concern | Weak | Strong |

### 7.2 Relicensing mechanics

- All current contributors must agree in writing (issue or signed CLA).
  Contributor count is currently small; this is feasible now and gets
  harder later.
- The relicensing commit and the contributor consents are public on the
  repository.
- Brand and trademark are handled separately (section 9).

### 7.3 Recommendation

Relicense to AGPL-3.0 within the next two weeks while the contributor list
is short. Defer commercial licence exemptions until they are actually
asked for; do not pre-empt.

---

## 8. The foundation / trust layer

The foundation (or trust) is the long-lived legal entity that owns:

- The trademark.
- The repository (org account on GitHub / GitLab / Codeberg).
- The brand-licence authority — i.e. the right to authorise an operator to
  use the Kura Zetu mark for a country + cycle.
- Reserves / treasury (if any).
- The kill-switch heartbeat infrastructure (see
  [`legal-and-ops-audit.md`](./legal-and-ops-audit.md) section 6).

The foundation is **not** the operator. It holds the keys, it does not
run the database.

### 8.1 Minimum viable form

A **three-person trust** under the Kenya Trustees (Perpetual Succession)
Act is the cheapest credible vehicle.

- Cost: roughly **KES 30,000-50,000** including drafting the trust deed
  with a lawyer.
- Timeline: a few weeks.
- Trustees: three named humans on the deed. Recommended profile:
  - One technologist (the maintainer / project lead).
  - One civic-society figure with public legitimacy.
  - One legal or academic figure for independent counsel.
- Trust deed clauses to include:
  - Non-partisan covenant (no trustee can hold party office while serving).
  - Trademark + brand-licence authority.
  - Operator selection process.
  - Donor disclosure obligation.
  - Trustee succession on detention or incapacity.
  - Dissolution clause (where assets go if the trust ends).

### 8.2 Alternatives

- **Kenya Society** under the Societies Act — slightly cheaper, but less
  custodial-feeling than a trust; trust deed lets you bake in non-partisan
  covenants more cleanly.
- **Foreign foundation** (Estonia OÜ, US 501(c)(3) via fiscal sponsor) —
  stronger jurisdictional shield but weaker KE donor optics, and KE DPA
  still applies for KE data subjects. Worth pairing with a KE entity, not
  replacing it.

Recommend: KE trust first, foreign foundation later only if needed.

---

## 9. Trademark + brand-licence mechanics

### 9.1 Registration

- File the **Kura Zetu** mark with **KIPI** (Kenya Industrial Property
  Institute). Cost roughly **KES 15,000-30,000**.
- Trademark holder: the trust (section 8), not the project lead personally.
- Classes to file: software, civic services, related goods.

### 9.2 Brand-licence agreement (operator-facing)

A short, plain-language agreement signed between the trust and the
selected operator. Key clauses:

- **Exclusive for the country + cycle.** Only one operator may use the
  mark per country per election cycle.
- **Non-partisan covenant** mirroring the trust's.
- **Security-patch SLA.** Operator commits to deploying critical patches
  within a defined window (e.g. 24 hours for security; 72 hours for
  others).
- **Revocation clause.** Trust may revoke licence if operator breaches
  partisan or security covenants.
- **Data ownership at exit.** Operator commits to a clean handover of
  production data and access if revoked or at end of cycle.
- **No sublicence.** Operator cannot grant the mark to a third party.

---

## 10. Decision governance

Two-tier governance, mirroring the responsibility split:

### 10.1 Technical Steering Committee (for the code)

- 3-5 maintainers vote on architectural decisions and releases.
- Lazy consensus on routine PRs; explicit vote on breaking changes,
  cryptographic primitives, schema migrations affecting elections, and
  release tags.
- Documented in `CONTRIBUTING.md` and `GOVERNANCE.md` in the repository.
- Survives an individual maintainer's departure.

### 10.2 Foundation board (for the non-technical)

- The three trustees of the trust.
- Decisions: operator selection, brand-licence grants and revocations,
  donor acceptance, kill-switch policy, public statements during
  incidents.
- Quarterly meetings on the public record; emergency convenings as needed.

### 10.3 Overlap

One person may sit on both bodies but never all of either (no single
human can carry a decision alone). The project lead is naturally on the
TSC and may be a trustee on the foundation; the other trustees must be
people the project lead cannot direct unilaterally.

---

## 11. Real risks of the split model

| Risk | Mitigation |
|---|---|
| Wrong operator chosen, gets captured or co-opted | Brand-licence revocation clause; secondary operator on standby |
| Operator decision-making is too slow for security patches | Pre-agreed expedited path; emergency-deploy keyholders named in operator agreement |
| Operator accepts a politically tainted grant | Public donor list; foundation veto on funding sources |
| Two-organisation friction on feature priorities | Written operational scope at the start of each cycle; not all features must ship per cycle |
| Operator bails three months before election | Documented handover; secondary operator on standby with a draft licence |
| Foundation captured | Trust deed non-partisan covenant; transparency obligations; multiple trustees |

---

## 12. Suggested sequence

1. **This month**
   - Relicense to AGPL-3.0 while contributor count is small (section 7).
   - Draft and sign trust deed with three trustees (section 8).
   - File trademark with KIPI (section 9).
2. **Next 1-2 months**
   - Formal proposals to **Mzalendo Trust** and **ELOG**.
   - Follow-up conversation with **Kiongozi.org / AFOSI** to clarify scope
     and role expectations.
   - Multi-tenant config refactor in code (section 6.1).
   - Draft brand-licence agreement template.
3. **Next 3-4 months**
   - Selected operator signs brand-licence and operator agreement for
     cycle 0.
   - Operator stands up production environment; foundation hands over
     keys per operator agreement.
   - Foundation board meets publicly; donor and governance pages live.
4. **Pre-election (3 months out)**
   - Joint mock-election dry-run.
   - Joint load test.
   - Joint restore-from-backup drill.
   - Joint press-kit review.

---

## 13. Open questions

1. Will Kiongozi.org / AFOSI consider an operator role, or are they a
   better fit as a code-stewardship / advocacy partner? Resolve in next
   meeting and update this file.
2. Are any other relationships in flight that should be captured here
   (Ushahidi alumni, AFOSI member orgs, individual technologists offering
   to take a trustee seat)?
3. Who are the two other trustees, if the project lead is the first?
4. Is the project lead ready to relicense to AGPL-3.0 now? If not, what is
   the blocker?
