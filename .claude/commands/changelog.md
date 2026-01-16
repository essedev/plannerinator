---
description: Analyze changes and update CHANGELOG.md
---

# Update Changelog

Automatically analyze recent work and update CHANGELOG.md with comprehensive changes in the [Unreleased] section.

Execute these steps autonomously:

1. **Analyze recent changes**:
   - Run `git status` to see modified/added/deleted files
   - Run `git diff` to see unstaged changes
   - Run `git diff --staged` to see staged changes
   - Run `git log --oneline --decorate -10` to see recent commits
   - Run `git diff HEAD~5...HEAD` to see changes in last 5 commits (or fewer if less exist)

2. **Categorize changes automatically**:
   - **Added**: New features, files, components, or functionality
   - **Changed**: Updates, improvements, or modifications to existing features
   - **Fixed**: Bug fixes and error corrections
   - **Removed**: Deleted features, files, or functionality
   - **Security**: Security improvements, vulnerability fixes, or auth updates
   - **Deprecated**: Features marked for future removal

3. **Generate changelog entries**:
   - Analyze all file changes, commit messages, and code diffs
   - Create clear, user-facing descriptions (not just technical details)
   - Focus on "what" changed and "why it matters" to users
   - Group related changes together
   - Be specific but concise (one line per change)
   - **For dependency updates**: Group them into a single "Dependencies" section with maximum 2-3 lines
     - Line 1: Summary (e.g., "Updated Next.js to X.Y.Z, React to A.B.C, and N+ other dependencies")
     - Line 2 (optional): Major version updates if any
     - Line 3 (optional): Notable updates that impact functionality
     - DO NOT list every single package update - focus only on significant framework/library updates

4. **Update CHANGELOG.md automatically**:
   - If [Unreleased] section exists: Add new entries there
   - If [Unreleased] section doesn't exist: Create it at the top (after header, before first version)
   - Merge with existing [Unreleased] entries if present
   - Maintain proper markdown formatting and hierarchy
   - Follow the existing changelog style

5. **Quality checks**:
   - Ensure descriptions are clear and meaningful
   - Avoid duplicates or redundant entries
   - Use proper grammar and punctuation
   - Keep consistent tone with existing entries

**Important**:

- Execute all steps automatically without asking for intermediate confirmations
- Only show the user the final changelog diff
- If there are no meaningful changes to document, inform the user
- Focus on user-facing changes, not internal refactoring (unless significant)
- Keep changelog concise - avoid excessive detail that doesn't benefit end users
- For dependency updates: Group into 2-3 lines maximum, don't list every package
