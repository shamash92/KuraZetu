# JavaScript and TypeScript code style

Apply these rules to new or substantively edited hand-written JavaScript and
TypeScript in `src/ui/` and `NATIVE/`. They do not apply to Django/Python,
generated output, dependencies, or native Android and iOS source.

Do not mechanically rewrite nearby code just to make it comply. Match the
existing file where changing style would create an unrelated diff, then run the
formatter and linter configured for that project.

## Function forms

- Prefer function declarations for named, reusable functions and React
  components.
- Use arrow functions for callbacks and inline handlers.
- Use object method shorthand for multi-line object methods.

## Array types

- Prefer `Array<T>` and `ReadonlyArray<T>` over `T[]`.
- The generic form avoids precedence ambiguity in unions and keeps mutable and
  readonly collections visually consistent.

## Exports

- Prefer named exports.
- Use default exports when a framework contract requires them, including Expo
  Router route modules.
- Preserve the surrounding module's public API when changing an export would
  create unrelated caller changes.

## Imports

- Prefer the configured `@/...` alias over parent-relative `../...` paths.
- Keep `./...` imports for files in the same folder.
- Do not edit generated files to enforce import style.

## Type conventions

- Prefer `type` aliases for object shapes and unions.
- Use `interface` when declaration merging or a public extension point is
  required.
- Prefer inline parameter types when a shape is used once. Name a type when it
  improves readability or is shared.
- Use `satisfies` for exported objects that must conform to a framework or
  library contract without widening their inferred type.

## Absence values

- Use `null` for an explicit "no value" in local state or an API response.
- Use `undefined` for optional or omitted fields.
- Do not mix `null` and `undefined` for the same meaning within one API.

## References

Adapted for KuraZetu from Kody's
[code style](https://github.com/kentcdodds/kody/blob/main/docs/contributing/code-style.md).
