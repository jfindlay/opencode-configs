---
name: code-lenses
description: Select and invoke code-reasoning lenses (structured static-analysis views of a codebase exposed as MCP tools) and reason about when a lens beats raw text and grep. Python lenses (semgrep, grimp, callgraph, coverage, test inventory, fixture graph, salt loader, lens_query) are a subcategory. Load when planning a code-analysis investigation, when choosing among AST, import-graph, call-graph, coverage, or test-analysis approaches, or when the user names a lens explicitly.
---

# Code lenses

A *lens* is a structured representation of a codebase that answers a specific class of questions
more cheaply or more correctly than raw text plus grep. Lenses are exposed by the
`composable-code-lenses` MCP server. This skill carries the judgment for when and how to reach for
them; the MCP carries the capability. Loading it does not switch agents or grant permissions; the
session's own tool permissions still apply. A missing or denied required resource is a blocker:
report it, do not work from memory.

Resource paths below resolve from this skill's base directory (the directory holding this file;
`~/.config/opencode/skills/code-lenses/`), never from the target project's working directory. Read
them with the Read tool.

Load liberally: when a trigger is ambiguous, load the resource. Load only the language references
that apply; when the target language is ambiguous (mixed repo), load every applicable one.

## Resources

| Resource (`references/`) | Owns | Load when |
|---|---|---|
| `doctrine.md` | language-agnostic usage doctrine: catalog-not-flowchart, hybrid routing, meeting the agent's reach, pointers into the lens repo | choosing whether and which lens to invoke; designing or reviewing a lens tool |
| `python.md` | Python lens dispatch table, per-lens query types, `lens_query` language, composable-keys discipline, known limits | any Python code-analysis investigation, or a named Python lens |

Rust and Go lenses are planned; each will add a `references/<lang>.md` row here rather than a
sibling skill.

## Required loading by path

- **Any lens work:** `doctrine.md`.
- **Python code:** `python.md` in addition.
- **Mechanical agents (T2/T3)** load nothing from this skill.
