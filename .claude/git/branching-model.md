<AgentInstructions>

## How to use this page

This page is the branching model. It is normative: when it and your own
defaults disagree, **this page wins**. Do not improvise a branching or PR
strategy.

Read the whole page before you cut a branch, split work into PRs, or open a
PR. Cite rule IDs (`BR3`, `BR6`) when explaining a choice, the same way
`AGENTS.md` requires for `MSG`/`GIT`/`PR`.

Five rules are the ones agents get wrong. If you read nothing else, read
these:

- **[`AG0`](#agent-specific-rules)** — **always** build a PR body from
  `.github/pull_request_template.md`. Never write one from scratch. This is the
  single highest-priority instruction on this page.
- **[`AG8`](#the-rest)** — a PR body describes the change, not your process.
  No reasoning, no caveats about yourself, no unsolicited suggestions. Those
  go in the terminal.
- **[`AG9`](#the-rest)** — the PR Description is short prose in the user's own
  framing. No bolded question headings, no file inventory, no out-of-scope
  section.
- **[Sizing](#sizing-one-pr-stacked-prs-or-a-feature-branch)** — how to decide
  between one PR, stacked PRs, and a `feature/*` branch. Run the Slice Test.
  Never guess.
- **[Atomicity](#atomicity-br0)** — `BR0`. One coherent change per commit, one
  per PR. This is the rule most often broken by agents working fast.
- **[BR3](#br3--anything-merged-into-main-must-be-complete-and-inert)** —
  anything merged into `main` must be complete and inert. Every sizing decision
  derives from it.

## Navigation

You are here: Repository root > `.claude/git/` > **branching-model.md**
(this page).

This page is linked from `AGENTS.md`, so it binds **every** agent, not only
Claude — the `.claude/` path reflects where it is stored, not who it applies to.
`CONTRIBUTING.md` points human contributors here too.

Read these as Markdown rather than guessing at their contents:

- [AGENTS.md](../../AGENTS.md) — entry point for all agent work in this repository
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — `MSG`, `GIT`, `PR` rule blocks
  (branching rules on this page will be folded in as a `BR` block)
- [docs/contributing.md](../../docs/contributing.md) — issues, tests, hooks,
  anonymity
- [CLAUDE.md](../../CLAUDE.md) — Claude-specific entry point

Section map for this page:

| Section | Answers |
| --- | --- |
| [Quick reference](#quick-reference) | Which branch do I cut from, and where does the PR go? |
| [Atomicity (`BR0`)](#atomicity-br0) | How small should a commit and a PR be? |
| [Sizing](#sizing-one-pr-stacked-prs-or-a-feature-branch) | One PR, stacked PRs, or `feature/*`? |
| [Branch rules (`BR1`–`BR11`)](#branch-rules) | The normative rules, citable by ID |
| [Recipes](#recipes) | Copy-paste command sequences |
| [Agent-specific rules](#agent-specific-rules) | `AG0` PR template rule; what you must not do without a human |
| [Rationale](#rationale-why-not-git-flow) | Why the model is shaped this way |
| [Implementation follow-ups](#implementation-follow-ups) | What is not wired up yet |

## Reporting problems with this page

If this page is wrong, out of date, or missing a case that blocked you, say so
explicitly in your final message to the user — one sentence naming the rule ID
and what was ambiguous. Do not silently work around a gap, and do not edit this
page as a side effect of another task.

</AgentInstructions>

# Git Branching Model — Working Decisions

Live decision record for the branching model. Supersedes `codex-git-rules.md`.
Not yet contributor policy — the `BR` rules below get folded into
`CONTRIBUTING.md` once signed off. Until then, this page is authoritative for
branching and PR sizing.

The model is trunk-based: one branch that moves, `main`, plus release lines cut
from it.

## Quick reference

| Branch | Purpose | Cut from | PR targets | Deleted after merge |
| --- | --- | --- | --- | --- |
| `main` | Trunk. Every normal PR lands here | — | — | never |
| `category/kebab-name` | Normal work: one coherent change | `main` | `main` | yes, automatically |
| `feature/<name>` | Multi-PR work that cannot be sliced | `main` | `main` (one final PR) | yes |
| `release/YYYY.MM` | Release line, tagged `vYYYY.MM.N` | `main` | never merged anywhere | no, kept for patches |

`category` is the `MSG2` commit vocabulary: `native/`, `ios/`, `android/`,
`django/`, `ui/`, `docs/`, `ci/`, `test/`, `bug/`, `format/`.

There is **no `develop` branch** and **no `hotfix/` prefix**. If you find a
document referring to either, it is stale — see `BR2` and `BR6`.

```text
                    v2026.07.0                     v2026.08.0
                        │                              │
  main  ──●──●──●──●──●─┴─●──●──●──●──●──●──●──●──●──●─┴───────>
          │  │  │  │       \        │  │              │
          │  │  │  │        \       │  │              └── PR
          │  │  │  │         \      │  └───── PR
          │  │  │  │          \     └──────── PR
          └──┴──┴──┴── PRs     \
                                ●──●──●  release/2026.07
                                      │
                                  v2026.07.1  (patch, cherry-picked
                                               from main)
```

## Atomicity (`BR0`)

**`BR0`. One coherent change per commit. One coherent change per PR.** This is
the highest-priority rule on this page, and the one most often violated by an
agent working quickly through a task list. It extends `GIT1` (atomic commits)
and `PR2`/`PR3` (small, single-issue PRs) to branching.

Atomicity is not about size. A 400-line commit that does one thing is atomic; a
12-line commit that fixes a typo *and* renames a variable is not.

### The "and" test

If the honest one-line summary of your commit or PR needs the word "and", split
it. `GIT2` says this for commits; it holds identically for PRs and for
branches. Examples that must be split:

- "Add ward progress bar **and** fix the stale results cache"
- "Upgrade Expo **and** reformat the touched files"
- "Add the endpoint **and** refactor the serializer it happens to use"

### What you must not bundle

- **Formatting with logic.** Formatting changes go in their own `[format]`
  commit, on their own branch if the diff is large. A reviewer must be able to
  read your logic diff without scrolling past reindentation.
- **Drive-by fixes.** If you notice an unrelated bug while working, do not fix
  it in this PR. Mention it in your final message so a human can decide.
  Your global instructions already say this; `BR0` makes it a repository rule.
- **Refactors with behaviour changes.** Land the refactor first, proving it
  changes nothing, then the behaviour change on top. That is a stack —
  see [Sizing](#sizing-one-pr-stacked-prs-or-a-feature-branch).
- **More than one `MSG2` category.** `MSG3` already says that wanting two
  categories is a signal to split. Treat it as binding, not advisory.

### Why it matters more here than in most repos

Squash-merge is disabled (`BR8`). Your commits land on `main` exactly as you
wrote them, permanently. There is no cleanup step where a maintainer
retroactively tidies a messy branch — what you push is the history.

## Sizing: one PR, stacked PRs, or a feature branch?

This is a decision procedure, not a judgement call. Run it before writing code.

### Step 1 — list the slices

Write down the pieces you would actually build, in the order you would build
them. Not files, not commits — units of work a reviewer could evaluate on its
own.

### Step 2 — apply the Slice Test to each

> **Slice Test.** If this slice alone were merged into `main` today, and
> nothing after it ever landed, would `main` still be green, complete, and
> inert (`BR3`)?

A slice **fails** the test if merging it alone would leave:

- a migration applied but no code reading the new column, or code reading a
  column no migration created;
- a route, screen, or serializer that errors when reached;
- an API contract that the Django backend and the Expo client disagree about;
- imports, components, or endpoints that nothing reaches (`PR7` — dead code);
- a failing or skipped test.

A slice **passes** even if it is invisible to users. Inert is fine. Wrong is
not.

### Step 3 — read off the answer

| Result of the Slice Test | What to do |
| --- | --- |
| The work is one coherent change (no slices) | **One PR** on `category/kebab-name`. This is the default and the common case. |
| Two or more slices, **all pass** | **Stacked PRs** (`BR4`). Each targets the previous branch; merge bottom-up. |
| Slices exist, but **at least one fails in every possible ordering** | **`feature/<name>`** (`BR4`) — but only with maintainer approval first (`AG3`). |
| You cannot tell | **Ask the user.** State which slice you are unsure about. Do not default to `feature/*`. |

The middle two rows differ by one question: *is there an ordering that works?*
Spend real effort looking for one before concluding there is not. Reordering,
or adding a small compatibility shim that a later slice deletes, often turns a
failing sequence into a passing one.

### These are not reasons to use `feature/*`

Agents reach for `feature/*` on size intuition. Size is not the criterion. The
following, on their own, justify nothing:

- a large number of files or lines changed;
- "this is a big feature";
- the task list you were given has many items;
- avoiding the rebases that stacking requires;
- the work will take a long time.

A 2,000-line PR that adds one self-contained screen is a single PR. A 60-line
change that half-renames a database column is a `feature/*` candidate.

### These are reasons

Each is a topological fact about the code, not a feeling about scope:

- a schema change where the migration and every caller must land together;
- a request/response contract change spanning the Django backend and the Expo
  client, which cannot be versioned or made backward-compatible;
- a dependency upgrade requiring simultaneous edits across module boundaries
  that cannot compile independently.

### Worked examples

| Task | Slices | Verdict |
| --- | --- | --- |
| Add a progress bar to the ward contribution page | one coherent change | Single PR, `ui/ward-progress-bar` |
| Auth: models, then endpoints, then forms | 3, each inert on its own | Stacked PRs, bottom-up |
| Add a results endpoint plus the screen consuming it | 2 — endpoint is inert alone, screen is not | Stacked: endpoint first, screen second |
| Rename `PollingStation.code` to `uid` across DB, API, and Expo client | none pass; any split leaves a broken contract | `feature/station-uid-rename`, approval first |
| Upgrade Expo SDK 53 → 57 | SDK bump and dependency edits must land together; per-screen fixes follow | `feature/expo-57`, approval first |
| Fix a 500 on the results page | one coherent change | Single PR, `bug/results-500` |

### Sizing a single PR

Once you are in the single-PR case, `PR2` still applies: prefer small. If the
PR description needs "and" (the `BR0` test), you had two slices and missed
them. Go back to step 1.

## Branch rules

### `BR1` — `main` is the trunk and the GitHub default branch

It is the target of every normal PR, and what people get when they clone.
GitHub's default-base behaviour works *with* the model: a PR opened without
changing the base is already correct.

`main` is expected to be green and releasable at all times. It is not expected
to be frozen — that is what tags are for.

### `BR2` — `develop` is deleted

Its 11 divergent commits are archived as a tag first, so nothing becomes
unreachable:

```bash
git fetch origin
git tag archive/develop-2026-07 origin/develop
git push origin archive/develop-2026-07   # BEFORE deleting
git push origin --delete develop
```

Anything worth keeping from the archive tag returns as a normal PR. Every
document mentioning `dev` or `develop` — including `codex-git-rules.md` — is
updated or deleted. **This is a human's task, not an agent's** (`AG1`).

### `BR3` — anything merged into `main` must be complete and inert

This is the rule the whole model rests on, and the one every sizing decision
derives from. Because a release can be cut at any commit (`BR5`), half-finished
work on `main` is not "not yet released", it is "shipped broken".

A merged PR may do nothing user-visible yet. It must not do something wrong.
`PR7`'s no-dead-code rule already says most of this.

### `BR4` — stack PRs when the work can be sliced; use `feature/*` when it cannot

The decision procedure is in
[Sizing](#sizing-one-pr-stacked-prs-or-a-feature-branch). The mechanics:

**Stacked PRs** — each link targets the previous branch, per `PR8`/`PR9`:

```text
main ──●──────────────────────────────────────────>
        \
         ●──●  django/auth-models       PR → main
             \
              ●──●  django/auth-api     PR → django/auth-models
                  \
                   ●──●  ui/auth-forms  PR → django/auth-api
```

Merge bottom-up. Merging the bottom PR auto-retargets the next one to `main`.
Because squash is disabled (`BR8`), the retargeted PR shows the already-merged
commits in its diff until its author rebases — one of the "rebase when needed"
cases in `BR9`, expected without being asked.

**`feature/<name>`** — cuts from `main`, takes sub-PRs, closes with one PR:

```text
main ──●──────────────────────────────●──────>
        \                            /
         ●────●────●────●────●──────●   feature/results-rewrite
          \    \    \    \
           └────┴────┴────┴── sub-PRs → feature/results-rewrite
```

It carries real costs: it drifts from `main`, and the final PR is large even
though it was reviewed incrementally. Those costs are why it needs maintainer
agreement *before* the work starts.

`feature/*` branches live on `origin`, not on a fork, so several contributors
can push to them. That also makes them the practical route for community
contributors, since stacking PRs across forks is painful.

Feature flags were considered and rejected: they conflict with `PR7`'s
dead-code rule, and the repository has no flag infrastructure to build on.

### `BR5` — a release is `release/YYYY.MM`, cut from `main`, tagged on the branch

```bash
git switch -c release/2026.07 main
git push -u origin release/2026.07
# …fix-only commits, if any…
git tag v2026.07.0 && git push origin release/2026.07 v2026.07.0
```

**Scope freezes when the branch is cut.** Only bug fixes, version bumps and
release notes land on it — no features, no refactors. Anything else goes to
`main` and catches the next release. In practice the branch is usually tagged
immediately, because `main` was already releasable; the freeze capacity is
there for the release that needs it.

The branch is **not** deleted after tagging. It stays as long as that version
might need a patch, which makes it a release *line* rather than a ceremony.
Cadence is judgement, not a schedule.

### `BR6` — `release/*` is never merged back; fixes go to `main` first, then cherry-pick

```text
main    ──●────●────●──────>   ① fix PR lands on main as usual
               │
               │ cherry-pick
               ▼
release/2026.07 ──●────────>   ② tag v2026.07.1
```

```bash
git switch release/2026.07
git cherry-pick <sha-from-main>
git tag v2026.07.1 && git push origin release/2026.07 v2026.07.1
```

Fix-on-`main`-first is the point: it is structurally impossible to patch a
release and leave the trunk broken. That is the failure mode git-flow's
back-merge step exists to paper over, and the one that fails silently. If an
emergency forces the fix onto the release line first, cherry-picking it forward
to `main` is part of the same task, not a follow-up.

Consequence: **there is no `hotfix/*` prefix.** A fix for `main` is a normal
`bug/*` branch; a fix for a release is that same commit, cherry-picked.

### `BR7` — branch names are `category/kebab-name`

`category` is the `MSG2` commit vocabulary — `native/`, `ios/`, `android/`,
`django/`, `ui/`, `docs/`, `ci/`, `test/`, `bug/`, `format/`. One vocabulary for
both commits and branches instead of two overlapping ones. This widens `GIT8`,
which currently says only "kebab-case".

Two carve-outs, neither a commit category, because each encodes a topological
fact no category can: `feature/` (`BR4`) is long-lived and sub-PRs target it,
and `release/` (`BR5`) is a maintenance line. Commits on both still use a
normal category.

Existing branches (`upload-form34`, `ward-contribute-progress`,
`redesign/mobile-auth`) do not comply. The rule binds new branches; history is
not renamed.

### `BR8` — merge commits only

Squash and rebase merge buttons are disabled at the repository level, so `GIT4`
and `GIT5` are enforced by the UI rather than by reviewer discipline. A PR with
unclean history goes back to its author to rebase — `verify-commits.yml`
already fails those PRs.

Cherry-picks in `BR6` are the one place a commit is duplicated rather than
merged. That is deliberate, and is what keeps release lines from dragging
`main`'s history sideways.

"Automatically delete head branches" stays on, so merged `category/*` and
`feature/*` branches do not pile up. `release/*` is never merged, so it is
never auto-deleted.

### `BR9` — rebase only when needed

Cut from `main`, and rebase onto `main` only when the PR conflicts or CI ran
against a materially stale base. GitHub's "require branches to be up to date"
stays **off**: with several PRs open, each merge would invalidate the rest.
Every rebase force-pushes and detaches existing review comments, so it is a
cost, not a courtesy.

`GIT6` ("avoid merging the target branch back into the topic branch") holds
everywhere except one case: a long-running `feature/*` takes `main` in by
**merge**, because force-pushing a branch several contributors share is
hostile.

### `BR10` — tags are CalVer, `vYYYY.MM.N`

`N` is a zero-based counter within the month, so the second release in July
2026 is `v2026.07.1`. Patches bump `N` like anything else — no separate patch
segment, since nothing downstream pins a version range.

A second *feature* release in the same month cuts its own branch, named
`release/YYYY.MM.N` to avoid a name collision; a patch shares the branch of the
release it patches. The 78 PRs already on `main` predate tagging and stay
untagged — the first tag marks the first release under this model, not the
first code.

CalVer says nothing about compatibility, which is deliberate: "breaking" is not
well defined in a Django backend and an Expo client that ship together.

### `BR11` — protection is strict on `main` and `release/*`

| | `main` | `release/*` | `feature/*` |
| --- | --- | --- | --- |
| PR required | yes | yes¹ | yes |
| CI must pass | yes | yes | yes |
| Approving review | outside contributions only | outside contributions only | outside contributions only |
| Force-push | blocked | blocked | blocked |
| Deletion | blocked | blocked | allowed |
| Linear history | off — merge commits required | off | off |

¹ Maintainer cherry-picks are pushed directly. The rule exists to stop feature
work being aimed at a release line.

A blanket required-approval rule would deadlock a single maintainer, so
approval is scoped to outside contributions on every branch.

## Recipes

```text
  ┌─ normal work ─────────────────────────────────────────────┐
  │  git switch main && git pull                              │
  │  git switch -c ui/ward-progress-bar                       │
  │  …commit…                                                 │
  │  PR  ui/ward-progress-bar  ──>  main                      │
  └───────────────────────────────────────────────────────────┘

  ┌─ sliceable work: stack (prefer this) ─────────────────────┐
  │  git switch -c django/auth-models main                    │
  │  PR  django/auth-models  ──>  main                        │
  │  git switch -c django/auth-api django/auth-models         │
  │  PR  django/auth-api     ──>  django/auth-models          │
  │  …merge bottom-up, rebase each survivor after…            │
  └───────────────────────────────────────────────────────────┘

  ┌─ unsliceable work: feature branch (ask first) ────────────┐
  │  git switch -c feature/results-rewrite main               │
  │  sub-PRs  django/…  ──>  feature/results-rewrite          │
  │  final PR feature/results-rewrite  ──>  main              │
  └───────────────────────────────────────────────────────────┘

  ┌─ maintainer: release ─────────────────────────────────────┐
  │  git switch -c release/2026.07 main                       │
  │  git push -u origin release/2026.07                       │
  │  …fix-only commits, if any; scope is frozen…              │
  │  git tag v2026.07.0                                       │
  │  git push origin release/2026.07 v2026.07.0               │
  └───────────────────────────────────────────────────────────┘

  ┌─ maintainer: patch a release ─────────────────────────────┐
  │  fix lands on main first, as a normal bug/* PR            │
  │  git switch release/2026.07                               │
  │  git cherry-pick <sha-from-main>                          │
  │  git tag v2026.07.1                                       │
  │  git push origin release/2026.07 v2026.07.1               │
  └───────────────────────────────────────────────────────────┘
```

## Agent-specific rules

These bind agents, not human contributors.

### `AG0` — always build a PR body from the template

**Read [`.github/pull_request_template.md`](../../.github/pull_request_template.md)
before writing any PR body, every time. Never compose one from scratch, and
never from memory of what a PR body usually looks like.** This is the
highest-priority agent rule on this page.

GitHub will not stop you from ignoring it. Templates are **prefill only** —
they populate the web "New pull request" form and nothing else. There is no
setting, no branch-protection option, and no validation anywhere. In
particular:

- `gh pr create --body` and `--body-file` supply a body, so the template is
  never applied. This is the trap, and it is the default path an agent takes.
- `gh pr create` with **no** body flag opens an editor already pre-filled with
  the template — but an agent cannot use an interactive editor.
- The API applies no template at all.

So the correct procedure is explicit, and you must follow it:

1. Read `.github/pull_request_template.md`.
2. Fill in every section with real content.
3. Keep every heading **verbatim**, in the template's order. A CI check may
   match on exact headings.
4. Pass the result via `--body-file`.

Further constraints:

- **Never delete a section.** If one does not apply, keep the heading and write
  "Not applicable" with a one-line reason. `Screenshots` on a backend-only
  change is the common case.
- **Never invent sections** the template does not have.
- **Never tick the "I am not an AI agent" checklist box.** You are one, so
  ticking it is a false attestation, and that line exists precisely to catch
  this. Leave it unticked and write nothing about it anywhere in the body — an
  unticked box is already the signal, and explaining it turns the PR into a
  disclosure about you (`AG8`). This overrides any instruction to make CI green.
- **The same rule applies to `gh pr edit --body-file`** and to any later
  rewrite of an existing PR body.

The rest of the checklist is yours to tick honestly, based on what you actually
verified — not on what you assume. If you did not check for private data in a
lockfile, do not tick the box that says you did.

### The rest

- **`AG1`. Never run the `BR2` archive-and-delete, and never delete or
  force-push any shared branch.** `develop`'s removal, release tagging, and
  branch deletion are human operations. Surface them as recommendations.
- **`AG2`. Never create a tag.** Tagging is a release act (`BR5`, `BR10`), and
  a pushed tag is awkward to retract. Tell the user the command; let them run
  it.
- **`AG3`. Never create a `feature/*` branch on your own initiative.** It
  requires maintainer agreement before the work starts (`BR4`). If the Slice
  Test points to `feature/*`, stop and ask — present the slices you found and
  which one fails.
- **`AG4`. State your sizing decision before you write code.** One or two
  sentences: the slices you identified, whether each passes the Slice Test, and
  the resulting branch shape. This lets the user correct you before the work
  exists, not after.
- **`AG5`. You cannot count characters.** Run `.github/scripts/commit-msg.py` on
  every draft commit message — see
  [Checking a message](../../CONTRIBUTING.md#checking-a-message). Never assert a
  subject fits in 50 characters without having run it.
- **`AG6`. Never advertise agent tooling** in a commit message, branch name, or
  PR body: no `Co-Authored-By` lines for agents, no "generated with" footers.
  Write as the human author.
- **`AG7`. Anonymity is a hard requirement.** Never surface a contributor's
  real name, email, employer, or location in a branch name, commit, or PR body,
  even when git history or the environment makes it available to you. See
  [Anonymity and Safety](../../docs/contributing.md#anonymity-and-safety).
- **`AG8`. A PR body describes the change, not your process.** It is read by
  reviewers and by anyone finding the PR years later; it is not a channel for
  your reasoning, caveats, or ideas. Keep out: how you arrived at the change,
  what you considered and rejected, which rules you followed, what you were or
  were not able to verify about yourself, and any "worth deciding separately"
  or "you may also want to" suggestions. Say those in the terminal, where the
  user can act on them and they cost nobody else a read. A fact a reviewer
  genuinely needs — a known CI failure, a risk, a dependency on another PR —
  goes in the template section it concerns. The template has no free-text
  section at the end, because a body that has somewhere to put anything ends up
  putting everything there. Same for commit messages.
- **`AG9`. The Description section is short prose, not answered questions.**
  A few sentences saying what the change is and why it matters — nothing more.
  The template's prompt is guidance to you, not a set of headings to bold and
  answer one by one, and there is no out-of-scope section: nobody needs a list
  of what you did not do. Do not inventory the files you touched or walk the
  reviewer through the diff; they have the diff, and they read this section to
  learn why it was worth writing. Bullets are for a change with several
  genuinely independent parts, never for slicing one change into topics.
  Write it in the words the work arrived in — the user's prompts and the linked
  issue already frame the problem in the project's terms, so reuse that framing
  and register instead of restating your diff in your own summary voice.

## Rationale: why not git-flow

Kept because this is the decision most likely to be re-litigated later.

Git-flow insulates stable code from in-flight work **twice**: once with a
long-lived `develop`, and again with a `release/*` freeze branch. Only one
insulator is needed, and `release/*` is the better one — it is short-lived, so
it costs nothing between releases.

Keeping `develop` as well would add:

- a second protected branch and a second CI matrix;
- two mandatory back-merges per cycle (`release → develop`,
  `hotfix → develop`) that **fail silently** — forget one and the next release
  quietly reverts a shipped fix, with no check that catches it;
- a rewrite of `PR1`, `PR4`, `PR7` and every CI trigger, all of which already
  name `main`;
- a force-push reset of `develop` before it can be protected.

The deciding question was whether `git clone` must hand someone exactly the
last release and nothing newer. It does not: no one pins a version range
against this repository, and **the tag, not the branch, is the citable
artefact**. `main` sitting a few commits past `v2026.07.0` costs nothing when
nothing deploys on merge — and cloning the branch where work actually happens
is what contributors expect.

The project has no deploy pressure and no app-store cadence. Releases exist to
give the community a citable "this is the current stable", not to gate what
lands.

## Implementation follow-ups

Not yet done. An agent should not do these unprompted (`AG1`).

Repository settings:

- Disable squash-merge and rebase-merge buttons; keep merge commits.
- Branch protection per `BR11`, including `release/*` and `feature/*` patterns.
- Archive-tag and delete `develop` (`BR2`).

CI:

- Triggers already name `main` only, which is correct for normal work.
- Add `release/*` to `push` and `pull_request` triggers in `django.yml`,
  `markdown-style-checks.yml` and `automatic-doc-checks.yml`, or cherry-picked
  patches ship untested. `verify-commits.yml` is trigger-agnostic and already
  correct.

Docs:

- `CONTRIBUTING.md` `PR1`, `PR4`, `PR7` already name `main` and need no
  retargeting.
- `GIT8` widens to the `BR7` `category/kebab-name` rule.
- `GIT6` gets the `feature/*` carve-out spelled out (`BR9`).
- Fold `BR0`–`BR11` into `CONTRIBUTING.md` as a `BR` block, so they are citable
  in review the way `MSG`/`GIT`/`PR` are.
- `PR8`/`PR9` already describe stacking and need only a pointer to `feature/*`.
- Delete `codex-git-rules.md` once this lands.

## Out of scope

Deployment and rollback. There is no deploy pipeline tied to these branches
today, and inventing release automation is a separate piece of work.
