# 08. Consensus math

The platform decides what is "true" for a station from the **set of valid
submissions**, never from a single moderator. Every submission has already
passed the hard gates in `02-upload-gates`; weights do not lower the bar,
they only decide which cluster of agreeing submissions wins.

## Inputs per submission

| Field | Source | Range |
|---|---|---|
| `vote_vector` | candidate id → vote count | per station per level |
| `tier` | user.accreditation tier | `community`, `verified_phone`, `party_agent` |
| `gate_score` | sum of soft-gate scores (blur, entropy, AI confidence) | 0 to 100 |
| `submitted_at` | server timestamp | per submission |

Tier weights, capped to prevent single-tier dominance:

| Tier | Weight |
|---|---|
| `community` | 1 |
| `verified_phone` (M-Pesa STK confirm or similar) | 3 |
| `party_agent` (Accreditation row, see `04`) | 10 |

```{mermaid}
flowchart TD
    A[New submission accepted<br/>by upload gates] --> B[Compute submission weight<br/>= tier_weight * gate_score / 100]
    B --> C[Group submissions into<br/>vote_vector clusters<br/>tolerance = +/- 2 per candidate]
    C --> D{Sum cluster weights}
    D --> E{Top cluster weight &gt;= k_threshold<br/>and runner-up &lt; rival_threshold?}
    E -->|"yes"| F[State = live<br/>publish top cluster vote_vector]
    E -->|"top close to runner-up"| G[State = contested<br/>show all clusters]
    E -->|"no cluster heavy enough"| H[State = pending]
    F --> I{Freshness check<br/>nightly}
    I -->|"top cluster has no<br/>new submission in N hours"| G
    I -->|"still fresh"| F
    G --> I
```

## Thresholds (start values, tune from data)

- `k_threshold = 9`. Reachable by three party agents (3 \* 10 = 30) or nine
  community uploads (9 \* 1 = 9) or any mix.
- `rival_threshold = 0.6 * top_cluster_weight`. If the runner-up cluster
  carries more than 60% of the leader's weight, the station is contested
  rather than live.
- `tolerance = 2` votes per candidate. Two submissions whose vote_vectors
  differ by `<= 2` per candidate share a cluster.
- `freshness window = 24h`. A cluster that stops receiving new submissions
  loses dominance to keep pace with corrections from the ground.

## Why "all hard gates must pass" still produces a useful weight

The hard gates throw out garbage submissions before they ever reach this
flow. Weight only resolves ties among submissions that already passed every
check. A community uploader and a party agent each carry exactly one vote
into the consensus; the agent's vote just resolves ties faster, which is
the realistic ground-truth: an accredited person at a counted station with a
hashed Form 34A image is more likely to be reporting the actual tally than
a random walk-in.

## Failure modes tracked

- **All submissions in one cluster but `k_threshold` not yet reached**: state
  stays `pending`. Front-end says "awaiting confirmations". This is the
  default for low-turnout stations.
- **Cluster split exactly down the middle**: state `contested`, both shown.
  No automatic resolution.
- **One mega-uploader (one party agent) alone**: tier cap means a single
  party agent (weight 10) is below `k_threshold` (9 alone meets the bar but
  rival of weight 6 keeps contested; tune as needed). Reviewed nightly when
  thresholds get re-calibrated against real data.
- **Cluster dies**: freshness rule downgrades stale clusters so a result
  cannot be locked in by a flash mob early in the day.
