# Artifact hygiene: plan register, annealing, boundary review

Keeps planning vocabulary out of durable artifacts. Used by sharding (seed, denylist), execution
(REGISTER block, boundary procedures), and standalone `/plan-anneal`. The derivation is in
`rationale.md`.

## Two vocabularies

- **Domain invariants** are content: the actual property, reason, or invariant (e.g. the walk-state
  invariant `W = a·G + b·Q`; "known-answer test"). They belong in code, tests, and human docs and
  are never touched.
- **Plan coordinates** are registration marks: session ids, category letters, ◆, "frozen contract",
  sub-track names, numbered principles, phase names, stage labels, PLAN/ROADMAP references. They are
  load-bearing in rolling docs (PLAN, ledger, digest, commit messages) and dangling pointers in
  shipped artifacts. In durable files each is *translated* into the property it stood for, never
  merely deleted ("KAT for S4" becomes "known-answer test for the walk-state invariant
  `W = a·G + b·Q`", not an empty hole).

Three checks stay distinct and none certifies another: **coordinate-pattern triage** (grep hits),
**contextual planning-reference review** (reading prose for what patterns cannot name), and
**stale-claim verification** (obsolete assertions in ordinary domain language).

## REGISTER block (dispatch)

Every `@build` dispatch in a chain includes this block verbatim:

```
REGISTER (durable artifacts)
In code, tests, and human docs, state the actual property, reason, or invariant — never the
plan coordinate. Plan vocabulary (session ids, contract and category labels, numbered principles,
phase names, stage labels such as "F-stage"/"C-stage", "frozen contract", sub-track names, "the
plan's ...", PLAN/ROADMAP references, and paraphrases of any of these) belongs in PLAN, the ledger,
and commit messages only.
E.g. "known-answer test for the walk-state invariant W = a·G + b·Q", not "KAT for S4".
```

## Project `AGENTS.md` seed

Sessions outside a chain never see dispatch templates, so `/plan-shard` appends this block,
verbatim, to the target project's `AGENTS.md` (creating the file with just this block if none
exists), behind the confirm-before-write gate (a prompted write outside `@architect`'s auto-allowed
docs):

```
## Register in durable files

In code, tests, and human docs, state the actual property, reason, or invariant — never the
plan coordinate (session ids, contract and category labels, numbered principles, phase names,
sub-track names, "frozen contract", "the plan's ...", references to plan or roadmap files, and
paraphrases of any of these). Plan vocabulary lives in the rolling plan docs, the ledger, and
commit messages only.
```

Idempotent: skip if a `## Register in durable files` heading is already present. Keep it
self-contained: no pointer into PLAN or ROADMAP (it is durable; they are not) and no denylist or
pattern copy (the gates read PLAN's, or fall back to the seed below). Because it names the
vocabulary it prohibits, `AGENTS.md` is excluded from anneal sweeps.

## Anneal candidate seed (canonical)

The one authoritative pattern list. Sharding copies it into PLAN's `## Notes for executors`, where a
project may tune it (drop patterns that collide with domain vocabulary, add its own); the gates use
PLAN's list when present, else this one. Patterns are **candidate detectors, not bans**: each match
needs contextual triage. Mathematical symbols, algorithmic phases, domain principles, literal
identifiers, and historical quotations are retained when legitimate; never treat all Greek letters
or every "phase" as violations. "KAT"/"known-answer test" is domain vocabulary and is not listed.
Syntax is ripgrep (the Grep tool's engine, Unicode-aware):

```
\bS[0-9]+\b                                    plan session ids
sub-track
frozen contract
PLAN\.md
ROADMAP\.md
action-frame
◆
\bCat(egory)?[ -][A-Z]\b                       category labels: Cat B, Cat-C, Cat I
plan-(run|shard|juncture)
\b[A-Z]{1,2}-[A-Z]+[0-9][A-Za-z0-9]*\b         alphanumeric contract labels: C-F2m
(?i)\bprinciples?[ -]?[0-9]+\b                 numbered: principle 4, Principle-4, Principle4
(?i)\bthe plan['’]s\b                          plan possessives (straight and curly apostrophe)
(?i)\b(phase|session|stage)[ -][α-ωΑ-Ω]\b     Greek phase/session labels: Phase β, session γ
(?i)\b[α-ωΑ-Ω][ -](phase|session|stage)\b     the reversed order: α-phase
```

Expected legitimate matches: "phase φ" of a signal, an algorithm's own phase names, a domain
identifier that fits a label shape (`SHA-256` and `UTF-8` do not match). A paraphrase outside these
patterns ("the second milestone", "as agreed earlier") is not detectable by grep; the contextual
review exists for it. The denylist targets coordinates, not domain terms: if a project's list has
drifted to include one, stop and tell the user to tune it in PLAN rather than annealing away
content.

**Sweep scope.** In scope: source, tests, human docs (`docs/**` narrative prose, `PEDAGOGY.md`),
inline docstrings and comments. Excluded: PLAN, ROADMAP, NOTES, the project's `AGENTS.md`,
`.git/**`, and any file whose whole job is to hold coordinates.

## Triage

Decide each hit:

- **Genuine leak:** a plan coordinate standing in for a property (`"KAT for S4"`, `"see the frozen
  contract from the substrate sub-track"`, `"this is the Cat B algorithm"`) → translate.
- **Legitimate match:** a real domain symbol, phase, principle, literal identifier, or historical
  quotation → leave it and note it as a pattern-tuning hint.
- **Uncertain referent:** neither guess-edit nor dismiss. Standalone: list it under "needs-human",
  file unchanged. In a chain: pass it to the boundary fork and record it in the boundary note.

## Contextual planning-reference review

A clean grep proves only that its patterns found nothing. Independently of grep, read the durable
prose, with its surrounding surviving context and including source and test comments and docstrings
(not only Markdown), for planning references the patterns cannot name: paraphrases of plan
structure, milestone or phase names, "as agreed earlier". Triage finds exactly like grep hits. For a
very large scope, read the changed files and the surrounding files they touch, and state that limit;
never certify a scope clean on the strength of grep alone.

## Boundary review obligations (◆, in a chain)

The driver gathers, mechanically, before forking; the fork judges.

1. **Anneal gate.** Grep the sub-track's durable files (sweep scope above) against the denylist;
   triage; genuine leaks go to one `@build` anneal-fix dispatch; legitimate matches are noted in the
   boundary note; uncertain referents go to the fork.
2. **Stale-claim candidates.** From the digest and ledger, list the claims this sub-track corrected,
   invalidated, or flexed. For each, search the durable surfaces it touches (human docs, comments,
   tests), including unchanged sections, for surviving formulations: the claim's own terms and
   obvious paraphrases, not a whole-repository audit. Record each hit as `file:line` with the claim
   it may contradict. "No claims" or "no hits" is a stated result, not an omission. The anneal gate
   cannot certify this sweep.
3. **Planning-reference review inputs.** The sub-track's changed durable-file list
   (`git diff --name-only` over the range, minus the sweep exclusions); a recoverable diff range
   (the commit preceding the sub-track's first session commit, from the ledger, through the current
   tip); and the anneal grep result (patterns used, hits with triage, uncertain hits, or an explicit
   "zero hits").
4. **The fork** classifies each stale-claim candidate against the corrected contract and its
   evidence as a contradiction, a harmless historical quotation, or a keyword match; reads the
   changed prose for leaked planning references per the contextual review above; and reports each
   leak as `file:line`, uncertain referents separately, and any scope limit that kept the review
   incomplete. The review is part of the one boundary fork, not a second fork.
5. **Outcome.** Contradictions and leaks get one bounded `@build` correction (`execution.md` step
   7); what still stands after it is reported, not certified. Costs stay limited to claims this
   sub-track affected; this adds no verdict, phase, or loop.

## Standalone annealing (`/plan-anneal`)

Whole-project, on-demand form of the boundary anneal gate: use it when a chain ran without the gate,
when per-sub-track scope missed cross-cutting leaks, or as a final pass before a PLAN is archived.
It runs from `@build` and steers turn by turn (each Edit reacts to the grep state and the gate to
the edits), so it is never forked. Procedure:

1. **Scope.** The command's supplied argument, if any, is a path or glob narrowing the sweep; empty
   means the whole project. Use `workdir` set to the project root.
2. **Denylist.** PLAN's `## Notes for executors` list if present (read PLAN, normally
   `docs/PLAN.md`), else the canonical seed above. Do not work from memory.
3. **Scan** the in-scope durable files with each pattern; collect file, line, and matched
   coordinate.
4. **Triage** each hit, then do the contextual read.
5. **Translate** genuine leaks with `Edit` (never `sed -i` or another in-place shell edit): replace
   the coordinate with the standalone property it points at, making the narrowest correct edit.
   Recover the referent from surrounding code/test/doc, from the contract the coordinate named, or
   read-only from PLAN's `## Cross-session contracts`. If it cannot be recovered with confidence, do
   not invent one: flag it "needs-human".
6. **Verify green.** Run the project's test and type gate, discovered rather than assumed
   (`Makefile` test/typecheck targets; `tox` analyze; `package.json` scripts; else ask). A green
   gate confirms nothing behavioural moved. Red → fix the narrowest cause and rerun; this counts in
   the loop budget below. Under a supplied declared cadence, load `verification.md`.
7. **Re-scan** the patterns and re-read the prose you edited or flagged. Loop steps 4–7 until: clean
   (only noted legitimate matches or needs-human items remain); or two consecutive iterations with
   no reduction in the genuine-leak count; or four iterations. On a non-clean stop, summarize what
   remains and ask for direction; do not grind. This budget is the annealer's own and is unrelated
   to a driver's corrective-dispatch budget.
8. **Line-length pass** (below), then rerun step 6.

Constraints: never edit PLAN, ROADMAP, NOTES, `AGENTS.md`, or commit messages (they legitimately
hold coordinates); write only durable source, test, and doc files. Translate, never merely delete.
Domain vocabulary is off-limits. Does not commit: the tree is left dirty with green tests and the
translations applied. Does not push or rewrite history.

**Exit report:** scope swept and denylist source (PLAN override / canonical seed) plus
contextual-read coverage and any scope limit; genuine leaks translated (count, short before→after
list); legitimate matches left (count, producing patterns as tuning hints); needs-human items (file,
line, coordinate); line-length pass (lines rewrapped, unwrappable lines left); final status
**clean** / **stuck** / **needs-human**; verify-gate result; files modified (`git diff --stat`).

## Line length

Agents hold the line-width limit (`AGENTS.md`, Formatting conventions), leaving a few lines slightly
over. **A line-length overrun is never a reason to extend a session, open a Fix-loop iteration, or
dispatch a fix.** The executing agent notes it in the ledger (file and rough count) and moves on.
The standalone pass rewraps them in one fresh context: find in-scope durable lines over the width
(the project's formatter or linter if it reports them, never a local formatter outside the project's
dev/CI environment; else grep `.{101,}` at the current 100-character limit), rewrap them with `Edit`
without touching lines already within the width, and skip lines that cannot wrap (URLs, long
literals, tables).

Exception: a project gate that hard-fails on line length (e.g. a lint rule in the combined gate) is
a green-gate requirement, not cosmetic; fix it in-session with the project formatter. The default
`Anneal cleanup (skippable)` row exists to run this pass; the driver may waive it (`execution.md`
step 1).
