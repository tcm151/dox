---
name: find-replace
description: "Use when editing workspace files, applying find-and-replace changes, moving files or symbols, recovering from a failed patch, or keeping edits visible for review."
argument-hint: "Optional scope: files, symbols, or requested change"
---

# Find And Replace

- Use VS Code Go to Definition and Find All References to trace symbols; use Rename Symbol for semantic renames.
- Use Search or `rg --files` to find paths, then `rg -n -F "exact text" path` or `rg -n -C 3 "pattern" path` to verify targets and context.
- Check `git status --short` and `git diff -- path` first; preserve existing edits.
- Verify exact paths, imports, aliases, and occurrences from current source; never infer context from memory.
- Make the smallest coherent edit with the VS Code `apply_patch` tool, passing both required arguments: `input` and `explanation`. Do not write files through shell commands or stage changes unless asked.
- Format `input` as `*** Begin Patch`, `*** Update File: <exact path>`, optional `@@` class/function anchor, exact context, `-` old lines, `+` new lines, then `*** End Patch`. Do not send a standard `---`/`+++` unified diff. Prefix every added-file line with `+`.
- If a patch fails or its result is unknown, stop and inspect the target, `git status --short`, and `git diff` before retrying. Do not retry while the original tool call may still be running, and do not assume an ambiguous result means the edit succeeded or failed.
- After a patch result is known, run the narrowest relevant check immediately, then inspect the resulting diff for unintended or missing changes before continuing.

# A Failed Patch
When a patch fails in an active session, reference this file and update it to account for genuinely new guidance.