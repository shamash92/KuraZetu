# 02. Upload gates (proposed happy path)

Every gate is a **hard pass / hard fail** with an explicit reason returned to
the client. Soft / probabilistic gates use a narrow band where the only fallback
is an extra challenge (paper code or finger pose), never a moderator.

```{mermaid}
flowchart TD
    A[User taps upload<br/>at polling station] --> B[Client requests<br/>upload nonce]
    B --> C{Nonce valid?<br/>station, 15 min window}
    C -->|"expired or unknown"| C1[Show: refresh and retry]
    C -->|"fresh"| D{GPS check}
    D -->|"&gt; 40 m or accuracy &gt; 30 m<br/>or mocked == true"| D1[Show distance + accuracy,<br/>suggest walking closer]
    D -->|"pass"| E{User binding}
    E -->|"user.polling_center != station<br/>and no accreditation"| E1[Show: not registered<br/>at this station]
    E -->|"pass"| F[Camera: Form 34A<br/>+ challenge if contested ward]
    F --> G[Client: hash + strip EXIF<br/>POST multipart to server]
    G --> H{Image pre-checks}
    H -->|"pHash dup / bad EXIF / blur /<br/>low entropy / no IEBC watermark"| H1[Reject with named reason]
    H -->|"pass"| I{Free AI vision pass}
    I -->|"score &lt; threshold<br/>or challenge code mismatch"| H1
    I -->|"pass"| J[("transaction.atomic:<br/>insert Result rows,<br/>insert Extras,<br/>save image with sha256")]
    J --> K{Consensus check}
    K -->|"first valid submission"| L[State: pending]
    K -->|"k of n agree within tol"| M[State: live]
    K -->|"two groups disagree"| N[State: contested<br/>show both]

    style A fill:#dfd
    style M fill:#cfc
    style N fill:#fda
```

## Gate reference

| # | Gate | Source of truth | Audit ref |
|---|---|---|---|
| Nonce | Redis key per (station, 15min) | Backend issues + invalidates | new |
| GPS | `expo-location` reading | Client + server cross-check | E13 |
| Binding | `user.polling_center` or `Accreditation` | `accounts/models.py:73` + new | E11 |
| Pre-checks | pHash, EXIF, Laplacian variance, IEBC template | new utility module | H2, E5, E6 |
| AI vision | Claude Haiku, capped at 1 per station | new service, free tier | new |
| Atomic insert | `with transaction.atomic():` | All result-create views | E1, E4 |
| Consensus | `08-consensus-state-machine` | New state column on result | E8 |

## Failure UX rule

A failed gate **never** silently rejects. The HTTP response is a 4xx with
`{"reason": "<enum>", "detail": "<human msg>", "retry_hint": "<action>"}`.
Mobile client surfaces this verbatim so the contributor knows what to fix.
Silent fail = no contributor = no consensus = system dies in field.
