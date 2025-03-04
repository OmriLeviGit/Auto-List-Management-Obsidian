import { Editor, EditorChange } from "obsidian";
import { getLineInfo } from "./utils";
import { LineInfo, ReorderResult } from "./types";
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

function reorder(
    editor: Editor,
    index: number,
    startInfo: LineInfo
): { orderedItems: string[]; reorderResult: ReorderResult } {
    const checkedItemsAtBottom = SettingsManager.getInstance().isCheckedItemsAtBottom();
    const uncheckedItems: string[] = [];
    const checkedMap: Map<string, [string, LineInfo][]> = new Map();

    const startIndex = findReorderStartPosition(editor, index, startInfo, checkedItemsAtBottom);

    let prevChar = "";
    let transitionIndex = 0;

    // phase 1 - map items
    let i = startIndex;
    while (i <= editor.lastLine()) {
        const line = editor.getLine(i);
        const currInfo = getLineInfo(line);

        // Stop if the line status differs from the starting group
        if (!isSameStatus(startInfo, currInfo)) {
            break;
        }

        const currentChar = currInfo.checkboxChar;

        if (currentChar === undefined) {
            break; // is not a checked line
        }

        // get the max char so far
        if (currentChar !== prevChar) {
            prevChar = currentChar;
            transitionIndex = uncheckedItems.length;
        }

        // add to the correct data structure
        if (shouldBeSortedAsChecked(currentChar)) {
            if (!checkedMap.has(currentChar)) {
                checkedMap.set(currentChar, []);
            }
            checkedMap.get(currentChar)!.push([line, currInfo]);
        } else {
            uncheckedItems.push(line);
        }

        i++;
    }

    const finishedAt = i;

    // phase 2 - sort checked items
    const charsToDelete = getCharsToDelete(); // defined by user
    const checkedItems = [];
    const checkedItemsDel = [];
    const keys = Array.from(checkedMap.keys()).sort();
    const KVpairs = keys.flatMap((k) => checkedMap.get(k)!);

    for (const [s, lineInfo] of KVpairs) {
        if (!lineInfo.checkboxChar) {
            continue;
        }

        if (charsToDelete.has(lineInfo.checkboxChar)) {
            checkedItemsDel.push(s);
        } else if (shouldBeSortedAsChecked(lineInfo.checkboxChar)) {
            checkedItems.push(s);
        }
    }

    checkedItems.push(...checkedItemsDel);

    // phase 3 - combine and remove unchanged lines
    if (!checkedItemsAtBottom) {
        uncheckedItems.splice(transitionIndex); // remove unchanged unchecked lines from the end
    }

    const orderedItems = checkedItemsAtBottom
        ? [...uncheckedItems, ...checkedItems]
        : [...checkedItems, ...uncheckedItems];

    // remove unchanged lines from the beginning
    let count = 0;
    for (; count < orderedItems.length; count++) {
        if (orderedItems[count] !== editor.getLine(startIndex + count)) {
            break;
        }
    }

    orderedItems.splice(0, count);

    const newStart = startIndex + count;

    // remove unchanged lines from the end
    const offsettedStart = finishedAt - (orderedItems.length - 1) - 1;
    for (let i = orderedItems.length - 1; i >= 0; i--) {
        if (orderedItems[i] !== editor.getLine(offsettedStart + i)) {
            orderedItems.splice(i + 1);
            break;
        }
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

function findReorderStartPosition(
    editor: Editor,
    startIndex: number,
    startInfo: LineInfo,
    checkedItemsAtBottom: boolean
): number {
    if (!checkedItemsAtBottom) {
        return startIndex;
    }

    let i = startIndex;
    while (i <= editor.lastLine()) {
        const currInfo = getLineInfo(editor.getLine(i));
        if (shouldBeSortedAsChecked(currInfo.checkboxChar) !== false || !isSameStatus(startInfo, currInfo)) {
            break;
        }
        i++;
    }

    return i;
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
