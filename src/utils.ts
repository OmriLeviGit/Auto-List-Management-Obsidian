import { getUnpackedSettings } from "http2";
import { Editor } from "obsidian";

const PATTERN = /^(\d+)\. /;
const PATTERNTwo = /^\s*(\d+)\. /;

interface RetValue {
    spaces: number;
    number: number | undefined;
}

function getItemNum(editor: Editor, lineNum: number): number {
    if (lineNum < 0) {
        return -1;
    }
    const lineText = editor.getLine(lineNum);
    const match = lineText.match(PATTERN);
    return match == undefined ? -1 : parseInt(match[1]);
}

function getNumFromText(lineText: string): number {
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

function getLineInfo(line: string): RetValue {
    const length = line.length;
    let i = 0;

    // num of spaces
    while (i < length && line[i] === " ") i++;
    const numOfSpaces = i;

    // number indices
    while (i < length && 48 <= line.charCodeAt(i) && line.charCodeAt(i) <= 57) i++; // find number

    //console.log(`i : ${i}, line: ${line}, sliced: ${line.slice(numOfSpaces, i)}`);

    // check parsing
    if (length <= i + 1 || !(line[i] === "." || line[i + 1] === " ")) {
        return { spaces: numOfSpaces, number: undefined };
    }

    const number = parseInt(line.slice(numOfSpaces, i));
    return { spaces: numOfSpaces, number };
}
function findNonSpaceIndex(line: string): number {
    const length = line.length;
    let i = 0;

    while (i < length && line[i] === " ") i++; // num of spaces
    return i;
}
export { getItemNum, getListStart, PATTERN, getNumFromText, PATTERNTwo, getLineInfo, findNonSpaceIndex };
