// updates a numbered list from the current line, to the first correctly number line.
import { Editor, EditorChange } from "obsidian";
import { getLineInfo, isFirstInNumberedList } from "../utils";
import { RenumberingStrategy, LineInfo, PendingChanges } from "../types";
import { generateChanges } from "./renumbering-utils";
import IndentTracker from "./IndentTracker";

// updates a numbered list from the current line, to the first correctly number line.
class DynamicStartStrategy implements RenumberingStrategy {
    renumber(editor: Editor, startLine: number): PendingChanges {
        let currInfo = getLineInfo(editor.getLine(startLine));
        let prevInfo: LineInfo | undefined = undefined;

        if (currInfo.number === undefined) {
            startLine++;
            prevInfo = currInfo;
            currInfo = getLineInfo(editor.getLine(startLine));
        }

        if (currInfo.number === undefined) {
            startLine++;
            return { changes: [], endIndex: startLine }; // not part of a numbered list
        }

        if (startLine <= 0) {
            const indentTracker = new IndentTracker(editor, startLine + 1);
            return startLine === editor.lastLine()
                ? { changes: [], endIndex: startLine }
                : generateChanges(editor, startLine + 1, indentTracker, true);
        }

        if (prevInfo && !prevInfo.number && prevInfo.spaceCharsNum < currInfo.spaceCharsNum) {
            startLine++;
        }
        const indentTracker = new IndentTracker(editor, startLine);

        return generateChanges(editor, startLine, indentTracker, true);
    }
}

// Start renumbering from one
class StartFromOneStrategy implements RenumberingStrategy {
    renumber(editor: Editor, startIndex: number): PendingChanges {
        let firstLineChange: EditorChange | undefined;

        const text = editor.getLine(startIndex);
        const currInfo = getLineInfo(text);

        const isFirstInList = isFirstInNumberedList(editor, startIndex);

        if (isFirstInList && currInfo.number !== 1) {
            const newText = text.slice(0, currInfo.spaceCharsNum) + 1 + ". " + text.slice(currInfo.textIndex);
            firstLineChange = {
                from: { line: startIndex, ch: 0 },
                to: { line: startIndex, ch: text.length },
                text: newText,
            };
        }

        const indentTracker = new IndentTracker(editor, startIndex + 1);

        const generatedChanges = generateChanges(editor, startIndex + 1, indentTracker, true);

        if (firstLineChange) {
            generatedChanges.changes.unshift(firstLineChange);
        }

        return generatedChanges;
    }

    /*
    renumber(editor: Editor, startIndex: number): PendingChanges {
        let firstLineChange: EditorChange | undefined;
        startIndex = startIndex - 1;

        if (startIndex < 0) {
            startIndex++;
        }

        let text = editor.getLine(startIndex);
        let currInfo = getLineInfo(text);
        if (currInfo.number === undefined) {
            startIndex++;
        }
        text = editor.getLine(startIndex);
        currInfo = getLineInfo(text);

        let isFirstInList = isFirstInNumberedList(editor, startIndex);

        if (isFirstInList) {
            const newText = text.slice(0, currInfo.spaceCharsNum) + 1 + ". " + text.slice(currInfo.textIndex);
            firstLineChange = {
                from: { line: startIndex, ch: 0 },
                to: { line: startIndex, ch: text.length },
                text: newText,
            };
        }

        const generatedChanges = this.generateChanges(editor, startIndex + 1, true);

        // console.log("is inside: ", firstLineChange !== undefined);
        if (firstLineChange) {
            generatedChanges.changes.unshift(firstLineChange);
        }
        // console.log("changes: ", generatedChanges);
        return generatedChanges;
    }


    */
}

export { DynamicStartStrategy, StartFromOneStrategy };
