// updates a numbered list from the current line, to the first correctly number line.
import { Editor, EditorChange } from "obsidian";
import { getLineInfo, isFirstInNumberedList } from "../utils";
import { RenumberingStrategy, LineInfo, PendingChanges } from "../types";
import { generateChanges } from "./renumbering-utils";
import IndentTracker from "./IndentTracker";

// updates a numbered list from the current line, to the first correctly number line.
class DynamicStartStrategy implements RenumberingStrategy {
    renumber(editor: Editor, index: number): PendingChanges {
        let currInfo = getLineInfo(editor.getLine(index));
        let prevInfo: LineInfo | undefined = undefined;

        if (currInfo.number === undefined) {
            index++;
            prevInfo = currInfo;
            currInfo = getLineInfo(editor.getLine(index));
        }

        if (currInfo.number === undefined) {
            index++;
            return { changes: [], endIndex: index }; // not part of a numbered list
        }

        if (index <= 0) {
            const indentTracker = new IndentTracker(editor, index, false); // TODO problematic
            // console.log("indent tracker: ", indentTracker);
            return index === editor.lastLine()
                ? { changes: [], endIndex: index }
                : generateChanges(editor, index + 1, indentTracker, true);
        }

        if (prevInfo && !prevInfo.number && prevInfo.spaceCharsNum < currInfo.spaceCharsNum) {
            index++;
        }
        const indentTracker = new IndentTracker(editor, index, false);

        return generateChanges(editor, index, indentTracker, true);
    }
}

// Start renumbering from one
class StartFromOneStrategy implements RenumberingStrategy {
    renumber(editor: Editor, index: number): PendingChanges {
        let firstLineChange: EditorChange | undefined;

        let text = editor.getLine(index);
        let currInfo = getLineInfo(text);

        let isFirstInList = isFirstInNumberedList(editor, index);
        if (isFirstInList) {
            if (currInfo.number !== 1) {
                const newText = text.slice(0, currInfo.spaceCharsNum) + 1 + ". " + text.slice(currInfo.textIndex);
                firstLineChange = {
                    from: { line: index, ch: 0 },
                    to: { line: index, ch: text.length },
                    text: newText,
                };
            }
            index++;
        }

        const indentTracker = new IndentTracker(editor, index, isFirstInList);
        const generatedChanges = generateChanges(editor, index, indentTracker, true);

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
