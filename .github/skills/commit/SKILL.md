---
name: commit
description: "Use when reviewing, preparing, staging, creating, amending, or renaming Git commits."
---

# Git Commits

## Approval and History Safety
- Never create a commit without explicit approval from the developer. Staging or preparing changes is not approval to commit.
- Ask before amending, rebasing, or otherwise rewriting existing commits. These actions change commit hashes.
- Do not push commits unless explicitly asked.

## Workflow
1. Inspect `git status`, the staged diff, the unstaged diff, and untracked files. Preserve existing staged or user-authored changes; do not assume every working-tree change belongs in the requested commit.
2. Identify the intended scope and relevant ticket. Split independent changes into coherent commits, and stage only the files for each approved commit.
3. Review the exact staged diff. Run the relevant tests, checks, or build when available, and check the staged diff for whitespace errors.
4. Match the repository's recent commit-message conventions. Prefer a concise subject that describes one logical change. Do not impose a global format such as Conventional Commits when the repository uses another style. Include a ticket identifier when the project convention or context calls for it.
5. Create the commit only after explicit approval. Afterward, verify the resulting commit and working-tree status, then report commit hashes, scope, validation, and any remaining changes.

## Commit Message Guidance
- Describe the change clearly; avoid vague subjects.
- Keep separate commits focused on separate concerns, even when they belong to one ticket.
- Add a body only when it clarifies motivation, important behavior, or compatibility concerns not clear from the subject.