// Helpers stay outside plugins/ so discovery never loads them as entrypoints.
// Thresholds are provisional advisory triggers, not budgets or established optima.
export const SETTINGS = {
  costWarnUsd: 5,
  stepsWarnCount: 100,
  maxNoticesPerSession: 3,
  maxNoticeChars: 500,
  maxTaskReportChars: 500,
};

export function resolveMode(env = process.env) {
  const raw = env.OPENCODE_SESSION_ECONOMICS;
  if (raw === undefined) return "observe";
  if (["off", "observe", "advisory"].includes(raw)) return raw;
  logBounded("invalid-mode", { fallback: "observe" });
  return "observe";
}

export function logBounded(event, details) {
  try {
    console.error(JSON.stringify({ plugin: "session-economics", event, ...details }));
  } catch {
    // Logging must not fail work.
  }
}

export function createStore() {
  return new Map();
}

export function ensureState(store, sessionID) {
  if (!store.has(sessionID)) {
    store.set(sessionID, {
      steps: new Map(), noticesFired: new Set(), noticesSent: 0, reported: false,
      parentID: undefined, agent: undefined,
      // True once this session's location was verified; later events may omit the location.
      located: false,
    });
  }
  return store.get(sessionID);
}

/** Record a completed primary request by assistant-message identity and durable event sequence. */
export function recordStepFinish(store, step) {
  if (typeof step.id !== "string" || !Number.isInteger(step.seq)) return;
  const state = ensureState(store, step.sessionID);
  const previous = state.steps.get(step.id);
  if (!previous || step.seq > previous.seq) {
    state.steps.set(step.id, { cost: step.cost, seq: step.seq });
  }
  return state;
}

export function sessionCost(store, sessionID) {
  const state = store.get(sessionID);
  if (!state?.steps.size) return null;
  let total = 0;
  for (const { cost } of state.steps.values()) {
    if (!Number.isFinite(cost) || cost < 0) return null;
    total += cost;
  }
  return total;
}

export function sessionStepCount(store, sessionID) {
  return store.get(sessionID)?.steps.size ?? 0;
}

const WORKERS = new Set(["build", "general", "explore"]);
const EXCLUDED = new Set(["committer", "git-editor", "title", "summary", "compaction"]);

export function classifyAgent(agent) {
  if (agent === undefined) return "unknown";
  if (WORKERS.has(agent)) return "worker";
  return EXCLUDED.has(agent) ? "excluded" : "other";
}

/** Treat result IDs as candidates only; callers must verify the child's parent and role. */
export function extractChildSessionID(value) {
  if (!value || typeof value !== "object") return;
  const keys = ["sessionID", "sessionId", "session_id", "childSessionID", "child_session_id"];
  for (const key of keys) {
    if (typeof value[key] === "string" && value[key].length) return value[key];
  }
}

export function evaluateThresholds(store, sessionID, settings = SETTINGS) {
  const state = ensureState(store, sessionID);
  const cost = sessionCost(store, sessionID);
  const steps = sessionStepCount(store, sessionID);
  const newlyFired = [];
  for (const [kind, value, threshold] of [
    ["cost", cost, settings.costWarnUsd], ["steps", steps, settings.stepsWarnCount],
  ]) {
    if (value !== null && value >= threshold && !state.noticesFired.has(kind)) {
      state.noticesFired.add(kind);
      newlyFired.push({ kind, value });
    }
  }
  return { cost, steps, newlyFired };
}

function capText(text, max) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}\u2026`;
}

function formatCost(cost) {
  return cost === null ? "unavailable" : `$${cost.toFixed(2)}`;
}

export function formatNotice(newlyFired, cost, steps, settings = SETTINGS) {
  const triggers = newlyFired.map(({ kind }) => kind).join("/");
  return capText(
    `[session-economics] ${triggers} threshold: recorded primary-step cost ${formatCost(cost)}, ` +
    `${steps} completed API steps observed since attachment; capacity unavailable. ` +
    `Not billing or a lifetime total. Reassess briefly (uncertainty, acceptance work owed, next ` +
    `bounded action), then continue when justified.`,
    settings.maxNoticeChars,
  );
}

export function formatTaskReport(cost, steps, settings = SETTINGS) {
  return capText(
    `[session-economics] Child tool returned — recorded primary-step cost ${formatCost(cost)}, ` +
    `${steps} completed API steps observed since plugin attachment; capacity unavailable. ` +
    `Not provider billing or a lifetime total; final events may still be in transit.`,
    settings.maxTaskReportChars,
  );
}
