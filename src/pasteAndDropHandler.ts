import { Editor } from "obsidian";
import { getLineInfo, getLastListStart } from "src/utils";
import SettingsManager from "src/SettingsManager";
import { Mutex } from "async-mutex";

interface PastingRange {
    baseIndex: number;
    offset: number;
}

interface TextModification {
    modifiedText: string | undefined;
    numOfLines: number;
}

export default function handlePasteAndDrop(evt: ClipboardEvent | DragEvent, editor: Editor, mutex: Mutex) {
    const updateNumbering = SettingsManager.getInstance().getLiveNumberingUpdate();
    const updateChecklist = SettingsManager.getInstance().getLiveCheckboxUpdate();

    if (!updateNumbering && !updateChecklist) {
        return { start: undefined, end: undefined }; // Return default values
    }

    // get the content from either clipboardData (paste) or dataTransfer (drag/drop)
    const content =
        evt instanceof ClipboardEvent
            ? evt.clipboardData?.getData("text")
            : evt instanceof DragEvent
            ? evt.dataTransfer?.getData("text")
            : null;

    if (evt.defaultPrevented || !content) {
        return { start: undefined, end: undefined }; // Return default values
    }

    evt.preventDefault();
    mutex.acquire(); // prevent from the

    const pastingRange = pasteText(editor, content);

    const start = pastingRange.baseIndex;
    const end = start + pastingRange.offset;

    return { start, end };
}

// ensures numbered lists in pasted text are numbered correctly
function pasteText(editor: Editor, textFromClipboard: string): PastingRange {
    const { anchor, head } = editor.listSelections()[0];
    const baseIndex = Math.min(anchor.line, head.line);
    let numOfLines: number;

    const smartPasting = SettingsManager.getInstance().getSmartPasting();
    if (smartPasting) {
        const indexAfterPasting = Math.max(anchor.line, head.line) + 1;
        const line = editor.getLine(indexAfterPasting);
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

    editor.replaceSelection(textFromClipboard); // paste

    return { baseIndex, offset: numOfLines };
}

// change the first item of the last numbered list in text to newNumber
function modifyText(text: string, newNumber: number): TextModification {
    const lines = text.split("\n");
    const lineIndex = getLastListStart(lines);

    if (lineIndex === undefined) {
        return { modifiedText: undefined, numOfLines: lines.length };
    }

    const targetLine = lines[lineIndex];
    const info = getLineInfo(targetLine);

    const newLine = targetLine.slice(0, info.spaceCharsNum) + newNumber + ". " + targetLine.slice(info.textOffset);

    lines[lineIndex] = newLine;
    const modifiedText = lines.join("\n");

    return { modifiedText, numOfLines: lines.length };
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

export { pasteText as processTextInput, modifyText };
