---
description: Archive old changelog versions to keep main file manageable
---

# Archive Changelog

Automatically archive old changelog versions to maintain a clean and manageable main CHANGELOG.md file.

Execute these steps autonomously:

1. **Analyze current state**:
   - Count lines in CHANGELOG.md to determine if archiving is needed
   - If <1000 lines: inform user that archiving is not necessary yet and STOP
   - If ≥1000 lines: proceed with archiving
   - Identify the oldest versions to archive (keep most recent 10 versions in main file)

2. **Determine archive strategy**:
   - Check current date to determine archive file name (e.g., CHANGELOG-2026-archive.md)
   - Identify which versions to move (versions older than the most recent 10)
   - Calculate how many versions will be archived

3. **Create or update archive file**:
   - Create `changelogs/` directory if it doesn't exist
   - Check if archive file for current year exists
   - If exists: append old versions to it
   - If doesn't exist: create new archive file with header
   - Archive file header format:

     ```markdown
     # Archived Changelog - YYYY (vX.Y.Z - vA.B.C)

     This file contains archived changelog entries for Plannerinator.

     For current and recent changes, see [CHANGELOG.md](../CHANGELOG.md) in the root directory.

     ---
     ```

4. **Update main CHANGELOG.md**:
   - Remove archived versions from main file
   - Add "Archived Versions" section with link to archive file if not present
   - Keep only version comparison links for versions in main file
   - Add comparison links for archived versions to the archive file

5. **Show summary**:
   - Display how many versions were archived
   - Show new line count of CHANGELOG.md
   - Show path to archive file
   - Confirm success

**Important**:

- Execute all steps automatically without asking for intermediate confirmations
- Always keep the most recent 10 versions in the main CHANGELOG.md
- Preserve all content - never delete any changelog entries, only move them
- Maintain proper markdown formatting in both files
- Update version comparison links correctly in both files
- If CHANGELOG.md is already <1000 lines, inform user and stop (no archiving needed)

**Archive file naming convention**:

- `changelogs/CHANGELOG-YYYY-archive.md` - Where YYYY is the year of the oldest version being archived
- For very old versions (pre-1.0): `changelogs/CHANGELOG-pre-1.0-archive.md`

**Example archive section in main CHANGELOG.md**:

```markdown
---

## Archived Versions

Older changelog entries have been moved to archive files for better readability:

- **2025** (v0.1.0 - v0.10.0): [CHANGELOG-2025-archive.md](changelogs/CHANGELOG-2025-archive.md)
- **2026** (v0.11.0 - v0.20.0): [CHANGELOG-2026-archive.md](changelogs/CHANGELOG-2026-archive.md)

---
```

**When updating existing archive section**:

- If archive section already exists: Add new archive entry to the list (newest first)
- If archive section doesn't exist: Create it with the new format
- Keep archive entries sorted by year (newest at top)
- Each entry format: `- **YYYY** (vX.Y.Z - vA.B.C): [CHANGELOG-YYYY-archive.md](changelogs/CHANGELOG-YYYY-archive.md)`
