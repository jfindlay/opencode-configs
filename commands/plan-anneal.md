---
description: "[jf] Sweep a project's durable files (source, tests, human docs) for leaked plan coordinates — session ids, category letters, ◆, 'frozen contract', sub-track names, PLAN/ROADMAP references — and translate each into a standalone statement of the actual property, reason, or invariant. The manually-invokable whole-project form of the per-sub-track anneal gate /plan-run runs at each ◆ boundary. Mechanical grep-against-denylist + Edit-fix loop; verifies green; never edits rolling docs. Args: [scope-path-or-glob]."
agent: build
---

# /plan-anneal

Remove leaked **plan coordinates** from a project's durable artifacts and resolve each into a
standalone statement of the property it stands for. This is the whole-project, on-demand form of the
per-sub-track anneal gate `/plan-run` runs automatically at each ◆ sub-track boundary (step 7). Use
it when a chain ran without the gate, when the gate's per-sub-track scope missed cross-cutting
leaks, or as a final pass before a PLAN is archived and its coordinates become dangling pointers.

Runs from `@build` (T1). The sweep is mechanical — grep against a denylist, then translate each hit
— with one thin judgment layer: distinguishing a genuine plan-coordinate leak from legitimate domain
vocabulary (see step 4). If invoked from another agent, proceed; nothing here needs a higher tier.

Scope (optional): $ARGUMENTS

# No fork: this command steers turn-by-turn — each Edit reacts to the grep state, and the verify
# gate reacts to the edits. Forking would lose the iterative translate-verify cycle (same reason
# format-loop and test-loop stay in-agent).

## The distinction this command enforces

Two vocabularies, from `multisession/multi-session-planning.md` ("Register discipline: plan
coordinates stay in the margin"):

- **Domain invariants** — content. The actual property, reason, or invariant (e.g. the walk-state
  invariant `W = a·G + b·Q`; "known-answer test"). These *belong* in code, tests, and human docs.
  Never touch them.
- **Plan coordinates** — registration marks. Session ids, category letters, ◆, "frozen contract",
  sub-track names, PLAN/ROADMAP references. Load-bearing in the rolling docs (PLAN, ledger, digest,
  commit messages) while the defining PLAN is co-present; dangling pointers in the shipped artifact
  once the PLAN is archived. These must be **trimmed** from durable files — translated into the
  standalone property they point at, not merely deleted.

The printer's-marks analogy: registration and cut marks live outside the trim line; this command is
the trim. A leaked coordinate is replaced by the thing it referenced ("known-answer test for the
walk-state invariant `W = a·G + b·Q`"), not by nothing ("KAT for S4" → delete leaves a hole).

## Steps

1. **Resolve scope.** `$ARGUMENTS`, if present, is a path or glob narrowing the sweep (a directory,
   a crate, a `src/**` glob). Empty → the whole project tree. Use `workdir` set to the project root
   — never `cd <root> && <cmd>`.

2. **Resolve the denylist.** Check for a per-project denylist in `docs/PLAN.md`'s
   `## Notes for executors` (the tunable list `/plan-shard` seeds and the ◆ gate greps). If present,
   use it. If absent, use the seed default (identical to `/plan-run` step 7):

   ```
   \bS[0-9]+\b      (plan session ids)
   sub-track
   frozen contract
   PLAN\.md
   ROADMAP\.md
   action-frame
   ◆
   \bCat [ABC]\b
   plan-(run|shard|juncture)
   ```

   The denylist targets plan coordinates, **not** domain terms. "KAT"/"known-answer test" is
   legitimate crypto-library vocabulary and is not on the list; if a project's denylist has drifted
   to include a domain term, stop and tell the user to tune it in PLAN rather than annealing away
   real content.

3. **Scan.** Grep each denylist pattern over the in-scope **durable** files only:
   - **Include:** source, tests, human docs (`docs/**` narrative prose, `PEDAGOGY.md`, inline
     docstrings and comments).
   - **Exclude:** the rolling/static docs and git metadata — `docs/PLAN.md`, `docs/ROADMAP.md`,
     `docs/NOTES.md`, `.git/**`, and any file whose whole job is to hold coordinates. Plan
     coordinates are *supposed* to live there; annealing them there is wrong.

   Collect every hit with its file, line, and the matched coordinate.

4. **Triage each hit (the one judgment step).** For each match decide:
   - **Genuine leak** — the token is a plan coordinate standing in for a property (`"KAT for S4"`,
     `"see the frozen contract from the substrate sub-track"`, `"this is the Cat B algorithm"`).
     → translate (step 5).
   - **False positive / legitimate domain use** — the pattern matched a real domain symbol, not a
     coordinate (a variable literally named `S4`; a sentence about a "sub-track" of a railway in a
     docstring's example). → leave it, and note it in the exit report so the user can tighten the
     denylist.

   When genuinely unsure whether a hit is a leak or content, do **not** guess-edit: list it under
   "needs-human" in the exit report and leave the file unchanged.

5. **Translate genuine leaks via `Edit`.** Replace each leaked coordinate with the standalone
   property it points at — the actual invariant, reason, or interface name. Recover the referent
   from the surrounding code/test/doc, from the contract the coordinate named, or (read-only) from
   PLAN's `## Cross-session contracts` if the coordinate is a contract id. Make the narrowest correct
   edit. Never use `sed -i` or any bash in-place edit — use the `Edit` tool for diff preview and undo.
   - If the referent cannot be recovered with confidence, do not invent one: flag the hit as
     "needs-human" and move on.

6. **Verify green.** After the edits, run the project's test + type gate (discover it, don't assume
   `make`: `Makefile` test/typecheck targets → `make test` / `make typecheck`; `tox` → the analyze
   invocation; `package.json` scripts → `npm test`; else ask). Translations touch comments/docstrings
   and occasionally test names, so a green gate confirms nothing behavioural moved. Red → fix the
   narrowest cause and re-run (this is part of the loop budget below).

7. **Re-scan.** Re-grep the denylist over the in-scope durable files. Loop steps 4–7 until:
   - **Clean** — no genuine leaks remain (only noted false positives / needs-human items), OR
   - 2 consecutive iterations with no reduction in genuine-leak count (not converging), OR
   - a hard cap of 4 iterations.

   In any non-clean stop: summarize what remains and ask for direction. Do not grind.

## Constraints

- **Never edit the rolling/static docs.** `docs/PLAN.md`, `docs/ROADMAP.md`, `docs/NOTES.md`, and
  commit messages legitimately hold plan coordinates — that is the whole point of the two-vocabulary
  split. This command reads PLAN (to recover referents) but writes only durable source/test/doc
  files.
- **Translate, never merely delete.** A trimmed coordinate is replaced by its referent. Deleting a
  coordinate and leaving a hole loses the content the coordinate was standing in for.
- **Domain vocabulary is off-limits.** If a denylist pattern matches real domain content, the
  denylist is wrong — surface it, do not anneal the content away.
- **Does not commit.** Leaves the tree dirty with green tests and the translations applied. Commit
  separately (`/commit`) or let the surrounding chain commit. This mirrors the in-loop anneal-fix,
  which leaves the commit to the driver.
- **Does not push, does not rewrite history.**

## Exit report

- Scope swept (path/glob or "whole project") and the denylist source (PLAN override / seed default).
- Genuine leaks translated: count, with a short before→after list.
- False positives left in place: count, with the patterns that produced them (denylist-tuning hint).
- Needs-human items: leaks whose referent could not be recovered — file, line, and the coordinate.
- Final status: **clean** / **stuck** (non-converging, with remaining leaks) / **needs-human**.
- Verify gate result (green / the failure, if the loop stopped red).
- Files modified (from `git diff --stat`).
