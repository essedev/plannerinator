# Claude Commands Documentation

Custom slash commands for Plannerinator development workflow.

## Quick Reference

| Command              | Purpose                                         | When to Use                                                                |
| -------------------- | ----------------------------------------------- | -------------------------------------------------------------------------- |
| `/check`             | Format, lint, build - fix issues                | Before committing or when you want to ensure code quality                  |
| `/changelog`         | Update CHANGELOG.md                             | When you want to document changes without creating a release               |
| `/release`           | Create and publish a version                    | When CHANGELOG.md is already updated and you just need to version/tag/push |
| `/ship`              | Complete workflow (check + changelog + release) | **Most common**: When you want to do everything in one go                  |
| `/archive-changelog` | Move old versions to archive                    | When CHANGELOG.md exceeds 1000 lines                                       |
| `/deploy`            | Deploy to Cloudflare Workers                    | After releasing a new version                                              |

## Detailed Usage

### `/check` - Code Quality Validation

**Use this when**:

- Before committing changes
- Before creating a PR
- When you want to ensure code quality
- To fix lint/build errors properly

**What it does**:

1. Runs `pnpm format` (Prettier)
2. Runs `pnpm lint` and fixes errors/warnings properly
3. Runs `pnpm build` and fixes build errors
4. Shows summary of what was fixed

**Philosophy**:

- **Fix the actual code issue** (95% of cases)
- **Don't use eslint-disable** unless absolutely necessary
- **Don't use `as any` or `@ts-ignore`** - use proper types
- **Remove unused code** instead of commenting it out
- **Add missing dependencies** instead of disabling hooks rules

**Common fixes**:

```typescript
// ❌ BAD - Quick hack
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { unused } from "./module";

// ✅ GOOD - Proper fix
// Simply remove the unused import
```

```typescript
// ❌ BAD - Disabling the rule
// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  fetchData(userId);
}, []);

// ✅ GOOD - Adding the dependency
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

**Workflow**:

```bash
# Make changes
# ...

# Check quality
/check

# Fix any issues found
# Commit
```

**When eslint-disable IS acceptable**:

- Third-party untyped libraries
- Documented intentional design decisions
- Framework-specific false positives
- With TODO comment and issue reference

---

### `/ship` - Complete Release Workflow ⭐ Recommended

**Use this when**: You've finished work and want to ship a new version.

**What it does**:

1. **Phase 0 - Code Quality**:
   - Runs `pnpm format`, `pnpm lint`, `pnpm build`
   - Fixes all errors and warnings properly (no quick hacks)
   - Must pass before proceeding
2. **Phase 1 - Changelog**:
   - Analyzes your recent changes (git diff, commits, file changes)
   - Automatically categorizes changes (Added/Changed/Fixed/etc.)
   - Updates CHANGELOG.md with clear, user-facing descriptions
   - Shows you the changelog diff
   - **Asks confirmation**: "Proceed with release?"
3. **Phase 2 - Release**:
   - Determines next version (patch/minor/major)
   - Updates version in package.json and CHANGELOG.md
   - Creates git commit and tag
   - Pushes to remote

**Workflow**:

```bash
# 1. Make your changes
git add .

# 2. Run ship command
/ship

# 3. Review changelog updates
# 4. Confirm to proceed with release
# 5. Confirm or adjust version number
# 6. Done! ✨
```

**Example**:

```
You: /ship

Claude: Phase 0: Code Quality Check
        Running pnpm format...
        Running pnpm lint...
        Fixed 3 issues:
        - Removed unused import in src/components/Header.tsx
        - Added missing dependency in useEffect at src/hooks/useData.ts:15
        - Fixed type error in src/lib/api.ts:42
        Running pnpm build...
        ✅ Format: Passed
        ✅ Lint: Passed
        ✅ Build: Successful

        Phase 1: Changelog Update
        [analyzes changes]

        I've updated CHANGELOG.md with the following entries:
        ### Added
        - User authentication system
        - Profile page with edit functionality

        Proceed with release? (yes/no)
You: yes
Claude: Current version: 0.18.0
        Suggested next version: 0.19.0 (MINOR - new features added)
        Release as version 0.19.0? (or specify different version)
You: yes
Claude: [creates release and pushes]
        ✅ Released v0.19.0
        📦 Commit: abc123def
        🏷️  Tag: v0.19.0
        🔗 https://github.com/user/repo/releases/tag/v0.19.0
```

---

### `/changelog` - Update Changelog Only

**Use this when**:

- You want to document changes but not release yet
- You're accumulating changes for a bigger release
- You want to manually review before releasing

**What it does**:

1. Analyzes recent changes
2. Updates CHANGELOG.md [Unreleased] section
3. Shows you the diff
4. Stops there (no version, no tag, no push)

**Workflow**:

```bash
# Update changelog as you work
git add .
/changelog

# Continue working...
# When ready to release:
/release
```

---

### `/release` - Create Version and Publish

**Use this when**:

- CHANGELOG.md is already up to date
- You've manually edited the [Unreleased] section
- You just need to version and publish

**What it does**:

1. Checks that CHANGELOG.md has [Unreleased] section with content
2. Determines next version
3. Updates package.json and CHANGELOG.md
4. Creates commit, tag, and pushes

**Workflow**:

```bash
# 1. CHANGELOG.md already updated
# 2. Just release it
/release

# 3. Confirm version
# 4. Done! ✨
```

**Note**: If [Unreleased] section is empty or missing, you'll be told to run `/changelog` first.

---

### `/archive-changelog` - Archive Old Versions

**Use this when**:

- CHANGELOG.md exceeds 1000 lines
- You want to keep the main file clean and readable
- You're doing periodic maintenance

**What it does**:

1. Checks if archiving is needed (≥1000 lines)
2. Identifies oldest versions (keeps 10 most recent)
3. Moves old versions to `changelogs/CHANGELOG-YYYY-archive.md`
4. Updates main CHANGELOG.md with archive links
5. Preserves all content (nothing is deleted)

**Workflow**:

```bash
# Run when CHANGELOG.md gets too long
/archive-changelog

# Result:
# CHANGELOG.md: 440 lines (was 1367)
# changelogs/CHANGELOG-2025-archive.md: 323 lines
```

**Automatic reminder**: The `/release` and `/ship` commands will remind you if archiving is recommended.

---

### `/deploy` - Deploy to Cloudflare Workers

**Use this when**:

- You've just released a new version
- You want to deploy to production

**What it does**:

- Deploys the application to Cloudflare Workers
- (See deploy.md for full details)

---

## Best Practices

### Standard Workflow (Recommended) ⭐

```bash
# 1. Work on features
git add .

# 2. Ship everything at once (includes quality checks)
/ship

# 3. Deploy (optional)
/deploy
```

### Quality-First Workflow

```bash
# 1. Work on features
git add .

# 2. Check quality before anything else
/check

# 3. If checks pass, proceed with release
/ship

# 4. Deploy
/deploy
```

**Note**: `/ship` already includes `/check` as Phase 0, so running `/check` separately is optional.

### Gradual Workflow (For Large Changes)

```bash
# 1. Work on feature A
git add .
/changelog

# 2. Work on feature B
git add .
/changelog

# 3. Work on feature C
git add .
/changelog

# 4. Ready to release everything
/release

# 5. Deploy
/deploy
```

### Manual Workflow (For Fine Control)

```bash
# 1. Work on features
git add .

# 2. Manually edit CHANGELOG.md
vim CHANGELOG.md

# 3. Just create the release
/release

# 4. Deploy
/deploy
```

---

## Changelog Guidelines

### Automatic Categorization

The changelog commands automatically categorize changes:

- **Added**: New features, files, components, or functionality
- **Changed**: Updates, improvements, or modifications to existing features
- **Fixed**: Bug fixes and error corrections
- **Removed**: Deleted features, files, or functionality
- **Security**: Security improvements, vulnerability fixes, or auth updates
- **Deprecated**: Features marked for future removal

### Dependency Updates

Dependency updates are automatically grouped and summarized:

**Instead of listing 20+ packages**:

```markdown
### Changed

**Dependencies**

- Updated Next.js to 16.0.8, React to 19.2.1, and 20+ other dependencies
- Major version updates: vitest (4.0.15), @react-email/components (1.0.1)
- Notable updates: better-auth (1.4.6), drizzle-orm (0.45.0)
```

### Focus on User Impact

The commands focus on **what changed and why it matters to users**, not internal implementation details.

**Good**:

- "AI chat drawer now persists conversation ID across messages"
- "Improved sidebar footer layout with better spacing"

**Avoid**:

- "Refactored useEffect hook in AiDrawer component"
- "Changed variable name from foo to bar"

---

## Troubleshooting

### "No changes to document"

**Problem**: `/changelog` or `/ship` says there are no meaningful changes.

**Solution**:

- Make sure you've staged changes: `git add .`
- Or make actual code changes before running the command

### "[Unreleased] section is empty"

**Problem**: `/release` complains about empty [Unreleased] section.

**Solution**: Run `/changelog` first to populate it, or manually add entries.

### "CHANGELOG.md exceeds 1000 lines"

**Problem**: `/release` or `/ship` warns about file size.

**Solution**: Run `/archive-changelog` after releasing to move old versions to archive.

### Git push fails

**Problem**: "fatal: No configured push destination" or similar.

**Solution**:

- Configure git remote: `git remote add origin <url>`
- Or push manually after the command completes

---

## File Structure

```
.
├── .claude/
│   ├── COMMANDS.md           # This documentation file
│   └── commands/
│       ├── check.md          # Format, lint, build validation
│       ├── changelog.md      # Update changelog only
│       ├── release.md        # Version and publish only
│       ├── ship.md           # Complete workflow ⭐
│       ├── archive-changelog.md  # Archive old versions
│       └── deploy.md         # Deploy to Cloudflare
├── CHANGELOG.md              # Main changelog (recent versions)
├── changelogs/
│   └── CHANGELOG-2025-archive.md  # Archived old versions
└── package.json
```

---

## Version History

- **Current**: Added `/check` command for code quality validation
- **Current**: Integrated `/check` into `/ship` as Phase 0
- **v0.18.0**: Added `/ship` unified command
- **v0.17.0**: Enhanced `/changelog` with dependency grouping
- **v0.17.0**: Added `/archive-changelog` for changelog rotation
- **v0.3.0**: Initial `/changelog` and `/release` commands
