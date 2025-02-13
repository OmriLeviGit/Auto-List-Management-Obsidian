import { Editor } from "obsidian";
import { getLineInfo } from "./utils";
import { LineInfo, ReorderData } from "./types";
import SettingsManager from "./SettingsManager";

function reorderChecklist(editor: Editor, index: number): ReorderData | undefined {
    const line = editor.getLine(index);
    const startInfo = getLineInfo(line);
    const hasContent = hasCheckboxContent(line);

    // if not a checkbox or without any content, dont reorder
    if (startInfo.isChecked === undefined || hasContent === false) {
        return;
    }

    const checkedAtTop = SettingsManager.getInstance().getChecklistSortPosition() === "top";

    return reorder(editor, index, checkedAtTop);
}

function reorder(editor: Editor, index: number, checkedAtTop: boolean): ReorderData | undefined {
    const startInfo = getLineInfo(editor.getLine(index));
    const checklistStartIndex = getChecklistStart(editor, index);

    // Find where to start reordering by skipping items that are already in the correct position
    let i = checklistStartIndex;
    const skipStatus = checkedAtTop ? true : false;
    while (i < editor.lastLine()) {
        const currInfo = getLineInfo(editor.getLine(i));
        if (currInfo.isChecked !== skipStatus || !isSameStatus(startInfo, currInfo)) {
            break;
        }
        i++;
    }

    const startReorderingFrom = i;
    const { uncheckedItems, checkedItems, endIndex } = collectChecklistItems(editor, i, startInfo, checkedAtTop);

    i = endIndex;

    if (uncheckedItems.length === 0 || checkedItems.length === 0) {
        return undefined; // no changes are needed
    }

    // Combine items in the desired order
    const orderedItems = checkedAtTop ? [...checkedItems, ...uncheckedItems] : [...uncheckedItems, ...checkedItems];

    // Calculate the last unchecked index based on ordering
    const placeCursorAt = checkedAtTop
        ? startReorderingFrom + checkedItems.length
        : startReorderingFrom + uncheckedItems.length - 1;

    // Apply the changes
    const changes = i > editor.lastLine() ? orderedItems.join("\n") : orderedItems.join("\n") + "\n";
    editor.replaceRange(changes, { line: startReorderingFrom, ch: 0 }, { line: i, ch: 0 });
    // TODO cursor is not placed correctly

    return { start: startReorderingFrom, limit: i, placeCursorAt };
}

// optimized version for fun
function collectChecklistItems(editor: Editor, startIndex: number, startInfo: LineInfo, checkedAtTop: boolean) {
    const uncheckedItems: string[] = [];
    const checkedItems: string[] = [];
    const groupStartMap: Map<number, number> = new Map(); // Tracks start of new groups
    let i = startIndex;
    let lastGroupStart = i;
    let groupIsChecked = checkedAtTop;

    while (i <= editor.lastLine()) {
        const line = editor.getLine(i);
        const currInfo = getLineInfo(line);

        // Stop if the line status differs from the starting group
        if (!isSameStatus(startInfo, currInfo)) {
            break;
        }

        const isChecked = currInfo.isChecked;
        if (isChecked === undefined) {
            break; // Can be undefined
        }

        // Track the start of a new group if needed
        const isStatusTransition = isChecked !== groupIsChecked;
        if (isStatusTransition) {
            // Update the current state
            groupIsChecked = isChecked;

            // Track the start of a new group if needed
            const shouldTrackNewGroup = (checkedAtTop && !groupIsChecked) || (!checkedAtTop && groupIsChecked);
            if (shouldTrackNewGroup) {
                lastGroupStart = i;
                groupStartMap.set(lastGroupStart, groupIsChecked ? checkedItems.length : uncheckedItems.length);
            }
        }

        if (isChecked === false) {
            uncheckedItems.push(line);
        } else {
            checkedItems.push(line);
        }

        i++;
    }

    // If the end of the checklist does not require reordering, reset i back to the last group
    if ((checkedAtTop && !groupIsChecked) || (!checkedAtTop && groupIsChecked)) {
        const ind = groupStartMap.get(lastGroupStart);
        if (ind !== undefined) {
            i = lastGroupStart;
            uncheckedItems.splice(i);
        } else {
            // should never happen
            console.log("Automatic List Reordering: error, index not found in checkbox reordering");
        }
    }

    return { uncheckedItems, checkedItems, endIndex: i };
}

/*
// simple version
function collectChecklistItems(editor: Editor, startIndex: number, startInfo: LineInfo, checkedAtTop: boolean) {
    const uncheckedItems: string[] = [];
    const checkedItems: string[] = [];
    let i = startIndex;

    while (i <= editor.lastLine()) {
        const line = editor.getLine(i);
        const currInfo = getLineInfo(line);
        if (!isSameStatus(startInfo, currInfo)) {
            break;
        }

        if (currInfo.isChecked === false) {
            uncheckedItems.push(line);
        } else if (currInfo.isChecked === true) {
            checkedItems.push(line);
        } else {
            break; // can be undefined
        }

        i++;
    }

    return { uncheckedItems, checkedItems, endIndex: i };
}
*/

// get the start of the checklist
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

function isSameStatus(info1: LineInfo, info2: LineInfo): boolean {
    const hasSameNumberStatus = (info1.number !== undefined) === (info2.number !== undefined);
    const hasSameIndentation = info1.spaceIndent === info2.spaceIndent;
    const hasSameCheckboxStatus = (info1.isChecked !== undefined) === (info2.isChecked !== undefined);

    if (hasSameNumberStatus && hasSameIndentation && hasSameCheckboxStatus) {
        return true;
    }

    return false;
}

// is a part of a checklist, and not an empty item
function hasCheckboxContent(line: string): boolean {
    const CHECKBOX_WITH_CONTENT = /^(?:\s*\d+\.\s*\[.\]|\s*-\s*\[.\])\s+\S+/;
    return CHECKBOX_WITH_CONTENT.test(line);
}

export { reorderChecklist, getChecklistStart, collectChecklistItems };
