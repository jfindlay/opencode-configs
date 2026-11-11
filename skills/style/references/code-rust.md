# Code Style: Rust

Loaded on demand by T0/T1 agents before writing, modifying, or reviewing Rust code. Sibling of
`code-python.md` (Python) and `code-go.md` (Go); the language-agnostic register rules
live in `doc.md` and the AGENTS.md `## Code conventions` section. A canonical worked example
of these conventions is the `jfindlay/rust-template` repository; consult it if available locally or
via its GitHub page. Do not assume any particular local path — its presence on a given system is
incidental, not a dependency of this guide.

## Mechanical rules

- `rustfmt` owns layout. The one non-default setting is `max_width`, set to the `AGENTS.md`
  line width (the tool setting must carry the number; keep it in sync); everything else is rustfmt
  canonical and kept implicit per Rust convention. Never hand-format against rustfmt.
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

### Classifying rustdoc and comment edits (gate evidence)

A rustdoc or comment edit in a `.rs` file is **executable input, not prose**, until the diff proves
otherwise: `///`/`//!` code blocks compile and run as doctests, `missing_docs` and rustdoc lints
(broken intra-doc links) fail under `-D warnings` or `cargo doc`, `#[doc = include_str!(..)]` pulls
files into the build, and added or removed lines shift coverage line attribution. So after any such
edit — including boundary corrections and review fixes — re-run the unit gate and the coverage floor
on the new inputs; do not reuse earlier evidence. Only an edit that provably touches no compiled or
executed text (a Markdown file nothing includes, the ledger) takes the prose-only path. Uncertain
means code path. This is the Rust instance of the plan-run rule "Classifying inputs".

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
`code-python.md` §"Function structuring principles". Rust's expression orientation and `?`
operator tend to shorten functions; the ~60–90-line guidance still applies at the standard width.

### Module / crate structuring principles

TODO.

## Test philosophy

See `test-rust.md`.

## Audit invocation

`/style/audit <target>` forks a read-only `@explore` against the code surface using this document
as the reference. Mechanical rules emit findings; structuring principles surface as observations.
