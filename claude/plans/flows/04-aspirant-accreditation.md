# 04. Aspirant + agent accreditation

Goal: every uploading agent is traceable to a real aspirant in a real party,
without putting the project on the hook for daily moderation. The chain of
trust is anchored once per election cycle by the IEBC nominee list and then
delegated to political parties.

```{mermaid}
flowchart TD
    A[IEBC publishes nominee list<br/>PDF] --> B[Admin runs scrape script<br/>raw_iebc_pdfs_convertor/]
    B --> C[(Nominees + party + party email<br/>imported to DB)]
    C --> D[System emails party HQ<br/>signed magic link]
    D --> E{Party HQ clicks link}
    E -->|"opens portal,<br/>sets password"| F[Party portal session]
    E -->|"no click after 7 days"| E1[Admin manual fallback<br/>per aspirant]
    F --> G[Party reviews their nominee list,<br/>confirms each aspirant]
    G --> H[Aspirant receives portal invite<br/>by email + SMS]
    H --> I[Aspirant adds agents:<br/>phone + ID + station code]
    I --> J{Accreditation.clean<br/>zone + 1 per station}
    J -->|"violates zone"| J1[Reject with reason]
    J -->|"violates 1 per station"| J2[Reject as duplicate]
    J -->|"pass"| K[Agent SMS:<br/>app link + token]
    K --> L[Agent installs app,<br/>binds token to user account]
    L --> M[Agent uploads only at<br/>their assigned station]

    style A fill:#dfd
    style M fill:#cfc
```

## Hard rules enforced at DB level

| Rule | How |
|---|---|
| Zone match between aspirant.level and station geo | `Accreditation.clean()` mirrors `Aspirant.clean()` in `results/models.py:104` |
| One active agent per (aspirant, station, cycle) | `UniqueConstraint` with `revoked_at IS NULL` |
| One active accreditation per (user, cycle) | `UniqueConstraint` with `revoked_at IS NULL` |
| Revocation never deletes prior uploads | `revoked_at` is a soft flag, history preserved |

## Trust anchors

- **IEBC nominee list**: scraped once per cycle, single source of who can be
  an aspirant. No self-service aspirant signup.
- **Party HQ email**: ties aspirants to a party that bears reputational cost
  for fraud. Magic link expires; rotated per cycle.
- **Aspirant**: bears the cost of vetting their agents. KYC is the aspirant's
  problem, not the platform's.

## Push-back tracked

- Bounce rate on scraped party emails may be high. Admin manual fallback is
  the safety valve, scoped per aspirant, not per upload.
- Aspirant filling fake "agent" slots in their own zone is still possible.
  Cap at one per station limits damage; combined with the upload gates in
  `02-upload-gates` they cannot inject for stations they are not at.
