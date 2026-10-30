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
- Format `input` as `*** Begin Patch`, one `*** Update File: <exact path>` header per file, optional `@@` class/function anchor, exact context, `-` old lines, `+` new lines, then `*** End Patch`. Put all hunks for a file beneath its single header and order them from top to bottom as they appear in the source. Copy context exactly, including whitespace, and use enough unique context to identify each target; do not use line numbers as anchors. Do not send a standard `---`/`+++` unified diff. Prefix every added-file line with `+`.
- If a patch fails or its result is unknown, stop and inspect the target, `git status --short`, and `git diff` before retrying. A small context mismatch is usually an intervening developer edit or formatter change: preserve it, reread the current source, and rebase only the intended change onto that version. Never restore stale content or undo changes to make a patch apply. If the mismatch looks corrupted (for example, garbled, truncated, or structurally damaged text), stop editing and notify the user instead of guessing at a repair. Use the actual rejection/output to identify format or context issues; do not guess at a cause. Correct only the rejected patch, keep the retry smaller if needed, and do not retry while the original tool call may still be running or assume an ambiguous result means the edit succeeded or failed.
- After a patch result is known, run the narrowest relevant check immediately, then inspect the resulting diff for unintended or missing changes before continuing.

# A Failed Patch
When a patch fails in an active session, reference this file and update it to account for genuinely new guidance.