---
description: Complete release workflow - analyze changes, update changelog, create version, and publish
---

# Ship Release

Unified command that automates the complete release workflow: check code quality → analyze changes → update changelog → version → tag → push.

This combines `/check` + `/changelog` + `/release` into a single seamless workflow.

Execute these steps autonomously:

## Phase 0: Code Quality Check

**Run format, lint, and build**:

1. Run `pnpm format` to format all code with Prettier
2. Run `pnpm lint` and fix all errors/warnings:
   - Fix actual code issues (DO NOT use eslint-disable unless absolutely necessary)
   - See `/check` command for detailed fixing guidelines
   - Only use eslint-disable with proper justification comments
3. Run `pnpm build` and fix all build errors:
   - Fix TypeScript type errors properly
   - Fix import errors
   - Don't use `as any` or `@ts-ignore` unless absolutely necessary

**If checks fail**:

- Fix all issues properly (follow `/check` guidelines)
- DO NOT proceed to Phase 1 until all checks pass
- DO NOT use quick hacks like mass eslint-disable

**Show results**:

```
✅ Format: Passed
✅ Lint: Passed
✅ Build: Successful
```

Only proceed to Phase 1 after all checks pass.

## Phase 1: Analyze and Update Changelog

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

6. **Confirm changelog updates**:
   - Show the user the changelog diff
   - **IMPORTANT**: Ask user "Proceed with release?" before continuing to Phase 2
   - Wait for user confirmation
   - If user says no: stop here and let them edit manually

## Phase 2: Create and Publish Release

7. **Verify release readiness**:
   - Verify CHANGELOG.md has an [Unreleased] section with changes (should exist from Phase 1)
   - Read package.json to get current version
   - Check git status to see what files are modified (will be included in release commit)
   - **Archive check**: Count lines in CHANGELOG.md - if >1000 lines, suggest running `/archive-changelog` after release

8. **Determine next version automatically**:
   - Parse current version from package.json
   - Analyze [Unreleased] section to suggest next version using semver:
     - **MAJOR** (x.0.0): Breaking changes, removed features, or major rewrites
     - **MINOR** (0.x.0): New features, added functionality (backward compatible)
     - **PATCH** (0.0.x): Bug fixes, security fixes, small changes
   - Present recommendation with reasoning
   - Ask user ONCE: "Release as version X.Y.Z? (or specify different version)"
   - Wait for confirmation/alternative version

9. **Update all version files**:
   - Update version in package.json
   - Update CHANGELOG.md:
     - Get today's date in YYYY-MM-DD format
     - Rename `## [Unreleased]` to `## [x.y.z] - YYYY-MM-DD`
     - Add new empty `## [Unreleased]` section at the top
     - Update comparison links at bottom if they exist
   - Check for other version files (package-lock.json, etc.) and update if needed

10. **Show release summary**:
    - Display version being released
    - Show changelog entries being published
    - Show all files that will be modified

11. **Create and publish release**:
    - Run `git add .` to stage ALL modified files (including CHANGELOG.md, package.json, and any other changes)
    - Run `git commit` with a comprehensive message:
      - If only CHANGELOG.md and package.json changed: "chore: release vx.y.z"
      - If other files changed too: Include a detailed commit message listing all changes with the Claude Code footer
    - Run `git tag -a vx.y.z -m "Release x.y.z"`
    - Run `git push && git push --tags`
    - Confirm success with commit SHA and tag name

12. **Post-release summary**:
    - Show the git tag created
    - Show the commit SHA
    - Provide GitHub release URL (if repo has remote)
    - If CHANGELOG.md >1000 lines: remind user to run `/archive-changelog`

## Important Notes

**Phase 0 (Code Quality)**:

- MUST pass all checks before proceeding
- Fix code properly, not with disable comments
- See `/check` command for detailed guidelines
- Build must succeed completely
- No warnings should remain unless justified

**Phase 1 (Changelog)**:

- Execute steps 1-5 automatically
- Only show user the final changelog diff
- **REQUIRED**: Ask user "Proceed with release?" before Phase 2
- Focus on user-facing changes, not internal refactoring (unless significant)
- Keep changelog concise - avoid excessive detail that doesn't benefit end users
- For dependency updates: Group into 2-3 lines maximum, don't list every package

**Phase 2 (Release)**:

- Only execute if user confirmed after Phase 1
- Ask for version confirmation ONCE at step 8
- Execute all subsequent steps automatically
- If git push fails (e.g., no remote), inform user but don't fail the release
- Ensure version numbers follow semver (X.Y.Z format)
- Handle edge cases gracefully (first release, dirty working directory, etc.)

**When to stop**:

- If no changes to document in Phase 1: inform user and STOP
- If user declines to proceed after Phase 1: STOP
- If user declines version at step 8: STOP
- Never proceed with Phase 2 without explicit user confirmation
