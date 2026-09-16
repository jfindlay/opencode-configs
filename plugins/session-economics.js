// Session economics safeguards: measures cost, API-step count, and a last-completed-request
// capacity estimate per session, and delivers bounded, occasional advisories asking an agent to
// briefly reassess — never a stop, a resharding trigger, or a context-rewrite mechanism. See
// PLAN.md for the accounting/delivery contracts this implements and
// multisession/multi-session-planning.md for the cost/capacity/integrity distinction. Deliberately
// excludes context GC, pruning, summarization, transcript access, and automatic abort/pause/resume.
//
// Verified against the installed runtime (v1.18.31) source:
// packages/opencode/src/session/overflow.ts (usable()/isOverflow()) and
// packages/opencode/src/provider/transform.ts (maxOutputTokens()). The public SDK's `Model.limit`
// never exposes the internal `.input` field that upstream's `usable()` branches on, so this module
// always takes the `context - maxOutputTokens` branch — the same branch upstream takes whenever a
// model's internal `limit.input` is unset. This is a documented simplification, not a guess.
//
// Modes (env `OPENCODE_SESSION_ECONOMICS`): "off" registers no hooks. "observe" (default) accounts
// silently and logs bounded summaries; it never touches model-facing output. "advisory" also
// appends the bounded notices/report described below. Invalid values fall back to "observe" with
// one diagnostic.

// ---------------------------------------------------------------------------
// Settings — one block, no configuration framework. Pilot-tunable starting points, not optima.
// ---------------------------------------------------------------------------

export const SETTINGS = {
  costWarnUsd: 5,
  stepsWarnCount: 100,
  capacityWarnFraction: 0.7,
  maxNoticesPerSession: 3,
  maxNoticeChars: 500,
  maxTaskReportChars: 500,
  // Mirrors OUTPUT_TOKEN_MAX in packages/opencode/src/provider/transform.ts (v1.18.31).
  defaultOutputTokenMax: 32_000,
};

const VALID_MODES = new Set(["off", "observe", "advisory"]);

/**
 * Resolve the plugin's operating mode from the environment.
 *
 * :param env: environment map to read from (defaults to ``process.env``).
 * :returns: one of ``"off" | "observe" | "advisory"``; invalid values fall back to ``"observe"``.
 */
export function resolveMode(env = process.env) {
  const raw = env.OPENCODE_SESSION_ECONOMICS;
  if (raw === undefined) return "observe";
  if (VALID_MODES.has(raw)) return raw;
  logBounded("invalid-mode", { received: raw, fallback: "observe" });
  return "observe";
}

// ---------------------------------------------------------------------------
// Bounded structured logging — no bespoke logger exists in this repo's plugins; this is the safe
// minimal choice. Bounded metadata only: never tool bodies, source, or secrets.
// ---------------------------------------------------------------------------

function logBounded(event, details) {
  try {
    console.error(JSON.stringify({ plugin: "session-economics", event, ...details }));
  } catch {
    // Logging must never throw into the caller's hook.
  }
}

// ---------------------------------------------------------------------------
// Per-session accounting state. In-memory only, bounded to active sessions, no persistence.
// ---------------------------------------------------------------------------

function newSessionState() {
  return {
    // partID -> {cost, tokens}, deduplicated by stable identity (never summed blindly).
    steps: new Map(),
    // Most recent completed step's token usage, for the capacity estimate.
    latestTokens: null,
    // {providerID, modelID} for the most recent completed step, resolved via its message.
    latestModelRef: null,
    // Threshold names already fired, so each fires at most once per session.
    noticesFired: new Set(),
    // Count of model-facing notices actually delivered (advisory mode only), capped.
    noticesSent: 0,
  };
}

/** Create a fresh, empty accounting store (sessionID -> state). */
export function createStore() {
  return new Map();
}

function ensureState(store, sessionID) {
  let state = store.get(sessionID);
  if (!state) {
    state = newSessionState();
    store.set(sessionID, state);
  }
  return state;
}

/** Discard a session's accounting state at a defined cleanup boundary. */
export function forgetSession(store, sessionID) {
  store.delete(sessionID);
}

/**
 * Record one completed model-API step, deduplicated by the step-finish part's stable id.
 *
 * Updates may repeat or arrive out of order; recording by identity (replace, not accumulate)
 * keeps the result idempotent regardless of delivery order.
 */
export function recordStepFinish(store, part) {
  const state = ensureState(store, part.sessionID);
  state.steps.set(part.id, { cost: part.cost, tokens: part.tokens });
  state.latestTokens = part.tokens;
  return state;
}

/** Total cost of a session's distinct completed steps, in USD. */
export function sessionCost(store, sessionID) {
  const state = store.get(sessionID);
  if (!state) return 0;
  let total = 0;
  for (const step of state.steps.values()) total += step.cost;
  return total;
}

/** Count of a session's distinct completed model-API steps (not messages, not tool calls). */
export function sessionStepCount(store, sessionID) {
  const state = store.get(sessionID);
  return state ? state.steps.size : 0;
}

// ---------------------------------------------------------------------------
// Capacity estimate — mirrors packages/opencode/src/session/{overflow,provider/transform}.ts
// on the branch reachable from the public SDK's Model type (see module header note).
// ---------------------------------------------------------------------------

/** Mirrors `ProviderTransform.maxOutputTokens()`. */
export function maxOutputTokens(model, outputTokenMax = SETTINGS.defaultOutputTokenMax) {
  return Math.min(model.limit.output, outputTokenMax) || outputTokenMax;
}

/** Mirrors the reachable branch of `overflow.usable()`: usable input tokens before overflow. */
export function usableContext(model) {
  const context = model.limit.context;
  if (!context) return 0;
  return Math.max(0, context - maxOutputTokens(model));
}

/**
 * Fraction of usable context the given step's tokens occupied, mirroring `overflow.isOverflow()`'s
 * token count (input + output + cache.read + cache.write; reasoning excluded, matching upstream).
 *
 * :returns: a fraction, or ``null`` when tokens or model limits are unavailable — unavailable is
 *   distinct from zero.
 */
export function capacityFraction(tokens, model) {
  if (!tokens || !model) return null;
  const usable = usableContext(model);
  if (!usable) return null;
  const count = tokens.input + tokens.output + tokens.cache.read + tokens.cache.write;
  return count / usable;
}

// ---------------------------------------------------------------------------
// Role / parent linkage — verified session metadata only, never titles or prompt matching.
// ---------------------------------------------------------------------------

const WORKER_AGENTS = new Set(["build", "general", "explore"]);
// Excluded even when parented: no economics signal is meaningful for these roles.
const EXCLUDED_AGENTS = new Set(["committer", "git-editor", "title", "summary", "compaction"]);

/** Classify a cached agent name into "worker" | "excluded" | "other" | "unknown" (not yet seen). */
export function classifyAgent(agentName) {
  if (agentName === undefined) return "unknown";
  if (EXCLUDED_AGENTS.has(agentName)) return "excluded";
  if (WORKER_AGENTS.has(agentName)) return "worker";
  return "other";
}

/**
 * Best-effort extraction of a completed "task" tool's spawned child session id from its metadata.
 * The public SDK types this field as `unknown` — several plausible keys are tried; if none match,
 * callers must fall back to the unambiguous-parent-scan or skip (observe-only), never guess from
 * titles or prompt text.
 */
export function extractChildSessionID(metadata) {
  if (!metadata || typeof metadata !== "object") return undefined;
  for (const key of ["sessionID", "session_id", "childSessionID", "child_session_id"]) {
    const value = metadata[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

/**
 * Fall back to the parent/agent cache (fed only by verified `session.created`/`session.updated`
 * events) when task metadata does not name the child. Returns a session id only when exactly one
 * unreported worker child is attributable to this parent — concurrent children are genuinely
 * ambiguous without a verified call-id/session-id link, and misattribution is worse than silence.
 */
export function findSoleUnreportedWorkerChild(
  parentByID,
  agentByID,
  reportedChildren,
  parentSessionID,
) {
  const candidates = [];
  for (const [sessionID, parentID] of parentByID) {
    if (parentID !== parentSessionID) continue;
    if (reportedChildren.has(sessionID)) continue;
    if (classifyAgent(agentByID.get(sessionID)) !== "worker") continue;
    candidates.push(sessionID);
  }
  return candidates.length === 1 ? candidates[0] : undefined;
}

// ---------------------------------------------------------------------------
// Threshold evaluation and bounded notice text.
// ---------------------------------------------------------------------------

/**
 * Evaluate the three advisory thresholds against a session's current totals, marking any
 * newly-crossed threshold as fired (each fires at most once per session; simultaneous crossings
 * are returned together so callers can group them into one notice).
 */
export function evaluateThresholds(store, sessionID, tokens, model, settings = SETTINGS) {
  const state = ensureState(store, sessionID);
  const cost = sessionCost(store, sessionID);
  const steps = sessionStepCount(store, sessionID);
  const capacity = capacityFraction(tokens, model);
  const newlyFired = [];
  if (cost >= settings.costWarnUsd && !state.noticesFired.has("cost")) {
    state.noticesFired.add("cost");
    newlyFired.push({ kind: "cost", value: cost });
  }
  if (steps >= settings.stepsWarnCount && !state.noticesFired.has("steps")) {
    state.noticesFired.add("steps");
    newlyFired.push({ kind: "steps", value: steps });
  }
  const capacityWarned = capacity !== null && capacity >= settings.capacityWarnFraction;
  if (capacityWarned && !state.noticesFired.has("capacity")) {
    state.noticesFired.add("capacity");
    newlyFired.push({ kind: "capacity", value: capacity });
  }
  return { cost, steps, capacity, newlyFired };
}

function capText(text, max) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}\u2026`;
}

/** Compose a bounded, grouped advisory notice for a worker's own newly-crossed thresholds. */
export function formatNotice(newlyFired, cost, steps, capacity, settings = SETTINGS) {
  const parts = newlyFired.map((f) => {
    if (f.kind === "cost") return `spend ~$${f.value.toFixed(2)}`;
    if (f.kind === "steps") return `${f.value} completed API steps`;
    return `~${Math.round(f.value * 100)}% of estimated usable context`;
  });
  const capacityNote = capacity !== null ? `, capacity ~${Math.round(capacity * 100)}%` : "";
  const text =
    `[session-economics] Observed ${parts.join(", ")} in this session ` +
    `(cost $${cost.toFixed(2)}, steps ${steps}${capacityNote}). This is a measurement, not a ` +
    `verdict — reassess briefly (uncertainty, acceptance work owed, next bounded action) and ` +
    `continue once that action is justified.`;
  return capText(text, settings.maxNoticeChars);
}

/** Compose a bounded, retrospective task-boundary report for a finished child worker session. */
export function formatTaskReport(cost, steps, capacity, settings = SETTINGS) {
  const capacityNote = capacity !== null ? `, latest capacity ~${Math.round(capacity * 100)}%` : "";
  const text =
    `[session-economics] Child session finished — cost $${cost.toFixed(2)}, ${steps} completed ` +
    `API steps${capacityNote}. Observed since plugin attachment; not asserted as a lifetime total.`;
  return capText(text, settings.maxTaskReportChars);
}

// ---------------------------------------------------------------------------
// Model catalog lookup (for the capacity estimate only). Fetched lazily, once, via the verified
// `config.providers` API — never assumed, never read from `opencode.db`.
// ---------------------------------------------------------------------------

async function getModel(client, catalog, providerID, modelID) {
  if (!providerID || !modelID) return undefined;
  const key = `${providerID}/${modelID}`;
  if (catalog.map.has(key)) return catalog.map.get(key);
  if (!catalog.fetched) {
    catalog.fetched = true;
    try {
      const result = await client.config.providers();
      const providers = result?.data?.providers ?? [];
      for (const provider of providers) {
        for (const [id, model] of Object.entries(provider.models ?? {})) {
          catalog.map.set(`${provider.id}/${id}`, model);
        }
      }
    } catch (error) {
      logBounded("model-catalog-unavailable", { message: String(error?.message ?? error) });
    }
  }
  return catalog.map.get(key);
}

// ---------------------------------------------------------------------------
// Plugin entry point.
// ---------------------------------------------------------------------------

export const SessionEconomics = async (input) => {
  const mode = resolveMode();
  if (mode === "off") return {};

  const store = createStore();
  const parentByID = new Map(); // sessionID -> parentID | null, fed only by verified session events
  const agentByID = new Map(); // sessionID -> agent name, fed only by the chat.message hook
  const modelByMessage = new Map(); // assistant messageID -> {providerID, modelID}
  const modelCatalog = { map: new Map(), fetched: false };
  const reportedChildren = new Set(); // child sessionIDs already given a task-boundary report

  async function resolveRole(sessionID) {
    const agentClass = classifyAgent(agentByID.get(sessionID));
    if (agentClass === "excluded") return "excluded";
    let parentID = parentByID.has(sessionID) ? parentByID.get(sessionID) : undefined;
    if (parentID === undefined) {
      try {
        const result = await input.client.session.get({ path: { id: sessionID } });
        parentID = result?.data?.parentID ?? null;
      } catch {
        parentID = null;
      }
      parentByID.set(sessionID, parentID);
    }
    if (!parentID) return "other";
    if (agentClass === "worker") return "worker";
    if (agentClass === "unknown") return "unknown";
    return "other";
  }

  return {
    event: async ({ event }) => {
      try {
        if (event.type === "message.part.updated" && event.properties.part.type === "step-finish") {
          const part = event.properties.part;
          const state = recordStepFinish(store, part);
          const modelRef = modelByMessage.get(part.messageID);
          if (modelRef) state.latestModelRef = modelRef;
        } else if (event.type === "message.updated" && event.properties.info.role === "assistant") {
          const info = event.properties.info;
          modelByMessage.set(info.id, { providerID: info.providerID, modelID: info.modelID });
        } else if (event.type === "session.created" || event.type === "session.updated") {
          const info = event.properties.info;
          parentByID.set(info.id, info.parentID ?? null);
        } else if (event.type === "session.deleted") {
          const info = event.properties.info;
          forgetSession(store, info.id);
          parentByID.delete(info.id);
          agentByID.delete(info.id);
          reportedChildren.delete(info.id);
        }
      } catch (error) {
        logBounded("event-hook-error", { message: String(error?.message ?? error) });
      }
    },

    "chat.message": async (hookInput) => {
      try {
        if (hookInput.agent) agentByID.set(hookInput.sessionID, hookInput.agent);
      } catch (error) {
        logBounded("chat-message-hook-error", { message: String(error?.message ?? error) });
      }
    },

    "tool.execute.after": async (hookInput, hookOutput) => {
      try {
        const sessionID = hookInput.sessionID;

        if (hookInput.tool === "task") {
          const childID =
            extractChildSessionID(hookOutput.metadata) ??
            findSoleUnreportedWorkerChild(parentByID, agentByID, reportedChildren, sessionID);
          if (childID && !reportedChildren.has(childID)) {
            const childRole = await resolveRole(childID);
            if (childRole === "worker") {
              reportedChildren.add(childID);
              const childState = store.get(childID);
              if (childState) {
                const cost = sessionCost(store, childID);
                const steps = sessionStepCount(store, childID);
                const model = childState.latestModelRef
                  ? await getModel(
                      input.client,
                      modelCatalog,
                      childState.latestModelRef.providerID,
                      childState.latestModelRef.modelID,
                    )
                  : undefined;
                const capacity = capacityFraction(childState.latestTokens, model);
                logBounded("task-boundary", { childID, cost, steps, capacity });
                if (mode === "advisory") {
                  const report = formatTaskReport(cost, steps, capacity);
                  hookOutput.output = `${hookOutput.output}\n\n${report}`;
                }
              }
              forgetSession(store, childID);
            }
          }
        }

        const workerRole = await resolveRole(sessionID);
        if (workerRole === "worker") {
          const state = ensureState(store, sessionID);
          if (state.noticesSent < SETTINGS.maxNoticesPerSession) {
            const model = state.latestModelRef
              ? await getModel(
                  input.client,
                  modelCatalog,
                  state.latestModelRef.providerID,
                  state.latestModelRef.modelID,
                )
              : undefined;
            const { cost, steps, capacity, newlyFired } = evaluateThresholds(
              store,
              sessionID,
              state.latestTokens,
              model,
            );
            if (newlyFired.length > 0) {
              const fired = newlyFired.map((f) => f.kind);
              logBounded("advisory", { sessionID, cost, steps, capacity, fired });
              if (mode === "advisory") {
                const notice = formatNotice(newlyFired, cost, steps, capacity);
                hookOutput.output = `${hookOutput.output}\n\n${notice}`;
                state.noticesSent += 1;
              }
            }
          }
        }
      } catch (error) {
        logBounded("tool-hook-error", { message: String(error?.message ?? error) });
      }
    },

    dispose: async () => {
      store.clear();
      parentByID.clear();
      agentByID.clear();
      modelByMessage.clear();
      modelCatalog.map.clear();
      reportedChildren.clear();
    },
  };
};
