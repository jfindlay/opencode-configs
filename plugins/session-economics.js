// V2 session economics monitor. OPENCODE_SESSION_ECONOMICS=off registers nothing; observe (default)
// logs metadata only; advisory appends bounded notices to successful tool content. Diagnostics are
// written to the server log/stderr as JSON with plugin="session-economics".
// Only completed primary steps observed since attachment are counted, not auxiliary requests or
// provider invoices. Capacity is unavailable until V2's usable-context calculation is verified.

import { Plugin } from "@opencode/plugin";
import {
  SETTINGS, resolveMode, logBounded, createStore, ensureState, recordStepFinish,
  sessionCost, sessionStepCount, classifyAgent, extractChildSessionID,
  evaluateThresholds, formatNotice, formatTaskReport,
} from "../lib/session-economics-core.js";
import { appendNotice } from "../lib/plugin-result.js";

export default Plugin.define({
  id: "session-economics",
  async setup(ctx) {
    const mode = resolveMode();
    if (mode === "off") return;
    const store = createStore();
    const controller = new AbortController();
    const sameLocation = (location) => location?.directory === ctx.location.directory &&
      location?.workspaceID === ctx.location.workspaceID;

    function track(sessionID) {
      const state = ensureState(store, sessionID);
      state.located = true;
      return state;
    }

    // A server subscription spans locations. Location is verified once at enrolment. Later events
    // may or may not carry one: step events have been observed with it; deletion, agent-selection
    // and usage events without. A located event must match this location; an unlocated one is
    // accepted only for an already-verified session, so other locations' sessions are never
    // enrolled implicitly.
    function observe(event) {
      const data = event?.data;
      if (!data?.sessionID) return;
      // Deletion carries no location; dropping an untracked ID is a no-op.
      if (event.type === "session.deleted") {
        store.delete(data.sessionID);
        return;
      }
      const scope = event.location ?? data.location;
      if (scope === undefined ? !store.get(data.sessionID)?.located : !sameLocation(scope)) return;
      if (event.type === "session.created") {
        const state = track(data.sessionID);
        state.parentID = data.parentID ?? null;
        state.agent = data.agent;
      } else if (event.type === "session.agent.selected" || event.type === "session.step.started") {
        track(data.sessionID).agent = data.agent;
      } else if (event.type === "session.step.ended") {
        const state = track(data.sessionID);
        if (state.reported) return;
        recordStepFinish(store, {
          id: data.assistantMessageID, sessionID: data.sessionID,
          cost: data.cost, seq: event.durable?.seq,
        });
      }
    }

    async function workerState(sessionID) {
      const state = ensureState(store, sessionID);
      if (state.parentID === undefined || state.agent === undefined) {
        try {
          const info = await ctx.session.get({ sessionID });
          if (controller.signal.aborted || !sameLocation(info.location)) return;
          state.located = true;
          state.parentID = info.parentID ?? null;
          state.agent ??= info.agent;
        } catch {
          return;
        }
      }
      if (state.parentID && classifyAgent(state.agent) === "worker") return state;
    }

    await ctx.tool.hook("execute.after", async (event) => {
      if (controller.signal.aborted || event.status !== "completed" || !event.result) return;
      try {
        ensureState(store, event.sessionID).agent = event.agent;
        // Background dispatch returns before the worker finishes; it is not a completion boundary.
        // A foreground call moved to the background also reports status "running".
        const launched = event.input?.background === true ||
          event.result.output?.status === "running" || event.result.metadata?.status === "running";
        if (event.tool === "subagent" && !launched) {
          const childID = extractChildSessionID(event.result.output) ??
            extractChildSessionID(event.result.metadata);
          if (childID) {
            const child = await workerState(childID);
            const attributable = child?.parentID === event.sessionID && child?.steps.size;
            if (attributable && !child.reported) {
              const cost = sessionCost(store, childID);
              const steps = sessionStepCount(store, childID);
              logBounded("task-boundary", { childID, cost, steps, capacity: null });
              if (mode === "advisory") {
                event.result = appendNotice(event.result, formatTaskReport(cost, steps));
              }
              child.reported = true;
              child.steps.clear();
            }
          }
        }

        const state = await workerState(event.sessionID);
        if (controller.signal.aborted || !state || state.reported) return;
        if (state.noticesSent >= SETTINGS.maxNoticesPerSession) return;
        const { cost, steps, newlyFired } = evaluateThresholds(store, event.sessionID);
        if (!newlyFired.length) return;
        logBounded("advisory", {
          sessionID: event.sessionID, cost, steps, capacity: null,
          fired: newlyFired.map(({ kind }) => kind),
        });
        if (mode === "advisory") {
          event.result = appendNotice(event.result, formatNotice(newlyFired, cost, steps));
          state.noticesSent += 1;
        }
      } catch {
        // Do not log exception text: a failing API can include sensitive response content.
        logBounded("tool-hook-error", {});
      }
    });

    const subscription = (async () => {
      try {
        for await (const event of ctx.event.subscribe({ signal: controller.signal })) {
          if (controller.signal.aborted) break;
          try { observe(event); } catch { logBounded("event-hook-error", {}); }
        }
      } catch {
        if (!controller.signal.aborted) logBounded("event-stream-unavailable", {});
      }
    })();
    logBounded("initialized", { mode, capacity: "unavailable" });

    return async () => {
      controller.abort();
      await subscription;
      store.clear();
    };
  },
});
