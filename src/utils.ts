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
    while (
        index < length &&
        "0".charCodeAt(0) <= line.charCodeAt(index) &&
        line.charCodeAt(index) <= "9".charCodeAt(0)
    ) {
        index++;
    }

    const isNumberDetected = spaceCharsNum !== index && line[index] === "." && line[index + 1] === " ";

    if (!isNumberDetected) {
        const isChecked = getCheckboxInfo(line, index, isNumberDetected);
        return {
            spaceCharsNum,
            spaceIndent: numOfSpaceIndents,
            number: undefined,
            textIndex: index,
            isChecked,
        };
    }

    const number = parseInt(line.slice(spaceCharsNum, index));

    index += 2;
    const isChecked = getCheckboxInfo(line, index, isNumberDetected);

    if (isNaN(number)) {
        return {
            spaceCharsNum,
            spaceIndent: numOfSpaceIndents,
            number: undefined,
            textIndex: 0,
            isChecked,
        };
    }

    return {
        spaceCharsNum,
        spaceIndent: numOfSpaceIndents,
        number,
        textIndex: index,
        isChecked,
    };
}

function getCheckboxInfo(line: string, index: number, isNumberDetected: boolean) {
    const EMPTY_CHECKBOX_NUMBERED = /^\s*\[ \] /; // unchecked checkbox inside a numbered item
    const FULL_CHECKBOX_NUMBERED = /^\s*\[.\] /; // checked checkbox inside a numbered item

    const EMPTY_CHECKBOX = /^\s*- \[ \] /; // unchecked checkbox, indented or not
    const FULL_CHECKBOX = /^\s*- \[.\] /; // unchecked checkbox, indented or not

    if (isNumberDetected) {
        const s = line.slice(index); // slice out the number and its space
        if (EMPTY_CHECKBOX_NUMBERED.test(s)) {
            return false;
        }
        if (FULL_CHECKBOX_NUMBERED.test(s)) {
            return true;
        }
    } else {
        if (EMPTY_CHECKBOX.test(line)) {
            return false;
        }

        if (FULL_CHECKBOX.test(line)) {
            return true;
        }
    }

    return undefined;
}

function hasCheckboxContent(line: string): boolean {
    console.log(`line |${line}|`);
    const CHECKBOX_WITH_CONTENT = /^(?:\s*\d+\.\s*\[.\]|\s*-\s*\[.\])\s+\S+/;
    return CHECKBOX_WITH_CONTENT.test(line);
}

function extractTextAfterCheckbox(line: string): string {
    // Match the checkbox pattern and capture everything after it
    const regex = /^(?:\s*\d+\.\s*\[.\]|\s*-\s*\[.\])\s+(.+)$/;
    const match = line.match(regex);

    if (match) {
        return match[1]; // Return the captured text
    }

    // If no checkbox pattern found, return the original line
    return line;
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

export { getLineInfo, getListStart, getLastListStart, getPrevItemIndex, hasCheckboxContent, extractTextAfterCheckbox };
