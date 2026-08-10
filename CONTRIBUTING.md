# Contributing to KuraZetu

This file covers how we use git: commit messages, history, and pull requests. Each rule has an ID
(`MSG3`, `GIT6`, `PR2`) so it can be referenced in reviews and in agent instructions.

For the contribution workflow itself — anonymity and safety, issues before PRs, testing and
documentation standards, pre-commit hooks — see [docs/contributing.md](./docs/contributing.md).

## Commit messages (MSG)

Guidelines for writing commit messages for non-merge commits. They are inspired by
[this](https://cbea.ms/git-commit/)
[and](https://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html)
[other](https://preslav.me/2015/02/21/what-s-with-the-50-72-rule/)
[posts](https://stackoverflow.com/questions/2290016/git-commit-messages-50-72-formatting).
The category prefix is the main originality.

- **MSG1.** Begin with a subject line.
- **MSG2.** Start the subject line with a lower-case, single-word category, within square brackets
  (hyphenated, composite words are acceptable).
- **MSG3.** If you find yourself wanting multiple categories, consider splitting commits. Otherwise,
  try to find a generic unifying category, or choose the most relevant.
- **MSG4.** Leave a single space after the category and capitalize the first ensuing word.
- **MSG5.** Limit the subject line to 50 characters (category included).
- **MSG6.** Do not end the subject line with a period.
- **MSG7.** Use the imperative mood in the subject line (e.g. "Fix bug" rather than "Fixed bug" or
  "Fixes bug").
- **MSG8.** If adding a body, separate it from the subject with a blank line.
- **MSG9.** Use multiple paragraphs in the body if needed. Separate them with a blank line.
- **MSG10.** Do not include more than 1 consecutive blank line, except in quoted text.
- **MSG11.** Use punctuation normally in the body.
- **MSG12.** Wrap the body at 72 characters, except on lines consisting only of blockquotes,
  references, sign-offs, and co-authors.
- **MSG13.** Use the body to explain *what* and *why*, rather than *how*.
- **MSG14.** Be descriptive but succinct and avoid filler text.
- **MSG15.** Omit the body if the subject is self-explanatory.
- **MSG16.** Common abbreviations are fine (e.g. "msg" or "var").

### Categories

Categories follow the area of the repository you touched:

| Category | Area |
| --- | --- |
| `[native]` | The Expo/React Native app in `NATIVE/` |
| `[ios]`, `[android]` | Platform-specific native work |
| `[django]` | The backend in `src/` |
| `[ui]` | The web frontend in `src/ui/` |
| `[docs]` | Documentation in `docs/` |
| `[ci]` | Workflows and automation |
| `[test]` | Tests |
| `[bug]` | Fixes that do not sit cleanly in one area |
| `[format]` | Formatting-only changes |

### Examples

Subject line only:

```
[ui] Fix button alignment in navigation bar
```

With a body:

```
[django] Avoid evaluating function input

Avoid calling `eval` with function arguments, to reduce the chance for
code injection (now or in the future).
```

### Checking a message

Do not eyeball the character limits — count them with
[`.github/scripts/commit-msg.py`](.github/scripts/commit-msg.py). It checks `MSG1`, `MSG2`, `MSG4`,
`MSG5`, `MSG6`, `MSG8`, `MSG10`, and `MSG12`, printing `OK` or one line per violation, and exits
non-zero when anything fails. Contributors and agents alike are expected to run it before
committing.

```bash
# a message you are drafting
.github/scripts/commit-msg.py commit-msg.txt

# the commit you just made
git log -1 --pretty=%B | .github/scripts/commit-msg.py -

# the message being written, from a commit-msg hook
.github/scripts/commit-msg.py "$1"
```

Example output:

```
MSG5  subject is 59 chars (max 50): [ui] Fix the alignment of the primary button in the navbar.
MSG6  subject must not end with a period
```

`fixup!` and `squash!` subjects pass by default, since you will rebase them away before review.
Pass `--strict` to reject them — this is what CI does, so those commits must not survive into a
PR. The same script runs in
[`.github/workflows/verify-commits.yml`](./.github/workflows/verify-commits.yml) against every
non-merge commit in a pull request, so local checks and CI cannot drift apart.

The remaining rules still need human judgement. The checker validates the *shape* of the category
but not the *choice* of it, and says nothing about splitting commits (`MSG3`), imperative mood
(`MSG7`), or whether the body explains what and why (`MSG13`).

## Versioning (GIT)

- **GIT1.** Strive for atomic commits. A commit should introduce a coherent change that appears as a
  unit in a low level of abstraction.
- **GIT2.** As a rule of thumb, commit messages of the form "do this and that" are an indication that
  there should be two commits instead.
- **GIT3.** Strive to preserve a clean but detailed git history.
- **GIT4.** Avoid squashing.
- **GIT5.** Prefer additional commits during review (easier for reviewers to see the diff).
- **GIT6.** Avoid merging the target branch back into the topic branch. Rebase instead.
- **GIT7.** Contributors are encouraged to
  [sign their commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/signing-commits),
  while maintainers are required to do so.
- **GIT8.** Use kebab-case branch names (i.e. lower-case-words-separated-with-hyphens).
- **GIT9.** Do not introduce whitespace errors.

## Branching (BR)

The branching model — which branch to cut from, how releases and tags work, and how to decide
between a single PR, stacked PRs, and a `feature/*` branch — lives in
[.claude/git/branching-model.md](.claude/git/branching-model.md) as rules `BR0`–`BR11`. It is
authoritative for branching and PR sizing, and will be folded into this file once signed off.

Read it before cutting a branch or splitting work into PRs. In short: `main` is the trunk and the
target of every normal PR; branches are named `category/kebab-name` using the same categories as
commit messages; releases are `release/YYYY.MM` branches tagged `vYYYY.MM.N`.

## Pull requests (PR)

Guidelines for how we use and handle pull requests.

- **PR1.** Concrete modifications of KuraZetu are proposed via
  [Pull Requests](https://docs.github.com/en/pull-requests/reference/pull-requests)
  (AKA PRs) targeting the `main` branch.
- **PR2.** Prefer small, single-issue PRs.
- **PR3.** A PR should introduce a coherent change that appears as a unit in a medium or high level
  of abstraction.
- **PR4.** The `main` branch is modified exclusively via PRs, except for an empty commit after
  branching for release.
- **PR5.** PRs accepted into `main` are merged with merge commits.
- **PR6.** PRs to `main` should typically be covered by automated tests.
- **PR7.** If a PR is valuable on its own, does not depend on others, and does not involve dead code,
  target the `main` branch, even if it is part of a larger task. This should be the most common
  case.
- **PR8.** If your PR relies on another one, target the other's branch.
- **PR9.** When PRs are stacked, prefer to merge them in order. The target branch will update
  automatically upon merging.
- **PR10.** PRs should include descriptions and/or point to appropriate context (within reason).
- **PR11.** When authoring a PR, make sure to test it.
- **PR12.** When authoring a PR, make sure to review its diff.
