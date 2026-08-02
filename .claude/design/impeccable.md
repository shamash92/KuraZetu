# Impeccable UI QA

Impeccable is a local QA aid for visible UI: Django templates, landing pages,
React, any `*.tsx`. Use it to inspect a change before handing off, when it is
available. Upstream docs: <https://impeccable.style/docs/>. Prefer them over
anything restated here.

Impeccable is **not vendored here**. A fresh clone has no skill tree and no
`/impeccable` command. Each developer installs it into their own harness.

## Why

Provider builds are generated, several MB each, and mostly JavaScript. Two of
them were committed (`.claude/skills/` and `.github/skills/`, 247 files) and
made GitHub report this repository as 66% JavaScript against 133 KB of real
JavaScript. Upstream's recommended path is the installer, not vendoring.

## Rules for agents

- **Never run `npx impeccable install` or `update` as part of another task.**
  It is deliberate maintenance, run by a human or on explicit request.
- **If `/impeccable` is missing, say so and continue without it.** Do not
  install to fix it mid-task.
- **Never commit a skill tree.** If `git status` shows files under
  `.claude/skills/`, `.github/skills/`, `.agents/skills/`, or another provider
  directory, a project-scoped install leaked. Delete them; do not commit. These
  paths are gitignored, so seeing them tracked means someone forced them in.
- **Never commit a hook manifest pointing at a path this repository lacks.**
  Hooks resolve against the developer's own install.
- **Never commit live-injection wiring.** Markers like `impeccable-live-start`,
  `impeccable-live-end`, or a localhost `live.js` script are local and
  temporary. Before staging template or UI work, check no tracked file carries
  them:

  ```sh
  rg "impeccable-live|localhost:8400/live.js" . --glob '!.claude/design/impeccable.md'
  ```

- **Never add a shared Django template or partial solely to load Impeccable.**
  The tool may change; live wiring stays local. If `src/templates/base.html` or
  similar was edited only for local preview, revert it before staging.

## Using it

- Confirm a working install with `/impeccable <command>`, or run
  `npx impeccable detect <file>`, which prints a findings count without a
  harness.
- Turn the detector hook on per clone with `/impeccable hooks on`. It lives in
  `.claude/settings.local.json`, machine-local and never cloned.
- Live mode needs a server. Start Django first, then `/impeccable live`; it
  attaches to the page the browser actually loads.
- Local state regenerates. `.impeccable/` is gitignored, so a fresh clone has
  no live config and no design sidecar. `/impeccable live` writes its config on
  first run; `/impeccable document` rebuilds the sidecar from `DESIGN.md`.

## Setup (human, once)

```sh
npx impeccable install     # pick your harness, then Global (~) scope
npx impeccable check       # reports whether the install is behind
npx impeccable update      # refresh when wanted
```

Choose `Global (~)`. A project scope writes the full provider build back into
this repository, which is exactly what was removed. Codex needs `Customize` ->
`Codex CLI (.agents/skills)` -> `Global (~)`, then `/hooks` to approve its
project hook manifest (`.codex/hooks.json`, gitignored).

Runtime state under `.impeccable/` is gitignored and regenerates. Do not use
ignore rules to hide a partial install — an incomplete tree means a broken
detector hook.

If the team ever needs a pinned, repository-managed version, use upstream's
Git submodule + `npx impeccable link` workflow rather than copying trees.

## References

- [CLI installer](https://github.com/pbakaus/impeccable#option-1-cli-installer-recommended)
- [Git submodule option](https://github.com/pbakaus/impeccable#option-2-git-submodule)
- [Design hooks](https://github.com/pbakaus/impeccable#design-hook)
- [Doctor: version and hook-path drift](https://impeccable.style/docs/doctor/)
