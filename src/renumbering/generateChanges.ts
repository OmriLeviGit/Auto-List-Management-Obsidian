// RenumberingUtils.ts
import { Editor, EditorChange } from "obsidian";
import { ChangeResult, LineInfo, PendingChanges } from "../types";
import { getLineInfo, getPrevItemIndex, isFirstInNumberedList } from "../utils";
import SettingsManager from "src/SettingsManager";

function renumber(editor: Editor, index: number, isLocal = true): PendingChanges {
    const revisitIndices = [index]; // contains indices to revisit
    const changes: EditorChange[] = [];

    if (index > 0) {
        revisitIndices.unshift(index - 1);
    }

    if (index < editor.lastLine()) {
        revisitIndices.push(index + 1);
    }

    let endIndex = index;
    while (0 < revisitIndices.length) {
        const indexToRenumber = revisitIndices.shift()!;
        if (indexToRenumber < endIndex) {
            continue;
        }

        const info = getLineInfo(editor.getLine(indexToRenumber));
        if (info.number === undefined) {
            continue;
        }

        let num: number;
        const prevIndex = getPrevItemIndex(editor, indexToRenumber);
        const isStartFromOne = SettingsManager.getInstance().getStartsFromOne();

        if (prevIndex === undefined) {
            num = isStartFromOne ? 1 : info.number; // is the item number in the list
        } else {
            num = getLineInfo(editor.getLine(prevIndex)).number! + 1;
        }

        const changeResult = generateChanges(editor, indexToRenumber, num, info.spaceIndent, isLocal);
        if (changeResult) {
            changes.push(...changeResult.changes);
            revisitIndices.push(...changeResult.revisitIndices);
            endIndex = changeResult.endIndex;
        }
    }

    return { changes, endIndex };
}

// performs the calculation itself
function generateChanges(
    editor: Editor,
    index: number,
    currentNumber: number,
    indent: number,
    isLocal = true
): ChangeResult | undefined {
    const revisitIndices: number[] = [];
    const changes: EditorChange[] = [];
    let isFirstChange = true;

    if (index < 0) {
        return undefined;
    }

    for (; index <= editor.lastLine(); index++) {
        const lineText = editor.getLine(index);
        const info = getLineInfo(lineText);

        // if not a number or on a lower indent
        if (info.number === undefined || info.spaceIndent < indent) {
            break;
        }

        // if on a higher indent
        if (info.spaceIndent > indent) {
            revisitIndices.push(index);
            continue;
        }

        // if is local, allow the current line's numbering to be already what it's supposed to be only once
        if (isLocal) {
            if (info.number === currentNumber) {
                if (!isFirstChange) {
                    break;
                }
                isFirstChange = false;
                continue;
            }
        }

        const updatedLine = getUpdatedLine(index, currentNumber, info, lineText);
        changes.push(updatedLine);

        currentNumber++;
        isFirstChange = false;
    }

    return { changes, revisitIndices, endIndex: index };
}

function getUpdatedLine(index: number, expectedNum: number, info: LineInfo, text: string): EditorChange {
    const newText = `${text.slice(0, info.spaceCharsNum)}${expectedNum}. ${text.slice(info.textIndex)}`;
    const updatedLine = {
        from: { line: index, ch: 0 },
        to: { line: index, ch: text.length },
        text: newText,
    };
    return updatedLine;
}

export { renumber };
