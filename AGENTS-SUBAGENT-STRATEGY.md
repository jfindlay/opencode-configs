# Subagent Strategy

Load trigger: when deciding whether to fork a subagent or use a tool call directly; when writing
a subagent fork prompt.

## Three-axis fork test

Forking a subagent is sideways capability allocation: spending a fresh context's budget on a
specific load-bearing question while preserving the caller's context for the decision the question
serves. The three-axis test is the tactical implementation of that allocation. Violating it wastes
budget (forking when steering is needed) or pollutes context (not forking when pollution would
drown the caller).

Fork a subagent when **context pollution OR parallelizability is YES, AND steering is NO**:

- **Context pollution**: will the intermediate tool output (reads, greps, bash output) be large AND
  irrelevant to subsequent work in the caller's context?
- **Parallelizability**: is the work embarrassingly decomposable into independent chunks?
- **Steering**: does the work require turn-by-turn judgment from the caller or user mid-task? If
  yes, never fork — subagents return once and lose the steering loop.

Do NOT fork for:
- A single file read or targeted Grep.
- Any loop that reacts to intermediate results (test loops, format loops, interactive debugging) —
  these require turn-by-turn steering.
- Work that will continue with edits immediately after — context is lost anyway.

See `AGENTS-HINTS.md` for the derivation of the three-axis rule.

## Planned driver-owned handoff

`/plan-run`'s feature/completion (F/C) pattern (see `multisession/multi-session-planning.md`) is a
calculated exception to the one session per commit and a green project state at the end of every
session rules. 

The implementation session runs its *own* loop to completion — it reaches a designed stopping point
(`handoff-ready`), not a loop interruption — and writes a complete intent capsule before any handoff
occurs. The driver (`@plan-admin`) then dispatches a *fresh* completion context whose scope is the
capsule, not "pick up this interactive debugging session." Each stage owns its own steering
end-to-end; only the boundary between stages is cold, and that boundary was planned (by
`/plan-shard`'s conditional branch) before either stage started, not reached for because the first
context got expensive or stuck.

The three-axis test still applies to each stage's *internal* work (an F or C context forking
`@explore` mid-investigation follows the same rules as any other context). What the F/C pattern adds
is a planned, driver-owned phase transition between two bounded stages — never a tool for escaping an
in-progress interactive loop. A feature-stage return (`handoff-ready`) is a checkpoint, not
completion of the delivery unit; the unit is not done until the completion stage and the unit's gate
(the full project gate, or the per-unit gate under a project-declared cadence) both pass.

## Subagent prompt template

Every subagent prompt should include:

```
Working directory: <absolute path>
Thoroughness: <quick | medium | very thorough>
Read-only: YES ("DO NOT EDIT ANY FILES.")

GOAL
<one-paragraph statement of why this investigation exists>

INVESTIGATION TASKS
<numbered, actionable>

OUTPUT FORMAT
<bulleted or section-headed template>
```

Subagents do NOT inherit `AGENTS.md`. Re-state relevant rules in the fork prompt.
