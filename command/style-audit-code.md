# /style-audit-code (STUB)

Audit source against the per-language code styleguide. The mechanical rules emit findings
(linter-shaped); the structuring principles emit observations for human review.

## Status

STUB. Not yet implemented. The audit logic and prompt body will be designed once the per-language
guides have more content under their currently-stubbed sections (classes, modules, packages,
structuring principles). Test-specific rules are split into the matching `STYLE-TEST-<LANG>.md`
and audited by `/style-audit-test`.

## Intended shape (sketch)

1. **Target.** Argument is a file, module, or package path. Empty argument: ask user.
2. **Language resolution.** Detect the target's language from file extension / project markers
   (`pyproject.toml` → Python, `Cargo.toml` → Rust, `go.mod` → Go). Mixed/ambiguous → load all
   applicable guides.
3. **Load the matching per-language guide** via the `STYLE-CODE.md` index
   (`STYLE-CODE-PYTHON.md` / `STYLE-CODE-RUST.md` / `STYLE-CODE-GO.md`).
4. **Mechanical pass.** For each rule in `## Mechanical rules` that is checkable without running
   tools, emit findings with line numbers.
5. **Structuring pass.** For each section under `## *-structuring principles`, surface observations
   where the code looks like it might be violating the principle. Mark as "observation" not
   "finding" — these require human judgment.
6. **Report.** Findings (mechanical) and observations (structural) emitted as a structured list.
   Do NOT auto-fix; this command is read-only.

## Pairing

`/style-audit-doc` is the documentation-side equivalent; `/style-audit-test` is the test-code
equivalent.
