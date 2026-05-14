---
name: python-lenses
description: Select and invoke Python code-reasoning lenses (semgrep, grimp, callgraph, coverage, test inventory, fixture graph, salt loader, lens_query). Load when planning a code-analysis investigation or when the user names a lens explicitly.
---

Python code-reasoning lenses expose static-analysis tools as MCP tools. Each lens runs a
structured pass over source and returns a JSON `LensOutput` envelope with a stable
`composable_keys` contract so outputs from different lenses can be joined.

**When to load this skill:** when planning a code-analysis investigation, when the user names
a lens explicitly, or when choosing among AST, import-graph, call-graph, coverage, or
test-analysis approaches. See also `AGENTS-LENSES.md` for the generative framing.

---

## Lens dispatch table

Lens selection is shape-matching: match the question's shape to the tool's affordance.
The metaphor column does the matching — read it first, then check "good for".

| MCP tool | Lens ID | Metaphor | Summary | Good for |
|---|---|---|---|---|
| `semgrep_scan` | `ast.semgrep` | **Pattern-finder** — "show me everywhere this shape appears" | Run semgrep rules against a source tree; returns pattern matches with location, severity, message, metavariables | Finding antipatterns, security patterns, deprecated usage, structural clones; any "where does X syntactic shape appear?" question |
| `imports_scan` | `imports.grimp` | **Topograph** — "show me the terrain of dependencies" | Build a grimp import graph; query modules, direct imports, import chains, or layer-conformance violations | Import cycles, layer-boundary enforcement, "what does package X depend on?", architecture conformance |
| `callgraph_scan` | `callgraph.ast_networkx` | **Telescope** — "trace the chain of calls from here" | AST + networkx call graph (over-approximated); query graph, reachable, callers, cycles, dead code | Blast-radius of a change, who calls X, reachability from an entry point, dead-code candidates in static code |
| `loader_entrypoints_scan` | `salt.loader_entrypoints` | **Registry reader** — "show me what the dispatch table sees" | Walk Salt loader directories, extract public functions and `__virtualname__`; map what the loader can invoke | Salt-specific: which functions are loader-visible, virtualname mapping, composing with callgraph as entry points |
| `test_inventory_scan` | `testing.inventory` | **Catalogue** — "enumerate what tests exist" | AST-walk test files; enumerate test functions, markers, file summaries | "What tests cover module X?", "what's marked slow/integration?", test distribution across files |
| `fixture_graph_scan` | `testing.fixture_graph` | **Dependency map** — "trace what each test needs" | Discover pytest fixtures in conftest files; build fixture dependency graph; query dependents, unused fixtures | Fixture blast-radius ("if I change this fixture, which tests break?"), unused fixture cleanup, conftest architecture |
| `coverage_scan` | `coverage.pytest` | **Spectroscope** — "measure what light actually reaches each function" | Run pytest with coverage context tracking; report per-function coverage fraction and which tests cover each function | Coverage gaps, "which callers cover this function?", test-to-code mapping, composing with callgraph |
| `lens_query` | (compositor) | **Compositor** — "join, filter, and project across multiple lenses in one call" | Declarative multi-lens pipeline: `source` → `join` → `filter` → `project`; query_version="0" | Cross-lens compositions at scale; avoids context exhaustion when raw outputs would overflow the window |

---

## Query types per lens

### `semgrep_scan`
- No `query_type` — runs rules and returns all matches.
- `composable_keys`: `["rule_id"]`
- Key attrs: `rule_id`, `severity`, `message`, `lines`, `fix`, `metavars`, `fingerprint`

### `imports_scan`
- `query_type`: `modules` | `direct_imports` | `chains` | `conformance`
- `composable_keys`: `["module", "importer", "imported"]` (subset per query type)
- `query_args` for `chains`: `{"pairs": [{"importer": "a", "imported": "b"}]}`
- `query_args` for `conformance`: `{"layers": ["high", "low"], "containers": null}`

### `callgraph_scan`
- `query_type`: `graph` | `reachable` | `callers` | `cycles` | `dead_code`
- `composable_keys`: `["name", "module", "caller", "callee"]` (subset per query type)
- `graph` is always populated (all five query types)
- Limitation: over-approximated — `self.method()` resolves to bare `"method"`. Static-dispatch
  codebases work well; string-dispatch (Salt loaders, plugin registries) produces false
  positives in dead-code results.

### `loader_entrypoints_scan`
- `query_type`: `entrypoints` | `virtualnames`
- `composable_keys`: `["loader_function", "loader_virtualname"]`
- Salt-specific: use `loader_function` values as `entry_points` for `callgraph_scan`

### `test_inventory_scan`
- `query_type`: `tests` | `markers` | `files`
- `composable_keys`: `["test_id", "func_name"]` (tests); `["test_id", "marker"]` (markers)
- `query_args` for `markers`: `{"markers": ["slow", "integration"]}`

### `fixture_graph_scan`
- `query_type`: `graph` | `fixtures` | `dependents` | `unused`
- `composable_keys`: `["name"]` (graph/fixtures/unused); `["name", "dependent", "dependency"]` (dependents)
- `query_args` for `dependents`: `{"fixture": "<fixture-name>"}`

### `coverage_scan`
- `query_type`: `functions` | `tests` | `gaps`
- `composable_keys`: `["name", "module"]` (functions/gaps); `["test_id"]` (tests)
- `query_args` for `gaps`: `{"threshold": 0.8}`
- Requires `source` param (package name or path measured by `--cov`)

---

## `lens_query` — query language (version 0)

Use `lens_query` when a single lens won't fit context, or when you need a join across two
lenses. The full wire protocol is in `docs/LENS-QUERY-LANGUAGE.md`.

**Skeleton:**
```json
{
  "query_version": "0",
  "steps": [
    {"op": "source", "name": "<alias>", "lens": "<mcp-tool-name>", "args": {...}},
    {"op": "join",   "left": "<alias>", "right": "<alias>", "on": {"left_key": "...", "right_key": "..."}},
    {"op": "filter", "source": "<alias>", "predicate": {"kind": "comparison", "field": "...", "op": "...", "value": ...}}
  ],
  "project": ["field1", "field2"]
}
```

**Predicate kinds:** `comparison` (op: `==`, `!=`, `<`, `>`, `<=`, `>=`), `regex`
(re.search on a string field), `and`, `or`.

**Coverage × callgraph example** — functions in the call graph with < 80% coverage:
```json
{
  "query_version": "0",
  "steps": [
    {"op": "source", "name": "cov",  "lens": "coverage_scan",  "args": {"target_paths": ["tests/"], "source": "mypackage", "query_type": "functions"}},
    {"op": "source", "name": "cg",   "lens": "callgraph_scan", "args": {"target_paths": ["src/"], "query_type": "graph"}},
    {"op": "join",   "left": "cov",  "right": "cg", "on": {"left_key": "name", "right_key": "name"}},
    {"op": "filter", "source": "cov_x_cg", "predicate": {"kind": "comparison", "field": "coverage", "op": "<", "value": 0.8}}
  ],
  "project": ["name", "module", "coverage", "total_lines"]
}
```

---

## Composable-keys discipline

The `composable_keys` field in each `LensOutput` names which `attrs` keys are stable join
surfaces. Always read `output.composable_keys`; do not assume the full union.

Universal join keys (safe across all lenses): `file`, `line`, `line_start`, `line_end`
(from `location`, not `attrs`).

---

## Known limits and anti-patterns

- **Callgraph + dynamic dispatch**: the AST call graph cannot follow string-keyed dispatch
  (Salt loaders, plugin registries, `getattr(obj, name)()`). Dead-code results are
  unreliable for dispatch-saturated codebases. Use `loader_entrypoints_scan` to model
  the entry points explicitly, then compose.
- **Coverage requires subprocess**: `coverage_scan` runs pytest as a subprocess. It is the
  most expensive lens. Use `query_type="gaps"` with a threshold to avoid fetching full
  per-function data when you only need the low-coverage functions.
- **Grimp requires importable packages**: `imports_scan` calls `grimp.build_graph()` which
  imports the package. The package must be on sys.path (typically: run from the repo root
  with the venv active, or pass the MCP server the right env).
- **`lens_query` is eager (v0)**: all named sources run, then filters apply in memory.
  Project aggressively to keep results small.
