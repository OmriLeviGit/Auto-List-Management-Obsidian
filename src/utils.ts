import { Editor } from "obsidian";

const PATTERN = /^(\d+)\. /;
export const TAB_SIZE = 4;

interface LineInfo {
    spaces: number;
    number: number | undefined;
    textOffset: number | undefined;
}

function getLineInfo(line: string): LineInfo {
    const length = line.length;
    let i = 0;

    // num of spaces
    while (i < length && (line[i] === " " || line[i] === "\t")) {
        i += line[i] === " " ? 1 : TAB_SIZE;
    }

    const numOfSpaces = i;

    // number indices
    while (i < length && "0".charCodeAt(0) <= line.charCodeAt(i) && line.charCodeAt(i) <= "9".charCodeAt(0)) i++;

    console.debug(`i : ${i}, line: ${line}, sliced: ${line.slice(numOfSpaces, i)}`);

    // check parsing for ". "
    if (i <= 0 || length <= i + 1 || !(line[i] === "." || line[i + 1] === " ")) {
        return { spaces: numOfSpaces, number: undefined, textOffset: undefined };
    }

    const number = parseInt(line.slice(numOfSpaces, i));

    if (isNaN(number)) {
        return { spaces: numOfSpaces, number: undefined, textOffset: undefined };
    }

    return { spaces: numOfSpaces, number, textOffset: i + 2 };
}

function getListStart(editor: Editor, currLineIndex: number): number | undefined {
    if (currLineIndex < 0 || editor.lastLine() < currLineIndex) {
        return undefined;
    }

    const currInfo = getLineInfo(editor.getLine(currLineIndex));
    if (currInfo.number === undefined) {
        return undefined;
    }

    if (currLineIndex == 0) return 0;

    let prevIndex = currLineIndex - 1;
    while (0 <= prevIndex && getLineInfo(editor.getLine(prevIndex)).number !== undefined) {
        prevIndex--;
    }

    return prevIndex + 1;
}

export { getLineInfo, getListStart, PATTERN };
