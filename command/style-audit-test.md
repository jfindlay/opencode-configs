# /style-audit-test (STUB)

Audit Python test code against `~/.config/opencode/STYLE-TEST.md`. The mechanical rules emit
findings (linter-shaped); the structuring principles emit observations for human review.

## Status

STUB. Not yet implemented. Most of `STYLE-TEST.md` is still TODO (test philosophy, structuring
principles); the audit logic and prompt body will be designed once those sections have content. The
mechanical-rule subset alone (pytest framework, pyfakefs/pytest-mock usage, layout, fixture and
parametrize affordances, `conftest.py` hoisting) is largely covered by `ruff` PT-rules and project
linters, so a stub-only command would duplicate existing tooling.

## Intended shape (sketch)

1. **Target.** Argument is a file, module, or `tests/` subtree path. Empty argument: ask user.
2. **Load `STYLE-TEST.md`** as the audit reference; load `STYLE-CODE.md` as the inherited base.
3. **Mechanical pass.** For each rule in `## Mechanical rules` not already enforced by ruff/mypy
   in the target project, emit findings with line numbers. Skip rules the project's lint config
   already covers — duplication is noise.
4. **Structuring pass.** For each section under `## Structuring principles` and `## Test
   philosophy`, surface observations where the test code looks like it might be violating the
   principle. Mark as "observation" not "finding" — these require human judgment.
5. **Report.** Findings (mechanical) and observations (structural) emitted as a structured list.
   Do NOT auto-fix; this command is read-only.

## Pairing

`/style-audit-code` is the source-side equivalent; `/style-audit-doc` is the documentation-side
equivalent.
