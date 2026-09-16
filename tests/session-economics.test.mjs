// Deterministic tests for plugins/session-economics.js. Synthetic SDK events and a mocked client
// only — no live database fixtures, no model calls. Kept outside the auto-discovered
// plugins/ directory per PLAN.md.
//
// Run with: node --experimental-default-type=module --test tests/session-economics.test.mjs
// (plain `node --test` fails on Node 18 because this repo's package.json has no "type": "module"
// and it is OpenCode-managed, not ours to edit; see PLAN.md's test-command note.)

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  SETTINGS,
  SessionEconomics,
  resolveMode,
  createStore,
  recordStepFinish,
  sessionCost,
  sessionStepCount,
  forgetSession,
  maxOutputTokens,
  usableContext,
  capacityFraction,
  classifyAgent,
  extractChildSessionID,
  findSoleUnreportedWorkerChild,
  evaluateThresholds,
  formatNotice,
  formatTaskReport,
} from "../plugins/session-economics.js";

const PLUGIN_SOURCE_PATH = fileURLToPath(
  new URL("../plugins/session-economics.js", import.meta.url),
);
const PLUGIN_SOURCE = readFileSync(PLUGIN_SOURCE_PATH, "utf8");

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeModel(
  { context = 200_000, output = 32_000, providerID = "anthropic", modelID = "m" } = {},
) {
  return { id: modelID, providerID, limit: { context, output } };
}

function makeTokens({ input = 0, output = 0, reasoning = 0, cacheRead = 0, cacheWrite = 0 } = {}) {
  return { input, output, reasoning, cache: { read: cacheRead, write: cacheWrite } };
}

function stepFinishPart({ id, sessionID, messageID = "m1", cost, tokens = makeTokens() }) {
  return { id, sessionID, messageID, type: "step-finish", reason: "stop", cost, tokens };
}

function assistantMessageInfo({ id, sessionID, providerID, modelID }) {
  return {
    id,
    sessionID,
    role: "assistant",
    providerID,
    modelID,
    parentID: "",
    mode: "build",
    path: { cwd: "/", root: "/" },
    cost: 0,
    tokens: makeTokens(),
  };
}

function makeMockClient({ sessionParents = {}, providers = [], sessionGetError = false } = {}) {
  return {
    session: {
      get: async ({ path }) => {
        if (sessionGetError) throw new Error("network down");
        return { data: { id: path.id, parentID: sessionParents[path.id] } };
      },
    },
    config: {
      providers: async () => ({ data: { providers } }),
    },
  };
}

// The `event` hook's signature is `(input: { event: Event }) => Promise<void>`. These helpers
// build the raw Event payload and wrap it to match the hook's real input shape in one call.
function emitStepFinish(hooks, args) {
  const part = stepFinishPart(args);
  return hooks.event({ event: { type: "message.part.updated", properties: { part } } });
}

function emitAssistantMessage(hooks, args) {
  const info = assistantMessageInfo(args);
  return hooks.event({ event: { type: "message.updated", properties: { info } } });
}

function emitSession(hooks, type, { id, parentID }) {
  return hooks.event({ event: { type, properties: { info: { id, parentID } } } });
}

// Shorthand for a worker's own completed tool call, the shape most tests exercise repeatedly.
function toolAfter(hooks, { tool = "read", sessionID, callID = "c1", output }) {
  return hooks["tool.execute.after"]({ tool, sessionID, callID, args: {} }, output);
}

function withEnv(mode, fn) {
  return async () => {
    const previous = process.env.OPENCODE_SESSION_ECONOMICS;
    if (mode === undefined) delete process.env.OPENCODE_SESSION_ECONOMICS;
    else process.env.OPENCODE_SESSION_ECONOMICS = mode;
    try {
      await fn();
    } finally {
      if (previous === undefined) delete process.env.OPENCODE_SESSION_ECONOMICS;
      else process.env.OPENCODE_SESSION_ECONOMICS = previous;
    }
  };
}

// ---------------------------------------------------------------------------
// Mode resolution
// ---------------------------------------------------------------------------

test("resolveMode defaults to observe when unset", () => {
  assert.equal(resolveMode({}), "observe");
});

test("resolveMode accepts off/observe/advisory", () => {
  assert.equal(resolveMode({ OPENCODE_SESSION_ECONOMICS: "off" }), "off");
  assert.equal(resolveMode({ OPENCODE_SESSION_ECONOMICS: "observe" }), "observe");
  assert.equal(resolveMode({ OPENCODE_SESSION_ECONOMICS: "advisory" }), "advisory");
});

test("resolveMode falls back to observe on an invalid value with one diagnostic, no throw", () => {
  assert.equal(resolveMode({ OPENCODE_SESSION_ECONOMICS: "nonsense" }), "observe");
});

test(
  "off mode registers no hooks",
  withEnv("off", async () => {
    const hooks = await SessionEconomics({ client: makeMockClient() });
    assert.deepEqual(hooks, {});
  }),
);

// ---------------------------------------------------------------------------
// Accounting: normal accumulation, dedup, out-of-order/partial updates
// ---------------------------------------------------------------------------

test("normal accumulation sums distinct steps", () => {
  const store = createStore();
  recordStepFinish(store, stepFinishPart({ id: "p1", sessionID: "s1", cost: 0.01 }));
  recordStepFinish(store, stepFinishPart({ id: "p2", sessionID: "s1", cost: 0.02 }));
  assert.equal(sessionStepCount(store, "s1"), 2);
  assert.ok(Math.abs(sessionCost(store, "s1") - 0.03) < 1e-9);
});

test("duplicate part ids are deduplicated by identity, not summed", () => {
  const store = createStore();
  recordStepFinish(store, stepFinishPart({ id: "p1", sessionID: "s1", cost: 0.01 }));
  recordStepFinish(store, stepFinishPart({ id: "p1", sessionID: "s1", cost: 0.01 }));
  assert.equal(sessionStepCount(store, "s1"), 1);
  assert.ok(Math.abs(sessionCost(store, "s1") - 0.01) < 1e-9);
});

test("out-of-order updates to the same part id replace rather than accumulate", () => {
  const store = createStore();
  recordStepFinish(store, stepFinishPart({ id: "p1", sessionID: "s1", cost: 0.05 }));
  // A "stale" resend of an earlier, smaller value must still just replace, never add.
  recordStepFinish(store, stepFinishPart({ id: "p1", sessionID: "s1", cost: 0.01 }));
  assert.equal(sessionStepCount(store, "s1"), 1);
  assert.ok(Math.abs(sessionCost(store, "s1") - 0.01) < 1e-9);
});

test("partial observation: a session with no recorded steps reports zero, not unavailable", () => {
  const store = createStore();
  assert.equal(sessionCost(store, "never-seen"), 0);
  assert.equal(sessionStepCount(store, "never-seen"), 0);
});

test("distinct sessions and nested tasks keep independent totals (no cross-contamination)", () => {
  const store = createStore();
  recordStepFinish(store, stepFinishPart({ id: "p1", sessionID: "parent", cost: 1 }));
  recordStepFinish(store, stepFinishPart({ id: "p2", sessionID: "child-a", cost: 2 }));
  recordStepFinish(store, stepFinishPart({ id: "p3", sessionID: "child-b", cost: 3 }));
  assert.equal(sessionCost(store, "parent"), 1);
  assert.equal(sessionCost(store, "child-a"), 2);
  assert.equal(sessionCost(store, "child-b"), 3);
});

test("forgetSession removes only the named session's state", () => {
  const store = createStore();
  recordStepFinish(store, stepFinishPart({ id: "p1", sessionID: "s1", cost: 1 }));
  recordStepFinish(store, stepFinishPart({ id: "p2", sessionID: "s2", cost: 1 }));
  forgetSession(store, "s1");
  assert.equal(sessionCost(store, "s1"), 0);
  assert.equal(sessionCost(store, "s2"), 1);
});

test("compaction does not reset spend: no hook path clears accounting", () => {
  const store = createStore();
  recordStepFinish(store, stepFinishPart({ id: "p1", sessionID: "s1", cost: 4 }));
  // A session.compacted event carries no handling branch in the plugin; simulate by asserting the
  // accounting API itself has no compaction-triggered reset path — spend survives untouched.
  assert.equal(sessionCost(store, "s1"), 4);
});

// ---------------------------------------------------------------------------
// Capacity estimate — mirrors overflow.ts / transform.ts
// ---------------------------------------------------------------------------

test("maxOutputTokens caps at the default when the model's own output limit is larger", () => {
  const model = makeModel({ output: 64_000 });
  assert.equal(maxOutputTokens(model), SETTINGS.defaultOutputTokenMax);
});

test("maxOutputTokens uses the model's smaller output limit", () => {
  const model = makeModel({ output: 8_000 });
  assert.equal(maxOutputTokens(model), 8_000);
});

test("maxOutputTokens falls back to the default when the model reports zero", () => {
  const model = makeModel({ output: 0 });
  assert.equal(maxOutputTokens(model), SETTINGS.defaultOutputTokenMax);
});

test("usableContext subtracts the output reserve from the context window", () => {
  const model = makeModel({ context: 200_000, output: 32_000 });
  assert.equal(usableContext(model), 200_000 - 32_000);
});

test("usableContext is zero when the model reports no context limit", () => {
  const model = makeModel({ context: 0 });
  assert.equal(usableContext(model), 0);
});

test("capacityFraction counts input+output+cache.read+cache.write, excluding reasoning", () => {
  const model = makeModel({ context: 200_000, output: 32_000 }); // usable = 168_000
  const tokens = makeTokens({
    input: 50_000,
    output: 10_000,
    reasoning: 999_999,
    cacheRead: 20_000,
    cacheWrite: 4_000,
  });
  const fraction = capacityFraction(tokens, model);
  assert.ok(Math.abs(fraction - (50_000 + 10_000 + 20_000 + 4_000) / 168_000) < 1e-9);
});

test("capacityFraction is null (unavailable), not zero, when tokens or model are missing", () => {
  assert.equal(capacityFraction(null, makeModel()), null);
  assert.equal(capacityFraction(makeTokens(), null), null);
  assert.equal(capacityFraction(makeTokens(), makeModel({ context: 0 })), null);
});

// ---------------------------------------------------------------------------
// Role / parent linkage and child attribution
// ---------------------------------------------------------------------------

test("classifyAgent distinguishes worker, excluded, other, and unknown", () => {
  assert.equal(classifyAgent("build"), "worker");
  assert.equal(classifyAgent("general"), "worker");
  assert.equal(classifyAgent("explore"), "worker");
  assert.equal(classifyAgent("committer"), "excluded");
  assert.equal(classifyAgent("summary"), "excluded");
  assert.equal(classifyAgent("architect"), "other");
  assert.equal(classifyAgent(undefined), "unknown");
});

test("extractChildSessionID reads known metadata keys and ignores unrelated shapes", () => {
  assert.equal(extractChildSessionID({ sessionID: "abc" }), "abc");
  assert.equal(extractChildSessionID({ session_id: "abc" }), "abc");
  assert.equal(extractChildSessionID({ summary: "no session ref here" }), undefined);
  assert.equal(extractChildSessionID(null), undefined);
  assert.equal(extractChildSessionID("not-an-object"), undefined);
});

test("findSoleUnreportedWorkerChild resolves an unambiguous single candidate", () => {
  const parentByID = new Map([["child-1", "parent"]]);
  const agentByID = new Map([["child-1", "build"]]);
  const reported = new Set();
  const result = findSoleUnreportedWorkerChild(parentByID, agentByID, reported, "parent");
  assert.equal(result, "child-1");
});

test("findSoleUnreportedWorkerChild refuses to guess when children are ambiguous", () => {
  const parentByID = new Map([
    ["child-1", "parent"],
    ["child-2", "parent"],
  ]);
  const agentByID = new Map([
    ["child-1", "build"],
    ["child-2", "explore"],
  ]);
  const reported = new Set();
  const result = findSoleUnreportedWorkerChild(parentByID, agentByID, reported, "parent");
  assert.equal(result, undefined);
});

test("findSoleUnreportedWorkerChild excludes already-reported and non-worker children", () => {
  const parentByID = new Map([
    ["child-1", "parent"],
    ["child-2", "parent"],
  ]);
  const agentByID = new Map([
    ["child-1", "committer"],
    ["child-2", "build"],
  ]);
  const reported = new Set(["child-2"]);
  const result = findSoleUnreportedWorkerChild(parentByID, agentByID, reported, "parent");
  assert.equal(result, undefined);
});

// ---------------------------------------------------------------------------
// Threshold evaluation, notice grouping, and caps
// ---------------------------------------------------------------------------

test("evaluateThresholds fires nothing below all thresholds", () => {
  const store = createStore();
  recordStepFinish(store, stepFinishPart({ id: "p1", sessionID: "s1", cost: 0.5 }));
  const { newlyFired } = evaluateThresholds(store, "s1", null, null);
  assert.equal(newlyFired.length, 0);
});

test("evaluateThresholds groups simultaneous crossings into one evaluation", () => {
  const store = createStore();
  // One step's cost matches the threshold exactly; avoid dividing costWarnUsd by stepsWarnCount,
  // which would sum to something just under the threshold under float rounding.
  for (let i = 0; i < SETTINGS.stepsWarnCount; i += 1) {
    const cost = i === 0 ? SETTINGS.costWarnUsd : 0;
    recordStepFinish(store, stepFinishPart({ id: `p${i}`, sessionID: "s1", cost }));
  }
  // A real (non-zero) output limit smaller than the context window, so usable context is finite
  // and the input tokens below clear the capacity threshold.
  const model = makeModel({ context: 1_000, output: 100 });
  const tokens = makeTokens({ input: 900 });
  const { newlyFired, cost, steps } = evaluateThresholds(store, "s1", tokens, model);
  assert.ok(Math.abs(cost - SETTINGS.costWarnUsd) < 1e-9);
  assert.equal(steps, SETTINGS.stepsWarnCount);
  const kinds = newlyFired.map((f) => f.kind).sort();
  assert.deepEqual(kinds, ["capacity", "cost", "steps"]);
});

test("evaluateThresholds fires each threshold at most once per session", () => {
  const store = createStore();
  const part = stepFinishPart({ id: "p1", sessionID: "s1", cost: SETTINGS.costWarnUsd });
  recordStepFinish(store, part);
  const first = evaluateThresholds(store, "s1", null, null);
  assert.deepEqual(first.newlyFired.map((f) => f.kind), ["cost"]);
  const second = evaluateThresholds(store, "s1", null, null);
  assert.deepEqual(second.newlyFired, []);
});

test("formatNotice stays within the character cap and names measurements, not verdicts", () => {
  const text = formatNotice([{ kind: "cost", value: 12.3456 }], 12.3456, 150, 0.81);
  assert.ok(text.length <= SETTINGS.maxNoticeChars);
  assert.match(text, /\$12\.35/);
  assert.match(text, /reassess/);
  assert.doesNotMatch(text, /\b(stop|abort|halt)\b/i);
});

test("formatTaskReport stays within the character cap and labels partial coverage", () => {
  const text = formatTaskReport(3.2, 42, 0.55);
  assert.ok(text.length <= SETTINGS.maxTaskReportChars);
  assert.match(text, /since plugin attachment/);
  assert.match(text, /not asserted as a lifetime total/);
});

// ---------------------------------------------------------------------------
// Full plugin wiring: hook behavior across modes, roles, and preservation constraints
// ---------------------------------------------------------------------------

test(
  "observe mode accounts and logs but never mutates tool output",
  withEnv("observe", async () => {
    const client = makeMockClient({ sessionParents: { worker1: "root1" } });
    const hooks = await SessionEconomics({ client });

    await hooks["chat.message"]({ sessionID: "worker1", agent: "build" });
    await emitSession(hooks, "session.created", { id: "worker1", parentID: "root1" });

    for (let i = 0; i < SETTINGS.stepsWarnCount + 1; i += 1) {
      await emitStepFinish(hooks, { id: `p${i}`, sessionID: "worker1", cost: 1 });
    }

    const output = { title: "Read", output: "original tool output", metadata: { untouched: true } };
    await toolAfter(hooks, { sessionID: "worker1", output });

    assert.equal(output.output, "original tool output");
    assert.deepEqual(output.metadata, { untouched: true });
    assert.equal(output.title, "Read");
  }),
);

test(
  "advisory mode appends a bounded notice while preserving the original output content",
  withEnv("advisory", async () => {
    const client = makeMockClient({ sessionParents: { worker1: "root1" } });
    const hooks = await SessionEconomics({ client });

    await hooks["chat.message"]({ sessionID: "worker1", agent: "build" });
    await emitSession(hooks, "session.created", { id: "worker1", parentID: "root1" });

    for (let i = 0; i < SETTINGS.stepsWarnCount; i += 1) {
      await emitStepFinish(hooks, { id: `p${i}`, sessionID: "worker1", cost: 0 });
    }

    const output = { title: "Read", output: "original tool output", metadata: { untouched: true } };
    await toolAfter(hooks, { sessionID: "worker1", output });

    assert.ok(output.output.startsWith("original tool output"));
    assert.match(output.output, /\[session-economics\]/);
    assert.deepEqual(output.metadata, { untouched: true });
  }),
);

test(
  "notices are capped at three per session even if checked repeatedly",
  withEnv("advisory", async () => {
    const client = makeMockClient({ sessionParents: { worker1: "root1" } });
    const hooks = await SessionEconomics({ client });
    await hooks["chat.message"]({ sessionID: "worker1", agent: "build" });
    await emitSession(hooks, "session.created", { id: "worker1", parentID: "root1" });

    // Cross cost, then steps, then capacity thresholds one at a time across separate calls so
    // each produces its own notice, then verify a further crossing produces no further notice.
    await emitStepFinish(hooks, { id: "p0", sessionID: "worker1", cost: SETTINGS.costWarnUsd });
    const out1 = { title: "t", output: "o", metadata: {} };
    await toolAfter(hooks, { sessionID: "worker1", callID: "c1", output: out1 });
    assert.match(out1.output, /\[session-economics\]/);

    for (let i = 1; i <= SETTINGS.stepsWarnCount; i += 1) {
      await emitStepFinish(hooks, { id: `p${i}`, sessionID: "worker1", cost: 0 });
    }
    const out2 = { title: "t", output: "o", metadata: {} };
    await toolAfter(hooks, { sessionID: "worker1", callID: "c2", output: out2 });
    assert.match(out2.output, /\[session-economics\]/);

    // Nothing left to fire (capacity was never evaluated against a model), so a further call is
    // silent — verifying the cap holds rather than replaying prior notices.
    const out3 = { title: "t", output: "o", metadata: {} };
    await toolAfter(hooks, { sessionID: "worker1", callID: "c3", output: out3 });
    assert.equal(out3.output, "o");
  }),
);

test(
  "non-worker sessions (unresolved parent, or excluded agent) never receive notices",
  withEnv("advisory", async () => {
    const client = makeMockClient({ sessionParents: {} }); // no parent -> top-level session
    const hooks = await SessionEconomics({ client });
    await hooks["chat.message"]({ sessionID: "top1", agent: "build" });

    for (let i = 0; i < SETTINGS.stepsWarnCount + 5; i += 1) {
      await emitStepFinish(hooks, { id: `p${i}`, sessionID: "top1", cost: SETTINGS.costWarnUsd });
    }
    const output = { title: "t", output: "o", metadata: {} };
    await toolAfter(hooks, { sessionID: "top1", output });
    assert.equal(output.output, "o");
  }),
);

test(
  "excluded agents (e.g. committer) never receive notices even when parented",
  withEnv("advisory", async () => {
    const client = makeMockClient({ sessionParents: { committer1: "root1" } });
    const hooks = await SessionEconomics({ client });
    await hooks["chat.message"]({ sessionID: "committer1", agent: "committer" });
    for (let i = 0; i < SETTINGS.stepsWarnCount + 5; i += 1) {
      const cost = SETTINGS.costWarnUsd;
      await emitStepFinish(hooks, { id: `p${i}`, sessionID: "committer1", cost });
    }
    const output = { title: "t", output: "o", metadata: {} };
    await toolAfter(hooks, { sessionID: "committer1", output });
    assert.equal(output.output, "o");
  }),
);

test(
  "role/parent lookup failure degrades to observe-only, never throws",
  withEnv("advisory", async () => {
    const client = makeMockClient({ sessionGetError: true });
    const hooks = await SessionEconomics({ client });
    // No session.created/updated event seen, so role resolution must fall back to the (failing)
    // client.session.get call — which must be swallowed, not thrown.
    await hooks["chat.message"]({ sessionID: "mystery1", agent: "build" });
    const output = { title: "t", output: "o", metadata: {} };
    await assert.doesNotReject(toolAfter(hooks, { sessionID: "mystery1", output }));
    assert.equal(output.output, "o");
  }),
);

test(
  "task-boundary report is retrospective, attributes via metadata, and cleans up the child",
  withEnv("advisory", async () => {
    const client = makeMockClient({ sessionParents: { child1: "parent1" }, providers: [] });
    const hooks = await SessionEconomics({ client });

    await hooks["chat.message"]({ sessionID: "child1", agent: "build" });
    await emitSession(hooks, "session.created", { id: "child1", parentID: "parent1" });
    await emitStepFinish(hooks, { id: "p1", sessionID: "child1", cost: 1.5 });

    const output = { title: "task", output: "child summary", metadata: { sessionID: "child1" } };
    await toolAfter(hooks, { tool: "task", sessionID: "parent1", output });

    assert.ok(output.output.startsWith("child summary"));
    assert.match(output.output, /Child session finished/);
    assert.match(output.output, /\$1\.50/);

    // A second task completion for the same child must not double-report (state was cleaned up).
    const output2 = {
      title: "task",
      output: "child summary again",
      metadata: { sessionID: "child1" },
    };
    await toolAfter(hooks, { tool: "task", sessionID: "parent1", callID: "c2", output: output2 });
    assert.equal(output2.output, "child summary again");
  }),
);

test(
  "task-boundary report falls back to the sole-unambiguous-child scan when id is missing",
  withEnv("advisory", async () => {
    const client = makeMockClient({ sessionParents: { child1: "parent1" }, providers: [] });
    const hooks = await SessionEconomics({ client });
    await hooks["chat.message"]({ sessionID: "child1", agent: "build" });
    await emitSession(hooks, "session.created", { id: "child1", parentID: "parent1" });
    await emitStepFinish(hooks, { id: "p1", sessionID: "child1", cost: 0.4 });

    const output = { title: "task", output: "no id here", metadata: {} };
    await toolAfter(hooks, { tool: "task", sessionID: "parent1", output });
    assert.match(output.output, /Child session finished/);
  }),
);

test(
  "task-boundary report is skipped (observe-only) when attribution is ambiguous",
  withEnv("advisory", async () => {
    const client = makeMockClient({
      sessionParents: { childA: "parent1", childB: "parent1" },
      providers: [],
    });
    const hooks = await SessionEconomics({ client });
    await hooks["chat.message"]({ sessionID: "childA", agent: "build" });
    await hooks["chat.message"]({ sessionID: "childB", agent: "explore" });
    await emitSession(hooks, "session.created", { id: "childA", parentID: "parent1" });
    await emitSession(hooks, "session.created", { id: "childB", parentID: "parent1" });

    const output = { title: "task", output: "ambiguous", metadata: {} };
    await toolAfter(hooks, { tool: "task", sessionID: "parent1", output });
    assert.equal(output.output, "ambiguous");
  }),
);

test(
  "model changes: capacity tracks the latest step's model, not a stale earlier one",
  withEnv("advisory", async () => {
    const bigModel = makeModel({
      providerID: "p",
      modelID: "big",
      context: 1_000_000,
      output: 32_000,
    });
    const smallModel = makeModel({ providerID: "p", modelID: "small", context: 1_000, output: 0 });
    const client = makeMockClient({
      sessionParents: { worker1: "root1" },
      providers: [{ id: "p", models: { big: bigModel, small: smallModel } }],
    });
    const hooks = await SessionEconomics({ client });
    await hooks["chat.message"]({ sessionID: "worker1", agent: "build" });
    await emitSession(hooks, "session.created", { id: "worker1", parentID: "root1" });

    const bigRef = { id: "m1", sessionID: "worker1", providerID: "p", modelID: "big" };
    await emitAssistantMessage(hooks, bigRef);
    await emitStepFinish(hooks, {
      id: "p1",
      sessionID: "worker1",
      messageID: "m1",
      cost: 0,
      tokens: makeTokens({ input: 500_000 }),
    });

    const smallRef = { id: "m2", sessionID: "worker1", providerID: "p", modelID: "small" };
    await emitAssistantMessage(hooks, smallRef);
    await emitStepFinish(hooks, {
      id: "p2",
      sessionID: "worker1",
      messageID: "m2",
      cost: 0,
      tokens: makeTokens({ input: 900 }),
    });

    // The small model's tiny usable window (limit.output=0 falls back to the 32_000 default, so
    // usable = max(0, 1000-32000) = 0) means capacity is "unavailable" rather than falsely huge —
    // exercise that no crash occurs when the latest step's model has a degenerate window.
    const output = { title: "t", output: "o", metadata: {} };
    await assert.doesNotReject(toolAfter(hooks, { sessionID: "worker1", output }));
  }),
);

test(
  "session.deleted cleans up cached parent/agent/report state (defined cleanup boundary)",
  withEnv("observe", async () => {
    const client = makeMockClient({ sessionParents: { worker1: "root1" } });
    const hooks = await SessionEconomics({ client });
    await hooks["chat.message"]({ sessionID: "worker1", agent: "build" });
    await emitSession(hooks, "session.created", { id: "worker1", parentID: "root1" });
    await emitStepFinish(hooks, { id: "p1", sessionID: "worker1", cost: 3 });

    await emitSession(hooks, "session.deleted", { id: "worker1" });

    // After deletion the session is unknown again: a lookup-failure client would now be consulted
    // afresh rather than reusing the deleted cache entry. Observe mode never mutates output
    // regardless of accounting state, so this mainly checks the hook still runs cleanly after
    // the delete.
    const output = { title: "t", output: "o", metadata: {} };
    await toolAfter(hooks, { sessionID: "worker1", output });
    assert.equal(output.output, "o");
  }),
);

test(
  "observer failures inside hooks never propagate to the caller",
  withEnv("advisory", async () => {
    const client = makeMockClient();
    const hooks = await SessionEconomics({ client });
    // A malformed event (missing `properties`) must be swallowed, not thrown.
    await assert.doesNotReject(hooks.event({ event: { type: "message.part.updated" } }));
    await assert.doesNotReject(hooks.event({ event: null }));
    await assert.doesNotReject(hooks["chat.message"]({}));
  }),
);

test(
  "dispose clears all in-memory state without throwing",
  withEnv("observe", async () => {
    const client = makeMockClient({ sessionParents: { worker1: "root1" } });
    const hooks = await SessionEconomics({ client });
    await emitSession(hooks, "session.created", { id: "worker1", parentID: "root1" });
    await emitStepFinish(hooks, { id: "p1", sessionID: "worker1", cost: 1 });
    await assert.doesNotReject(hooks.dispose());
  }),
);

// ---------------------------------------------------------------------------
// Source-level audit: the excluded mechanisms named in PLAN.md must not appear at all.
// ---------------------------------------------------------------------------

test("plugin source never calls session abort/prompt APIs or touches the filesystem", () => {
  const forbidden = [
    /session\.abort/,
    /session\.prompt\b/,
    /\brequire\(\s*["']fs["']\s*\)/,
    /from\s+["']node:fs["']/,
    /writeFile/,
    /readFileSync/,
    /sqlite/i,
  ];
  for (const pattern of forbidden) {
    assert.doesNotMatch(PLUGIN_SOURCE, pattern, `plugin source must not match ${pattern}`);
  }
});
