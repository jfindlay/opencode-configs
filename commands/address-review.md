---
description: "[jf] Process pasted code-review output (review bot, Codex, MR comments): classify and verify findings, plan fixes, then apply them with checkpoints."
agent: build
---

This command runs the session as `@build`. The switch persists after the command finishes; switch
back to another agent yourself if you want one.

Review output to address (paste after invocation; may be empty or multiline):

$ARGUMENTS

## Steps

1. If the supplied review output is empty, ask me to paste it. Otherwise parse it as the review
   content.

2. **Summarize — do not quote verbatim.** Review bot output is noisy (HTML, emoji, collapsed
   sections, embedded code blocks). Extract:
   - Each distinct finding, in one sentence.
   - Severity: CRITICAL (blocks merge), WARNING (should fix), MINOR (nitpick), INFO (informational /
     question).
   - File and line reference, where given.
   - Reviewer (OpenCode review agent, Codex, human, which teammate).

3. Classify what's actionable:
   - **Accept and fix** — clear, correct finding.
   - **Discuss / push back** — finding may be wrong or context-dependent; note reasoning for
     pushback.
   - **Out of scope** — valid but belongs in a different PR.
   - **Already done** — resolved since the review was written.

   a. **Code cross-check (always).** Before proposing a fix plan, verify against the actual code
      that every code-dependent "accept and fix" finding is correct as stated. Findings that do not
      depend on code (process remarks, questions) need no check. The finding count only selects who
      verifies, never whether verification happens:
      - **Fewer than 5 code-dependent findings:** verify inline. Read the cited code (or search for
        the symbol when no location is given) and assign each finding a verdict: accurate /
        inaccurate / needs-discussion, with one line of evidence.
      - **5 or more:** fork a `@verify` subagent with the list of findings (one per line: finding
        text + file:line citation if available), the working directory, and the instruction: "For
        each finding, read the cited code and return a verdict: accurate / inaccurate /
        needs-discussion, with one line of evidence."

      Then, whichever path ran:
      - Downgrade any "inaccurate" finding to "discuss / push back" with the evidence as the
        pushback rationale.
      - Flag "needs-discussion" findings for me before proceeding.
      - Proceed with only the confirmed-accurate findings in the fix plan.

4. Propose a plan:
   - Group findings by file and by logical change.
   - Recommend a single commit per logical group.
   - List files to touch, ordered by dependency.
   - Note any test or changelog entries that must accompany the fix.

5. Present the plan as a table and ask: "OK to proceed? (yes / modify plan / discuss finding N)".

6. On approval:
   - Apply fixes in the agreed order.
   - After each logical group, pause. Show the diff of that group. Run any scoped tests and run
     formatting and linting. Ask whether to commit or continue. On "commit", commit that group's files per the
     `AGENTS.md` git conventions.

## Constraints

- If a finding is from the "OpenCode Code Review" agent itself, treat its output critically. The
  review agent can be wrong; the verification above is not optional for it.
- Never bypass hooks. If a hook fails after applying a fix, the fix is wrong or incomplete.
- If a finding's severity is unclear, err toward asking me.
