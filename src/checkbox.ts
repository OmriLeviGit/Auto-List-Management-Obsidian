import { Editor, EditorChange } from "obsidian";
import { getLineInfo, hasCheckboxContent } from "./utils";
import { LineInfo, Range } from "./types";

function reorderCheckboxes(editor: Editor, index: number): Range | undefined {
    const line = editor.getLine(index);
    // console.log("lineoutside ", line, index);
    const startInfo = getLineInfo(line);
    const hasContent = hasCheckboxContent(line);
    // console.log(hasContent);
    // if not a checkbox or without any content, dont reorder
    if (startInfo.isChecked === undefined || hasContent === false) {
        return;
    }

    const checklistStartIndex = getChecklistStart(editor, index);

    // skip unchecked items at the beginning of the list
    let i = checklistStartIndex;
    while (i < editor.lastLine()) {
        const currInfo = getLineInfo(editor.getLine(index));
        const isSameStatus = sameStatus(startInfo, currInfo);
        if (!isSameStatus || currInfo.isChecked !== false) {
            break;
        }

        i++;
    }

    let lastInUnchecked = i - 1;

    const unCheckedItems = [];
    const checkedItems = [];

    // add items to the lists
    while (i < editor.lastLine()) {
        const line = editor.getLine(index);
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
        return undefined; // no changes
    }

    const cursorLocation = lastInUnchecked + unCheckedItems.length;

    unCheckedItems.push(...checkedItems);
    const newList = unCheckedItems.join("\n");
    editor.replaceRange(newList, { line: lastInUnchecked, ch: 0 }, { line: i, ch: 0 });

    return { start: lastInUnchecked, limit: i - 1 };
}

function getChecklistStart(editor: Editor, index: number): number {
    if (index === 0) {
        return index;
    }

    const startInfo = getLineInfo(editor.getLine(index));
    let i = index - 1;
    while (0 <= i) {
        const currInfo = getLineInfo(editor.getLine(index));
        const isSameStatus = sameStatus(startInfo, currInfo);
        if (!isSameStatus) {
            break;
        }
        i++;
    }
    return index + 1;
}

function sameStatus(info1: LineInfo, info2: LineInfo): boolean {
    const startContainsNumber = info1.number !== undefined;
    const currentContainsNumber = info2.number !== undefined;

    const hasSameNumberStatus = currentContainsNumber === startContainsNumber;
    const hasSameIndentation = info2.spaceIndent === info1.spaceIndent;

    if (hasSameNumberStatus && hasSameIndentation) {
        return true;
    }

    return false;
}

export { reorderCheckboxes };
