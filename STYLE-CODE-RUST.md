# Code Style: Rust

Loaded on demand by T0/T1 agents before writing, modifying, or reviewing Rust code. Sibling of
`STYLE-CODE-PYTHON.md` (Python) and `STYLE-CODE-GO.md` (Go); the language-agnostic register rules
live in `STYLE-DOC.md` and the AGENTS.md `## Code conventions` section. A canonical worked example
of these conventions is the `jfindlay/rust-template` repository; consult it if available locally or
via its GitHub page. Do not assume any particular local path — its presence on a given system is
incidental, not a dependency of this guide.

## Mechanical rules

- `rustfmt` owns layout. The one non-default setting is `max_width = 100` (mirrors the Python
  100-char wrap); everything else is rustfmt canonical and kept implicit per Rust convention. Never
  hand-format against rustfmt.
- `clippy` is the lint gate, wired in `Cargo.toml` `[lints.clippy]`: `all` denied, `pedantic`
  warned. CI runs `cargo clippy --all-targets -- -D warnings`. Do not `#[allow(...)]` without a
  short `// why` comment justifying the exception.
- `[lints.rust]`: `unsafe_code = "forbid"`, `missing_docs = "warn"`. The `[lints]` table (Rust
  1.74+) is the idiomatic location — it replaces scattering `#![deny(...)]` across source files.
- Doc comments on all public items: `//!` for module/crate headers, `///` for items. Document every
  public function's error conditions in an `# Errors` section and any panics in `# Panics`. This is
  the rST-docstring analogue; rustdoc is the contract surface.
- `#[must_use]` on pure functions whose return value is the whole point (e.g. a formatter that has
  no useful side effect).

## Preferences

- **Validating constructors are the data-contract boundary** — the Pydantic `BaseModel` analogue.
  Construct externally-sourced data through a fallible constructor (`Greeter::new -> Result<Self,
  E>`) that enforces invariants; keep business logic out of the constructor. Derive
  `Serialize`/`Deserialize` on such types so they round-trip through external formats (the
  `BaseModel` role).
- **Error handling: `thiserror` in libraries, `anyhow` in binaries.** Library code returns typed
  enum errors (`#[derive(Error)]`) so callers can match; the binary's `main` uses `anyhow::Result`
  for ergonomic top-level propagation. Never panic in library code paths.
- Prefer `&Path`/`&str` parameters over owned `PathBuf`/`String` where ownership is not needed;
  take `impl Into<String>` at constructor boundaries for caller convenience.
- Prefer iterator combinators to manual loops when the combinator is clearer; do not force it.
- Prefer `match` exhaustiveness over `if let` chains when handling an enum.

### Structuring: traits, generics, modules

TODO.

### Derive macros and newtypes

TODO.

## Structuring principles

### Function structuring principles

Apply the same level/concern-separation, plurality, side-effect-isolation, and size heuristics as
`STYLE-CODE-PYTHON.md` §"Function structuring principles". Rust's expression orientation and `?`
operator tend to shorten functions; the ~60–90-line guidance still applies at 100-char width.

### Module / crate structuring principles

TODO.

## Test philosophy

See `STYLE-TEST-RUST.md`.

## Audit invocation

`/style-audit-code` audits a Rust target against this document when the target's language resolves
to Rust. Mechanical rules emit findings; structuring principles surface as observations.
