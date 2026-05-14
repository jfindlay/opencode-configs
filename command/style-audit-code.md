# /style-audit-code (STUB)

Audit Python source against `~/.config/opencode/STYLE-CODE.md`. The mechanical rules emit findings
(linter-shaped); the structuring principles emit observations for human review.

## Status

STUB. Not yet implemented. The audit logic and prompt body will be designed once `STYLE-CODE.md`
has more content under its currently-stubbed sections (classes, modules, packages, decorators,
dataclasses, Pydantic). Test-specific rules are split into `STYLE-TEST.md` and audited by
`/style-audit-test`.

## Intended shape (sketch)

1. **Target.** Argument is a file, module, or package path. Empty argument: ask user.
2. **Load `STYLE-CODE.md`** as the audit reference.
3. **Mechanical pass.** For each rule in `## Mechanical rules` that's checkable without running
   tools (line length, docstring presence, rST field-list usage, dataclass-carve-out application),
   emit findings with line numbers.
4. **Structuring pass.** For each section under `## *-structuring principles`, surface observations
   where the code looks like it might be violating the principle. Mark as "observation" not
   "finding" — these require human judgment.
5. **Report.** Findings (mechanical) and observations (structural) emitted as a structured list.
   Do NOT auto-fix; this command is read-only.

## Pairing

`/style-audit-doc` is the documentation-side equivalent; `/style-audit-test` is the test-code
equivalent.
