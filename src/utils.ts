import { Editor } from "obsidian";
//import { DEFAULT_SETTINGS } from "../main";

// have the line info both hold index for spaces and total number of spaces in the editor for the stack
const SETTINGSINDENTSIZE = 4;

interface LineInfo {
    numOfSpaceChars: number;
    spaceIndent: number;
    number: number | undefined;
    textIndex: number | undefined;
}

function getLineInfo(line: string): LineInfo {
    const length = line.length;
    let index = 0;
    let numOfSpaceIndents = 0;

    // num of spaces
    while (index < length && (line[index] === " " || line[index] === "\t")) {
        // console.debug("linevalue: ", line[i].charCodeAt(0));
        numOfSpaceIndents += line[index] === " " ? 1 : SETTINGSINDENTSIZE;
        index++;
    }

    const numOfSpaceChars = index;

    // number indices
    while (index < length && "0".charCodeAt(0) <= line.charCodeAt(index) && line.charCodeAt(index) <= "9".charCodeAt(0))
        index++;
    // check parsing for ". "
    if (line[index] !== "." || line[index + 1] !== " ") {
        return {
            numOfSpaceChars: numOfSpaceChars,
            spaceIndent: numOfSpaceIndents,
            number: undefined,
            textIndex: undefined,
        };
    }

    // console.debug(
    //     `i: ${index}, text line: "${line}", number detected: ${line.slice(numOfSpaceChars, index)}, textOffset: ${
    //         index + 2
    //     }`
    // );

    const number = parseInt(line.slice(numOfSpaceChars, index));

    if (isNaN(number)) {
        return {
            numOfSpaceChars: numOfSpaceChars,
            spaceIndent: numOfSpaceIndents,
            number: undefined,
            textIndex: undefined,
        };
    }

    return { numOfSpaceChars: numOfSpaceChars, spaceIndent: numOfSpaceIndents, number, textIndex: index + 2 };
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

// index of the first item in the last numbered list
function getLastListIndex(lines: string[]): number | undefined {
    let index: number | undefined = undefined;
    for (let i = lines.length - 1; i >= 0; i--) {
        const info = getLineInfo(lines[i]);
        if (info.number === undefined) {
            break;
        }
        index = i;
    }
    return index;
}

export { getLineInfo, getListStart, getLastListIndex };
