---
description: "[jf] Run the project's tests, fix failures iteratively, and stop when green or when the loop isn't making progress. Optional $ARGUMENTS narrow the test selection."
---

# No fork: test-loop requires turn-by-turn steering — each failure cascades
# into a new fix attempt that may break other tests. Forking would convert
# the loop into a single round-trip and lose the iterative fix-retry cycle.

Test selection (optional): $ARGUMENTS

## Steps

1. Detect the test command. Try in this order:
   - `Makefile` with `test` target → `make test`.
   - `pyproject.toml` with pytest config → `uv run pytest` or
     `python -m pytest`.
   - Else ask me.

2. Apply $ARGUMENTS as a narrowing selector:
   - Looks like a path → pass as the test argument (pytest `path::node`).
   - Looks like a `-k` expression → pass as `-k "$ARGUMENTS"`.
   - Empty → run the full suite.

3. Run the command. Capture output.

4. If all pass, report "Green. N tests, T seconds." and stop.

5. If failures:
   - For each failure, read the traceback. Identify:
     - **Environment failure** (missing fixture, import error, docker not
       running) — usually a setup issue. Fix the env, don't change the test.
     - **Pre-existing failure** unrelated to recent changes — flag it but do
       not fix unless I ask.
     - **Regression** introduced by recent changes — fix the code, not the
       test, unless the test's expectation was wrong.
     - **New-test-fails-first** case (TDD) — fix the code to make the new
       test pass.
   - Never silently change a test's assertions to make it pass.

6. After applying fixes, re-run only the failed tests first (`-x` or
   equivalent) to verify each fix. Then run the full scope from step 3 again
   once failed tests pass.

7. Loop until green, OR until:
   - A test keeps failing across 3 iterations with different attempted fixes.
   - A fix breaks previously passing tests twice in a row.
   In either case STOP, summarize what's left, and ask for direction.

## Constraints

- Do NOT `--no-cov`, `--no-verify`, or skip tests to make a green status.
- Do NOT modify test expectations without explicit approval. If a test's
  expectation is wrong, flag it and ask.
- If pyfakefs is the fixture style in this project, ensure filesystem work
  uses `fs` fixture; do not silently switch to `tmp_path`.
- Run the tests sequentially or in parallel based on project convention —
  check for `pytest-xdist` config before using `-n auto`.
