import { Editor, EditorChange } from "obsidian";
import { getLineInfo, getNextItemIndex, isFirstInNumberedList } from "../utils";
import { RenumberingStrategy, LineInfo, PendingChanges } from "../types";
import generateChanges from "./generateChanges";
import IndentTracker from "./IndentTracker";

// Start renumbering from one
class StartFromOneStrategy implements RenumberingStrategy {
    renumber(editor: Editor, index: number, isLocal = true): PendingChanges {
        const changeList: PendingChanges = { changes: [], endIndex: index };
        const text = editor.getLine(index);
        const lineInfo = getLineInfo(text);

        if (lineInfo.number === undefined) {
            return changeList;
        }

        console.log("out before, index = ", index - 1);
        const before = this.abc(editor, index - 1, isLocal);
        if (before !== undefined) {
            console.log("in before");
            changeList.changes.push(...before.changes);
            changeList.endIndex = before.endIndex;
        }

        /*

        maybe make a loop
        */

        console.log("out mid, index = ", changeList.endIndex);
        if (changeList.endIndex <= index) {
            console.log("in mid");
            const mid = this.abc(editor, index, isLocal);
            if (mid !== undefined) {
                changeList.changes.push(...mid.changes);
                changeList.endIndex = mid.endIndex;
            }
        }

        console.log("out after, index = ", changeList.endIndex);
        if (changeList.endIndex <= index + 1) {
            console.log("in after");
            const after = this.abc(editor, index + 1, isLocal);
            if (after !== undefined) {
                changeList.changes.push(...after.changes);
                changeList.endIndex = after.endIndex;
            }
        }

        const nextIndex = getNextItemIndex(editor, index);

        console.log("out next, index = ", changeList.endIndex, "next index = ", nextIndex);
        if (nextIndex !== undefined && changeList.endIndex <= nextIndex) {
            console.log("in next");
            const next = this.abc(editor, nextIndex, isLocal);
            if (next !== undefined) {
                changeList.changes.push(...next.changes);
                changeList.endIndex = next.endIndex;
            }
        }
        console.log("changelistlen", changeList.changes.length, changeList.changes);

        return changeList;
    }

    private abc(editor: Editor, index: number, isLocal: boolean): PendingChanges | undefined {
        if (index < 0 || editor.lastLine() < index) {
            return;
        }

        const text = editor.getLine(index);
        const lineInfo = getLineInfo(text);

        const isFirstInList = isFirstInNumberedList(editor, index);
        if (isFirstInList) {
            console.log("index ", index, "is first");
            const firstChange = this.createFirstLineChange(text, lineInfo, index);
            if (firstChange) {
                return { changes: [firstChange], endIndex: index + 1 };
            }
            return { changes: [], endIndex: index + 1 };
        }
        return this.followingLine(editor, index, lineInfo, isLocal);
    }

    private followingLine(editor: Editor, index: number, lineInfo: LineInfo, isLocal: boolean) {
        if (editor.lastLine() < index) {
            return undefined;
        }

        console.log("@index = ", index);
        const newLineInfo = getLineInfo(editor.getLine(index));
        // if there's no number in the line, theres no need to further renumbering
        if (newLineInfo.number === undefined) {
            return undefined;
        }

        // prevent adjustment for the following line if the indentation is lower
        let isFirstInList = true;
        if (newLineInfo.spaceIndent < lineInfo.spaceIndent) {
            isFirstInList = false;
        }

        const indentTracker = new IndentTracker(editor, index, isFirstInList);

        // changes for the remaining lines
        const changeList = generateChanges(editor, index, indentTracker, true, isLocal);

        return changeList;
    }

    // function to create the first line change if needed
    private createFirstLineChange(text: string, lineInfo: LineInfo, index: number): EditorChange | undefined {
        if (lineInfo.number !== 1) {
            const newText = text.slice(0, lineInfo.spaceCharsNum) + "1. " + text.slice(lineInfo.textIndex);
            return {
                from: { line: index, ch: 0 },
                to: { line: index, ch: text.length },
                text: newText,
            };
        }
        return undefined;
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
