---
name: find-replace
description: "Use when editing workspace files, including reorganizing files, consolidating files, applying find-and-replace changes, moving files or symbols, recovering from a failed patch, or keeping edits visible for review."
argument-hint: "Optional scope: files, symbols, or requested change"
---

# Find And Replace

- Use VS Code Go to Definition and Find All References to trace symbols; use Rename Symbol for semantic renames.
- Use Search or `rg --files` to find paths, then `rg -n -F "exact text" path` or `rg -n -C 3 "pattern" path` to verify targets and context.
- Check `git status --short` and `git diff -- path` first; preserve existing edits.
- Verify exact paths, imports, aliases, and occurrences from current source; never infer context from memory.
- Use the patch or editor tool available in the current environment and follow its declared input format; do not assume a signature from another client. Do not write files through shell commands or stage changes unless asked.
- Keep patch context exact and group hunks by file when the tool supports it.
- If a patch fails or its result is unknown, stop and inspect the target, `git status --short`, and `git diff` before retrying. A small context mismatch is usually an intervening developer edit or formatter change: preserve it, reread the current source, and rebase only the intended change onto that version. Never restore stale content or undo changes to make a patch apply. If the mismatch looks corrupted (for example, garbled, truncated, or structurally damaged text), stop editing and notify the user instead of guessing at a repair. Use the actual rejection/output to identify format or context issues; do not guess at a cause. Correct only the rejected patch, keep the retry smaller if needed, and do not retry while the original tool call may still be running or assume an ambiguous result means the edit succeeded or failed.
- Run the narrowest relevant check after an edit; inspect the focused diff only when a check fails or uncertainty remains.

## Recovering From A Failed Patch

- A patch may partially apply. Inspect status and the focused diff, then retry only hunks that did not apply.
- If exact-context retries still fail, stop rather than broadening the patch or switching to shell-based replacement.
- For file moves, confirm the destination is absent, use a move operation, and verify the source, destination, and worktree state.