import { Editor } from "obsidian";
import { getLineInfo, hasCheckboxContent } from "./utils";
import { LineInfo, Range } from "./types";

function reorderCheckboxes(editor: Editor, index: number): Range | undefined {
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

    unCheckedItems.push(...checkedItems); // push all changed to one list
    const changes = unCheckedItems.join("\n") + "\n";
    editor.replaceRange(changes, { line: startReorderingFrom, ch: 0 }, { line: i, ch: 0 });

    return { start: startReorderingFrom, limit: i };
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

export { reorderCheckboxes, getChecklistStart, sameStatus };
