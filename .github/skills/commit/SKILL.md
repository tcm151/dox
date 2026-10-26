---
name: commit
description: "Use when reviewing or preparing Git commits, including staging, creating, amending, rebasing, or renaming. Covers scope, approval, checks, and post-commit verification."
argument-hint: "Optional scope: files, ticket, or commit to review"
---

# Git Commits

## Approval and History Safety
- Never commit without explicit user approval. Staging or preparing changes does not count as approval.
- Ask before amending, rebasing, or otherwise rewriting existing commits. These actions change commit hashes.
- Do not push commits unless explicitly asked.

## Workflow
1. Check `git status`, staged and unstaged diffs, and untracked files. Preserve changes you did not make; do not assume everything belongs in this commit.
2. Set the commit scope and relevant ticket. Split independent work into separate commits, and stage only the files in scope.
3. Review the staged diff. Run relevant tests, checks, or builds, and check the patch for whitespace errors.
4. Follow recent commit messages. Use one concise subject for one logical change. Do not impose Conventional Commits if the repository uses another style. Include a ticket identifier when the project convention calls for one.
5. Commit only after explicit approval. Then verify the commit and worktree, and report the hash, scope, checks, and any remaining changes.

## Changelog Timing
- Do not update the changelog during patch implementation. Prepare it only after the patch is complete and verified, when a new application version is being prepared.
- Derive the release entry by reviewing commits and tracked changes since the latest release tag, plus intended untracked files. Update `package.json` and `CHANGELOG.md` together.

## Commit Message Guidance
- Say what changed; avoid vague subjects.
- Keep separate concerns in separate commits, even when they belong to one ticket.
- Add a body only when the subject does not explain motivation, behavior, or compatibility impact.