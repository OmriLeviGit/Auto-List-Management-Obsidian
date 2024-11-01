import { Editor, EditorChange } from "obsidian";
import { getListStart, getLineInfo } from "./utils";
import IndentTracker from "./IndentTracker";

interface PendingChanges {
    changes: EditorChange[];
    endIndex: number | undefined;
}

// responsible for all renumbering actions
export default class Renumberer {
    constructor() {}

    // renumbers the list at cursor location from start to end
    listAtCursor = (editor: Editor, changes: EditorChange[]) => {
        const { anchor, head } = editor.listSelections()[0];
        const currLine = Math.min(anchor.line, head.line);
        changes.push(...this.renumberBlock(editor, currLine).changes);
        this.applyChangesToEditor(editor, changes);
    };

    // renumbers all numbered lists in specified range
    allListsInRange = (editor: Editor, changes: EditorChange[], currLine: number, end: number) => {
        while (currLine <= end) {
            const line = editor.getLine(currLine);
            if (line) {
                const { number } = getLineInfo(line);
                if (number) {
                    const newChanges = this.renumberBlock(editor, currLine);

                    if (newChanges.endIndex !== undefined) {
                        changes.push(...newChanges.changes);
                        currLine = newChanges.endIndex;
                    }
                }
            }

            currLine++;
        }

        if (changes.length > 0) {
            this.applyChangesToEditor(editor, changes);
        }
    };

    // updates a numbered list from start to end
    private renumberBlock(editor: Editor, currLine: number): PendingChanges {
        const startIndex = getListStart(editor, currLine);

        if (startIndex === undefined) {
            return { changes: [], endIndex: undefined }; // not a part of a numbered list
        }

        return this.generateChanges(editor, startIndex);
    }

    // updates a numbered list from the current line, to the first correctly number line.
    renumberLocally(editor: Editor, startIndex: number): PendingChanges {
        const { numOfSpaceChars: currSpaces, number: currNumber } = getLineInfo(editor.getLine(startIndex));

        // check if current line is part of a numbered list
        if (currNumber === undefined) {
            return { changes: [], endIndex: startIndex }; // not a part of a numbered list
        }

        // edge case for the first line
        if (startIndex <= 0) {
            return startIndex === editor.lastLine()
                ? { changes: [], endIndex: startIndex }
                : this.generateChanges(editor, startIndex + 1, true);
        }

        const { numOfSpaceChars: prevSpaces, number: prevNumber } = getLineInfo(editor.getLine(startIndex - 1));
        // adjust startIndex based on previous line info
        if (!prevNumber || prevSpaces < currSpaces) {
            startIndex++;
        }

        return this.generateChanges(editor, startIndex, true);
    }

    // performs the calculation itself
    private generateChanges(editor: Editor, currLine: number, isLocal = false): PendingChanges {
        const changes: EditorChange[] = [];
        const indentTracker = new IndentTracker(editor, currLine);
        console.log("tracker: ", indentTracker.get());
        const originalIndent = getLineInfo(editor.getLine(currLine)).spaceIndent;

        let firstChange = true;
        let prevSpaceIndent = getLineInfo(editor.getLine(currLine - 1)).spaceIndent;
        const endOfList = editor.lastLine() + 1;
        for (; currLine < endOfList; currLine++) {
            const text = editor.getLine(currLine);

            const { spaceIndent, numOfSpaceChars, number: currNum, textIndex } = getLineInfo(editor.getLine(currLine));

            console.log(
                `line: ${currLine}, spaceIndent: ${spaceIndent}, curr num: ${currNum}, text index: ${textIndex}`
            );
            console.log("tracker: ", indentTracker.get());

            // make sure indented text does not stop the search
            if (currNum === undefined) {
                firstChange = false;
                if (prevSpaceIndent < spaceIndent) {
                    indentTracker.insert(text);

                    continue;
                }
                console.log("broke 1");
                break;
            }

            const previousNum = indentTracker.get()[spaceIndent];
            const expectedNum = previousNum === undefined ? undefined : previousNum + 1;

            console.log("expected num", expectedNum);
            let newText = text;
            // if a change is required (expected != actual), push it to the changes list
            if (expectedNum !== undefined) {
                console.log(`orig: ${originalIndent}, space: ${spaceIndent}, tracklen: ${indentTracker.get().length}`);
                // const isValidIndent = originalIndent <= spaceIndent && spaceIndent <= indentTracker.get().length;
                const isValidIndent = spaceIndent <= indentTracker.get().length;
                if (expectedNum !== currNum && isValidIndent) {
                    newText = text.slice(0, numOfSpaceChars) + expectedNum + ". " + text.slice(textIndex);
                    console.log("change is made, new line is", newText);
                    changes.push({
                        from: { line: currLine, ch: 0 },
                        to: { line: currLine, ch: text.length },
                        text: newText,
                    });
                } else if (isLocal && !firstChange && spaceIndent === 0) {
                    console.log("broke 2");
                    break; // ensures changes are made locally, not until the end of the block
                }
            }

            indentTracker.insert(newText);

            prevSpaceIndent = spaceIndent;
            firstChange = false;
        }
        console.log("chnages: ", changes);

        return { changes, endIndex: currLine - 1 };
    }

    applyChangesToEditor(editor: Editor, changes: EditorChange[]) {
        const changesApplied = changes.length > 0;

        if (changesApplied) {
            editor.transaction({ changes });
        }
        changes.splice(0, changes.length);
        return changesApplied;
    }
}
