import { Editor } from "obsidian";

const PATTERN = /^(\d+)\. /;

function getItemNum(editor: Editor, lineNum: number): number {
    if (lineNum < 0) {
        return -1;
    }
    const lineText = editor.getLine(lineNum);
    const match = lineText.match(PATTERN);
    return match == undefined ? -1 : parseInt(match[1]);
}

function getListStart(editor: Editor, currLineIndex: number): number {
    if (getItemNum(editor, currLineIndex) === -1) {
        return -1;
    }

    if (currLineIndex == 0) return 0;

    let prevIndex = currLineIndex - 1;
    while (getItemNum(editor, prevIndex) > 0) {
        prevIndex--;
    }
    return prevIndex + 1;
}

export { getItemNum, getListStart, PATTERN };
