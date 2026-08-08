# React and React Native testing principles

Apply these principles to tests for hand-written code in `src/ui/` and
`NATIVE/`. They govern new and substantively edited tests; do not reorganize an
unrelated existing suite solely to match this document.

Favor small, readable suites with explicit setup and minimal magic. A test may
be longer and contain several assertions when they describe one meaningful
user workflow.

## Current test tools

| Scope | Tooling | Command |
| --- | --- | --- |
| `src/ui/` | Jest, jsdom, React Testing Library, and `user-event` | `cd src/ui && pnpm test` |
| `NATIVE/tests/form34a/` | Node's built-in test runner for isolated logic | `cd NATIVE && pnpm test:form34a` |

`NATIVE/` does not currently have a React Native component-test harness. Do not
claim that component tests ran, or add a runner as a side effect of unrelated
work. Establish Expo-compatible component tooling as its own deliberate
change when a feature needs it.

## Choose the lightest useful test

- Test pure functions and state transitions without rendering when rendering
  adds no confidence.
- For web components and hooks, use Jest and Testing Library when behavior
  depends on the rendered interface or user interaction.
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
- Keep slower integration and end-to-end suites deliberately small.
- Keep test output free of stray logging. Do not silence warnings or errors
  without asserting or narrowly accounting for the expected output.

These are strong defaults, not absolute bans. Depart when the exception makes
the test materially clearer or handles real cleanup, but keep the setup and
behavior visible to the reader.

## Reference

Adapted for KuraZetu from Kody's
[testing principles](https://github.com/kentcdodds/kody/blob/main/docs/contributing/testing-principles.md).
