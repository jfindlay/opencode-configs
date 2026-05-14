// Prevents interactive-editor hangs in bash tool invocations by setting
// EDITOR/GIT_EDITOR/GIT_SEQUENCE_EDITOR/VISUAL to `true` (the POSIX utility
// that exits 0 immediately) when the caller has not already set them.
//
// The `??` fallback preserves caller overrides — e.g. the @rebase agent sets
// GIT_SEQUENCE_EDITOR="cp <planfile>" for scripted rebases and that value is
// respected. The per-call override is the canonical way for an agent to opt
// into scripted-editor behavior; this plugin is the safe default for
// everything else.
//
// PAGER is set to `cat` to prevent `git log`, `git diff`, and similar
// paginated commands from spawning `less` and blocking on stdin.

export const NoInteractiveEditor = async () => {
  return {
    "shell.env": async (input, output) => {
      output.env.EDITOR              = output.env.EDITOR              ?? "true";
      output.env.VISUAL              = output.env.VISUAL              ?? "true";
      output.env.GIT_EDITOR          = output.env.GIT_EDITOR          ?? "true";
      output.env.GIT_SEQUENCE_EDITOR = output.env.GIT_SEQUENCE_EDITOR ?? "true";
      output.env.PAGER               = output.env.PAGER               ?? "cat";
    },
  };
};
