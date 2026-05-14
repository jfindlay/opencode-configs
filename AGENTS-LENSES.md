# Code-reasoning lenses: usage doctrine

How an agent reaches for a code-reasoning lens. This file is referential — pulled in on demand
when an agent or user is choosing whether and which lens to invoke. The lens-system philosophy,
design pattern, and per-lens catalog live in the `composable-code-lenses` repo (see Pointers).

A *lens* is a structured representation of a codebase that answers a specific class of questions
more cheaply or more correctly than raw text + grep. The available lenses are exposed by the
`composable-code-lenses` MCP server; selection vocabulary and named compositions live in the
`python-lenses` skill.

## Why a catalog, not a flowchart

For meta-affordances like representation selection, prefer priming over routing when the
underlying axis isn't clean. Priming surfaces options to the agent and lets in-context judgment
do the selection; routing forces a path. Tier hierarchies (T0/T1/T2) work as decision trees
because cost-of-wrong is a clean axis; lens selection lacks an equivalently clean axis (question
shape × codebase size × frequency × cost × accuracy), so it should be a hint catalog rather than
a flowchart.

The operative pattern is **hybrid routing**: human supplies routing intuition by naming the lens
explicitly in the prompt; the catalog (and skill, when built) supplies vocabulary, cost
calibration, and agent fallback when no lens is named. Strictly better than either pure-agent
routing (which pays meta-cost every time) or pure-human routing (which leaves the agent without
fallback and the human without vocabulary). The catalog is a contract — named lenses must do
what their names say, consistently.

## Meet the agent's reach

A lens-tool's input contract should match the shape an agent naturally reaches for, not the
wrapped CLI's calling convention. When an agent's first guess at how to call a tool is wrong,
the friction is paid every session forever; when the tool absorbs the translation once, the
friction is paid never. Concretely: if the wrapped CLI takes file paths but agents will reach
for inline content, accept inline content and write the tempfile internally. If the agent's
reach is wrong in a way the tool can't accommodate, the failure mode must name the right
reach — opaque subprocess exit codes are a design bug, not a runtime quirk.

This is downstream of "wrap > build" but distinct: wrap-vs-build asks whether to wrap an
existing tool; meet-the-reach asks how the wrapper should shape its inputs once the decision to
wrap is made. The wrapping is the opportunity to fix the calling convention, not preserve it.

## Pointers

- **Available lenses and how to call them**: the `composable-code-lenses` MCP server's tool
  catalog.
- **Selection vocabulary and named compositions**: the `python-lenses` skill (when built).
- **Why lenses exist as a category, design rules for new lenses, output schema discipline,
  language-agnostic patterns**.
- **Per-lens reference, composition matrix (including informal-spec cross-checks like
  tests-as-spec × docstrings × call graph), cost calibration**: `docs/LENSES-CATALOG.md` in the
  same repo.
- **Active build plan and phase progression**: `docs/PLAN.md` in the same repo.
