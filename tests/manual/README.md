# Manual Tests

This folder contains manual tests that need to be performed in Obsidian.

## Why Manual Tests?

Some plugin functionalities cannot be tested with Playwright or programmatic tests because:

-   Playwright doesn't support Obsidian's editor API well
-   No public API exists for certain editor behaviors (e.g., checkbox toggling, live updates)
-   Edge cases involving file boundaries (first/last lines) need verification
-   Testing behavior with empty lines at start/end of files

## Structure

Each test is in its own subfolder containing:

-   `instructions.md` - What to test and how to test it
-   `test.md` - The file to perform the test on (contains initial state, clean content only)
-   `expected.md` - The expected result after performing the test (clean content only)

## How to Use

1. Open the test folder in Obsidian
2. Read `instructions.md` to understand the test
3. Work in `test.md` following the instructions
4. Compare the result in `test.md` (actual) with `expected.md`

## Adding New Tests

1. Create a new subfolder with a descriptive name (e.g., `checkbox-reorder-issue-123`)
2. Create `instructions.md` with test description and steps
3. Create `test.md` with the initial state (clean content only)
4. Create `expected.md` with the expected outcome (clean content only)
