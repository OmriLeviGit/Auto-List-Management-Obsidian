import { Editor } from "obsidian";
import SettingsManager from "./SettingsManager";
import { LineInfo } from "./types";

// extract information from a line of text
function getLineInfo(line: string): LineInfo {
    const length = line.length;
    let index = 0;
    let numOfSpaceIndents = 0;

    const indentSize = SettingsManager.getInstance().getIndentSize();

    // num of spaces
    while (index < length && (line[index] === " " || line[index] === "\t")) {
        // console.debug("linevalue: ", line[i].charCodeAt(0));
        numOfSpaceIndents += line[index] === " " ? 1 : indentSize;
        index++;
    }

    const spaceCharsNum = index;

    // number indices
    while (index < length && "0".charCodeAt(0) <= line.charCodeAt(index) && line.charCodeAt(index) <= "9".charCodeAt(0))
        index++;
    // check parsing for ". "
    if (line[index] !== "." || line[index + 1] !== " ") {
        return {
            spaceCharsNum,
            spaceIndent: numOfSpaceIndents,
            number: undefined,
            textIndex: undefined,
        };
    }

    // console.debug(
    //     `i: ${index}, text line: "${line}", number detected: ${line.slice(spaceCharsNum, index)}, textOffset: ${
    //         index + 2
    //     }`
    // );

    const number = parseInt(line.slice(spaceCharsNum, index));

    if (isNaN(number)) {
        return {
            spaceCharsNum,
            spaceIndent: numOfSpaceIndents,
            number: undefined,
            textIndex: undefined,
        };
    }

    return { spaceCharsNum, spaceIndent: numOfSpaceIndents, number, textIndex: index + 2 };
}

// gets the index of the first item in a numbered list
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
function getLastListStart(lines: string[]): number | undefined {
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

function getPrevItemIndex(editor: Editor, index: number): number | undefined {
    // console.log("1");

    if (index <= 0 || index > editor.lastLine()) {
        return undefined;
    }

    // console.log("2 index", index);
    const currSpaceOffset = getLineInfo(editor.getLine(index)).spaceIndent;

    // console.log("3");
    let prevIndex = index - 1;
    // console.log("prev1", prevIndex);
    let prevSpaceOffset: number | undefined = undefined;
    for (; prevIndex >= 0; prevIndex--) {
        // console.log("4");
        prevSpaceOffset = getLineInfo(editor.getLine(prevIndex)).spaceIndent;
        if (prevSpaceOffset <= currSpaceOffset) {
            break;
        }
    }
    // console.log("prev2", prevIndex);
    // console.log("5");

    // all preceeding lines are indented further than currLine
    if (prevSpaceOffset && prevSpaceOffset > currSpaceOffset) {
        return undefined;
    }

    return prevIndex;
}

function isFirstInNumberedList(editor: Editor, index: number): boolean {
    if (index < 0) {
        return false;
    }

    const currLine = getLineInfo(editor.getLine(index));

    if (index === 0) {
        return currLine.number !== undefined;
    }

    if (currLine.number === undefined) {
        return false;
    }

    const prevIndex = getPrevItemIndex(editor, index);

    if (prevIndex === undefined) {
        return true;
    }

    const prevInfo = getLineInfo(editor.getLine(prevIndex));

    if (prevInfo.spaceIndent < currLine.spaceIndent || prevInfo.number === undefined) {
        return true;
    }

    return false;
}

export { getLineInfo, getListStart, getLastListStart, getPrevItemIndex, isFirstInNumberedList };
