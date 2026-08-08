# Django backend instructions

These instructions apply to Django and Python work under `src/`, excluding the
React application in `src/ui/`.

## Read first

- Repository-wide agent rules: [`../AGENTS.md`](../AGENTS.md)
- Backend setup: [`../docs/tutorials/setup.md`](../docs/tutorials/setup.md)
- Contribution standards: [`../docs/contributing.md`](../docs/contributing.md)

## Working rules

- Run Django commands from `src/` with the documented virtual environment
  active.
- Keep schema migrations, tests, and documentation in the same change as the
  backend behavior that requires them.
- Changes under `src/ui/` follow [`ui/CLAUDE.md`](ui/CLAUDE.md), not this file.
- Visible Django template changes also require the repository's
  [Impeccable UI QA guidance](../.claude/design/impeccable.md).
