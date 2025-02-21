import { Editor } from "obsidian";
import SettingsManager from "./SettingsManager";
import { LineInfo } from "./types";

// extract information from a line of text
function getLineInfo(line: string): LineInfo {
    const length = line.length;
    let offset = 0;
    let numOfSpaceIndents = 0;

    const indentSize = SettingsManager.getInstance().getIndentSize();

    // num of spaces
    while (offset < length && (line[offset] === " " || line[offset] === "\t")) {
        numOfSpaceIndents += line[offset] === " " ? 1 : indentSize;
        offset++;
    }

    const spaceCharsNum = offset;

    // number indices
    while (
        offset < length &&
        "0".charCodeAt(0) <= line.charCodeAt(offset) &&
        line.charCodeAt(offset) <= "9".charCodeAt(0)
    ) {
        offset++;
    }

    // const isNumberDetected = spaceCharsNum !== index && line[index] === "." && line[index + 1] === " ";

    // if (!isNumberDetected) {
    //     const checkboxChar = getCheckboxInfo(line, index, isNumberDetected);
    //     return {
    //         spaceCharsNum,
    //         spaceIndent: numOfSpaceIndents,
    //         number: undefined,
    //         textIndex: index,
    //         checkboxChar,
    //     };
    // }

    // const number = parseInt(line.slice(spaceCharsNum, index));

    // index += 2;
    // const checkboxChar = getCheckboxInfo(line, index, isNumberDetected);

    // if (isNaN(number)) {
    //     return {
    //         spaceCharsNum,
    //         spaceIndent: numOfSpaceIndents,
    //         number: undefined,
    //         textIndex: 0,
    //         checkboxChar,
    //     };
    // }

    // return {
    //     spaceCharsNum,
    //     spaceIndent: numOfSpaceIndents,
    //     number,
    //     textIndex: index,
    //     checkboxChar,
    // };

    const isNumberDetected = spaceCharsNum !== offset && line[offset] === "." && line[offset + 1] === " ";

    let number = undefined;

    if (!isNumberDetected) {
        offset = spaceCharsNum;
    } else {
        const parsedNum = parseInt(line.slice(spaceCharsNum, offset));

        if (isNaN(parsedNum)) {
            offset = spaceCharsNum;
        } else {
            number = parsedNum;
            offset += 2;
        }
    }

    const checkboxChar = getCheckboxInfo(line, offset, isNumberDetected);

    return {
        spaceCharsNum,
        spaceIndent: numOfSpaceIndents,
        number,
        textOffset: offset,
        checkboxChar,
    };
}

function getCheckboxInfo(line: string, index: number, isNumberDetected: boolean): string | undefined {
    const NUMBERED_CHECKBOX = /^\s*\[(.)\] /; // checkbox inside a numbered item
    const UNNUMBERED_CHECKBOX = /^\s*- \[(.)\] /; // unnumbered checkbox, indented or not

    const pattern = isNumberDetected ? NUMBERED_CHECKBOX : UNNUMBERED_CHECKBOX;
    const stringToCheck = isNumberDetected ? line.slice(index) : line;

    const match = stringToCheck.match(pattern);
    if (match) {
        const checkboxChar = match[1];
        return checkboxChar;
    }

    return undefined;
}

// TODO not perfect, does not take into account indents and im not sure if its intendend (it might be)
// gets the index of the first item in a numbered list
function getListStart(editor: Editor, currLineIndex: number): number | undefined {
    if (currLineIndex < 0 || editor.lastLine() < currLineIndex) {
        return undefined;
    }

    const currInfo = getLineInfo(editor.getLine(currLineIndex));
    if (currInfo.number === undefined) {
        return currLineIndex;
    }

    let prevIndex = currLineIndex - 1;
    while (0 <= prevIndex && getLineInfo(editor.getLine(prevIndex)).number !== undefined) {
        prevIndex--;
    }

    return prevIndex + 1;
}

// index of the first item in the last numbered list
function getLastListStart(lines: string[]): number | undefined {
    const maxIndex = lines.length - 1;
    let index: number | undefined = undefined;
    for (let i = maxIndex; i >= 0; i--) {
        const info = getLineInfo(lines[i]);
        if (info.number === undefined) {
            break;
        }
        index = i;
    }
    return index;
}

function getPrevItemIndex(editor: Editor, index: number): number | undefined {
    if (index <= 0 || editor.lastLine() < index) {
        return undefined;
    }

    const currSpaceOffset = getLineInfo(editor.getLine(index)).spaceIndent;

    for (let prevIndex = index - 1; prevIndex >= 0; prevIndex--) {
        const info = getLineInfo(editor.getLine(prevIndex));

        // Skip lines with deeper indentation
        if (info.spaceIndent > currSpaceOffset) {
            continue;
        }

        // If we find a line with same indentation and it has a number, we found our match
        if (info.spaceIndent === currSpaceOffset && info.number !== undefined) {
            return prevIndex;
        }

        return undefined;
    }

    return undefined;
}

function isLineChecked(info: LineInfo) {
    if (info.checkboxChar === undefined) {
        return undefined;
    }
    if (info.checkboxChar === " ") {
        return false;
    }
    return true;
}

export { getLineInfo, getListStart, getLastListStart, getPrevItemIndex, isLineChecked };
