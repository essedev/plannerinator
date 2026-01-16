---
description: Format, lint, and build the project - fix all errors and warnings properly
---

# Check Code Quality

Runs format, lint, and build checks - fixes all errors and warnings with proper solutions (not quick hacks).

Execute these steps autonomously:

## 1. Format Code

```bash
pnpm format
```

- Runs Prettier to format all code
- If formatting changes files, note which files were modified
- Formatting is automatic and should not produce errors

## 2. Lint Code

```bash
pnpm lint
```

**Analyze lint output**:

- If no errors/warnings: proceed to build
- If errors/warnings exist: fix them properly

**Fixing lint issues** - Priority order:

### A. Fix the actual code issue (ALWAYS TRY THIS FIRST)

**DO NOT use eslint-disable unless absolutely necessary.**

Most lint issues should be fixed by correcting the code, not by disabling the rule.

**Common patterns and proper fixes**:

1. **Unused variables/imports**:
   - ❌ DON'T: `// eslint-disable-next-line @typescript-eslint/no-unused-vars`
   - ✅ DO: Remove the unused variable/import
   - ✅ DO: If truly needed for type signature, prefix with `_` (e.g., `_unused`)

2. **Missing dependencies in useEffect/useCallback**:
   - ❌ DON'T: `// eslint-disable-next-line react-hooks/exhaustive-deps`
   - ✅ DO: Add the missing dependency to the array
   - ✅ DO: If the dependency causes issues, wrap it in useCallback/useMemo
   - ✅ DO: If it's a setter from useState, it's stable and doesn't need to be added
   - Only disable if you have a legitimate reason (e.g., intentionally run only on mount)

3. **Any type usage**:
   - ❌ DON'T: `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
   - ✅ DO: Use proper TypeScript types
   - ✅ DO: Use generics if the type is variable
   - ✅ DO: Use `unknown` and type guards if you don't know the type
   - Only use `any` with disable comment if dealing with untyped third-party code

4. **Missing await in async function**:
   - ❌ DON'T: Disable the warning
   - ✅ DO: Add `await` if the promise should be awaited
   - ✅ DO: Remove `async` if no awaits are needed
   - ✅ DO: Add `.catch()` if intentionally not awaiting

5. **React component not using return value**:
   - ❌ DON'T: Disable the warning
   - ✅ DO: Return JSX if it's a component
   - ✅ DO: Make it a regular function if it's not a component

6. **Prefer const over let**:
   - ❌ DON'T: Ignore the warning
   - ✅ DO: Change `let` to `const` if the variable is never reassigned

7. **No console.log in production**:
   - ❌ DON'T: Leave console.logs in production code
   - ✅ DO: Remove debug console.logs
   - ✅ DO: Use proper logging library if needed
   - Only disable for intentional console usage (rare)

### B. When eslint-disable IS acceptable

Use `eslint-disable-next-line` or `eslint-disable` ONLY when:

1. **Third-party library issues**: Untyped libraries requiring `any`
2. **Intentional design**: You have a specific reason documented in a comment
3. **Framework requirements**: Next.js or React patterns that trigger false positives
4. **Temporary workaround**: With a TODO comment and issue tracker reference

**Format when disabling**:

```typescript
// We need to disable this because [specific reason]
// TODO: Fix properly in issue #123
// eslint-disable-next-line rule-name
const problematicCode = something;
```

### C. Fix globally if it's a bad rule

If a rule consistently gives bad advice:

- Don't disable it everywhere in code
- Update `.eslintrc` or `eslint.config.mjs` to disable/configure the rule globally
- Document why in the config file

## 3. Build Project

```bash
pnpm build
```

**Analyze build output**:

- If build succeeds: report success
- If build fails: fix the errors

**Common build errors and fixes**:

1. **TypeScript type errors**:
   - Read the error message carefully
   - Fix type mismatches properly with correct types
   - Don't use `as any` or `@ts-ignore` unless absolutely necessary

2. **Import errors (module not found)**:
   - Check file paths and imports
   - Verify the file exists
   - Fix import statements

3. **Next.js specific errors**:
   - Server/client component boundaries
   - Async component issues
   - Metadata export issues
   - Fix according to Next.js 15 patterns

4. **Build optimization warnings**:
   - Large bundle size: Consider code splitting
   - Image optimization: Use Next.js Image component
   - Fix properly, don't ignore

## 4. Report Results

After all checks pass:

**Show summary**:

```
✅ Format: No changes needed (or X files formatted)
✅ Lint: All checks passed (or Fixed X issues)
✅ Build: Successful
```

**If you fixed issues**:

- List what was fixed and how
- Explain why you chose that solution
- Note if any eslint-disable was needed and why

**If checks still fail**:

- Show the remaining errors
- Explain what needs manual attention
- Suggest solutions but don't implement quick hacks

## Important Guidelines

**Code quality standards**:

- Prefer fixing code over disabling rules (95% of cases)
- Write proper TypeScript types, don't use `any`
- Remove unused code instead of commenting it out
- Add missing dependencies instead of disabling hooks rules
- Fix the root cause, not the symptom

**When you fix code**:

- Read the full file context before making changes
- Understand what the code does
- Make minimal, targeted changes
- Don't introduce new bugs while fixing lints
- Test that the logic still works

**Use of disable comments**:

- Should be <5% of all lint issues
- Always include a comment explaining why
- Consider if the rule should be changed globally instead
- Prefer more specific disables over broad ones

**Don't**:

- Mass-add eslint-disable comments everywhere
- Use `any` type everywhere to silence TS errors
- Remove code that's actually used
- Break functionality to pass lints
- Rush through fixes without understanding them

## Example Workflow

**Bad approach** ❌:

```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { something } from "./module";

// eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  doSomething(dependency);
}, []);

const data: any = await fetch();
```

**Good approach** ✅:

```typescript
// Removed unused import entirely

useEffect(() => {
  doSomething(dependency);
}, [dependency]); // Added missing dependency

interface ApiResponse {
  id: string;
  name: string;
}
const data: ApiResponse = await fetch();
```
