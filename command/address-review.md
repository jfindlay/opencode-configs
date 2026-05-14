---
description: "[jf] Process pasted code-review output (OpenCode Code Review bot, Codex, MR comments). Classifies findings by severity, groups them, and drafts a fix plan before any edits."
---

Review output to address (paste after invocation): $ARGUMENTS

## Steps

1. If $ARGUMENTS is empty, ask me to paste the review output. Otherwise parse it as the review
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

  a. **Conditional code cross-check (fork if ≥5 findings AND any require code verification).**
     Before proposing a fix plan, verify that "accept and fix" findings are actually correct as stated.

     Fork a `@verify` subagent with:
     - The list of "accept and fix" findings (one per line: finding text + file:line citation if
       available).
     - The working directory.
     - Instruction: "For each finding, read the cited code and return a verdict: accurate /
       inaccurate / needs-discussion, with one line of evidence."

     When the subagent returns:
     - Downgrade any "inaccurate" finding to "discuss / push back" with the subagent's evidence as
       the pushback rationale.
     - Flag "needs-discussion" findings for me before proceeding.
     - Proceed with only the confirmed-accurate findings in the fix plan.

     Skip this step if there are fewer than 5 findings or if all findings are trivially verifiable
     from the review output alone (e.g., pure style nits with explicit line citations).

4. Propose a plan:
   - Group findings by file and by logical change.
   - Recommend a single commit per logical group.
   - List files to touch, ordered by dependency.
   - Note any test or changelog entries that must accompany the fix.

5. Present the plan as a table and ask: "OK to proceed? (yes / modify plan / discuss finding N)".

6. On approval:
   - Apply fixes in the agreed order.
   - After each logical group, pause. Show the diff of that group. Run any scoped tests and run
     formatting and linting. Ask whether to commit (invoke `/commit` flow) or continue.
   - Do NOT attempt to address all findings in one go without checkpoints.

## Constraints

- If a finding is from the "OpenCode Code Review" agent itself, treat its output critically. The
  review agent can be wrong. Cross-check against the actual code before committing.
- Never bypass hooks. If a hook fails after applying a fix, the fix is wrong or incomplete.
- If a finding's severity is unclear, err toward asking me.
