---
name: style
description: Code, test, and documentation style guides (Python, Rust, Go) and the style-audit procedure. Load before writing, modifying, or reviewing any code; before writing or modifying any test code; before writing, editing, auditing, or restructuring any documentation; and for /style/audit. T0/T1 agents only.
---

# Style

Index for the style guides. Loading this skill does not switch agents or grant permissions; the
session's own edit and shell permissions still apply. A missing or denied required resource is a
blocker: report it, do not work from memory.

Resource paths below resolve from this skill's base directory (the directory holding this file;
`~/.config/opencode/skills/style/`), never from the target project's working directory. Read them
with the Read tool. A command expands its input in its own body and passes it explicitly; resources
consume that input and are not command templates, so they never interpolate placeholders.

Load liberally: when a trigger is ambiguous, load the resource. Load only the language guides that
apply; when the target language is ambiguous (mixed repo, polyglot file), load every applicable
guide.

## Resources

| Resource (`references/`) | Owns | Load when |
|---|---|---|
| `code.md` | language-agnostic code rules (configuration precedence) | any code work, alongside the language guide |
| `code-python.md` | Python mechanical rules and structuring principles | writing, modifying, or reviewing Python |
| `code-rust.md` | Rust mechanical rules and structuring principles | writing, modifying, or reviewing Rust |
| `code-go.md` | Go mechanical rules and structuring principles | writing, modifying, or reviewing Go |
| `test-python.md` | Python test conventions, layered on `code-python.md` | writing, modifying, or reviewing Python tests |
| `test-rust.md` | Rust test conventions, layered on `code-rust.md` | writing, modifying, or reviewing Rust tests |
| `test-go.md` | Go test conventions, layered on `code-go.md` | writing, modifying, or reviewing Go tests |
| `doc.md` | documentation registers (inline, human, agent), reference direction, audit checklist | writing, editing, auditing, or restructuring any documentation |
| `audit.md` | `/style/audit` procedure and per-surface worker template | `/style/audit` |

The language-agnostic register rules live in `doc.md` and the project instructions' `## Code
conventions` section.

## Required loading by path

- **Code:** `code.md` and the matching `code-<lang>.md`.
- **Tests:** the matching `test-<lang>.md` and its inherited `code-<lang>.md` (plus `code.md`).
- **Documentation:** `doc.md`.
- **Audit:** `audit.md`; the audit's per-surface workers load the references that file names.
- **Mechanical agents (T2/T3)** load nothing from this skill.
