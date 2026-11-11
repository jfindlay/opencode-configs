---
description: "[jf] Fork a read-only @explore subagent with a structured investigation prompt. Args: [thoroughness] goal; thoroughness is quick, medium, thorough, or very-thorough (default medium)."
---

Spawn an `@explore` subagent for the investigation described in the input below, using the template
in this command.

Input (optional thoroughness level followed by the goal):

$ARGUMENTS

## Input parsing

1. If the input starts with one of `quick`, `medium`, `thorough`, or `very-thorough`, use that as
   the thoroughness level and treat the rest as the goal.
2. Otherwise default thoroughness to `medium` and treat the entire input as the goal.
3. If the input is empty, ask me for the goal and thoroughness before forking.

## Pre-fork planning (required)

Before invoking the `subagent` tool:

1. Decide the subagent's working directory — usually the session's current directory, but override
   if the investigation is scoped to a specific path.
2. Identify the concrete artifacts the subagent must examine: files, patterns, symbols, or
   questions. Avoid forking with vague goals — refine first.
3. Decide the output format: one of
   - "inventory": file-by-file catalogue.
   - "report": structured sections (A/B/C/…), each answering one question.
   - "trace": flow-based — "X goes to Y goes to Z".
   - "comparison": tabular — "here are the options and their tradeoffs".
4. If any of the above is unclear, ask me one clarifying question, then proceed.

## Subagent prompt template

Fork the `@explore` subagent with a prompt built from this template:

```
Working directory: <cwd-or-override>
Thoroughness: <quick|medium|thorough|very-thorough>
Read-only: YES. DO NOT EDIT ANY FILES.

GOAL
<one-paragraph statement of the investigation's purpose>

INVESTIGATION TASKS
<numbered list, each concretely actionable>

OUTPUT FORMAT
<inventory / report / trace / comparison, with section headers>
```

Fill each placeholder from the parsed input and my answers to any clarifying questions.

## Post-fork handling

- When the subagent returns, summarize its findings in your own words (3–6 sentences) before pasting
  or referencing its full output.
- Flag any `CAPTURE-CANDIDATE:` tags that surfaced.
- Ask me whether to act on the findings or spawn a follow-up investigation.
