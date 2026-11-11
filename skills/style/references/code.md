# Code Style (shared rules)

Language-agnostic code rules; load alongside the matching `code-<lang>.md` guide (routing lives in
`SKILL.md`). The register rules live in `doc.md` and the project instructions' `## Code conventions`
section.

## Configuration precedence

The prioritization of configuration or data should be conventional but is enumerated explicitly
anyway.  In order of decreasing priority:

1. Command line
2. Environment variables (Discouraged: environment is passive and side effective because there is no
   causal covariance between app use and its data)
3. Config file
4. Programatic defaults
