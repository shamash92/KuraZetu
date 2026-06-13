# Plan — Terms of Service & Privacy Policy

Not the documents themselves. A plan to produce, host, and link them later.

## Why
Signup form, landing footer (`landing-pages/footer.tsx`), and APK download page
(`pages/APKDownload.tsx`) all reference "Terms of Service" / "Privacy Policy"
but every link is a bare `href="#"`. No page or route exists yet.

## Open decisions (resolve first)
- [ ] Operating/legal entity behind KuraZetu (who the docs bind users to).
- [ ] Jurisdiction + governing law (assume Kenya; confirm).
- [ ] Does a real privacy doc already exist offline? User thought "the latter
      exists somewhere" — none found in repo. Confirm before drafting.
- [ ] Hosting target: React pages (`/ui/privacy/`, `/ui/terms/`) vs
      readthedocs vs static Django templates. Pick one.
- [ ] Who drafts the legal text (founder vs lawyer vs civil-society partner).

## Steps
1. [ ] Lock the decisions above.
2. [ ] Draft Privacy Policy content. Must cover what data is collected
       (phone, name, gender, optional age, role, polling station, Form 34A
       images), retention, anonymised public handles, S3/region transfer,
       Kenya ODPC obligations, user rights.
3. [ ] Draft Terms of Service content. Must cover eligibility (18+),
       phone-as-identity + no-OTP caveat, acceptable use, user-content licence,
       accuracy disclaimer ("not an IEBC system"), liability, termination.
4. [ ] Legal review of both drafts.
5. [ ] Build the chosen hosting surface (pages/routes or external docs).
6. [ ] Replace the `href="#"` placeholders in:
       - `auth/signup/signupForm.tsx` (Terms of Service, Privacy Policy)
       - `landing-pages/footer.tsx` (Privacy, Terms)
       - `pages/APKDownload.tsx` (Privacy Policy, Terms of Service)
7. [ ] Add "Last updated" + effective dates; announce changes mechanism.

## Out of scope (now)
Writing the actual legal text — deferred until decisions + drafter are set.
