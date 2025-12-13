# Checkbox Reorder Preserves First Number

## What This Tests

Verifies that the first line's number is preserved during checkbox reordering to prevent visual glitches before automatic renumbering runs.

## Settings Required

-   Live renumbering: **Enabled**
-   Live checkbox reordering: **Enabled**
-   Checked items at bottom: **Enabled**

## Steps

1. Open `test.md`
2. Check the first checkbox (toggle `[ ]` to `[x]`)
3. Compare the result in `test.md` with `expected.md`

## Expected Result

The list should immediately match `expected.md` with no visual glitches.
Specifically, the first line should show "1. [ ] Task B" (not "2. [ ] Task B").

## Bug Behavior (What Should NOT Happen)

Without the fix, when you check the first checkbox, the reordering runs before renumbering. Task B (originally line 2) becomes the new first line while keeping its "2." number:

**Bugged behavior:**
```
2. [ ] Task B  ← Wrong! Should be "1."
3. [ ] Task C
4. [x] Task A
```

The list should start at "1." not "2."

> Note that obisidian's default smart lists cause this bug regardless
