---
description: Create and publish a new version release
---

# Create Release

Automatically prepare and publish a new version release with full automation.

Execute these steps autonomously:

1. **Verify and analyze current state**:
   - Check CHANGELOG.md has an [Unreleased] section with changes
   - If empty: warn user there are no changes to release and STOP
   - If doesn't exist: inform user to run `/changelog` first and STOP
   - Read package.json to get current version
   - Check git status to see what files are modified (will be included in release commit)
   - **Archive check**: Count lines in CHANGELOG.md - if >1000 lines, suggest running `/archive-changelog` after release

2. **Determine next version automatically**:
   - Parse current version from package.json
   - Analyze [Unreleased] section to suggest next version using semver:
     - **MAJOR** (x.0.0): Breaking changes, removed features, or major rewrites
     - **MINOR** (0.x.0): New features, added functionality (backward compatible)
     - **PATCH** (0.0.x): Bug fixes, security fixes, small changes
   - Present recommendation with reasoning
   - Ask user ONCE: "Release as version X.Y.Z? (or specify different version)"
   - Wait for confirmation/alternative version

3. **Update all version files**:
   - Update version in package.json
   - Update CHANGELOG.md:
     - Get today's date in YYYY-MM-DD format
     - Rename `## [Unreleased]` to `## [x.y.z] - YYYY-MM-DD`
     - Add new empty `## [Unreleased]` section at the top
     - Update comparison links at bottom if they exist
   - Check for other version files (package-lock.json, etc.) and update if needed

4. **Show release summary**:
   - Display version being released
   - Show changelog entries being published
   - Show all files that will be modified

5. **Create and publish release**:
   - Run `git add .` to stage ALL modified files (including CHANGELOG.md, package.json, and any other changes)
   - Run `git commit` with a comprehensive message:
     - If only CHANGELOG.md and package.json changed: "chore: release vx.y.z"
     - If other files changed too: Include a detailed commit message listing all changes with the Claude Code footer
   - Run `git tag -a vx.y.z -m "Release x.y.z"`
   - Run `git push && git push --tags`
   - Confirm success with commit SHA and tag name

6. **Post-release summary**:
   - Show the git tag created
   - Show the commit SHA
   - Provide GitHub release URL (if repo has remote)
   - Remind about any additional deployment steps if needed

**Important**:

- Only ask for confirmation ONCE at the beginning
- Execute all subsequent steps automatically
- If git push fails (e.g., no remote), inform user but don't fail the release
- Ensure version numbers follow semver (X.Y.Z format)
- Handle edge cases gracefully (first release, dirty working directory, etc.)
