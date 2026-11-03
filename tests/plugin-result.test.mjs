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

test("notices support results with neither content nor output", () => {
  assert.deepEqual(appendNotice({ metadata: { a: 1 } }, "notice"), {
    metadata: { a: 1 }, content: [{ type: "text", text: "notice" }],
  });
  assert.deepEqual(appendNotice({ content: [] }, "notice"), {
    content: [{ type: "text", text: "notice" }],
  });
});

test("output the host would show in place of missing content is kept ahead of the notice", () => {
  // The host renders JSON/string `output` only while `content` is undefined or empty; adding a
  // bare notice block would otherwise hide it from the model.
  for (const content of [undefined, []]) {
    const structured = appendNotice({ content, output: { ok: true } }, "notice");
    assert.deepEqual(structured.content, [
      { type: "text", text: '{"ok":true}' }, { type: "text", text: "notice" },
    ]);
    assert.deepEqual(structured.output, { ok: true });
    assert.deepEqual(appendNotice({ content, output: "plain" }, "notice").content, [
      { type: "text", text: "plain" }, { type: "text", text: "notice" },
    ]);
  }
});

test("output text is not duplicated when content is present, even if empty text", () => {
  assert.equal(appendNotice({ content: "", output: { ok: true } }, "n").content, "\n\nn");
  const withBlocks = appendNotice({ content: [{ type: "text", text: "shown" }], output: 1 }, "n");
  assert.deepEqual(withBlocks.content.map(({ text }) => text), ["shown", "n"]);
});

test("unserializable output degrades to its string form", () => {
  const cyclic = {};
  cyclic.self = cyclic;
  assert.match(appendNotice({ output: cyclic }, "n").content[0].text, /object/);
});
