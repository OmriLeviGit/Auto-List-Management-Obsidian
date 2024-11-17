import { Editor } from "obsidian";
import { getLineInfo, getLastListStart } from "src/utils";
import SettingsManager from "src/SettingsManager";

interface PastingRange {
    baseIndex: number;
    offset: number;
}

interface TextModification {
    modifiedText: string | undefined;
    numOfLines: number;
}

// ensures numbered lists in pasted text are numbered correctly
export default function handlePaste(editor: Editor, textFromClipboard: string): PastingRange {
    const { anchor, head } = editor.listSelections()[0];
    const baseIndex = Math.min(anchor.line, head.line);

    let numOfLines: number;

    const settingsManager = SettingsManager.getInstance();

    const smartPasting = settingsManager.getSmartPasting();
    if (smartPasting) {
        const afterPastingIndex = Math.max(anchor.line, head.line) + 1;
        const line = editor.getLine(afterPastingIndex);
        const info = getLineInfo(line);

        if (info.number !== undefined) {
            const retval = modifyText(textFromClipboard, info.number);
            textFromClipboard = retval.modifiedText ?? textFromClipboard;
            numOfLines = retval.numOfLines;
        } else {
            numOfLines = countNewlines(textFromClipboard);
        }
    } else {
        numOfLines = countNewlines(textFromClipboard);
    }

    // console.debug("base: ", baseIndex, "last:", lastIndex);
    editor.replaceSelection(textFromClipboard); // paste

    return { baseIndex, offset: numOfLines };
}

function countNewlines(text: string) {
    let count = 0;
    for (const char of text) {
        if (char === "\n") {
            count++;
        }
    }
    return count;
}

// changes the first item of the last numbered list in text to newNumber
function modifyText(text: string, newNumber: number): TextModification {
    const lines = text.split("\n");
    const lineIndex = getLastListStart(lines);

    if (lineIndex === undefined) {
        return { modifiedText: undefined, numOfLines: lines.length };
    }

    const targetLine = lines[lineIndex];
    const info = getLineInfo(targetLine);

    const newLine = targetLine.slice(0, info.spaceCharsNum) + newNumber + ". " + targetLine.slice(info.textIndex);

    lines[lineIndex] = newLine;
    const modifiedText = lines.join("\n");

    // console.debug("modifiedText:", modifiedText);

    return { modifiedText, numOfLines: lines.length };
}

export { modifyText, countNewlines };
