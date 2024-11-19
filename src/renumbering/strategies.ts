// updates a numbered list from the current line, to the first correctly number line.
import { Editor, EditorChange } from "obsidian";
import { getLineInfo, getPrevItemIndex, isFirstInNumberedList } from "../utils";
import { RenumberingStrategy, LineInfo, PendingChanges } from "../types";
import generateChanges from "./generateChanges";
import IndentTracker from "./IndentTracker";

// Start renumbering from one
class StartFromOneStrategy implements RenumberingStrategy {
    /*
    deleting mango doesnt renumber watermelon
    1. Apple
    1. Banana
            1. Orange
            2. Strawberry
            2. Mango
            3. Watermelon
            
    deleting mango DOES renumber watermelon
    1. Apple
        1. Banana
    2. Mango
    3. Watermelon
  */
    renumber(editor: Editor, index: number, isLocal = true): PendingChanges {
        let firstLineChanges: PendingChanges = { changes: [], endIndex: index };
        while (true) {
            console.log("rec index", index, "last index", editor.lastLine());

            if (index < 0 || editor.lastLine() < index) {
                console.log("out of range");
                return { changes: [], endIndex: index };
            }

            const text = editor.getLine(index);
            const lineInfo = getLineInfo(text);

            const isFirstInList = isFirstInNumberedList(editor, index);
            console.log("index: ", index, "isfirst: ", isFirstInList, text, lineInfo);

            if (isFirstInList) {
                // set the first line to 1 manually
                if (lineInfo.number !== 1) {
                    const newText = text.slice(0, lineInfo.spaceCharsNum) + 1 + ". " + text.slice(lineInfo.textIndex);
                    const firstLineChange = {
                        from: { line: index, ch: 0 },
                        to: { line: index, ch: text.length },
                        text: newText,
                    };
                    firstLineChanges.changes.push(firstLineChange);
                }

                index++; // renumber from the next item on the list
                continue;
            }
            break;
        }

        const l = getLineInfo(editor.getLine(index));

        // console.log(`isFirst: ${isFirstInList}, sameIndex: ${l.spaceIndent == lineInfo.spaceIndent}`);

        const p = getPrevItemIndex(editor, index);

        let b = false;
        if (p && isFirstInNumberedList(editor, p)) {
            b = true;
        }

        const indentTracker = new IndentTracker(editor, index, b);
        console.log("trakcer: ", indentTracker);
        firstLineChanges.changes.push(...generateChanges(editor, index, indentTracker, true, isLocal).changes);
        console.log("generated changes: ", firstLineChanges.changes);

        return firstLineChanges;
    }
}

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
