import { Editor, EditorTransaction, MarkdownView } from "obsidian";
import { getLineInfo, findFirstNumbersByIndentFromEnd, findFirstNumbersAfterIndex } from "src/utils";
import SettingsManager from "src/SettingsManager";
import { checkPrimeSync } from "crypto";
import path from "path";

function handlePaste(evt: ClipboardEvent, editor: Editor): { start?: number; end?: number } {
    const updateNumbering = SettingsManager.getInstance().getLiveNumberingUpdate();
    const updateChecklist = SettingsManager.getInstance().getLiveCheckboxUpdate();
    if (!updateNumbering && !updateChecklist) {
        return { start: undefined, end: undefined };
    }

    // Get the content from clipboardData
    const content = evt.clipboardData?.getData("text");
    if (evt.defaultPrevented || !content) {
        return { start: undefined, end: undefined };
    }

    // Prevent default handling
    evt.preventDefault();

    // Get current selection
    const { anchor, head } = editor.listSelections()[0];
    const baseIndex = Math.min(anchor.line, head.line);

    // Modify text if smart pasting is enabled
    let modifiedContent = content;
    const smartPasting = SettingsManager.getInstance().getSmartPasting();
    if (smartPasting) {
        const indexAfterPasting = Math.max(anchor.line, head.line) + 1;
        modifiedContent = modifyText(editor, content, indexAfterPasting) ?? content;
    }

    editor.replaceSelection(modifiedContent); // Paste the content

    // Count lines for return value calculation
    const contentLines = modifiedContent.split("\n");
    const numOfLines = contentLines.length - 1;

    // Calculate end position
    const start = baseIndex;
    const end = start + numOfLines;

    return { start, end };
}

function handleDrop(evt: DragEvent, editor: Editor): { start?: number; end?: number } {
    const settingsManager = SettingsManager.getInstance();
    if (!settingsManager.getLiveNumberingUpdate() && !settingsManager.getLiveCheckboxUpdate()) {
        return { start: undefined, end: undefined };
    }

    // Get the cm active view
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || !activeView.editor.hasFocus()) {
        return { start: undefined, end: undefined };
    }
    // @ts-expect-error, not typed
    const editorView = activeView.editor.cm as EditorView;

    const dropPosition = editorView.posAtCoords({ x: evt.clientX, y: evt.clientY });
    if (dropPosition === null) {
        return { start: undefined, end: undefined };
    }

    // Get the content from dataTransfer
    const content = evt.dataTransfer?.getData("text");
    if (evt.defaultPrevented || !content) {
        return { start: undefined, end: undefined };
    }

    evt.preventDefault(); // Prevent default handling

    const pos = editor.offsetToPos(dropPosition); // Get the drop position

    // Get the current selection (what's being dragged)
    const { anchor, head } = editor.listSelections()[0];

    let modifiedContent = content;
    const smartPasting = SettingsManager.getInstance().getSmartPasting();
    if (smartPasting) {
        modifiedContent = modifyText(editor, content, pos.line) ?? content;
    }

    const selectionFrom = anchor.line < head.line || (anchor.line === head.line && anchor.ch < head.ch) ? anchor : head;

    const selectionTo = anchor.line > head.line || (anchor.line === head.line && anchor.ch > head.ch) ? anchor : head;

    // Create and execute the transaction
    const transaction: EditorTransaction = {
        changes: [
            {
                from: selectionFrom,
                to: selectionTo,
                text: "",
            },
            {
                from: pos,
                to: pos,
                text: modifiedContent,
            },
        ],
    };

    editor.transaction(transaction);

    // Calculate end position of inserted text
    const lines = modifiedContent.split("\n");
    const endPos = {
        line: pos.line + lines.length - 1,
        ch: lines.length > 1 ? lines[lines.length - 1].length : pos.ch + modifiedContent.length,
    };

    const start = Math.min(pos.line, selectionFrom.line);
    const end = Math.max(endPos.line, selectionTo.line) + 1;

    return { start, end };
}

function modifyText(editor: Editor, pastedText: string, pastePosition: number) {
    const currentLineInfo = getLineInfo(editor.getLine(pastePosition));
    if (!currentLineInfo.number) {
        return;
    }

    const pastedLines = pastedText.split("\n");
    const sourceListNumbers = findFirstNumbersByIndentFromEnd(pastedLines);
    const targetListNumbers = findFirstNumbersAfterIndex(editor, pastePosition);

    for (let indentLevel = 0; indentLevel < sourceListNumbers.length; indentLevel++) {
        const sourceLineIndex = sourceListNumbers[indentLevel];
        const newNumber = targetListNumbers[indentLevel];

        if (sourceLineIndex === undefined || newNumber === undefined) {
            continue;
        }

        const sourceLine = pastedLines[sourceLineIndex];
        const sourceLineInfo = getLineInfo(sourceLine);

        pastedLines[sourceLineIndex] =
            sourceLine.slice(0, sourceLineInfo.spaceCharsNum) +
            newNumber +
            ". " +
            sourceLine.slice(sourceLineInfo.textOffset);
    }

    const renumberedText = pastedLines.join("\n");

    return renumberedText;
}

export { modifyText, handlePaste, handleDrop };
