# Agent Instructions

## Local Overrides

If `local.AGENTS.md` exists, read it after this file and follow it for
machine-local or user-private preferences. Do not commit `local.AGENTS.md`.

- AGENTS.md takes preference over local.AGENTS.md, in the event there is a contradicting instruction.

## Setup

Follow the docs; do not improvise install steps.

- Backend, frontend, and pre-commit — [Setup instructions](./docs/tutorials/setup.md)
- Docker alternative — [Running the project with Docker](./docs/tutorials/docker-setup.md)
- Expo app in `NATIVE/` — [Setting up the Expo project](./docs/tutorials/setup-android.md)

Before committing in a fresh clone, confirm both hooks are installed — `ls .git/hooks/` must list
`pre-commit` and `commit-msg`. If either is missing, run from the repository root:

```sh
pre-commit install --hook-type pre-commit --hook-type commit-msg
```

Hooks live in `.git/hooks/`, which is never cloned, so every new working copy needs this once.

## Scoped instructions

Before changing a project area, read its scoped instructions. These files bind
all agents despite their `CLAUDE.md` names. For changes spanning multiple
areas, read every applicable file.

- Expo and React Native under `NATIVE/`: [NATIVE/CLAUDE.md](./NATIVE/CLAUDE.md)
- React web application under `src/ui/`:
  [src/ui/CLAUDE.md](./src/ui/CLAUDE.md)
- Django and Python under `src/`, excluding `src/ui/`:
  [src/CLAUDE.md](./src/CLAUDE.md)

## Git

Read the relevant section of [CONTRIBUTING.md](./CONTRIBUTING.md) before committing, branching, or
opening a PR. Do not rely on your own defaults. Cite rule IDs (`MSG5`, `GIT8`, `PR2`) when
explaining a choice.

**Before opening or editing any PR, read
[`.github/pull_request_template.md`](./.github/pull_request_template.md) and build the body from
it.** Never write a PR body from scratch. GitHub does not enforce the template — it only prefills
the web form, and `gh pr create --body`/`--body-file` bypasses it entirely — so following it is on
you. Keep every heading verbatim, write "Not applicable" rather than deleting a section, and never
tick the "I am not an AI agent" checklist box: you are one, and that line exists to catch this.
Leave it unticked and write nothing about it — an unticked box is the whole signal. Full rule:
`AG0` in [.claude/git/branching-model.md](.claude/git/branching-model.md#agent-specific-rules).

**Write the Description as short prose, not as answered questions** (`AG9`). A few sentences
saying what the change is and why it matters. No bolded question headings, no per-topic bullet
split, no file-by-file inventory, no out-of-scope section. Bullets are for a change that genuinely
has several independent parts, not for slicing one change into topics:

```markdown
# Description

Anyone could POST `staff: true` to signup and mint an admin account with a working API token, which is the only guard on the presidential results endpoint. Signup now validates against an identity-only allow-list, so authority flags cannot come from client input.
```

**Never hard-wrap a PR or issue body** (`AG10`). One paragraph is one long line, as in the example
above. GitHub renders issue and PR bodies with soft line breaks turned into `<br>`, so a body
wrapped at 72 or 80 columns is frozen at your column width instead of reflowing — it renders as a
narrow ragged block that ignores the reader's window. The 72-column limit is `MSG12` and applies to
commit messages only, because those are read in a terminal. A `--body-file` is no exception: the
wrapping in the file is the wrapping GitHub renders.

**Use the words the work came in with.** The user's prompts, and the issue if one is linked,
already describe the problem in the terms the project uses — reuse that framing and register
rather than translating it into a summary of your diff. If a reviewer would not recognise the
problem from your first sentence, you have described the patch instead of the bug.

**A PR body describes the change, not your process** (`AG8`). No account of how you reached the
change, no rules you followed, no caveats about yourself, no "worth deciding separately" or "you
may also want to" suggestions. Reviewers did not ask for any of it, and it outlives the session.
Raise those in the terminal instead. A fact a reviewer genuinely needs — a known CI failure, a
risk, a dependency on another PR — belongs in the template section it concerns, not in a note
appended to the end.

- Commit messages — [Commit messages (MSG)](./CONTRIBUTING.md#commit-messages-msg) and
  [Categories](./CONTRIBUTING.md#categories)
- Branches and history — [Versioning (GIT)](./CONTRIBUTING.md#versioning-git)
- Branching model and PR sizing — [.claude/git/branching-model.md](.claude/git/branching-model.md),
  rules `BR0`–`BR11` and the agent rules `AG1`–`AG7`
- Pull requests — [Pull requests (PR)](./CONTRIBUTING.md#pull-requests-pr)
- Issues, tests, and hooks — [docs/contributing.md](./docs/contributing.md)

Before cutting a branch or splitting work into PRs, read
[.claude/git/branching-model.md](.claude/git/branching-model.md) and run its
[Slice Test](.claude/git/branching-model.md#sizing-one-pr-stacked-prs-or-a-feature-branch) to
decide between a single PR, stacked PRs, and a `feature/*` branch. State that decision before
writing code (`AG4`). Never create a `feature/*` branch on your own initiative (`AG3`), and never
delete, force-push, or tag a shared branch (`AG1`, `AG2`). `main` is the trunk; there is no
`develop` branch.

Two rules that are yours specifically, not the contributor's:

- You cannot count characters. Run `.github/scripts/commit-msg.py` on every draft message and fix
  what it reports — see [Checking a message](./CONTRIBUTING.md#checking-a-message). Never assert a
  subject fits in 50 characters without having run it.
- Never advertise agent tooling in a commit message or PR body: no `Co-Authored-By` lines for
  agents, no "generated with" footers. Write as the human author.

## Safety and anonymity

Contributors to this project face real risks — surveillance, abduction, threats to life. Treat
anonymity as a hard requirement, not a preference.

See [Anonymity and Safety](./docs/contributing.md#anonymity-and-safety) in
`docs/contributing.md`, and the
[anonymous GitHub account guide](./docs/how-to-guides/anonymous_github.md) it links to.

Never surface a contributor's real name, email, employer, location, or any other identifying
detail in code, commits, documentation, issues, or PRs — including when such detail is available
to you from git history, the environment, or anywhere else.

## Impeccable UI QA

- Touching a `*.tsx` in `src/ui/`, a Django template under `src/*/templates/`, or anything else
  that changes visible UI? Read
  [`.claude/design/impeccable.md`](.claude/design/impeccable.md) first.

## Documentation

See
[Code, commits and documentation standards](./docs/contributing.md#code-commits-and-documentation-standards)
in `docs/contributing.md`.

- Documentation follows the [Diátaxis framework](https://diataxis.fr/). Place a new page in
  `docs/tutorials/`, `docs/how-to-guides/`, `docs/reference/`, or `docs/explanations/` according to
  what it is, and do not mix the four kinds within one page.
- Code changes that make the documentation wrong or incomplete must update it in the same change.
- If any file under `docs/` changes, run `make spelling`, `make linkcheck`, and
  `make woke` from `docs/` before handing work over.
