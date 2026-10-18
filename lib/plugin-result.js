/** Append advisory text without replacing structured output, metadata, or file content. */
export function appendNotice(result, text) {
  if (typeof result.content === "string") {
    return { ...result, content: `${result.content}\n\n${text}` };
  }
  return { ...result, content: [...(result.content ?? []), { type: "text", text }] };
}
