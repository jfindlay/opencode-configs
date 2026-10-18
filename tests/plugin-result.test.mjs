import test from "node:test";
import assert from "node:assert/strict";
import { appendNotice } from "../lib/plugin-result.js";

test("notices preserve structured output and metadata", () => {
  const result = Object.freeze({
    content: "original", output: { sessionID: "child" }, metadata: { title: "Read" },
  });
  const updated = appendNotice(result, "notice");
  assert.equal(updated.content, "original\n\nnotice");
  assert.equal(updated.output, result.output);
  assert.equal(updated.metadata, result.metadata);
});

test("notices preserve every original text and file content block", () => {
  const content = Object.freeze([
    { type: "text", text: "original" },
    { type: "file", uri: "file:///tmp/image.png", mime: "image/png" },
  ]);
  const updated = appendNotice({ content }, "notice");
  assert.deepEqual(updated.content, [...content, { type: "text", text: "notice" }]);
  assert.equal(updated.content[0], content[0]);
  assert.equal(updated.content[1], content[1]);
});

test("notices support results with no content", () => {
  assert.deepEqual(appendNotice({ output: { ok: true } }, "notice"), {
    output: { ok: true }, content: [{ type: "text", text: "notice" }],
  });
});
