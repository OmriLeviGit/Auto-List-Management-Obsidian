import { Editor, EditorChange } from "obsidian";
import { getLineInfo } from "./utils";
import { LineInfo, ReorderResult, ChecklistBlock } from "./types";
import SettingsManager from "./SettingsManager";

function reorderChecklist(editor: Editor, start: number, limit?: number): ReorderResult | undefined {
    const result = limit === undefined ? reorderAtIndex(editor, start) : reorderAllListsInRange(editor, start, limit);

    if (!result) {
        return undefined;
    }

    const { changes, reorderResult } = result;
    applyChangesToEditor(editor, changes);

    return reorderResult;
}

// renumbers all numbered lists in specified range
function reorderAllListsInRange(
    editor: Editor,
    start: number,
    limit: number
): { reorderResult: ReorderResult; changes: EditorChange[] } | undefined {
    const isInvalidRange = start < 0 || editor.lastLine() + 1 < limit || limit < start;
    const changes: EditorChange[] = [];

    let i = start;
    let currentStart: number | undefined = undefined;
    let end = i;

    if (isInvalidRange) {
        console.error(
            `reorderAllListsInRange is invalid with index=${start}, limit=${limit}. editor.lastLine()=${editor.lastLine()}`
        );

        return;
    }

    for (; i < limit; i++) {
        const reorderData = reorderAtIndex(editor, i);

        if (reorderData === undefined || reorderData.changes === undefined) {
            continue;
        }

        changes.push(...reorderData.changes);

        if (currentStart === undefined) {
            currentStart = reorderData.reorderResult.start;
        }

        end = reorderData.reorderResult.limit;
        i = end;

        while (shouldBeSortedAsChecked(getLineInfo(editor.getLine(i)).checkboxChar) !== undefined) {
            i++;
        }
    }

    if (changes.length === 0) return undefined;

    return {
        reorderResult: {
            start: currentStart ?? start,
            limit: end,
        },
        changes,
    };
}

function reorderAtIndex(
    editor: Editor,
    index: number
): { reorderResult: ReorderResult; changes: EditorChange[] } | undefined {
    const line = editor.getLine(index);
    const startInfo = getLineInfo(line);
    const hasContent = hasCheckboxContent(line);

    // if not a checkbox or without any content, dont reorder
    if (shouldBeSortedAsChecked(startInfo.checkboxChar) === undefined || hasContent === false) {
        return;
    }

    const checklistStartIndex = getChecklistStart(editor, index);

    const { orderedItems, reorderResult } = reorder(editor, checklistStartIndex, startInfo);

    if (orderedItems.length === 0) {
        return; // no changes are needed
    }

    const { start: startIndex, limit: endIndex } = reorderResult;

    const newText = endIndex > editor.lastLine() ? orderedItems.join("\n") : orderedItems.join("\n") + "\n"; // adjust for the last line in note

    const change: EditorChange = {
        from: { line: startIndex, ch: 0 },
        to: { line: endIndex, ch: 0 },
        text: newText,
    };

    return {
        changes: [change],
        reorderResult: {
            start: startIndex,
            limit: endIndex,
        },
    };
}

/**
 * NEW BLOCK-BASED IMPLEMENTATION
 *
 * Reorders checkbox items in a checklist, treating each checkbox and its indented
 * children as a single block that moves together.
 *
 * Key changes from the old line-based approach:
 * 1. Extracts checkbox blocks (parent + all indented children)
 * 2. Reorders blocks instead of individual lines
 * 3. Recursively processes nested checkboxes within each block
 *
 * This enables hierarchical checkbox reordering where checking a parent checkbox
 * moves the entire subtree (including indented content and sub-checkboxes).
 */
function reorder(
    editor: Editor,
    index: number,
    startInfo: LineInfo
): { orderedItems: string[]; reorderResult: ReorderResult } {
    const checkedItemsAtBottom = SettingsManager.getInstance().isCheckedItemsAtBottom();
    const charsToDelete = getCharsToDelete();

    const startIndex = findReorderStartPosition(editor, index, startInfo, checkedItemsAtBottom);

    // Phase 1: Extract all checkbox blocks at the current indentation level
    const { blocks, finishedAt } = extractBlocksAtLevel(editor, startIndex, startInfo);

    // If no blocks found, return empty (no changes needed)
    if (blocks.length === 0) {
        return {
            orderedItems: [],
            reorderResult: {
                start: startIndex,
                limit: startIndex,
            },
        };
    }

    // Phase 2: Reorder blocks based on checkbox state
    const reorderedBlocks = reorderBlocks(blocks, checkedItemsAtBottom, charsToDelete);

    // Phase 3: Recursively process each block and flatten to lines
    // This handles nested checkboxes within each block
    const allLines: string[] = [];
    for (const block of reorderedBlocks) {
        const blockLines = recursivelyProcessBlock(block, checkedItemsAtBottom, charsToDelete);
        allLines.push(...blockLines);
    }

    // If automatic renumbering is enabled, preserve the original first line's number
    // This prevents glitches before the renumbering pass runs
    if (SettingsManager.getInstance().getLiveNumberingUpdate() && allLines.length > 0) {
        const originalLine = editor.getLine(startIndex);
        const originalInfo = getLineInfo(originalLine);
        const newFirstInfo = getLineInfo(allLines[0]);

        if (originalInfo.number !== undefined && newFirstInfo.number !== undefined) {
            // Reconstruct the line with original number but new content
            // This handles different digit lengths correctly (1. vs 12. vs 123.)
            const prefix = originalLine.substring(0, originalInfo.spaceCharsNum);
            const suffix = allLines[0].substring(newFirstInfo.textOffset);
            allLines[0] = prefix + originalInfo.number + ". " + suffix;
        }
    }

    // Phase 4: Optimization - Remove unchanged lines from the beginning
    let count = 0;
    for (; count < allLines.length; count++) {
        if (allLines[count] !== editor.getLine(startIndex + count)) {
            break;
        }
    }

    const orderedItems = allLines.slice(count);
    const newStart = startIndex + count;

    // Phase 5: Optimization - Remove unchanged lines from the end
    // After removing lines from the beginning (count items), we need to compare
    // the end of orderedItems with the corresponding lines in the editor.
    // orderedItems[i] should match editor.getLine(newStart + i)
    for (let i = orderedItems.length - 1; i >= 0; i--) {
        if (orderedItems[i] !== editor.getLine(newStart + i)) {
            orderedItems.splice(i + 1);
            break;
        }
    }

    // When no changes needed and hierarchical mode is OFF, return appropriate boundary indices
    if (orderedItems.length === 0 && !SettingsManager.getInstance().isHierarchicalReordering()) {
        if (checkedItemsAtBottom) {
            return {
                orderedItems,
                reorderResult: { start: finishedAt, limit: finishedAt },
            };
        }

        const firstIsChecked =
            blocks[0]?.parentInfo.checkboxChar !== undefined && blocks[0].parentInfo.checkboxChar !== " ";
        if (!firstIsChecked) {
            return {
                orderedItems,
                reorderResult: { start: startIndex, limit: startIndex },
            };
        }

        let boundaryIndex = startIndex;
        for (const block of blocks) {
            const isChecked = block.parentInfo.checkboxChar !== undefined && block.parentInfo.checkboxChar !== " ";
            if (!isChecked) break;
            boundaryIndex += 1 + block.childLines.length;
        }

        return {
            orderedItems,
            reorderResult: { start: boundaryIndex, limit: boundaryIndex },
        };
    }

    return {
        orderedItems,
        reorderResult: {
            start: newStart,
            limit: newStart + orderedItems.length,
        },
    };
}

function getChecklistStart(editor: Editor, index: number): number {
    if (index === 0) {
        return index;
    }

    const startInfo = getLineInfo(editor.getLine(index));
    let i = index - 1;

    while (0 <= i) {
        const currInfo = getLineInfo(editor.getLine(i));
        if (!isSameStatus(startInfo, currInfo)) {
            break;
        }
        i--;
    }

    return i + 1;
}

/**
 * Finds the starting position for reordering when checked items go at the bottom.
 *
 * In the old line-based approach, this would skip unchecked lines.
 * In the new block-based approach, we skip entire unchecked blocks.
 *
 * HOWEVER, for the block-based reordering to work correctly, we should always
 * start from the original startIndex because we extract and reorder ALL blocks
 * in the range, not just the checked ones.
 *
 * The old optimization of skipping unchecked items doesn't apply anymore because:
 * 1. We extract all blocks (both checked and unchecked) at once
 * 2. We reorder them based on their checked state
 * 3. We only apply changes where actual reordering occurred
 */
function findReorderStartPosition(
    editor: Editor,
    startIndex: number,
    startInfo: LineInfo,
    checkedItemsAtBottom: boolean
): number {
    // Always start from the beginning for block-based reordering
    return startIndex;
}

// Status = Both lines are numbered \ unnumbered
function isSameStatus(info1: LineInfo, info2: LineInfo): boolean {
    const hasSameNumberStatus = (info1.number !== undefined) === (info2.number !== undefined);
    const hasSameIndentation = info1.spaceIndent === info2.spaceIndent;
    const hasSameCheckboxStatus =
        (shouldBeSortedAsChecked(info1.checkboxChar) !== undefined) ===
        (shouldBeSortedAsChecked(info2.checkboxChar) !== undefined);

    if (hasSameNumberStatus && hasSameIndentation && hasSameCheckboxStatus) {
        return true;
    }

    return false;
}

/**
 * Extracts a checkbox block consisting of the parent checkbox line
 * and all lines indented more than the parent.
 *
 * A block includes:
 * - The checkbox line itself (parent)
 * - ALL subsequent lines with greater indentation (children)
 *   - This includes text, code, nested checkboxes, etc.
 *
 * The block ends when we encounter:
 * - A line with equal or less indentation than the parent
 * - The end of the editor
 *
 * @param editor - The Obsidian editor instance
 * @param startLineIndex - Index of the checkbox line (parent)
 * @returns Object containing the extracted block and the index of the next line after the block
 */
function extractBlock(editor: Editor, startLineIndex: number): { block: ChecklistBlock; nextIndex: number } {
    const parentLine = editor.getLine(startLineIndex);
    const parentInfo = getLineInfo(parentLine);
    const parentIndent = parentInfo.spaceIndent;
    const childLines: string[] = [];

    let i = startLineIndex + 1;

    // Only collect children if hierarchical reordering is enabled
    const useHierarchical = SettingsManager.getInstance().isHierarchicalReordering();

    if (useHierarchical) {
        while (i <= editor.lastLine()) {
            const line = editor.getLine(i);
            const lineInfo = getLineInfo(line);

            if (lineInfo.spaceIndent <= parentIndent) {
                break;
            }

            childLines.push(line);
            i++;
        }
    }

    return {
        block: {
            parentLine,
            parentInfo,
            childLines,
        },
        nextIndex: i,
    };
}

/**
 * Extracts all checkbox blocks at the same indentation level within a checklist group.
 *
 * This function:
 * 1. Starts at startIndex and processes lines forward
 * 2. Only extracts blocks (checkboxes) at the targetIndent level
 * 3. Stops when it hits a line with different status (using isSameStatus)
 * 4. Returns all extracted blocks and the index where processing stopped
 *
 * @param editor - The Obsidian editor instance
 * @param startIndex - Index to start searching from
 * @param startInfo - LineInfo of the line that triggered reordering (for status comparison)
 * @returns Object containing array of blocks and the index where we finished
 */
function extractBlocksAtLevel(
    editor: Editor,
    startIndex: number,
    startInfo: LineInfo
): { blocks: ChecklistBlock[]; finishedAt: number } {
    const blocks: ChecklistBlock[] = [];
    const targetIndent = startInfo.spaceIndent;
    let i = startIndex;

    // Process lines while they're part of the same checklist group
    while (i <= editor.lastLine()) {
        const line = editor.getLine(i);
        const currInfo = getLineInfo(line);

        // Stop if the line status differs from the starting group
        if (!isSameStatus(startInfo, currInfo)) {
            break;
        }

        // If this line is at our target indentation and has a checkbox, extract it as a block
        if (currInfo.spaceIndent === targetIndent && currInfo.checkboxChar !== undefined) {
            const { block, nextIndex } = extractBlock(editor, i);
            blocks.push(block);
            i = nextIndex; // Skip past the entire block (parent + all children)
        } else {
            // This line is not a checkbox at our level, skip it
            i++;
        }
    }

    return {
        blocks,
        finishedAt: i,
    };
}

/**
 * Reorders checkbox blocks based on their checkbox state.
 *
 * Categorizes blocks into:
 * - Unchecked blocks (checkbox char = ' ')
 * - Checked blocks (grouped by checkbox character, then sorted)
 * - Delete blocks (checkbox chars in charsToDelete set)
 *
 * @param blocks - Array of checkbox blocks to reorder
 * @param checkedItemsAtBottom - If true, checked items go to bottom; if false, to top
 * @param charsToDelete - Set of checkbox characters that should be treated as "to delete"
 * @returns Reordered array of blocks
 */
function reorderBlocks(
    blocks: ChecklistBlock[],
    checkedItemsAtBottom: boolean,
    charsToDelete: Set<string>
): ChecklistBlock[] {
    const uncheckedBlocks: ChecklistBlock[] = [];
    const checkedMap: Map<string, ChecklistBlock[]> = new Map();
    const deleteBlocks: ChecklistBlock[] = [];

    // Phase 1: Categorize blocks
    for (const block of blocks) {
        const char = block.parentInfo.checkboxChar!; // We know it exists because we extracted checkbox blocks

        if (charsToDelete.has(char.toLowerCase())) {
            deleteBlocks.push(block);
        } else if (shouldBeSortedAsChecked(char)) {
            if (!checkedMap.has(char)) {
                checkedMap.set(char, []);
            }
            checkedMap.get(char)!.push(block);
        } else {
            uncheckedBlocks.push(block);
        }
    }

    // Phase 2: Sort checked blocks by checkbox character
    const checkedBlocks: ChecklistBlock[] = [];
    const keys = Array.from(checkedMap.keys()).sort();
    for (const key of keys) {
        checkedBlocks.push(...checkedMap.get(key)!);
    }

    // Add delete blocks to the end of checked blocks
    checkedBlocks.push(...deleteBlocks);

    // Phase 3: Combine based on settings
    const reordered = checkedItemsAtBottom
        ? [...uncheckedBlocks, ...checkedBlocks]
        : [...checkedBlocks, ...uncheckedBlocks];

    return reordered;
}

/**
 * Extracts checkbox blocks from an array of lines (instead of from Editor).
 * Used for processing nested checkboxes within a block's children.
 *
 * @param lines - Array of lines to extract blocks from
 * @param targetIndent - Indentation level to look for checkboxes at
 * @returns Object containing extracted blocks and the index where extraction ended
 */
function extractBlocksFromLines(
    lines: string[],
    targetIndent: number
): { blocks: ChecklistBlock[]; lastProcessedIndex: number } {
    const blocks: ChecklistBlock[] = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i];
        const lineInfo = getLineInfo(line);

        // If this is a checkbox at the target indentation level, extract it as a block
        if (lineInfo.spaceIndent === targetIndent && lineInfo.checkboxChar !== undefined) {
            const parentLine = line;
            const parentInfo = lineInfo;
            const childLines: string[] = [];

            const useHierarchical = SettingsManager.getInstance().isHierarchicalReordering();

            let j = i + 1;
            if (useHierarchical) {
                while (j < lines.length) {
                    const childLine = lines[j];
                    const childLineInfo = getLineInfo(childLine);

                    if (childLineInfo.spaceIndent <= targetIndent) {
                        break;
                    }

                    childLines.push(childLine);
                    j++;
                }
            }

            blocks.push({
                parentLine,
                parentInfo,
                childLines,
            });

            i = j;
        } else {
            i++;
        }
    }

    return {
        blocks,
        lastProcessedIndex: i,
    };
}

/**
 * Recursively processes a checkbox block, reordering any nested checkboxes within its children.
 *
 * This function:
 * 1. Takes a block (parent checkbox + all indented children)
 * 2. Looks for nested checkboxes at the immediate child indentation level
 * 3. Reorders those nested checkboxes based on their checkbox state
 * 4. Recursively processes each nested block
 * 5. Preserves non-checkbox lines in their appropriate positions
 * 6. Returns all lines flattened (parent + processed children)
 *
 * Example:
 * Input block:
 *   - [ ] Parent
 *       Description text
 *       - [x] Child 1
 *       - [ ] Child 2
 *
 * Output (with checked at bottom):
 *   - [ ] Parent
 *       Description text
 *       - [ ] Child 2
 *       - [x] Child 1
 *
 * @param block - The checkbox block to process
 * @param checkedItemsAtBottom - Settings flag for checked item position
 * @param charsToDelete - Set of checkbox characters to treat as "to delete"
 * @returns Array of lines (parent + all processed children)
 */
function recursivelyProcessBlock(
    block: ChecklistBlock,
    checkedItemsAtBottom: boolean,
    charsToDelete: Set<string>
): string[] {
    const result: string[] = [block.parentLine];

    // Base case: no children, just return the parent line
    if (block.childLines.length === 0) {
        return result;
    }

    // Calculate the indentation level for immediate children
    const childIndent = block.parentInfo.spaceIndent + SettingsManager.getInstance().getIndentSize();

    // Extract checkbox blocks at the child level
    const { blocks: childBlocks } = extractBlocksFromLines(block.childLines, childIndent);

    // If no nested checkboxes found, return parent + all children as-is
    if (childBlocks.length === 0) {
        return [...result, ...block.childLines];
    }

    // Strategy: We need to reconstruct childLines by:
    // 1. Identifying which line indices belong to checkbox blocks
    // 2. Preserving non-checkbox lines in their original order
    // 3. Replacing checkbox blocks with their reordered & recursively processed versions

    // Map each line index to the block it belongs to (if any)
    const lineToBlockMap = new Map<number, ChecklistBlock>();
    const blockStartIndices = new Map<ChecklistBlock, number>();

    for (const childBlock of childBlocks) {
        // Find where this block starts in childLines
        for (let i = 0; i < block.childLines.length; i++) {
            if (block.childLines[i] === childBlock.parentLine) {
                blockStartIndices.set(childBlock, i);
                // Mark the parent line
                lineToBlockMap.set(i, childBlock);
                // Mark all child lines of this block
                for (let j = 0; j < childBlock.childLines.length; j++) {
                    lineToBlockMap.set(i + 1 + j, childBlock);
                }
                break;
            }
        }
    }

    // Collect lines that are NOT part of any checkbox block (prefix and suffix lines)
    const prefixLines: string[] = [];
    const suffixLines: string[] = [];

    // Find the first checkbox index
    const firstCheckboxIndex = Math.min(...Array.from(blockStartIndices.values()));
    // Find the last line of the last checkbox block
    let lastCheckboxEndIndex = -1;
    for (const [childBlock, startIndex] of blockStartIndices.entries()) {
        // Block occupies: startIndex (parent) + childLines.length (children)
        // So the next line after the block is at: startIndex + 1 + childLines.length
        const endIndex = startIndex + 1 + childBlock.childLines.length;
        if (endIndex > lastCheckboxEndIndex) {
            lastCheckboxEndIndex = endIndex;
        }
    }

    // Collect prefix lines (before first checkbox)
    for (let i = 0; i < firstCheckboxIndex; i++) {
        prefixLines.push(block.childLines[i]);
    }

    // Collect suffix lines (after last checkbox block)
    for (let i = lastCheckboxEndIndex; i < block.childLines.length; i++) {
        suffixLines.push(block.childLines[i]);
    }

    // Reorder child blocks
    const reorderedChildren = reorderBlocks(childBlocks, checkedItemsAtBottom, charsToDelete);

    // Add prefix lines
    result.push(...prefixLines);

    // Recursively process and add reordered child blocks
    for (const childBlock of reorderedChildren) {
        const processedLines = recursivelyProcessBlock(childBlock, checkedItemsAtBottom, charsToDelete);
        result.push(...processedLines);
    }

    // Add suffix lines
    result.push(...suffixLines);

    return result;
}

function deleteChecked(editor: Editor): { deleteResult: ReorderResult; deletedItemCount: number } {
    const lastLine = editor.lastLine();
    const changes: EditorChange[] = [];
    const charsToDelete = getCharsToDelete();

    let deletedItemCount = 0;
    let start = 0;
    let end = 0;

    for (let i = 0; i <= lastLine; i++) {
        const currLine = getLineInfo(editor.getLine(i));

        if (currLine.checkboxChar !== undefined && charsToDelete.has(currLine.checkboxChar.toLowerCase())) {
            if (start === 0) {
                start = i;
            }

            changes.push({
                from: { line: i, ch: 0 },
                to: { line: i + 1, ch: 0 },
                text: "",
            });

            end = i;
            deletedItemCount++;
        }
    }

    applyChangesToEditor(editor, changes);

    // last line is done separately becasue it has no new line after it
    if (end === lastLine && end !== 0) {
        const lastIndex = editor.lastLine();
        if (lastIndex > 0) {
            editor.replaceRange(
                "",
                { line: lastIndex - 1, ch: editor.getLine(lastIndex - 1).length },
                { line: lastIndex, ch: 0 }
            );
        }
    }

    const limit = end + 1 - deletedItemCount; //  index after the last deleted line

    return { deleteResult: { start, limit }, deletedItemCount };
}

// char should be treated as checked
function shouldBeSortedAsChecked(char: string | undefined): boolean | undefined {
    if (char === undefined) {
        return undefined;
    }

    const sortSpecialChars = SettingsManager.getInstance().getSortSpecialChars();
    const checkedItems = getCharsToDelete();
    const isSpecialChar = char !== " ";

    if ((isSpecialChar && sortSpecialChars) || checkedItems.has(char)) {
        return true;
    }

    return false;
}

function getCharsToDelete(): Set<string> {
    const value = SettingsManager.getInstance().getCharsToDelete();
    const defaultDelete = ["x"];
    const filterChars = value
        .trim()
        .toLowerCase()
        .split(" ")
        .filter((char) => char.length === 1);

    const charsToDelete = new Set([...defaultDelete, ...filterChars]);

    return charsToDelete;
}

// is a part of a checklist, and not an empty item
function hasCheckboxContent(line: string): boolean {
    const CHECKBOX_WITH_CONTENT = /^(?:\s*\d+\.\s*\[.\]|\s*-\s*\[.\])\s+\S+/;
    return CHECKBOX_WITH_CONTENT.test(line);
}

function applyChangesToEditor(editor: Editor, changes: EditorChange[]) {
    if (changes.length > 0) {
        editor.transaction({ changes });
    }
}
export { reorderChecklist, reorder, getChecklistStart, deleteChecked };
