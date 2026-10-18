# NOTES — opencode-config

Rolling-context findings and framings for this repository. Durable cross-project hints graduate to
`AGENTS-HINTS.md` only via `/note` or `/session-end` with per-item approval.

## Large-write requests correlate with long tool spans (corrected 2026-09-28)

Confirmed in the combined rDLP ALIGN execution/status-check cohort: 71 of 902 completed requests
had cache writes ≥30,000 tokens and cache reads <5,000. Those requests accounted for $19.72 of
$44.67 recorded cost; 66 followed an assistant turn containing a tool span of at least five minutes.
The exact cohort, grouping method, and corrected role totals are in `PLAN.md` → Pilot results.

Inference: cache expiry plausibly makes large-context sessions sensitive to waits. Neither historical
TTL settings nor provider eviction decisions were verified. Recorded tool spans mix possible approval
latency, execution, and other blocking. Whole-request cost is not cache-write cost alone, avoidable
waste, or a savings estimate. The previous universal claim about every five-minute wait was too strong.

Design implication: measure context size and cache behavior alongside request count; retain required
checks and human approval participation. Compare equivalent workloads before prescribing shorter
driver sessions or longer cache TTL. The pilot did not measure improvements in reasoning quality.
