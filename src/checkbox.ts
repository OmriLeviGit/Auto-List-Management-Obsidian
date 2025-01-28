import { Editor, EditorChange } from "obsidian";
import { getLineInfo } from "./utils";
import { LineInfo, Range } from "./types";

function reorderCheckboxes(editor: Editor, index: number): Range | undefined {
    const info = getLineInfo(editor.getLine(index)); // TODO make sure is not < 0

    // if not a checkbox, no need to reorder
    if (info.isChecked === undefined) {
        return;
    }

    let toLine = info.isChecked === true ? getNewCheckedLoc(editor, index) : getNewUncheckedLoc(editor, index);

    if (toLine === undefined || index === toLine) {
        return;
    }

    moveLine(editor, index, toLine);

    return { start: index, limit: toLine };
}

// gets the index of the last item in a numbered list
function getNewUncheckedLoc(editor: Editor, startIndex: number): number | undefined {
    if (startIndex < 0 || editor.lastLine() < startIndex) {
        return undefined;
    }

    const startInfo = getLineInfo(editor.getLine(startIndex));

    if (startInfo.isChecked !== false) {
        return undefined;
    }

    const startContainsNumber = startInfo.number !== undefined;

    let index = startIndex - 1;
    while (0 <= index) {
        const currentInfo = getLineInfo(editor.getLine(index));

        if (shouldBreak(currentInfo, startInfo, startContainsNumber, false)) {
            break;
        }

        index--;
    }

    return index + 1;
}

// gets the index of the last item in a numbered list
function getNewCheckedLoc(editor: Editor, startIndex: number): number | undefined {
    if (startIndex < 0 || editor.lastLine() < startIndex) {
        return undefined;
    }

    const startInfo = getLineInfo(editor.getLine(startIndex));

    if (startInfo.isChecked !== true) {
        return undefined;
    }

    const startContainsNumber = startInfo.number !== undefined;

    let index = startIndex + 1;
    while (index <= editor.lastLine()) {
        const currentInfo = getLineInfo(editor.getLine(index));

        if (shouldBreak(currentInfo, startInfo, startContainsNumber, true)) {
            break;
        }

        index++;
    }

    return index - 1;
}
function shouldBreak(
    currentInfo: LineInfo,
    startInfo: LineInfo,
    startContainsNumber: boolean,
    breakOn: boolean
): boolean {
    const currentContainsNumber = currentInfo.number !== undefined;
    const hasSameNumberStatus = currentContainsNumber === startContainsNumber;
    const hasSameIndentation = currentInfo.spaceIndent === startInfo.spaceIndent;

    if (!hasSameNumberStatus || !hasSameIndentation) {
        return true;
    }

    return currentInfo.isChecked === breakOn || currentInfo.isChecked === undefined;
}

/*
// gets the index of the last item in a numbered list # TODO this version is both sort to top or to bottom
function getCheckboxEndIndexBySort(editor: Editor, startIndex: number): number | undefined {
    if (startIndex < 0 || editor.lastLine() < startIndex) {
        return undefined;
    }

    const sortToBottom = SettingsManager.getInstance().getSortCheckboxesBottom();

    const startInfo = getLineInfo(editor.getLine(startIndex));

    if (startInfo.isChecked !== true) {
        return undefined;
    }

    const startContainsNumber = startInfo.number !== undefined;

    const shouldBreak = (currentInfo: LineInfo): boolean => {
        const currentContainsNumber = currentInfo.number !== undefined;
        const hasSameNumberStatus = currentContainsNumber === startContainsNumber;
        const hasSameIndentation = currentInfo.spaceIndent === startInfo.spaceIndent;

        if (!hasSameNumberStatus || !hasSameIndentation) {
            return true;
        }

        if (sortToBottom) {
            return currentInfo.isChecked === undefined;
        }
        
        return currentInfo.isChecked === true || currentInfo.isChecked === undefined;
    };

    let index = startIndex + 1;
    while (index <= editor.lastLine()) {
        const currentInfo = getLineInfo(editor.getLine(index));

        if (shouldBreak(currentInfo)) {
            break;
        }

        index++;
    }

    return index - 1;
}
*/

function moveLine(editor: Editor, fromLine: number, toLine: number) {
    if (fromLine === toLine) {
        return;
    }

    const changes: EditorChange[] = [];
    const content = editor.getLine(fromLine);
    const lastLine = editor.lastLine();

    let removeLine: EditorChange;
    let insertLine: EditorChange;

    if (fromLine === lastLine) {
        // Case 1: Moving from last line
        removeLine = {
            from: { line: fromLine - 1, ch: editor.getLine(fromLine - 1).length },
            to: { line: fromLine + 1, ch: content.length },
            text: "",
        };
        insertLine = {
            from: { line: toLine, ch: 0 },
            to: { line: toLine, ch: 0 },
            text: content + "\n",
        };
    } else if (toLine === lastLine) {
        // Case 2: Moving to last line
        removeLine = {
            from: { line: fromLine, ch: 0 },
            to: { line: fromLine + 1, ch: 0 },
            text: "",
        };
        insertLine = {
            from: { line: toLine + 1, ch: 0 },
            to: { line: toLine + 1, ch: 0 },
            text: "\n" + content,
        };
    } else {
        // Case 3: Moving between non-last lines
        removeLine = {
            from: { line: fromLine, ch: 0 },
            to: { line: fromLine + 1, ch: 0 },
            text: "",
        };
        const adjustedLine = toLine > fromLine ? toLine + 1 : toLine;
        insertLine = {
            from: { line: adjustedLine, ch: 0 },
            to: { line: adjustedLine, ch: 0 },
            text: content + "\n",
        };
    }

    console.log(fromLine, toLine);
    changes.push(insertLine, removeLine);
    editor.transaction({ changes });
}

export { reorderCheckboxes, getNewCheckedLoc, getNewUncheckedLoc };
