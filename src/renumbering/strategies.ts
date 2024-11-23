import { Editor, EditorChange } from "obsidian";
import { getLineInfo, isFirstInNumberedList } from "../utils";
import { RenumberingStrategy, LineInfo, PendingChanges } from "../types";
import generateChanges from "./generateChanges";
import IndentTracker from "./IndentTracker";

// Start renumbering from one
class StartFromOneStrategy implements RenumberingStrategy {
    renumber(editor: Editor, index: number, isLocal = true): PendingChanges {
        // function to create the first line change if needed
        const createFirstLineChange = (text: string, lineInfo: LineInfo, index: number): EditorChange | undefined => {
            if (lineInfo.number !== 1) {
                const newText = text.slice(0, lineInfo.spaceCharsNum) + "1. " + text.slice(lineInfo.textIndex);
                return {
                    from: { line: index, ch: 0 },
                    to: { line: index, ch: text.length },
                    text: newText,
                };
            }
            return undefined;
        };

        const text = editor.getLine(index);
        const lineInfo = getLineInfo(text);
        let isFirstInList = isFirstInNumberedList(editor, index);

        // console.log("index: ", index, "isFirstInList: ", isFirstInList, lineInfo);

        let firstLineChange: EditorChange | undefined = undefined;
        if (isFirstInList) {
            firstLineChange = createFirstLineChange(text, lineInfo, index);
            index++;
        }

        if (index > editor.lastLine()) {
            const changes = firstLineChange !== undefined ? [firstLineChange] : [];
            return { changes, endIndex: index };
        }

        const newLineInfo = getLineInfo(editor.getLine(index));

        // if there's no number in the line, theres no need to further renumbering
        if (newLineInfo.number === undefined) {
            const changes = firstLineChange !== undefined ? [firstLineChange] : [];
            return { changes, endIndex: index };
        }

        // prevent adjustment for the following line if the indentation is lower
        if (newLineInfo.spaceIndent < lineInfo.spaceIndent) {
            isFirstInList = false;
        }

        const indentTracker = new IndentTracker(editor, index, isFirstInList);

        // changes for the remaining lines
        const changeList = generateChanges(editor, index, indentTracker, true, isLocal);
        if (firstLineChange) {
            changeList.changes.unshift(firstLineChange);
        }

        return changeList;
    }
}

// updates a numbered list from the current line, to the first correctly number line
class DynamicStartStrategy implements RenumberingStrategy {
    renumber(editor: Editor, index: number, isLocal = true): PendingChanges {
        let currInfo = getLineInfo(editor.getLine(index));
        let prevInfo: LineInfo | undefined = undefined;

        // handle twice for cases where changes move the cursor to a line with different indentation
        if (currInfo.number === undefined) {
            index++;
            prevInfo = currInfo;
            currInfo = getLineInfo(editor.getLine(index));
        }

        // if there's no number in the line, theres no need to further renumbering
        if (currInfo.number === undefined) {
            index++;
            return { changes: [], endIndex: index };
        }

        if (index <= 0) {
            const indentTracker = new IndentTracker(editor, index, false);
            // console.log("indent tracker: ", indentTracker);
            return index === editor.lastLine()
                ? { changes: [], endIndex: index }
                : generateChanges(editor, index + 1, indentTracker, false, isLocal);
        }

        if (prevInfo && !prevInfo.number && prevInfo.spaceCharsNum < currInfo.spaceCharsNum) {
            index++;
        }
        const indentTracker = new IndentTracker(editor, index, false);

        return generateChanges(editor, index, indentTracker, false, isLocal);
    }
}

export { DynamicStartStrategy, StartFromOneStrategy };
