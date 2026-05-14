# Test Style: Python

Loaded on demand by T0/T1 agents before writing, modifying, or reviewing Python test code. Carries
the test-specific mechanical rules and (eventually) structuring principles. All conventions in
`STYLE-CODE.md` apply to test code as well — this file adds to them, never relaxes them.

## Mechanical rules

- **Framework: pytest.** No `unittest.TestCase`, no nose, no bare `assert` scripts. Use plain
  functions and `assert` with pytest's rewriting; reach for classes only to share fixtures across a
  small, related cluster of tests.
- **Filesystem mocking: pyfakefs.** Use the `fs` fixture for any test that touches the filesystem.
  Do not write to real `tmp_path` when pyfakefs would do; do not mix the two in one test.  If a test
  is validating a project artifact, such as an example config, keep the non-`fs` related work
  isolated.
- **Mocking: pytest-mock.** Use the `mocker` fixture, do not use anything from `unittest.mock`.  Do
  not use decorator mocks from `unittest.mock`. Exceptions raised in `__enter__`/`__exit__` are
  still handled gracefully by `mocker`.  `unittest.mock` supports more mocking styles with dubious
  value: decorators `.start()`/`.stop()`.  Do not use these and standardize on the simple `mocker`
  UX, which forces test case simplicity.  Import `unittest.mock` only for:
  - **Type annotations** of mock objects (`MagicMock`, `AsyncMock`, etc. as types, not factories).
    Prefer gating these imports under `if TYPE_CHECKING:` so the runtime mocking surface remains
    completely `mocker`-driven.
  - **`isinstance` checks** against mock types in test helpers or custom matchers.
  - **Sentinels and helpers `mocker` does not proxy.** `mocker` covers `Mock`, `MagicMock`,
    `NonCallableMock`, `NonCallableMagicMock`, `PropertyMock`, `AsyncMock`, `call`, `ANY`,
    `DEFAULT`, `sentinel`, `mock_open`, `seal`, `patch`, `create_autospec`, `spy`, and `stub`.
    Anything else (e.g. constructing `mock.call(...)` values for `pytest.mark.parametrize` outside a
    test body) requires the direct import.
- **Top-level layout.**
  - `tests/unit/` — fast, isolated, no network, no real filesystem, no real subprocesses. Mirrors
    the package tree under test.
  - `tests/integration/` — exercises real boundaries (filesystem, subprocess, network where
    appropriate, real config loading). Slower; may be gated behind a marker.
  - Other top-level test directories (`tests/e2e/`, `tests/perf/`) are allowed when the project
    needs them, but `unit/` and `integration/` are the baseline split.
- **Prefer pytest affordances over hand-rolled scaffolding.**
  - `@pytest.fixture` for setup/teardown and shared state, not `setUp`/`tearDown` methods or
    module-level globals.
  - `@pytest.mark.parametrize` for table-driven tests, not `for`-loops inside a test function or
    copy-pasted test bodies.
  - `pytest.raises`, `pytest.warns`, `pytest.approx`, `monkeypatch`, `caplog`, `capsys` — reach for
    these before writing equivalents from scratch.
- **`conftest.py` hoisting.** Common fixtures, hooks, and helpers live in a `conftest.py` at the
  lowest package level that covers all consumers. A fixture used by two sibling test modules belongs
  in their shared parent's `conftest.py`, not duplicated. A fixture used across `unit/` and
  `integration/` belongs in `tests/conftest.py`.
- **Docstrings and typing.** Per `STYLE-CODE.md`, tests are not exempt from the docstring and mypy
  rules. Every test function gets a one-line docstring stating what behaviour it pins down; every
  fixture gets a docstring describing what it provides and any teardown contract.

## Test philosophy

- **Minimize duplication.**  While overcoverage is traditionally acceptable, agent-written code
  tends toward excess.  Try to keep coverage adequate but relentlessly minimal.
- **Unit tests** validate and enforce the important **inner contracts** within the codebase:
  function signatures (input+return+yield+raise+side-effect), class public API, module/package
  public API.
- **Integration tests** validate and enforce the application interface itself: the static dimensions
  of the API, UI, and UX, stability of the application contract including controlled deprecation,
  and behavioral validation such as monotonically improved performance unless justified by new
  functionality.
TODO:
- When to mock vs. when to use a real collaborator
- Fixture scope guidance (`function` / `class` / `module` / `session`)
- Parametrize-vs-separate-test tradeoffs
- What makes a test fragile
- Naming conventions for test functions and parametrize ids.

## Structuring principles

TODO:
- When to split a test module
- When a test class earns its keep
- How to organise large parametrize tables

## Audit invocation

The `/style-audit-test` command audits a target test file or module against the rules in this
document. Currently a STUB pending the philosophy and structuring sections above.
