---
inspiration:
  name: Kody
  author: Kent C. Dodds
  repository: https://github.com/kentcdodds/kody
  source: https://github.com/kentcdodds/kody/blob/main/docs/contributing/testing-principles.md
---

# Testing principles

[What to test and what to keep](#what-to-test-and-what-to-keep) applies to all
code in the repository: Django, `src/ui/`, `NATIVE/`, and scripts. The sections
after it apply to tests for hand-written code in `src/ui/` and `NATIVE/`.

These principles govern new and substantively edited tests; do not reorganize an
unrelated existing suite solely to match this document.

## What to test and what to keep

Code in this project is refactored, replaced with libraries, and rewritten
often. A test that pins how something is implemented must be rewritten with it.
A test that pins what the user experiences survives the change and proves the
new code still works. Write the second kind.

- Prioritize behavioral and integration tests that follow how a person uses the
  app over tests of isolated implementation details.

  For example, for a web or mobile sign-in that needs an OTP, test the journey:
  enter a phone number, submit the code, end up signed in. Do not test in
  isolation whether the form formats the number or escapes its input.
- Test helpers through the workflow that uses them, so the test keeps covering
  the behavior when the helper is replaced.

  For example, if a function converts international phone numbers to the Kenyan
  format, assert the reformatted number in the field where a user typed it, not
  the function's return value. When the function is later swapped for a
  library, that test still passes and needs no edit.
- Not every change needs a new committed test. Add one when a change adds or
  alters functionality from a UI or user-flow perspective, and make it an
  integration test of that flow.
- Add a small unit test only in the few cases where the logic is important
  enough to justify its maintenance cost on its own.

### Verifying your own work

- Use unit tests for your own verification. Write and run them locally while
  you work; you do not need to commit them.
- When a change touches something sensitive, rerun the existing behavioral and
  integration tests that cover the area you changed, so the UI does not break
  and the web app, mobile app, backend, or script still produces the outcomes it
  is supposed to.
- Agents often create many regression tests and other tests to verify their
  work. These are valuable at the time but often should not be kept long-term.
  Before handing work over, check every test you added or changed against this
  document and make sure it is high signal. Edit, combine, or delete any that
  are not, so the project does not carry the weight of tests that provide
  minimal value.

Favor small, readable suites with explicit setup and minimal magic. A test may
be longer and contain several assertions when they describe one meaningful
user workflow.

## Current test tools

| Scope | Tooling | Command |
| --- | --- | --- |
| `src/` (Django) | pytest with `pytest-django` | `cd src && py.test --ds=CommunityTally.settings.local_testing --nomigrations` |
| `src/ui/` | Jest, jsdom, React Testing Library, and `user-event` | `cd src/ui && pnpm test` |
| `NATIVE/tests/form34a/` | Node's built-in test runner for isolated logic | `cd NATIVE && yarn test:form34a` |

`NATIVE/` does not currently have a React Native component-test harness. Do not
claim that component tests ran, or add a runner as a side effect of unrelated
work. Establish Expo-compatible component tooling as its own deliberate
change when a feature needs it.

## Choose the right test

- For web components and hooks, use Jest and Testing Library to drive the
  rendered interface the way a user would.
- Keep end-to-end coverage for a small number of user-critical journeys. Do not
  introduce a new end-to-end framework as part of an unrelated feature.
- Prefer local fakes and fixtures over the public internet or third-party
  services so tests can run offline.

## Principles

- Treat a test like a manual tester's script: perform one explicit setup, then
  the actions and assertions needed to validate the workflow.
- Prefer fewer, longer tests when assertions belong to the same workflow. Do
  not split a flow merely to enforce one assertion per test.
- Prefer flat files with top-level `test(...)` calls over nested `describe`
  blocks.
- Prefer setup inside each test over `beforeEach` and `afterEach` hooks.
  Shared hooks are acceptable when real cleanup or clearer repetition makes
  them the more readable choice.
- Avoid mutable state shared between tests. If later assertions depend on the
  same render, request, or response, keep them in the same test.
- Build helpers that return ready-to-use objects instead of relying on globals.
- Name tests after observable behavior, such as "county selection advances to
  the constituency step".
- Interact with the interface as a user would. Prefer accessible roles, labels,
  visible names, and `user-event` over implementation details or direct event
  dispatch.
- Assert user-visible outcomes and stable public contracts. Avoid pinning
  incidental markup, component state, long prose, or configuration strings.
- Assert meaningful intermediate states inside the workflow that causes them
  instead of creating isolated tests for incidental transitions.
- Do not test guarantees already enforced by TypeScript.
- Add regression coverage when the failure is likely to recur or the affected
  workflow is important enough to justify its maintenance cost.
- Keep slower end-to-end suites deliberately small.
- Keep test output free of stray logging. Do not silence warnings or errors
  without asserting or narrowly accounting for the expected output.

These are strong defaults, not absolute bans. Depart when the exception makes
the test materially clearer or handles real cleanup, but keep the setup and
behavior visible to the reader.
