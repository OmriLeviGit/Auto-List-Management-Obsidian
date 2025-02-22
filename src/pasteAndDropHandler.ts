import { Editor } from "obsidian";
import { getLineInfo, getLastListStart } from "src/utils";
import SettingsManager from "src/SettingsManager";
import { Mutex } from "async-mutex";
import { reorderChecklist } from "./checkbox";

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
        return;
    }

    // get the content from either clipboardData (paste) or dataTransfer (drag/drop)
    const content =
        evt instanceof ClipboardEvent
            ? evt.clipboardData?.getData("text")
            : evt instanceof DragEvent
            ? evt.dataTransfer?.getData("text")
            : null;

    if (evt.defaultPrevented || !content) {
        return;
    }

    evt.preventDefault();

    mutex.runExclusive(() => {
        this.blockChanges = true;
        const { baseIndex, offset } = processTextInput(editor, content);
        const lineToReturn = editor.getCursor().line;
        if (updateChecklist) {
            reorderChecklist(editor, baseIndex, baseIndex + offset);
            editor.setCursor({ line: lineToReturn, ch: editor.getLine(lineToReturn).length });
        }
        if (updateNumbering) {
            this.renumberer.renumberAllListsInRange(editor, baseIndex, baseIndex + offset);
        }
    });
}

// ensures numbered lists in pasted text are numbered correctly
function processTextInput(editor: Editor, textFromClipboard: string): PastingRange {
    const { anchor, head } = editor.listSelections()[0];
    const baseIndex = Math.min(anchor.line, head.line);
    let numOfLines: number;

    const smartPasting = SettingsManager.getInstance().getRenumberingSmartPasting();
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

export { modifyText };
