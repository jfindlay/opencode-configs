# Code Style: Python

Loaded on demand by T0/T1 agents before writing, modifying, or reviewing Python code. Carries both
the mechanical rules (what a perfect linter would catch) and the structuring principles (what
linters can't catch — the judgment layer).

This file is currently Python-focused. Future per-language sections (TypeScript, Go, Rust) may be
added as flat sections or split into siblings (`STYLE-CODE-TS.md`, etc.); the load-rule in
AGENTS.md will be updated accordingly.

## Mechanical rules

- PEP 8 except line wrap at 100 characters.
- Full mypy strict typing.
- Docstrings on all named scopes: packages, modules, classes, functions, in rST format — **no types
  in docstrings**, because the code is fully typed. Use `:param name:`, `:returns:`, `:raises:`,
  `:yields:`, `:ivar name:`, `:cvar name:`; never `:type name:`, `:rtype:`, `:vartype name:`.
- Document **every** parameter, return, raise, and yield of every public function, and **every
  instance and class attribute** of every public class (`:ivar:` for instance attributes, `:cvar:`
  for class-level attributes). **Applies to test code as well** — tests are not exempt.
- **Dataclass carve-out.** For pure data containers (`@dataclass`, `@dataclass(frozen=True)`,
  `NamedTuple`, `TypedDict`, Pydantic `BaseModel`) where the field annotations and names are
  self-documenting, a one-line class docstring is sufficient — `:ivar:` entries are not required.
  Add them only when a field's meaning or invariant is not obvious from its name and type.

## Preferences

- Always prefer `Path` from `pathlib`
- Always prefer `match`/`case` to `if`(/`elif`/...)/`else` when the conditionals are similar enough
- Always use an assignment expression `if (a := f()) is not None: print(a)`

### Decorators: when and how

TODO.

### Dataclasses, NamedTuples, TypedDicts, Enum

- Prefer `enum` to magic constants, even `Literal` types

### Pydantic models

- Always use a pydantic data model any time data is imported: from a file, from the user, from
  another process, even from distant parts of the same codebase, etc.  It formally validates the
  data contract at the level of detail known or suitable and separates validation from other
  business logic.

## Structuring principles

### Function structuring principles

When considering function scope, focus, and complexity (intricacy, fragility, importance):

1. **[level and concern separation]** Is the function's content all at the same level? Does it
   implement core business logic or supplemental logic? Does it mix high-level with low-level
   logic? Does it mix critical-path code with noncritical paths?
2. **[plurality]** Can loose-coupled or uncoupled units focusing on distinct concerns be identified
   within the function? If the function were split, would the focus of the split functions be worth
   the complexity of the cross calls, shared state, and data contracts between those functions? A
   function with a high ratio of input/output data-contract complexity to implementation complexity
   should probably be merged with one or more of its peers.
3. **[side effects]** IO to/from storage/network, other threads/processes, etc. should probably not
   be mixed with local logic.
4. **[function size]** If a function cannot naturally be split and it exceeds ~60–90 lines at
   100-character line length excluding inline documentation and comments, then it is intricate. If
   the codebase concern is lower-level, higher-performance, etc. **[codebase intensity]** then the
   reasonable size range could be higher and/or wider than ~60–90 lines. **[size range]** Given a
   typical project intensity, functions over 60 lines at 100 characters should be split unless
   doing so violates one of the above rules; some may go as long as 90 lines, after which the above
   rules apply more strictly.

### Class structuring principles

TODO.

### Module structuring principles

TODO.

### Package structuring principles

TODO.

## Test philosophy

See `STYLE-TEST.md`.

## Audit invocation

The `/style-audit-code` command audits a target file or module against the principles in this
document. Declarative checks (mechanical rules) emit findings; judgment-layer principles
(structuring) surface as observations for human review.
