---
description: "[jf] Gather tier-appropriate retrospective feedback on the AGENTS.md / AGENTS-REASONING.md layout from each primary agent and subagent. Run after any significant restructuring of the agent-doc tier split. No fork — run against each agent interactively."
---

Run the retrospective prompt below against each of these agents in a fresh session per agent
(or fork subagents from a lightweight primary session for the subagent-mode ones):

- `@dialectic` (T-1 / Fable 5)
- `@plan` (T0 / Opus 4.8)
- `@build` (T1 / Sonnet 4.6)
- `@git-editor` (T1 / Sonnet 4.6)
- `@explore` (T1 subagent / Sonnet 4.6)
- `@verify` (T1 subagent / Sonnet 4.6)
- `@session-scan` (T2 subagent / Haiku 4.5)

For subagents, fork them with the prompt below as the task body from a lightweight primary
session. The T2 subagent (`@session-scan`) is worth including — its perspective on whether
AGENTS.md alone suffices is the calibration check for the tier boundary.

---

## Retrospective prompt

Read `~/.config/opencode/AGENTS.md`, `~/.config/opencode/AGENTS-REASONING.md` (if your agent
references it), and the relevant sections of `~/.config/opencode/AGENTS-HINTS.md` (particularly
the entries on modes of inference, the hi-fi analogy, and the tier split).

Then give me a retrospective in three short sections:

**1. Did the split land appropriately for your tier?**
- Is the content in your prompt-body-referenced files well-calibrated to the work you do? Too
  much? Too little? The wrong content?
- If your tier does NOT read `AGENTS-REASONING.md` (i.e., `@session-scan`): do you feel its
  absence, or is `AGENTS.md` alone sufficient?
- If your tier DOES read `AGENTS-REASONING.md`: does its content actually fire during your work,
  or does it sit in context as abstract priming you don't reach for?

**2. Register check.** Does the split of register (transactional in `AGENTS.md`, activational in
`AGENTS-REASONING.md`, referential in `AGENTS-HINTS.md`) read clearly, or is there bleed between
them? Does `AGENTS-REASONING.md`'s preamble ("these fire alongside `AGENTS.md` conventions with
equal activational weight") actually prime you to treat its rules as rules in force, or does it
still feel like exposition?

**3. Gaps and friction.** What rules would have helped you in past sessions that are missing from
your current prompt-body-referenced set? What rules are you being given that you would deprioritize
or drop? Be concrete — cite a past moment if you can.

Keep the retrospective concise. One paragraph per section is enough. Flag any CAPTURE-CANDIDATE
observations.
