---
description: "[jf] Project doc-style audit: audits inline docs and rolling-context files (AGENTS.md, PLAN.md, NOTES.md) against current code per the doc policy in ~/.config/opencode/STYLE-DOC.md. Forks @explore for the audit; primary classifies findings into absorb / fold / delete / amend / flag and emits proposals. Read-only — no writes without explicit per-item approval."
---

Perform a documentation-cleanup pass on the current project. The pass has two halves that share a
single command because they are usually run together at pre-merge time:

1. **Inline-doc conformance** — docstring/comment policy violations in source files.
2. **Rolling-context lifecycle** — checking whether `docs/PLAN.md` and `docs/NOTES.md` are still
   earning their keep, or whether their content has been absorbed into code/AGENTS.md and the file
   can be retired.

Both halves emit proposals only. Nothing is written without per-item approval.

The doc policy this command enforces lives in `~/.config/opencode/STYLE-DOC.md`. Do not restate
the policy in this command or in the subagent prompt — reference it by name. The subagent loads
STYLE-DOC.md as part of its setup.

**Hard constraint — do not lose rolling-context content that has not been actioned.** A proposal to
delete a `PLAN.md` section or fold a `NOTES.md` entry requires positive evidence that the content
is already reflected elsewhere (code comment, AGENTS.md prose, commit history). When the evidence
is mixed or absent, the proposal must be `FLAG-FOR-USER`, not `ABSORB`. Quality of audit > volume
of proposals.

---

Fork an `@explore` subagent for the audit pass with the prompt below. The fork is appropriate: the
audit reads many files (every doc + a sample of source per claim + grep for stale tool refs) and
returns a compact table — context-pollution is high, parallelizability across entries is high, and
the audit needs no turn-by-turn steering. `@explore` is Sonnet-pinned, the right tier for a high-I/O
accuracy check that does not need primary-tier judgment until the synthesis step.

After the subagent returns, the primary agent applies Opus-register judgment to classify each finding
into a proposal type and emits the final report.

---

SUBAGENT PROMPT (pass this verbatim to `@explore`):

```
Working directory: $CWD
Thoroughness: very thorough
Read-only: YES. DO NOT EDIT ANY FILES.

GOAL
Audit this project's documentation against the current state of the code. Produce a structured
finding list that the primary agent will turn into proposals. You are NOT proposing actions — you
are gathering evidence. The primary agent decides what to do with each finding.

SETUP
Before scanning, Read `~/.config/opencode/AGENTS.md` and locate the section `## Documentation
layers`. That section is the single source of truth for the doc policy this audit enforces —
including the inline-doc rule (§1), the human-doc trichotomy (§2), the agent-doc rules (§3), and the
reference-direction table. Do not restate the rules in your output; cite the section number when
relevant.

PASS A — INLINE-DOC CONFORMANCE
Scan source files (Python unless the project is non-Python, in which case adapt). For each
violation, record one finding with file, line, category, and the offending content.

Categories (all defined in `STYLE-DOC.md`):
1. **Excessive inline exposition** — Documentation in docstrings or comments should be relentlessly
   minimal.  Any docstrings or comments that describe or explain the code should be moved to the
   human docs unless the `STYLE-DOC.md` §1 rule applies: code is intricate, fragile,
   load-bearing, or the consequences are not obvious from the code itself.
2. **Unnecessary inline exposition** — Superfluous, unnecessary, wrong, or outdated docs in
   docstrings or comments should be removed.
3. **Duplicate inline exposition** — Documentation in docstrings or comments that duplicates the
   human docs should be removed.
4. **Missing docstring** on a public named scope (package, module, class, function). Tests included
   — they are not exempt.
5. **Types in docstring** — `:type x:`, `:rtype:`, `:vartype:`. Code is fully typed; types in
   docstrings are forbidden.
6. **Incomplete rST coverage** — public function/method missing `:param:`, `:returns:`, `:raises:`,
   or `:yields:` for any signature element it has.
7. **Public class missing `:ivar:` / `:cvar:`** — except dataclass-carve-out (`@dataclass`,
   `NamedTuple`, `TypedDict` where field names + types are self-documenting).
8. **Premature line wrap** — docstring/comment/markdown line wrapped to <100 columns when more text
   would fit on the line.
9. **Line >100 columns** — any line, including code, docstrings, comments, markdown.
10. **non-en_US spelling/grammar** — colour, behaviour, organise, whilst, etc.
11. **Inline → agent reference** — any docstring/comment that mentions AGENTS.md, PLAN.md, or
    NOTES.md. Forbidden direction per §3.
12. **Legacy/intermediate-state code** — code clearly supporting a refactored-away path
    (compatibility shims, feature flags whose other branch is dead, "old_X"/"X_v2" pairs where one
    is unused). Read with judgment; flag only when confidence is high.
13. **Phase or refactor marker leftovers** — references to "Phase 1", "C2", "T.3", "stage 2",
    "milestone N", "(WIP)", "TODO(phaseX)", or similar plan-narrative artifacts in code or comments.

PASS B — HUMAN DOCS CONFORMANCE
Human docs should be scanned for duplicate or excessive content which should be flagged for
removal/consolidation. For each human doc file that exists in the project:

For the project's `docs/` (or `doc/`) tree (excluding rolling-context files), classify each file
    as design / development / user per `STYLE-DOC.md` §2. Flag:
    - Duplicative, excessive, or obsolete language that should be consolidated/removed.
    - Design docs without diagrams or without a motivation section.
    - Development docs that don't refer to inline docs (development docs are the exposition
      companion; missing inline-references is a smell).
    - User docs missing any of {setup, simple-usecase example, "why" explanation in intuitive
      language}.
    - Any human doc that refers to an agent doc (forbidden direction per §2).
    - **Refactor markers** — Strings such as `C2` or `Phase 3` used to anchor `PLAN.md`- or
      multipass-based refactors should be removed.

PASS C — ROLLING-CONTEXT LIFECYCLE
For each rolling-context file that exists in the project (`docs/PLAN.md`, `docs/NOTES.md`):

C1. Read the file in full.

C2. For each distinct entry/section, determine:
    - **Claim**: what does this entry assert about the code?
    - **Code reflection**: is the claim already reflected in the code itself (as a motivational
      comment, as a test, as a structural decision visible in the source)? Cite the file:line where
      you found the reflection, OR "not found" if absent.
    - **AGENTS.md reflection**: is the claim folded into AGENTS.md (project or user-level)?  Cite
      the AGENTS.md section, OR "not found".
    - **Status verdict**: ABSORBED (reflected in code AND/OR AGENTS.md), STALE (claim contradicts
      current code), LIVE (still accurate but not yet absorbed), or UNCERTAIN (cannot determine
      without user input).

C3. For PLAN.md specifically: identify completed sections vs in-flight sections. A "completed"
    section is one whose acceptance criteria are met by current code AND no follow-up tasks remain.

C4. For project-level AGENTS.md (do NOT touch ~/.config/opencode/AGENTS.md):
    - Stale tool references (e.g., black/isort when pyproject.toml uses ruff; pipenv/Pipfile when uv
      is in use; tox when uv/make replaced it).
    - Sizing-budget check: ~1 lines of AGENTS.md per ~128 lines of source it covers. Report the
      actual ratio. Flag overruns only if the source isn't intricate or gotcha-heavy enough to
      justify them.
    - Reference-direction violations: AGENTS.md content that points back into inline docs.

C5. **Unstable data in agent docs** — any `AGENTS.md`, `PLAN.md`, or `NOTES.md` content that cites a
    moving-target number (test count, file count, line count, dependency count, "X tests pass").
    See §3 of `STYLE-DOC.md`.  **Refactor markers** — Strings such as `C2` or `Phase 3`
    used to anchor `PLAN.md`- or multipass-based refactors should be removed.

INVESTIGATION TASKS
1. Run Pass A across the source tree. Use Grep for the mechanical categories (5, 6, 7, 8, 9, 11);
use Read on representative files for the judgment categories (1, 2, 3, 4, 10).
2. Run Pass C sequentially on each rolling-context file that exists.
3. Cross-pass step: when a Pass C entry's status is LIVE, check whether a corresponding code comment
exists that *should* mention the gotcha/decision but doesn't. Note these as "absorption opportunity"
— code that implements the gotcha but lacks the motivational comment.

OUTPUT FORMAT

## Pass A — Inline-doc findings
Table with columns: file:line | category | excerpt (≤80 char) | severity (high/med/low).  Cap at 80
rows. If more violations exist, show the highest-severity 80 and report the total count.

## Pass B — Human-doc structure
Table with columns: file:line | category | excerpt (≤80 char) | severity (high/med/low).  Cap at 80
rows. If more violations exist, show the highest-severity 80 and report the total count.
- Design docs without diagrams/motivation: <list>, or "none"
- Development docs not referring to inline: <list>, or "none"
- User docs missing setup/example/why: <list>, or "none"
- Human → agent references: <list>, or "none"

## Pass C — Rolling-context findings
For each entry/section in each rolling-context file, emit:

  ### <file>:<entry-id-or-section-name>
  Claim: <one sentence>
  Code reflection: <file:line> OR "not found"
  AGENTS.md reflection: <section> OR "not found"
  Status: ABSORBED | STALE | LIVE | UNCERTAIN
  Notes: <any caveats; especially absorption opportunities>

## Summary
- Total Pass A findings: <N>, severity breakdown.
- Pass C status counts: ABSORBED <a>, STALE <b>, LIVE <c>, UNCERTAIN <d>.
- Highest-confidence retirement candidates (file/section, with reflection citation): <up to 5>.
- Items that look retirement-worthy but where reflection evidence is incomplete (DO NOT retire these
  — flag for user): <up to 5>.
```

---

After the subagent returns, the primary agent:

1. **Classify each finding into a proposal type.** The subagent reports evidence; the primary agent
   decides the action.

   - `ABSORB-INTO-CODE` — rolling-context entry is LIVE, the relevant code exists but lacks the
     motivational comment. Proposal text is the exact comment to add at the cited file:line.
   - `FOLD-INTO-AGENTS` — rolling-context entry is LIVE and broadly applicable; belongs in project
     AGENTS.md as a convention. Proposal text is the AGENTS.md edit.
   - `DELETE` — rolling-context entry is ABSORBED (evidence cited by subagent). Proposal is to
     remove the entry, with the absorption-evidence citation copied verbatim into the proposal so
     the user can verify.
   - `AMEND-STALE` — rolling-context entry is STALE; current code contradicts it. Proposal is either
     a corrected entry or removal-with-replacement.
   - `FIX-INLINE` — Pass A finding. Proposal text is the exact docstring/comment edit.
   - `FLAG-FOR-USER` — UNCERTAIN findings, mixed-evidence retirements, or judgment calls the primary
     agent isn't comfortable making (e.g., "is this legacy code or just simple code?").  No proposal
     text — just the finding and the question.

   **Default to FLAG-FOR-USER over DELETE/ABSORB whenever evidence is incomplete.** The constraint
   is "don't lose unactioned content"; over-flagging is the safe failure mode.

2. **Emit the proposal report.** Do NOT apply anything.

   ## Inline-doc proposals (Pass A)
   Table grouped by file. Columns: file:line | category | proposal | severity. Cap display at 50
   rows; offer to dump the rest as a second table on request.

   ## Rolling-context proposals (Pass B)
   For each proposal:

     ### Proposal N — <ABSORB-INTO-CODE | FOLD-INTO-AGENTS | DELETE | AMEND-STALE | FLAG-FOR-USER>
     Source: <rolling-context file>:<entry/section>
     Evidence (from subagent): <citation that supports this action, verbatim>
     Action: <one-sentence statement of what changes>

     ---8<--- proposed change ---8<---
     <exact text to add/remove/edit, OR "n/a — flag only">
     ---8<--- end ---8<---

   ## AGENTS.md proposals
   - Stale tool refs to update (one proposal per ref): file:line | old text | new text.
   - Sizing-budget overruns (informational, no proposal unless egregious).
   - Reference-direction violations: one proposal per violation.

   ## Human-doc proposals (Pass B5)
   - Design / development / user findings, one proposal each.

   ## Summary
   - Pass A: <N> proposals across <M> files.
   - Pass B: ABSORB-INTO-CODE <a>, FOLD-INTO-AGENTS <b>, DELETE <c>, AMEND-STALE <d>,
     FLAG-FOR-USER <e>.
   - AGENTS.md: <N> stale-ref proposals, sizing ratio <R>.
   - Human-doc: <N> structure proposals.
   - Lowest-confidence proposals (please review first): <list>.

3. **Stop.** Ask the user how to proceed. Suggested options:
   - "Apply all FIX-INLINE proposals" (low-risk mechanical edits) — recommend handing off to
     `@build`.
   - "Apply specific proposal numbers" — user names them.
   - "Discuss FLAG-FOR-USER items" — work through them interactively.
   - "Done — discard the rest" — close the loop.

## Constraints

- Read-only command. The driving agent must not write to source files or to AGENTS.md without
  per-item user approval; rolling-context writes still require approval per the standing
  rolling-context-write rules.
- Never propose DELETE or ABSORB on a rolling-context entry without subagent-cited reflection
  evidence. Mixed evidence → FLAG-FOR-USER.
- Never edit `~/.config/opencode/AGENTS.md` or other user-level config files from this command.
  Project-level only.
- The subagent prompt above is self-contained — do NOT rely on AGENTS.md inheritance; the prompt
  directs the subagent to Read the relevant section explicitly as its first step.
- If the project has no `docs/` or `doc/` directory and no rolling-context files, run Pass A only
  and report Pass B as "no rolling-context files found — skipping".
- If Pass A finds >200 violations, suspect tooling drift (e.g., missing format-check in CI) rather
  than a rolling backlog. Recommend `/format-loop` first and stop.
