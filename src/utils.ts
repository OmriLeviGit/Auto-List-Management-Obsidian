import { Editor } from "obsidian";
import SettingsManager from "./SettingsManager";
import { LineInfo } from "./types";
import { resourceLimits } from "worker_threads";

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
        return match[1];
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

function findFirstNumbersAfterIndex(editor: Editor, startIndex: number): number[] {
    // Array to store the first number found for each indent level (going forward)
    const result: number[] = [];

    // Get the indent level of the current line to set our maximum tracking threshold
    const currentLineInfo = getLineInfo(editor.getLine(startIndex));

    if (!currentLineInfo || currentLineInfo.spaceIndent === undefined) {
        return []; // Invalid start line
    }

    // Initial maximum indent level we care about
    let maxIndentToTrack = Infinity;

    for (let i = startIndex; i <= editor.lastLine(); i++) {
        const line = editor.getLine(i);
        const info = getLineInfo(line);

        // Skip if we can't get info
        if (info.spaceIndent === undefined) {
            continue;
        }

        const currentIndent = info.spaceIndent;

        // Skip if this indent is higher than what we care about
        if (currentIndent > maxIndentToTrack) {
            continue;
        }

        // If the line has no number, continue to next line
        if (info.number === undefined) {
            continue;
        }

        // Store the number for this indent level if not already set
        if (result[currentIndent] === undefined) {
            result[currentIndent] = info.number;
        }

        // Only update maxIndentToTrack AFTER we've stored the number
        if (currentIndent < maxIndentToTrack) {
            maxIndentToTrack = currentIndent;
        }

        // If we've found indent 0, we're done (reached the lowest level)
        if (currentIndent === 0 && result[0] !== undefined) {
            break;
        }
    }

    return result;
}

// index of the first item in the last numbered list
function findFirstNumbersByIndentFromEnd(lines: string[]): number[] {
    // Array to store the first number found for each indent level (from the end)
    const result = [];
    // Track the maximum indent level we still care about, which is the minimum we have seen
    let maxIndentToTrack = Infinity;

    // Process lines in reverse order
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        const info = getLineInfo(line);

        // Skip if we can't get info
        if (!info || info.spaceIndent === undefined) {
            continue;
        }

        const currentIndent = info.spaceIndent;

        // Skip if this indent is higher than what we care about
        if (currentIndent > maxIndentToTrack) {
            continue;
        }

        // Update the minimum indent we care about
        maxIndentToTrack = currentIndent;

        // If the line has no number, we don't need to process any more lines
        // at this indent level or higher
        if (info.number === undefined) {
            if (currentIndent === 0) {
                // If we're at indent 0 with no number, we can break entirely
                break;
            }

            continue;
        }

        // Store the number for this indent level if not already set
        if (result[currentIndent] === undefined) {
            result[currentIndent] = i;
        }

        // If we've found indent 0, we're done
        if (currentIndent === 0 && result[0] !== undefined) {
            break;
        }
    }

    return result;
}

export { getLineInfo, getListStart, getPrevItemIndex, findFirstNumbersByIndentFromEnd, findFirstNumbersAfterIndex };
