# 07. Form 34A image integrity

Form 34A is the evidence chain for every presidential result row. The audit
flags multiple ways it can be silently swapped, reused, or stripped of meaning
(E2, E3, E5, E6, E9). This flow shows how an upload becomes a tamper-evident
artifact without relying on OCR.

```{mermaid}
flowchart TD
    A[Client picks photo<br/>from camera, never gallery] --> B[Client strips EXIF GPS<br/>but keeps timestamp]
    B --> C[Client computes sha256<br/>of compressed bytes]
    C --> D["POST multipart:<br/>file + sha256 + station_code + nonce"]
    D --> E{Server: pHash<br/>vs existing forms}
    E -->|"near-duplicate found<br/>at different station"| Z[Reject<br/>reason = duplicate_image]
    E -->|"unique"| F{Laplacian variance<br/>blur check}
    F -->|"too low"| Z2[Reject<br/>reason = image_blur]
    F -->|"ok"| G{Entropy + IEBC logo<br/>template match}
    G -->|"no IEBC header"| Z3[Reject<br/>reason = not_form_34a]
    G -->|"ok"| H{Server-side sha256<br/>matches client claim?}
    H -->|"no"| Z4[Reject<br/>reason = hash_mismatch]
    H -->|"yes"| I{AI vision check<br/>Claude Haiku, 1 per station}
    I -->|"score &lt; threshold or<br/>challenge code missing"| Z5[Reject<br/>reason = ai_low_confidence]
    I -->|"pass"| J[("transaction.atomic:<br/>insert Result rows,<br/>Extras row,<br/>save image with<br/>&lt;station&gt;_&lt;ts&gt;_&lt;sha256[:12]&gt;.jpg")]
    J --> K[django-simple-history<br/>captures row]
    K --> L[Append daily Merkle root<br/>to public log<br/>future, optional]

    style A fill:#dfd
    style J fill:#cfc
```

## Storage shape

- Filename: `<station_code>_<timestamp>_<sha256[:12]>.jpg`. Never reused, never
  overwritten (E3).
- Path: `forms/34A/<county>/<const>/<ward>/<center>/<station>/<filename>`.
- Stored alongside row: `image_sha256` (CharField, indexed),
  `image_phash` (CharField), `exif_taken_at` (DateTimeField), `uploader_id`,
  `client_geohash` (truncated to ward precision).
- `django-simple-history` enabled on `*Extras` models for append-only audit
  (E9).

## What stays out of scope on purpose

- **Signature authenticity**: AI cannot verify a wet-ink signature is the
  real presiding officer's. The system only counts agent signature boxes,
  never validates them.
- **OCR of handwritten totals**: too brittle; would fight handwriting variance.
  Form-field totals come from the user input; AI only sanity-checks that the
  visible digits *roughly* line up.
- **Server-side image-to-image diff**: deferred; pHash plus sha256 is enough
  for now.

## Audit findings closed

| Finding | How |
|---|---|
| E2 | Image validated and hashed before any Result row is inserted |
| E3 | Filename now unique per upload |
| E5 | sha256 stored on Extras row, exposed in API |
| E6 | EXIF stripped client-side, GPS never persisted to image |
| E9 | `django-simple-history` on result models |
| H2 | MIME, size, and magic-byte validation in pre-checks |
