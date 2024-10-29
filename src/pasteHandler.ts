import { Editor } from "obsidian";
import { getLineInfo } from "./utils";
import { getLastListIndex } from "./utils";

interface PastingRange {
    baseIndex: number;
    offset: number;
}
interface TextModification {
    modifiedText: string | undefined;
    numOfLines: number;
}

function handlePaste(editor: Editor, textFromClipboard: string, smartPaste: boolean): PastingRange {
    const { anchor, head } = editor.listSelections()[0];
    const baseIndex = Math.min(anchor.line, head.line);

    let numOfLines: number;

    if (smartPaste) {
        const afterPasteIndex = Math.max(anchor.line, head.line) + 1;
        const line = editor.getLine(afterPasteIndex);
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
    for (let char of text) {
        if (char === "\n") {
            count++;
        }
    }
    return count;
}

function modifyText(pastedText: string, newNumber: number): TextModification {
    const lines = pastedText.split("\n");
    const lineIndex = getLastListIndex(lines);

    if (lineIndex === undefined) {
        return { modifiedText: undefined, numOfLines: lines.length };
    }

    const targetLine = lines[lineIndex];
    const info = getLineInfo(targetLine);

    const newLine = targetLine.slice(0, info.spaces) + newNumber + ". " + targetLine.slice(info.textOffset);

    lines[lineIndex] = newLine;
    const modifiedText = lines.join("\n");

    console.debug("modifiedText:", modifiedText);

    return { modifiedText, numOfLines: lines.length };
}

export { handlePaste, modifyText, countNewlines };
