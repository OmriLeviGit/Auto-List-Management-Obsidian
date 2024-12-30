import { Editor } from "obsidian";
import SettingsManager from "./SettingsManager";
import { LineInfo, CheckboxInfo } from "./types";

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

    // console.log(`line: ${line}, index:${index}`);
    if (!isNumberDetected) {
        const checkboxInfo = getCheckboxInfo(line, index, isNumberDetected);
        return {
            spaceCharsNum,
            spaceIndent: numOfSpaceIndents,
            number: undefined,
            textIndex: undefined,
            isCheckbox: checkboxInfo.isCheckbox,
            isChecked: checkboxInfo.isChecked,
        };
    }

    const number = parseInt(line.slice(spaceCharsNum, index));

    index += 2;
    const checkboxInfo = getCheckboxInfo(line, index, isNumberDetected);

    if (isNaN(number)) {
        return {
            spaceCharsNum,
            spaceIndent: numOfSpaceIndents,
            number: undefined,
            textIndex: undefined,
            isCheckbox: checkboxInfo.isCheckbox,
            isChecked: checkboxInfo.isChecked,
        };
    }

    return {
        spaceCharsNum,
        spaceIndent: numOfSpaceIndents,
        number,
        textIndex: index,
        isCheckbox: checkboxInfo.isCheckbox,
        isChecked: checkboxInfo.isChecked,
    };
}

function getCheckboxInfo(line: string, index: number, isNumberDetected: boolean): CheckboxInfo {
    const EMPTY_CHECKBOX_NUMBERED = /^\[ \] /; // unchecked checkbox inside a numbered item
    const FULL_CHECKBOX_NUMBERED = /^\[.\] /; // checked checkbox inside a numbered item

    const EMPTY_CHECKBOX = /^\s*- \[ \] /; // unchecked checkbox, indented or not
    const FULL_CHECKBOX = /^\s*- \[.\] /; // unchecked checkbox, indented or not

    if (isNumberDetected) {
        const s = line.slice(index); // slice out the number
        if (EMPTY_CHECKBOX_NUMBERED.test(s)) {
            return { isCheckbox: true, isChecked: false };
        }
        if (FULL_CHECKBOX_NUMBERED.test(s)) {
            return { isCheckbox: true, isChecked: true };
        }
    }

    if (EMPTY_CHECKBOX.test(line)) {
        return { isCheckbox: true, isChecked: false };
    }
    if (FULL_CHECKBOX.test(line)) {
        return { isCheckbox: true, isChecked: true };
    }

    return { isCheckbox: false };
}

// TODO not perfect
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

export { getLineInfo, getCheckboxInfo, getListStart, getLastListStart, getPrevItemIndex, isFirstInNumberedList };
