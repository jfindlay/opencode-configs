# Code Style: Go

Loaded on demand by T0/T1 agents before writing, modifying, or reviewing Go code. Sibling of
`STYLE-CODE-PYTHON.md` and `STYLE-CODE-RUST.md`. A canonical worked example is the
`jfindlay/go-template` repository (consult locally or via GitHub if available; no local path is
assumed).

## Mechanical rules

- **`gofmt -s` owns all layout and is non-negotiable.** Go deliberately has no line-length setting;
  do NOT impose the Python/Rust 100-char wrap on Go source. (Markdown and comment prose may still
  wrap at 100.) This is the one deliberate divergence from the sibling guides — see
  `STYLE-DOC.md`'s Go note.
- **`go vet` + `staticcheck`** are the lint gate. `staticcheck` is the standard external linter;
  treat its findings as errors in CI.
- **Doc comments** on every exported identifier, beginning with the identifier's name
  (`// Greeter is ...`), per Go convention. Package doc comment on one file per package.
- **`govulncheck`** is the supply-chain audit; it reports only vulnerabilities reachable from the
  programme. Keep the dependency graph minimal so the audit stays meaningful.

## Preferences

- **Stdlib-first, minimal dependency graph.** Go's stdlib covers CLI parsing (`flag`), structured
  logging (`log/slog`), and error wrapping (`errors`/`fmt`) — the affordances Python/Rust reach for
  third-party libs to provide. Reach outside the stdlib only when it earns its place (the reference
  template keeps exactly one: `fatih/color` for terminal styling). Keeping one real dependency
  rather than zero gives `govulncheck`/`go.sum` a non-trivial graph to audit.
- **Validating constructor is the data-contract boundary** — the Pydantic / `Greeter::new`
  analogue: `NewGreeter(...) (Greeter, error)`. Construct externally-sourced data through it; keep
  business logic out. Struct tags (`json:"..."`) so the type round-trips through `encoding/json`.
- **Errors: sentinel + `%w` wrapping.** Libraries return sentinel errors
  (`var ErrEmptyName = errors.New(...)`) and wrap I/O failures with `fmt.Errorf("...: %w", err)`.
  Callers use `errors.Is` / `errors.As`. **No panics in library code.**
- **`log/slog`** for structured logging; configure once at the binary entry point, never
  reconfigure in library code.
- Thin `main`: keep `main()` a shell that delegates to a testable `run(args, ...) int` so logic is
  unit-testable and `main` only wires `os.Args` / `os.Exit`.

### Structuring: interfaces, packages, the cmd/ layout

TODO.

## Structuring principles

### Function structuring principles

Apply the same level/concern-separation, plurality, side-effect-isolation, and size heuristics as
`STYLE-CODE-PYTHON.md`. Go's explicit error returns lengthen functions slightly; judge size at
gofmt's layout, not a fixed wrap.

### Package structuring principles

TODO.

## Test philosophy

See `STYLE-TEST-GO.md`.

## Audit invocation

`/style-audit-code` audits a Go target against this document when the target language resolves to
Go.
