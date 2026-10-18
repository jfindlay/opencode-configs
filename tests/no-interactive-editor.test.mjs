// Run: node --experimental-default-type=module --test tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import plugin from "../plugins/no-interactive-editor.js";

async function shellHook() {
  let callback;
  await plugin.setup({
    shell: {
      async hook(name, fn) {
        assert.equal(name, "create.before");
        callback = fn;
      },
    },
  });
  return callback;
}

test("editor plugin has a single V2 default entrypoint", async () => {
  const module = await import("../plugins/no-interactive-editor.js");
  assert.deepEqual(Object.keys(module), ["default"]);
  assert.equal(plugin.id, "no-interactive-editor");
  assert.equal(typeof plugin.setup, "function");
});

test("shell hook supplies safe defaults without changing execution fields", async () => {
  const hook = await shellHook();
  const event = { command: "git log", cwd: "/tmp", shell: "/bin/bash", timeout: 1000, env: {} };
  hook(event);
  assert.deepEqual(event, {
    command: "git log", cwd: "/tmp", shell: "/bin/bash", timeout: 1000,
    env: {
      EDITOR: "true", VISUAL: "true", GIT_EDITOR: "true", GIT_SEQUENCE_EDITOR: "true", PAGER: "cat",
    },
  });
});

test("shell hook preserves all caller overrides and unrelated environment", async () => {
  const hook = await shellHook();
  const env = {
    EDITOR: "custom", VISUAL: "", GIT_EDITOR: "script", GIT_SEQUENCE_EDITOR: "cp plan",
    PAGER: "custom-pager", OTHER: "unchanged",
  };
  const original = { ...env };
  hook({ env });
  hook({ env });
  assert.deepEqual(env, original);
});

test("command-local editor assignment overrides the hook environment", async () => {
  const hook = await shellHook();
  const event = { env: {} };
  hook(event);
  const output = execFileSync("/bin/bash", ["-c",
    'GIT_SEQUENCE_EDITOR="cp plan" /bin/bash -c \'printf "%s" "$GIT_SEQUENCE_EDITOR"\'',
  ], { env: event.env, encoding: "utf8", timeout: 1000 });
  assert.equal(output, "cp plan");
});
