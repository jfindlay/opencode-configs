// Run: node --experimental-default-type=module --test tests/*.test.mjs
// Synthetic public events and hook payloads only: no model calls or persisted session history.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Schema } from "effect";
import { SessionEvent } from "@opencode/schema/session-event";
import plugin from "../plugins/session-economics.js";
import {
  SETTINGS, resolveMode, createStore, recordStepFinish, sessionCost, sessionStepCount,
  classifyAgent, extractChildSessionID, evaluateThresholds, formatNotice, formatTaskReport,
} from "../lib/session-economics-core.js";
import { mockContext } from "./plugin-context.mjs";

const location = { directory: "/project" };
const tokens = { input: 100, output: 20, reasoning: 0, cache: { read: 0, write: 0 } };

function event(type, data, seq = 1, scope = location) {
  return {
    type, id: `evt_${seq}`, created: seq, location: scope,
    durable: { aggregateID: data.sessionID, seq, version: 1 }, data,
  };
}

function ended(sessionID, id, cost, seq = 1, scope = location) {
  return event("session.step.ended", {
    sessionID, assistantMessageID: id, finish: "stop", cost, tokens,
  }, seq, scope);
}

function session(id, parentID = "root", agent = "build", scope = location) {
  return { id, parentID, agent, location: scope };
}

async function setup(t, mode = "advisory", options = {}) {
  const previous = process.env.OPENCODE_SESSION_ECONOMICS;
  if (mode === undefined) delete process.env.OPENCODE_SESSION_ECONOMICS;
  else process.env.OPENCODE_SESSION_ECONOMICS = mode;
  const mock = mockContext(options);
  const cleanup = await plugin.setup(mock.context);
  t.after(async () => {
    await cleanup?.();
    if (previous === undefined) delete process.env.OPENCODE_SESSION_ECONOMICS;
    else process.env.OPENCODE_SESSION_ECONOMICS = previous;
  });
  return { ...mock, cleanup, signal: mock.signal };
}

async function tool(mock, overrides = {}) {
  const call = {
    status: "completed", tool: "read", sessionID: "worker", agent: "build",
    messageID: "message", id: "call", input: {}, result: { content: "original" }, ...overrides,
  };
  await mock.hooks.get("tool.execute.after")(call);
  return call;
}

async function enrol(mock, id = "worker", parentID = "root", agent = "build") {
  await mock.emit(event("session.created", { sessionID: id, parentID, agent, location }));
}

test("V2 plugin has one default definition and no legacy entrypoint", async () => {
  assert.deepEqual(Object.keys(await import("../plugins/session-economics.js")), ["default"]);
  assert.equal(plugin.id, "session-economics");
  assert.equal(typeof plugin.setup, "function");
  assert.equal(plugin.server, undefined);
});

test("completed-step fixture satisfies the installed V2 event schema", () => {
  const fixture = ended("ses_worker", "msg_message", 1);
  fixture.durable.version = SessionEvent.Step.Ended.durable.version;
  assert.doesNotThrow(() => Schema.decodeUnknownSync(SessionEvent.Step.Ended)(fixture));
});

test("mode resolution defaults safely without logging arbitrary environment values", () => {
  assert.equal(resolveMode({}), "observe");
  for (const mode of ["off", "observe", "advisory"]) {
    assert.equal(resolveMode({ OPENCODE_SESSION_ECONOMICS: mode }), mode);
  }
  const logs = [];
  const original = console.error;
  console.error = (...args) => logs.push(args.join(" "));
  try {
    assert.equal(resolveMode({ OPENCODE_SESSION_ECONOMICS: "secret-shaped-value" }), "observe");
  } finally { console.error = original; }
  assert.equal(logs.length, 1);
  assert.doesNotMatch(logs[0], /secret-shaped-value/);
});

test("off mode registers neither hooks nor an event subscription", async t => {
  const mock = await setup(t, "off");
  assert.deepEqual(mock.registrations, []);
  assert.equal(mock.signal, undefined);
  assert.equal(mock.cleanup, undefined);
});

test("accounting deduplicates messages and ignores stale durable updates", () => {
  const store = createStore();
  const step = { id: "m1", sessionID: "s1", cost: 2, seq: 3 };
  recordStepFinish(store, step);
  recordStepFinish(store, step);
  recordStepFinish(store, { ...step, cost: 100, seq: 2 });
  recordStepFinish(store, { ...step, id: "m2", cost: 3, seq: 4 });
  recordStepFinish(store, { ...step, sessionID: "s2", cost: 20 });
  assert.equal(sessionCost(store, "s1"), 5);
  assert.equal(sessionStepCount(store, "s1"), 2);
  assert.equal(sessionCost(store, "s2"), 20);
  recordStepFinish(store, { ...step, cost: 4, seq: 5 });
  assert.equal(sessionCost(store, "s1"), 7);
});

test("missing cost stays unavailable while known zero remains zero", () => {
  for (const cost of [undefined, null, NaN, Infinity, -1]) {
    const store = createStore();
    assert.equal(sessionCost(store, "s"), null);
    recordStepFinish(store, { id: "m", sessionID: "s", cost, seq: 1 });
    assert.equal(sessionCost(store, "s"), null);
    assert.equal(sessionStepCount(store, "s"), 1);
    assert.match(formatTaskReport(sessionCost(store, "s"), 1), /cost unavailable/);
  }
  const store = createStore();
  recordStepFinish(store, { id: "m", sessionID: "s", cost: 0, seq: 1 });
  assert.equal(sessionCost(store, "s"), 0);
});

test("malformed identities and sequences do not enter accounting", () => {
  const store = createStore();
  recordStepFinish(store, { sessionID: "s", cost: 1, seq: 1 });
  recordStepFinish(store, { sessionID: "s", id: "m", cost: 1 });
  assert.equal(sessionStepCount(store, "s"), 0);
});

test("simultaneous triggers are grouped and each fires only once", () => {
  const store = createStore();
  for (let seq = 1; seq <= SETTINGS.stepsWarnCount; seq++) {
    recordStepFinish(store, {
      id: `m${seq}`, sessionID: "s", seq, cost: seq === 1 ? SETTINGS.costWarnUsd : 0,
    });
  }
  const first = evaluateThresholds(store, "s");
  assert.deepEqual(first.newlyFired.map(({ kind }) => kind), ["cost", "steps"]);
  assert.deepEqual(evaluateThresholds(store, "s").newlyFired, []);
  const notice = formatNotice(first.newlyFired, first.cost, first.steps);
  assert.ok(notice.length <= SETTINGS.maxNoticeChars);
  assert.match(notice, /since attachment/);
  assert.match(notice, /capacity unavailable/);
  assert.doesNotMatch(notice, /\b(stop|abort|halt)\b/i);
  assert.ok(formatTaskReport(2, 10).length <= SETTINGS.maxTaskReportChars);
});

test("worker classification and candidate result IDs are conservative", () => {
  for (const agent of ["build", "general", "explore"]) assert.equal(classifyAgent(agent), "worker");
  assert.equal(classifyAgent("committer"), "excluded");
  assert.equal(classifyAgent("architect"), "other");
  assert.equal(classifyAgent(undefined), "unknown");
  assert.equal(extractChildSessionID({ sessionID: "child" }), "child");
  assert.equal(extractChildSessionID({ sessionId: "child" }), "child");
  for (const value of [null, "child", {}, { sessionID: 1 }]) {
    assert.equal(extractChildSessionID(value), undefined);
  }
});

test("observe accounts and logs, but preserves the exact result object", async t => {
  const mock = await setup(t, "observe");
  await enrol(mock);
  await mock.emit(ended("worker", "m1", 6));
  const result = Object.freeze({ content: "original", metadata: { title: "read" } });
  assert.equal((await tool(mock, { result })).result, result);
  assert.deepEqual(mock.registrations, ["tool.execute.after"]);
});

test("advisory adds one notice and preserves attachments and structured output", async t => {
  const mock = await setup(t);
  await enrol(mock);
  await mock.emit(ended("worker", "m1", 6));
  const result = {
    content: [{ type: "file", uri: "file:///image.png", mime: "image/png" }],
    output: { ok: true }, metadata: { title: "read" },
  };
  const first = await tool(mock, { result });
  assert.equal(first.result.content[0], result.content[0]);
  assert.match(first.result.content[1].text, /\$6\.00/);
  assert.equal(first.result.output, result.output);
  assert.equal(first.result.metadata, result.metadata);
  await mock.emit(ended("worker", "m1", 6));
  assert.equal((await tool(mock)).result.content, "original");
});

test("cost and step crossings produce bounded separate notices without replay", async t => {
  const mock = await setup(t);
  await enrol(mock);
  await mock.emit(ended("worker", "m1", 5));
  assert.match((await tool(mock)).result.content, /cost threshold/);
  for (let i = 2; i <= 110; i++) await mock.emit(ended("worker", `m${i}`, 0, i));
  assert.match((await tool(mock)).result.content, /steps threshold/);
  for (let i = 0; i < 5; i++) assert.equal((await tool(mock)).result.content, "original");
});

test("errors are untouched and do not consume a later successful notice", async t => {
  const mock = await setup(t);
  await enrol(mock);
  await mock.emit(ended("worker", "m", 6));
  const failure = { status: "error", sessionID: "worker", error: { message: "failed" } };
  await mock.hooks.get("tool.execute.after")(failure);
  assert.deepEqual(failure, { status: "error", sessionID: "worker", error: { message: "failed" } });
  assert.match((await tool(mock)).result.content, /session-economics/);
});

test("top-level, unknown and excluded roles never receive notices", async t => {
  const mock = await setup(t);
  for (const [id, parentID, agent] of [
    ["top", undefined, "build"], ["unknown", "root", undefined], ["excluded", "root", "committer"],
  ]) {
    await mock.emit(event("session.created", { sessionID: id, parentID, agent, location }));
    await mock.emit(ended(id, "m", 6));
    assert.equal((await tool(mock, { sessionID: id, agent })).result.content, "original");
  }
});

test("V2 session.get uses a flat input and resolves verified parent/role", async t => {
  const mock = await setup(t, "advisory", { sessions: { worker: session("worker") } });
  await mock.emit(ended("worker", "m", 6));
  assert.match((await tool(mock)).result.content, /session-economics/);
});

test("failed metadata lookup can recover on the next tool call", async t => {
  const sessions = {};
  const mock = await setup(t, "advisory", { sessions });
  await mock.emit(ended("worker", "m", 6));
  assert.equal((await tool(mock)).result.content, "original");
  sessions.worker = session("worker");
  assert.match((await tool(mock)).result.content, /session-economics/);
});

test("other locations and workspaces are not implicitly observed", async t => {
  const mock = await setup(t);
  await enrol(mock);
  await mock.emit(ended("worker", "foreign", 100, 1, { directory: "/other" }));
  await mock.emit(ended("worker", "workspace", 100, 2, { ...location, workspaceID: "other" }));
  assert.equal((await tool(mock)).result.content, "original");
});

test("compaction and auxiliary usage never reset or double-count primary steps", async t => {
  const mock = await setup(t);
  await enrol(mock);
  await mock.emit(ended("worker", "m1", 2));
  await mock.emit(event("session.usage.recorded", {
    sessionID: "worker", source: "compaction", cost: 100, tokens,
  }, 2));
  await mock.emit(event("session.compaction.completed", { sessionID: "worker" }, 3));
  await mock.emit(ended("worker", "m2", 3, 4));
  assert.match((await tool(mock)).result.content, /cost \$5\.00, 2 completed/);
});

test("step-start role and model switches do not reset accumulated spend", async t => {
  const mock = await setup(t);
  await enrol(mock);
  for (const [seq, id] of [[1, "first"], [3, "second"]]) {
    await mock.emit(event("session.step.started", {
      sessionID: "worker", assistantMessageID: id, agent: "general",
      model: { providerID: "provider", id }, started: seq,
    }, seq));
    await mock.emit(ended("worker", id, 3, seq + 1));
  }
  assert.match((await tool(mock, { agent: "general" })).result.content, /\$6\.00/);
});

test("foreground subagent reports verified child totals once", async t => {
  const mock = await setup(t);
  await enrol(mock, "child", "parent");
  await mock.emit(ended("child", "m", 0.75));
  const call = {
    tool: "subagent", sessionID: "parent", agent: "architect",
    result: { content: "summary", output: { sessionID: "child" } },
  };
  const first = await tool(mock, call);
  assert.match(first.result.content, /Child tool returned.*\$0\.75/);
  assert.match(first.result.content, /events may still be in transit/);
  assert.equal((await tool(mock, call)).result.content, "summary");
  await mock.emit(ended("child", "m", 0.75));
  assert.equal((await tool(mock, call)).result.content, "summary");
});

test("nested subagents report only direct-child totals", async t => {
  const mock = await setup(t);
  await enrol(mock, "child", "parent");
  await enrol(mock, "grandchild", "child");
  await mock.emit(ended("child", "m1", 1));
  await mock.emit(ended("grandchild", "m2", 20));
  const foreign = await tool(mock, {
    tool: "subagent", sessionID: "parent", result: { metadata: { sessionID: "grandchild" } },
  });
  assert.equal(foreign.result.content, undefined);
  const own = await tool(mock, {
    tool: "subagent", sessionID: "parent", result: { metadata: { sessionId: "child" } },
  });
  assert.match(own.result.content[0].text, /\$1\.00/);
  assert.doesNotMatch(own.result.content[0].text, /\$21\.00/);
});

test("background dispatch and missing child IDs do not guess a completion report", async t => {
  const mock = await setup(t);
  await enrol(mock, "child", "parent");
  await mock.emit(ended("child", "m", 1));
  for (const overrides of [
    {
      input: { background: true },
      result: { content: "launched", output: { sessionID: "child" } },
    },
    { result: { content: "no child ID" } },
  ]) {
    const result = overrides.result;
    const call = await tool(mock, { tool: "subagent", sessionID: "parent", ...overrides });
    assert.equal(call.result, result);
  }
});

test("session deletion clears accounting and notice state", async t => {
  const mock = await setup(t);
  await enrol(mock);
  await mock.emit(ended("worker", "m1", 3));
  await mock.emit(event("session.deleted", { sessionID: "worker" }, 2));
  await enrol(mock);
  await mock.emit(ended("worker", "m2", 3, 3));
  assert.equal((await tool(mock)).result.content, "original");
});

test("a fresh attachment never imports lifetime cost from session metadata", async t => {
  const mock = await setup(t, "advisory", {
    sessions: { worker: { ...session("worker"), cost: 1000 } },
  });
  assert.equal((await tool(mock)).result.content, "original");
  await mock.emit(ended("worker", "m", 1));
  assert.equal((await tool(mock)).result.content, "original");
});

test("metadata from a different location cannot qualify a worker", async t => {
  const mock = await setup(t, "advisory", {
    sessions: { worker: session("worker", "root", "build", { directory: "/other" }) },
  });
  await mock.emit(ended("worker", "m", 100));
  assert.equal((await tool(mock)).result.content, "original");
});

test("cleanup aborts the subscription and makes retained hook references inert", async t => {
  const mock = await setup(t);
  await enrol(mock);
  await mock.emit(ended("worker", "m", 6));
  await mock.cleanup();
  assert.equal(mock.signal.aborted, true);
  assert.equal((await tool(mock)).result.content, "original");
});

test("bad events and result failures do not break the event stream or tool execution", async t => {
  const mock = await setup(t);
  await mock.emit(null);
  await mock.emit({ type: "session.step.ended" });
  await enrol(mock);
  await mock.emit(ended("worker", "m", 6));
  await assert.doesNotReject(tool(mock, { result: null }));
});

test("subscription failure is contained and does not reject plugin setup or cleanup", async t => {
  const original = process.env.OPENCODE_SESSION_ECONOMICS;
  process.env.OPENCODE_SESSION_ECONOMICS = "observe";
  t.after(() => {
    if (original === undefined) delete process.env.OPENCODE_SESSION_ECONOMICS;
    else process.env.OPENCODE_SESSION_ECONOMICS = original;
  });
  const mock = mockContext();
  mock.context.event.subscribe = async function* () { throw new Error("stream failed"); };
  const cleanup = await plugin.setup(mock.context);
  await assert.doesNotReject(cleanup());
});

test("production code has no transcript, persistence, prompt or interruption paths", () => {
  for (const file of ["plugins/session-economics.js", "lib/session-economics-core.js"]) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
    for (const pattern of [
      /session\.(prompt|synthetic|interrupt|context|compact)\(/,
      /from\s+["']node:fs["']/, /sqlite/i, /writeFile/, /readFile/,
    ]) assert.doesNotMatch(source, pattern);
  }
});
