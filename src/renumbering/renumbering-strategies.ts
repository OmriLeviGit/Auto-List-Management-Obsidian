// updates a numbered list from the current line, to the first correctly number line.
import { Editor, EditorChange } from "obsidian";
import { getLineInfo, isFirstInNumberedList } from "../utils";
import { RenumberingStrategy, LineInfo, PendingChanges } from "../types";
import { generateChanges } from "./renumbering-utils";
import IndentTracker from "./IndentTracker";

// updates a numbered list from the current line, to the first correctly number line.
class DynamicStartStrategy implements RenumberingStrategy {
    renumber(editor: Editor, index: number, isLocal = true): PendingChanges {
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
                : generateChanges(editor, index + 1, indentTracker, isLocal);
        }

        if (prevInfo && !prevInfo.number && prevInfo.spaceCharsNum < currInfo.spaceCharsNum) {
            index++;
        }
        const indentTracker = new IndentTracker(editor, index, false);

        return generateChanges(editor, index, indentTracker, isLocal);
    }
}

// Start renumbering from one
class StartFromOneStrategy implements RenumberingStrategy {
    renumber(editor: Editor, index: number, isLocal = true): PendingChanges {
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
        const generatedChanges = generateChanges(editor, index, indentTracker, isLocal);

        if (firstLineChange) {
            generatedChanges.changes.unshift(firstLineChange);
        }

        return generatedChanges;
    }
}

export { DynamicStartStrategy, StartFromOneStrategy };
