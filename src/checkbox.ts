import { Editor, EditorPosition } from "obsidian";
import { getLineInfo } from "./utils";
import { LineInfo } from "./types";
import SettingsManager from "./SettingsManager";

function reorder(editor: Editor, lineNum: number) {
    const info = getLineInfo(editor.getLine(lineNum)); // TODO make sure is not < 0

    if (info.isChecked === undefined || info.isChecked === false) {
        return;
    }

    const endIndex = getCheckboxEndIndex(editor, lineNum);

    if (endIndex !== undefined) {
        insert(editor, lineNum, endIndex);
    }
}

function insert(editor: Editor, fromLine: number, toLine: number) {
    const content = editor.getLine(fromLine);
    console.debug("firstReplace before");
    for (let i = 0; i <= editor.lastLine(); i++) {
        console.debug(`@${editor.getLine(i)}@`);
    }

    editor.replaceRange("", { line: fromLine, ch: 0 }, { line: fromLine + 1, ch: 0 });

    console.debug("after firstReplace");
    for (let i = 0; i <= editor.lastLine(); i++) {
        console.debug(`@${editor.getLine(i)}@`);
    }
    const adjustedToLine = fromLine < toLine ? toLine - 1 : toLine;
    editor.replaceRange(content + "\n", { line: adjustedToLine, ch: 0 }, { line: adjustedToLine, ch: 0 });
    console.debug("after second replacement");
    for (let i = 0; i <= editor.lastLine(); i++) {
        console.debug(`@${editor.getLine(i)}@`);
    }
}

// gets the index of the last item in a numbered list
function getCheckboxEndIndex(editor: Editor, startIndex: number): number | undefined {
    if (startIndex < 0 || editor.lastLine() < startIndex) {
        return undefined;
    }

    const sortToBottom = SettingsManager.getInstance().getSortCheckboxesBottom();

    const startInfo = getLineInfo(editor.getLine(startIndex));

    if (startInfo.isChecked === undefined) {
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

        return sortToBottom ? currentInfo.isChecked === undefined : currentInfo.isChecked !== false;
    };

    let index = startIndex;
    while (index <= editor.lastLine()) {
        const currentInfo = getLineInfo(editor.getLine(index));

        if (shouldBreak(currentInfo)) {
            break;
        }

        index++;
    }

    return index;
}

export { reorder, insert, getCheckboxEndIndex };
