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

## Project instructions

We have a few agent instructions living in various CLAUDE.md files in the project. These are for specific agents and are not shared with all agents. Please read and follow them as appropriate.

- For any android/ios related wotk, use the NATIVE/CLAUDE.md file for instructions.
- For any frontend/web-ui related work, use the src/ui/CLAUDE.md file for instructions.
- For any backend related work, use the src/CLAUDE.md file for instructions.

## Git

Read the relevant section of [CONTRIBUTING.md](./CONTRIBUTING.md) before committing, branching, or
opening a PR. Do not rely on your own defaults. Cite rule IDs (`MSG5`, `GIT8`, `PR2`) when
explaining a choice.

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

- You cannot count characters. Run `git-hooks/commit-msg.py` on every draft message and fix what it
  reports — see [Checking a message](./CONTRIBUTING.md#checking-a-message). Never assert a subject
  fits in 50 characters without having run it.
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

When changing Django templates, landing pages, React UI, or any `*.tsx` file that affects visible
UI, use the Impeccable workflow when it is available to preview and inspect the result before
handing off.

### Setting it up

Current documentation lives at <https://impeccable.style/docs/>; prefer it over anything restated
here. Impeccable builds are per harness, and two are already committed: `.claude/skills/impeccable/`
for Claude Code and `.github/skills/impeccable/` (plus the `postToolUse` hook in
`.github/hooks/impeccable.json`) for the others that read `.github/`.

- **Try the committed build first.** If your harness reads one of those two paths, the skill already
  works — invoke `/impeccable <command>`. Confirm with
  `node .claude/skills/impeccable/scripts/detect.mjs <file>`, which prints a findings count.
- **Never install or update as part of another task.** Both commands rewrite the ~250 committed
  files under `.claude/skills/` and `.github/skills/`, which would bury your actual change. If your
  harness has no build here, say so and carry on without Impeccable — do not install to fix it.
- **Installing and updating is deliberate maintenance**, run by a human or on explicit request, from
  the repository root, then reload the agent. Needs Node 22.12+. Review `git status` afterwards and
  commit the result on its own as `[ci]`.

  ```sh
  npx impeccable install     # adds the build for a harness we do not carry yet
  npx impeccable update      # refreshes the committed builds
  ```
- **Codex needs its own selected install target.** If `/impeccable` is missing in Codex even though
  the Claude/GitHub builds exist, run `npx impeccable install`, choose `Customize`, select
  `Codex CLI (.agents/skills)`, then choose `Global (~)` unless you intentionally want a
  project-local Codex build. Reload Codex afterwards. The installer writes the Codex skill under
  `~/.agents/skills/impeccable/` and may write a project hook manifest at `.codex/hooks.json`.
  Open `/hooks` in Codex and approve the Impeccable hook if prompted.
- **Turn the detector hook on per clone** with `/impeccable hooks on`. It is configured in
  `.claude/settings.local.json`, which is machine-local and never cloned.
- **Local state regenerates.** `.impeccable/` is ignored, so a fresh clone has no live config and no
  design sidecar. `/impeccable live` writes its own config on first run; `/impeccable document`
  rebuilds the sidecar from the committed `DESIGN.md`.
- **Live mode needs a server.** Start Django first, then `/impeccable live`; it attaches to the page
  the browser actually loads.

### Rules

Impeccable is a local QA aid only:

- Do not commit Impeccable live-injection snippets, including markers like
  `impeccable-live-start`, `impeccable-live-end`, or localhost `live.js` scripts.
- Do not create shared Django templates or partials solely to load Impeccable. The tool may change,
  so live wiring must remain local and temporary.
- Before committing template or UI work, check that no tracked file contains Impeccable live
  markers:

  ```sh
  rg "impeccable-live|localhost:8400/live.js" . --glob '!AGENTS.md'
  ```

- If a template such as `src/templates/base.html` was modified only to support local Impeccable
  preview, revert or remove that local-only change before staging commits.

## Documentation

See
[Code, commits and documentation standards](./docs/contributing.md#code-commits-and-documentation-standards)
in `docs/contributing.md`.

- Documentation follows the [Diátaxis framework](https://diataxis.fr/). Place a new page in
  `docs/tutorials/`, `docs/how-to-guides/`, `docs/reference/`, or `docs/explanations/` according to
  what it is, and do not mix the four kinds within one page.
- Code changes that make the documentation wrong or incomplete must update it in the same change.
- Run `make spelling`, `make linkcheck`, and `make woke` from `docs/` before handing work over.
