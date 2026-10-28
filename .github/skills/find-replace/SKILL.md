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
- Make the smallest coherent edit with `apply_patch` so it appears in the request diff; prefix every added-file line with `+`.
- Do not write files through shell commands or stage changes unless asked.
- If a patch fails, stop, reread the target, check for partial changes, then retry with current exact context.
- Run a focused check and inspect the resulting diff for unintended or missing changes.

# A Failed Patch
When a patch fails in an active session, reference this file and update it to account for genuinely new guidance.