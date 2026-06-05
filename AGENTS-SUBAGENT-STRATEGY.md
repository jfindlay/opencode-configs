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
