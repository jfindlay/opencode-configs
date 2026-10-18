---
description: "[jf] Run the project's format target, fix failures iteratively with Edit (never
  sed), and stop when clean or when the loop isn't converging. Optional $ARGUMENTS passed to
  the runner."
---

# No fork: format-loop requires turn-by-turn steering — each tool failure may cascade into the next,
# and the loop reacts to intermediate state. Forking would lose the iterative fix-retry cycle.

Target filter (optional): $ARGUMENTS

## Steps

1. **Detect the format runner.** Check in this order:
   - `Makefile` with a `format` target → `make format`.
   - Else ask.

   Use `workdir` set to the project root — never `cd <root> && <cmd>`.

2. **Apply $ARGUMENTS** as a narrowing selector if provided (e.g. a path, a target name, or a `-k`
   expression). Pass through to the runner. Empty → run the full format target.

3. **Run the format target.** Capture output.

4. If exit 0: report what was modified (via `git diff --stat` or equivalent) and stop.

5. If non-zero:
   - Read the error output. Identify the failing file(s) and error class.
   - **Fixable via `Edit`**: make the narrowest correct change and re-run.
     - Never use `sed -i` or any bash-based in-place edit. Use the `Edit` tool — it provides diff
       preview and undo semantics that `sed` does not.
   - **Requires human judgment** (protocol change, ambiguous lint rule, ignore-type decision,
     formatting conflict the tool can't resolve): summarize the failure and stop. Do not guess.
   - **Destructive formatting is acceptable.** The `format` target is expected to write to files;
     let it. Do not add `# noqa`, `# type: ignore`, or similar inline exemptions to silence a tool —
     prefer compliance over suppression unless explicitly asked.

6. After each fix, re-run the format target to verify. Capture the new output and compare error
   count to the previous iteration.

7. Loop until clean, OR until:
   - 3 consecutive iterations with no reduction in error count (not converging).
   - Hard cap of 8 iterations total.
   - A failure class is flagged as requiring human judgment.

   In any stop case: summarize what's left, list the remaining errors, and ask for direction.

## Exit report

When the loop ends, emit:
- Runner used.
- Iteration count.
- Final status: **clean** / **stuck** (with remaining errors) / **needs-human** (with reason).
- Files modified (from `git diff --stat` or equivalent).
