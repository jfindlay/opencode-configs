# Test Style: Rust

Loaded on demand by T0/T1 agents before writing, modifying, or reviewing Rust test code. All
conventions in `STYLE-CODE-RUST.md` apply to test code as well — this file adds to them, never
relaxes them. A canonical worked example is the `jfindlay/rust-template` repository (consult
locally or via GitHub if available; no local path is assumed).

## Mechanical rules

- **Unit tests live in a `#[cfg(test)] mod tests` block next to the code they test** (idiomatic
  Rust placement — the analogue of pytest's `tests/unit/` mirroring). `use super::*;` to reach the
  unit under test.
- **Integration tests live in `tests/`** (e.g. `tests/integration.rs`); they link only the public
  crate API and exercise the built binary via `env!("CARGO_BIN_EXE_<name>")`. This is the
  external-boundary tier (the `tests/integration/` analogue).
- **Table-driven cases** via arrays of structs / tuples iterated in the test, or via a parametrise
  helper crate only if one is already a project dependency. Prefer plain arrays to pulling in macro
  crates for trivial tables.
- **Coverage** is measured with `cargo llvm-cov` and gated (`--fail-under-lines`). The reference
  template enforces 100% line coverage. Do not write contorted tests or coverage hacks to hit a
  number — honesty over the number (see the Go guide's coverage-divergence note for the principle).
- **Assertions**: `assert_eq!` / `assert!` / `matches!`. Use `matches!(result, Err(E::Variant))`
  for error-variant assertions rather than unwrapping and string-matching.

## Test philosophy

Same three-step pattern (setup → run → assert) and relentless-focus / minimal-duplication
discipline as `STYLE-TEST-PYTHON.md` §"Test philosophy". Unit tests pin inner contracts (function
signatures, public API); integration tests pin the external CLI/library contract.

TODO:
- When a separate `tests/` file earns its keep vs. an inline `#[cfg(test)]` module.
- Fixtures-equivalent guidance (Rust has no pytest fixtures; helper functions + builder patterns).

## Structuring principles

TODO.

## Audit invocation

`/style-audit-test` audits a Rust test target against this document (with `STYLE-CODE-RUST.md` as
the inherited base) when the target language resolves to Rust.
