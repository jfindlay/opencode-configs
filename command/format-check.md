---
description: "[jf] Run the project's format-check target, fix all formatting errors, and stop when the check passes."
---

# No fork: format-check is a tight fix-rerun loop requiring turn-by-turn
# steering. Non-auto-fixable errors need judgment per occurrence. Steering=YES.

Run the format-check loop for the current project and fix every error until the
check passes.

## Steps

1. Detect the format-check command. Try in this order:
   - If a `Makefile` exists with a `format-check` target, use `make format-check`.
   - Else if `pyproject.toml` exists and declares ruff/black/etc., try `uv run black --check src/
     tests/` or equivalent.
   - Else ask me which command to run.

2. Run the detected command. Capture stdout+stderr.

3. If it passes, report "Clean." and stop.

4. If it fails, analyze the errors:
   - Group by file.
   - For each error, determine whether it's auto-fixable (formatting-only: line length, import
     order, quote style) or requires code change (semantic: unused variable, undefined name).
   - Auto-fixable: run the project's `format` (not `format-check`) target — typically `make format`.
     Do not hand-edit files that the formatter should fix.
   - Non-auto-fixable: edit the files manually.

5. Re-run the format-check command.

6. Loop steps 3–5 until clean, OR until the same file fails twice after an auto-fix pass. At that
   point STOP and show me the remaining errors — they likely need judgment.

## Constraints

- Never add `# noqa` or `# type: ignore` unless the finding is a false positive AND I have
  explicitly approved it.
- Never disable a linter rule project-wide to silence one finding.
- Do not commit afterward unless I ask. Invoke `/commit` if I do.
