// The host shows the model `content`, falling back to the text of `output` only while `content` is
// undefined or an empty array. Appending to such a result must carry that fallback text forward, or
// the notice would replace the tool's own output.
function outputText(output) {
  if (typeof output === "string") return output;
  try {
    return JSON.stringify(output) ?? String(output);
  } catch {
    return String(output);
  }
}

/** Append advisory text without replacing structured output, metadata, or file content. */
export function appendNotice(result, text) {
  if (typeof result.content === "string") {
    return { ...result, content: `${result.content}\n\n${text}` };
  }
  const blocks = result.content?.length || result.output === undefined
    ? [...(result.content ?? [])]
    : [{ type: "text", text: outputText(result.output) }];
  return { ...result, content: [...blocks, { type: "text", text }] };
}
