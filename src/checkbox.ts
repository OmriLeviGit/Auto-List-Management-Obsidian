import { Editor } from "obsidian";
import { getLineInfo } from "./utils";
import { LineInfo, ReorderData } from "./types";

function reorderCheckboxes(editor: Editor, index: number): ReorderData | undefined {
    const line = editor.getLine(index);
    const startInfo = getLineInfo(line);
    const hasContent = hasCheckboxContent(line);

    // if not a checkbox or without any content, dont reorder
    if (startInfo.isChecked === undefined || hasContent === false) {
        return;
    }

    const checklistStartIndex = getChecklistStart(editor, index);

    // skip unchecked items at the beginning of the list
    let i = checklistStartIndex;
    while (i < editor.lastLine()) {
        const currInfo = getLineInfo(editor.getLine(i));
        const isSameStatus = sameStatus(startInfo, currInfo);
        if (!isSameStatus || currInfo.isChecked !== false) {
            break;
        }

        i++;
    }

    const startReorderingFrom = i;

    const unCheckedItems = [];
    const checkedItems = [];

    // add items to the lists
    while (i <= editor.lastLine()) {
        const line = editor.getLine(i);
        const currInfo = getLineInfo(line);
        const isSameStatus = sameStatus(startInfo, currInfo);
        if (!isSameStatus) {
            break;
        }

        if (currInfo.isChecked === false) {
            unCheckedItems.push(line);
        } else if (currInfo.isChecked === true) {
            checkedItems.push(line);
        } else {
            break;
        }

        i++;
    }

    if (unCheckedItems.length === 0) {
        return undefined; // no changes are needed
    }

    // move the cursor to the last unchecked index if we go from checked to unchecked
    const lastUncheckedIndex = startReorderingFrom + unCheckedItems.length - 1;

    unCheckedItems.push(...checkedItems); // push all changed to one list

    let changes: string;
    if (i > editor.lastLine()) {
        changes = unCheckedItems.join("\n");
    } else {
        changes = unCheckedItems.join("\n") + "\n";
    }

    editor.replaceRange(changes, { line: startReorderingFrom, ch: 0 }, { line: i, ch: 0 });

    return { start: startReorderingFrom, limit: i, lastUncheckedIndex };
}

function getChecklistStart(editor: Editor, index: number): number {
    if (index === 0) {
        return index;
    }

    const startInfo = getLineInfo(editor.getLine(index));
    let i = index - 1;

    while (0 <= i) {
        const currInfo = getLineInfo(editor.getLine(i));
        const isSameStatus = sameStatus(startInfo, currInfo);
        if (!isSameStatus) {
            break;
        }
        i--;
    }

    return i + 1;
}

function sameStatus(info1: LineInfo, info2: LineInfo): boolean {
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

export { reorderCheckboxes, getChecklistStart };
