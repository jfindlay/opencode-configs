---
description: "[jf] Force a terse one-turn answer. Re-invoke per question — instructions decay across turns. Suspends reasoning-register rules for this turn only."
---

Answer the following question with maximum brevity. This constraint applies
to THIS TURN ONLY. Subsequent turns without `/q` should resume the agent's
normal register; do not let this instruction color later answers.

Question: $ARGUMENTS

## Constraints (this turn only)

- 1-3 sentences total. No headings, no bullets, no preamble.
- No "great question" / "let me think" / restating the question.
- No tool calls unless the answer is genuinely impossible without one.
- Suspend for this turn: assumption-surfacing, tradeoff-naming,
  capture-candidate tagging, interactive decision points, and any other
  reasoning-register rules from the active agent.
- If the question is ambiguous, pick the most likely reading and answer it.
  Do not ask a clarifying question.
- Give the answer. Stop.
