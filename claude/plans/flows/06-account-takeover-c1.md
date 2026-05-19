# 06. Account takeover (C1 + C3 + C6)

The audit identifies three failures that together let anyone walk into an
arbitrary account. Each is small on its own; chained, they are the auth half
of the kill chain in `01-kill-chain`.

## Before fix

```{mermaid}
flowchart LR
    A[Attacker knows<br/>victim phone number] --> B["POST /accounts/password-reset/"]
    B --> C["No OTP, no email,<br/>password swapped immediately<br/>(C1)"]
    C --> D["POST /api/accounts/login/"]
    D --> E["UserSerializer accepted<br/>staff, admin, is_verified<br/>at signup so attacker can<br/>also self-promote (C3)"]
    E --> F[DRF token issued]
    F --> G["Token never expires,<br/>not invalidated on password change<br/>(C6)"]
    G --> H[Indefinite privileged access]

    style A fill:#fdd
    style H fill:#f88
```

## After fix

```{mermaid}
flowchart LR
    A[Attacker knows<br/>victim phone number] --> B["POST /accounts/password-reset/"]
    B --> C{Endpoint disabled<br/>until OTP wired}
    C -->|"410 Gone"| C1[Attack fails here]
    B --> D[OTP via SMS<br/>required to proceed]
    D --> E{Code matches?}
    E -->|"no"| C1
    E -->|"yes"| F[Password change allowed]
    F --> G[Existing DRF tokens<br/>invalidated]
    G --> H[New login required]
    H --> I{Privilege fields<br/>read only on UserSerializer}
    I -->|"cannot self-promote<br/>at signup or reset"| J[Standard user account]

    style A fill:#fdd
    style C1 fill:#cfc
    style J fill:#cfc
```

## Concrete edits per finding

| Finding | File | Change |
|---|---|---|
| C1 | `src/accounts/views.py:55` | Block reset until OTP flow ships; gate behind `django_otp` (already installed) |
| C3 | `src/accounts/api/serializers.py:11` | Mark `staff`, `admin`, `is_verified` as `read_only` in `Meta` |
| C4 | `src/accounts/api/views.py:65-79` | Stop reading `request.data["data"]["password"]` directly; route through serializer + `set_password` |
| C5 | `src/accounts/forms.py:31,195` | Generic error message; do not reveal whether phone exists |
| C6 | `src/accounts/api/views.py:171` | Invalidate token on password change; add expiry |
| H1 | `src/accounts/api/views.py:28,135` | Replace `print(request.data)` with redacted `logger.debug` |

## Test plan

Regression tests live in `src/accounts/tests/test_signup_security.py`
(already on this branch, untracked). One test per finding, all must pass
before any merge that touches `accounts/`.
