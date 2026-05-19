# 03. Result state machine

Each `PollingStation*Results` row carries a public `state` that is computed
from the set of valid submissions. There is no moderator transition; every
arrow is driven by data.

```{mermaid}
stateDiagram-v2
    [*] --> pending: first valid submission accepted
    pending --> pending: more submissions, no quorum yet
    pending --> live: k submissions agree<br/>within tolerance
    pending --> contested: 2 valid clusters disagree
    live --> contested: new valid submission<br/>creates second cluster
    contested --> contested: more submissions on either side
    contested --> live: one cluster decays<br/>(see freshness rule)
    live --> frozen: post-counting window closes
    contested --> frozen: post-counting window closes
    frozen --> [*]
```

## Glossary

- **k**: minimum agreeing submissions. Start at `k = 3` per station per level.
- **tolerance**: per-candidate vote delta accepted as "agreement". Start at `±2`.
- **cluster**: group of submissions whose per-candidate totals are all within
  tolerance of each other.
- **freshness rule**: a cluster older than the most recent valid submission
  loses weight; if no submission from that cluster arrives within X hours,
  the cluster fades and the system can resolve back to `live`.
- **frozen**: hard cutoff after the counting window; no state changes accepted.
  Tampering attempts post-freeze are logged and ignored.

## Public rendering

| State | UI treatment |
|---|---|
| `pending` | Shown with "awaiting confirmations" badge. No totals revealed. |
| `live` | Totals shown plainly. |
| `contested` | Both clusters shown side-by-side, with submission counts and timestamps. No "winner" highlighted. Inline disclaimer (`claude-design` watermark). |
| `frozen` | Same as the last known state but marked locked. |

Contested is **not** an error state. It is the system telling the truth about
disagreement, which is the point of a parallel tally.
