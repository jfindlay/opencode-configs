// A pull-driven public event stream: emit resolves only after the subscriber handles the event.
export function mockContext({ sessions = {}, models = [] } = {}) {
  const hooks = new Map();
  const registrations = [];
  const waiters = [];
  const events = [];
  let signal;
  const context = {
    location: { directory: "/project", project: { id: "project" } },
    session: {
      async get({ sessionID }) {
        if (!sessions[sessionID]) throw new Error("session unavailable");
        return sessions[sessionID];
      },
      async hook(name, callback) {
        hooks.set(`session.${name}`, callback);
        registrations.push(`session.${name}`);
      },
    },
    model: { async list() { return models; } },
    tool: {
      async hook(name, callback) {
        hooks.set(`tool.${name}`, callback);
        registrations.push(`tool.${name}`);
      },
    },
    event: {
      async *subscribe(options) {
        signal = options.signal;
        signal.addEventListener("abort", () => {
          waiters.splice(0).forEach(fn => fn());
        }, { once: true });
        while (!signal.aborted) {
          if (!events.length) await new Promise(resolve => waiters.push(resolve));
          if (signal.aborted) return;
          const { event, resolve } = events.shift();
          yield event;
          resolve();
        }
      },
    },
  };
  return {
    context, hooks, registrations,
    get signal() { return signal; },
    emit(event) {
      return new Promise(resolve => {
        events.push({ event, resolve });
        waiters.shift()?.();
      });
    },
  };
}
