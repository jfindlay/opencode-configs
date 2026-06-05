# /style-audit-test (STUB)

Audit test code against the per-language test styleguide. The mechanical rules emit findings
(linter-shaped); the structuring principles emit observations for human review.

## Status

STUB. Not yet implemented. Most per-language test guides still have TODO sections (test philosophy,
structuring principles); the audit logic and prompt body will be designed once those sections have
content.

## Intended shape (sketch)

1. **Target.** Argument is a file, module, or `tests/` subtree path. Empty argument: ask user.
2. **Language resolution.** Detect the target's language from file extension / project markers
   (`pyproject.toml` → Python, `Cargo.toml` → Rust, `go.mod` → Go). Mixed/ambiguous → load all
   applicable guides.
3. **Load the matching per-language guide** via the `STYLE-TEST.md` index
   (`STYLE-TEST-PYTHON.md` / `STYLE-TEST-RUST.md` / `STYLE-TEST-GO.md`); load the same-language
   code guide (`STYLE-CODE-<LANG>.md`) as the inherited base.
4. **Mechanical pass.** For each rule in `## Mechanical rules` not already enforced by the
   project's lint config, emit findings with line numbers. Skip rules the project's tooling already
   covers — duplication is noise.
5. **Structuring pass.** For each section under `## Structuring principles` and `## Test
   philosophy`, surface observations where the test code looks like it might be violating the
   principle. Mark as "observation" not "finding" — these require human judgment.
6. **Report.** Findings (mechanical) and observations (structural) emitted as a structured list.
   Do NOT auto-fix; this command is read-only.

## Pairing

`/style-audit-code` is the source-side equivalent; `/style-audit-doc` is the documentation-side
equivalent.
