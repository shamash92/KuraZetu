# 01. Kill chain (current, pre-fix)

Source: `audit.md` round 2, "Updated kill chain (election fraud, end-to-end)".

This is the shortest path from a stranger on the internet to a fraudulent
national tally with the code as it stands on this branch. Every arrow lines
up to a finding ID in `audit.md`.

```{mermaid}
flowchart TD
    A[Stranger on internet] -->|"POST /api/accounts/signup/<br/>with staff=true, admin=true,<br/>is_verified=true"| B[Privileged user<br/>C3 + C4]
    B -->|"POST /api/accounts/login/"| C[DRF token<br/>never expires<br/>C6]
    C -->|"POST /api/results/polling-station/<br/>create/&lt;code&gt;/presidential/"| D{IsAdminUser check}
    D -->|"is_staff == True passes<br/>has_perm always True<br/>C2 + E11"| E[Per-candidate Result.objects.create<br/>no transaction.atomic<br/>E1]
    E --> F[Form 34A saved as<br/>form34A.jpg, overwrites prior<br/>E3]
    F --> G[Extras row inserted<br/>no uniqueness constraint<br/>E4]
    G --> H[No throttle, no geo check,<br/>no verified_by gate<br/>C14 + E12 + E13 + E8]
    H --> I[(Public national tally<br/>endpoints read this row)]
    I --> J[Fraudulent count is<br/>the published count]

    style A fill:#fdd
    style J fill:#f88
```

## Patch set that breaks each link

| Link broken | Findings closed |
|---|---|
| Cannot set `staff`/`admin` at signup | C3, C4 |
| `IsAdminUser` no longer enough; must be accredited agent for that station | C2, E11, E13 |
| Partial writes roll back on any error | E1 |
| Form 34A filename unique + sha256 + history | E3, E5, E9 |
| Extras uniqueness on `polling_station` | E4 |
| Per-user + per-endpoint throttle | C14, E12 |
| Verification workflow required before result counts publicly | E8 |

See `02-upload-gates` for the replacement happy path and
`06-account-takeover-c1` for the auth half of the same chain.
