// Prevent editor/pager hangs in shell invocations. `true` exits successfully without opening an
// editor; `cat` disables interactive paging. Preserve overrides, including empty values.
// Command-local assignments such as GIT_SEQUENCE_EDITOR="cp <planfile>" still take precedence.

import { Plugin } from "@opencode/plugin";

export default Plugin.define({
  id: "no-interactive-editor",
  async setup(ctx) {
    await ctx.shell.hook("create.before", (event) => {
      event.env.EDITOR ??= "true";
      event.env.VISUAL ??= "true";
      event.env.GIT_EDITOR ??= "true";
      event.env.GIT_SEQUENCE_EDITOR ??= "true";
      event.env.PAGER ??= "cat";
    });
  },
});
