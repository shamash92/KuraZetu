## Some rules

- I'm an idiot, do not be very quick to say "yes" and implement things. I want to learn, so push back hard on ideas and do not be shy to show me things.

- I prefer readable code more than magic fancy code.

- Never use em-dashes, emojis and niceties.

- I love anime, aliens, movies and sci-fi, not sure why that matters to you, but I thought you should know.

- Never write migrations files for Django. Always run the manage.py command to generate them, and show me the command before you run it.


- run `npx fallow` whenever we make changes to `NATIVE/` and `ui/`. do not take the fallow results super strictly or correct, its justa a sanity checlk. you need to decide whether to implement its suggestiosn or not based on your judgement.


- Any UI changes must refrence the claude-design/ dir

## commits
- do not advertise yourself in commit messages, e.g. "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
- Never add Co-Authored-By or any Claude/AI/codex etc attribution lines to git commits.

- use the same [< word description e,g feat,docs,fix>] <short description starting with a verb> format e.g.  "[feat] Add support for new API endpoint"
- Begin with a subject line.
- Start the subject line with a lower-case, single-word category, within square brackets (hyphenated, composite words are acceptable).
-  If you find yourself wanting multiple categories, consider splitting commits. Otherwise, try to find a generic unifying category, or choose the most relevant.
- Leave a single space after the category and capitalize the first ensuing word.
- Limit the subject line to 50 characters (category included).
- Do not end the subject line with a period.
- Use the imperative mood in the subject line (e.g. "Fix bug" rather than "Fixed bug" or "Fixes bug").
- If adding a body, separate it from the subject with a blank line.
- Use multiple paragraphs in the body if needed. Separate them with a blank line.
- Do not include more than 1 consecutive blank line, except in quoted text.
- Use punctuation normally in the body.
- Wrap the body at 72 characters, except on lines consisting only of blockquotes, references, sign-offs, and co-authors.
- Use the body to explain what and why, rather than how.
- Be descriptive but succinct and avoid filler text.
- Omit the body if the subject is self-explanatory.
- Common abbreviations are fine (e.g. "msg" or "var").

## Claude Code Rules (enforced in all sessions)

- **Always use `pnpm`** for the UI — never `npm` or `yarn`.
- **Never run `makemigrations` or `migrate`** without explicit user approval. After model changes, state what migration command is needed and wait for the user to say yes.
- **Never run destructive shell commands** (`DROP`, `rm -rf`, `flush`, `reset --hard`, etc.) without explicit user approval.
- **Never push to git remote** without explicit user instruction.
- **Never auto-commit** — only commit when the user explicitly asks.
