# Test Style: Go

Loaded on demand before writing, modifying, or reviewing Go test code. All conventions in
`STYLE-CODE-GO.md` apply to tests as well. A canonical worked example is the
`jfindlay/go-template` repository (consult locally or via GitHub if available; no local path is
assumed).

## Mechanical rules

- **Table-driven tests** are the default: a slice of case structs with a `name`, iterated under
  `t.Run(tc.name, ...)`. This is the idiomatic Go analogue of `@pytest.mark.parametrize`.
- **Unit tests live in `_test.go` files next to the code** they test (the analogue of Rust's
  `#[cfg(test)] mod tests`).
- **Integration tests** build the binary once in `TestMain` (`go build -o ...`) and run it as a
  subprocess (the analogue of Rust's `CARGO_BIN_EXE_`). Use `t.TempDir()` for filesystem
  isolation; it auto-cleans.
- **Coverage** via `go test -coverprofile`, gated in the Makefile. **The Go threshold legitimately
  differs from Python/Rust's 100%**: lines executed only inside the subprocess spawned by an
  integration test are NOT credited to the parent profile, so `main`'s lines are uncoverable by the
  parent run. Set the threshold to the highest honestly-achievable integer (the reference uses 90,
  library coverage 94.7%) and document the divergence in `docs/NOTES.md`. Do NOT fake tests to hit
  100%.
- **Assertions** are hand-written (`if got != want { t.Errorf(...) }`); Go has no assert library by
  convention. Use `t.Fatalf` for setup failures, `t.Errorf` for assertion failures.
- Name helpers to avoid shadowing package-level identifiers in the same `package main` test file
  (e.g. `runBin`, not `run`, when `main.go` defines `run`).

## Test philosophy

Same setup → run → assert, relentless-focus, minimal-duplication discipline as
`STYLE-TEST-PYTHON.md`. Unit tests pin inner contracts; subprocess integration tests pin the CLI
contract.

TODO:
- When a `helper_test.go` / `testdata/` fixture earns its keep.
- Golden-file testing guidance.

## Structuring principles

TODO.

## Audit invocation

`/style-audit-test` audits a Go test target against this document (with `STYLE-CODE-GO.md` as the
inherited base) when the target language resolves to Go.
