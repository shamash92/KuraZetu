# Agent Instructions

## Local Overrides

If `local.AGENTS.md` exists, read it after this file and follow it for
machine-local or user-private preferences. Do not commit `local.AGENTS.md`.

- AGENTS.md takes preference over local.AGENTS.md, in the event there is a contradicting instruction.

## Project instructions
We have a few agent instructions living in various CLAUDE.md files in the project. These are for specific agents and are not shared with all agents. Please read and follow them as appropriate.

- For any android/ios related wotk, use the NATIVE/CLAUDE.md file for instructions.
- For any frontend/web-ui related work, use the src/ui/CLAUDE.md file for instructions.
- For any backend related work, use the src/CLAUDE.md file for instructions.

## Git

Our git rules live in [CONTRIBUTING.md](./CONTRIBUTING.md). Read the relevant section before
committing, branching, or opening a PR — do not rely on your own defaults. Rules are referenced by
ID (`MSG5`, `GIT8`, `PR2`), so cite the ID when you explain a choice.

- **Commit messages** — [Commit messages (MSG)](./CONTRIBUTING.md#commit-messages-msg). Every
  subject line starts with a bracketed lower-case category and is capitalized after it, 50
  characters or fewer, imperative mood, no trailing period (`MSG1`–`MSG7`). Pick the category from
  the table in [Categories](./CONTRIBUTING.md#categories) based on the area you touched. Bodies are
  wrapped at 72 characters and explain what and why, not how (`MSG12`, `MSG13`); omit the body when
  the subject says it all (`MSG15`).
- **Counting characters** — you cannot count characters reliably, so do not try. Run
  `git-hooks/commit-msg.py` against your draft and fix what it reports before committing; see
  [Checking a message](./CONTRIBUTING.md#checking-a-message). Never claim a subject fits in 50
  characters without having run it. CI runs the same script with `--strict` over every non-merge
  commit in a PR, so a message that fails locally will fail the PR.
- **Splitting work** — a message of the form "do this and that" means it should have been two
  commits (`MSG3`, `GIT2`). Keep commits atomic (`GIT1`).
- **Branches and history** — [Versioning (GIT)](./CONTRIBUTING.md#versioning-git). Branch names are
  kebab-case (`GIT8`). Rebase rather than merging the target branch back in (`GIT6`). Do not squash
  (`GIT4`) and do not introduce whitespace errors (`GIT9`).
- **Pull requests** — [Pull requests (PR)](./CONTRIBUTING.md#pull-requests-pr). Target `main`, keep
  PRs small and single-issue, include a description, and test and review the diff before handing it
  over (`PR1`, `PR2`, `PR10`–`PR12`).
- **Workflow around the code** — issues before PRs, tests, and the pre-commit hooks are in
  [docs/contributing.md](./docs/contributing.md). Commit from the terminal so hook output is
  visible.

Do not advertise agent tooling in commit messages or PR bodies: no `Co-Authored-By` lines for
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

Impeccable is a local QA aid only:

- Do not commit `.impeccable/`; it is local tool state and should stay ignored.
- Do not commit Impeccable live-injection snippets, including markers like
  `impeccable-live-start`, `impeccable-live-end`, or localhost `live.js` scripts.
- Do not create shared Django templates or partials solely to load Impeccable. The tool may change,
  so live wiring must remain local and temporary.
- Before committing template or UI work, check that no tracked file contains Impeccable live
  markers:

  ```sh
  rg "impeccable-live|localhost:8400/live.js" . --glob '!AGENTS.md'
  ```

If a template such as `src/templates/base.html` was modified only to support local Impeccable
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
