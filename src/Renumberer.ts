import { Editor, EditorChange } from "obsidian";
import { getListStart, getLineInfo } from "./utils";
import Stack from "./Stack";

interface PendingChanges {
    changes: EditorChange[];
    endIndex: number | undefined;
}

export default class Renumberer {
    constructor() {}

    applyChangesToEditor(editor: Editor, changes: EditorChange[]) {
        const changesApplied = changes.length > 0;

        if (changesApplied) {
            editor.transaction({ changes });
        }
        changes.splice(0, changes.length);
        return changesApplied;
    }

    renumberListAtCursor = (editor: Editor, changes: EditorChange[]) => {
        const { anchor, head } = editor.listSelections()[0];
        const currLine = Math.min(anchor.line, head.line);
        changes.push(...this.renumberBlock(editor, currLine).changes);
        this.applyChangesToEditor(editor, changes);
    };

    renumberAllListsInRange = (editor: Editor, changes: EditorChange[], currLine: number, end: number) => {
        while (currLine <= end) {
            const line = editor.getLine(currLine);
            if (line) {
                const { spaces, number } = getLineInfo(line);
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

    private renumberBlock(editor: Editor, currLine: number): PendingChanges {
        const startIndex = getListStart(editor, currLine);

        if (startIndex === undefined) {
            return { changes: [], endIndex: undefined }; // not a part of a numbered list
        }

        return this.generateChanges(editor, startIndex);
    }

    renumberLocally(editor: Editor, startIndex: number): PendingChanges {
        // console.log("index", startIndex);

        const { spaces: currSpaces, number: currNumber } = getLineInfo(editor.getLine(startIndex));

        // console.log("spaces: ", currSpaces, "number: ", currNumber);
        // console.log("start index: ", startIndex, "last", editor.lastLine());

        // check if current line is part of a numbered list
        if (currNumber === undefined) {
            return { changes: [], endIndex: startIndex }; // not a part of a numbered list
        }

        // edge case for the first line
        if (startIndex <= 0) {
            return startIndex === editor.lastLine()
                ? { changes: [], endIndex: startIndex }
                : this.generateChanges(editor, startIndex + 1, -1, true);
        }

        const { spaces: prevSpaces, number: prevNumber } = getLineInfo(editor.getLine(startIndex - 1));

        // Adjust startIndex based on previous line info
        if (!prevNumber || prevSpaces < currSpaces) {
            startIndex++;
        }

        return this.generateChanges(editor, startIndex, -1, true);
    }

    private generateChanges(
        editor: Editor,
        currLine: number,
        startingValue: number = -1,
        isLocal = false
    ): PendingChanges {
        const changes: EditorChange[] = [];
        let stack = new Stack(editor, currLine);

        if (startingValue > 0) {
            stack.setLastValue(startingValue);
        }

        let firstChange = true;
        const endOfList = editor.lastLine() + 1;
        while (currLine < endOfList) {
            // let lastInStack = stack.peek();
            const text = editor.getLine(currLine);

            const {
                spaces: numOfSpaces,
                number: currNumber,
                textOffset: textIndex,
            } = getLineInfo(editor.getLine(currLine));
            console.log(
                `Line ${currLine}: numOfSpaces = ${numOfSpaces}, currNumber = ${currNumber}, textIndex = ${textIndex}`
            );

            let lastInStack = stack.get()[numOfSpaces];

            if (lastInStack === undefined) {
                console.log("Error: last in stack is **undefined**\nstack = ", stack.get());
                firstChange = false;
                currLine++;
                break;
            }

            let expectedItemNum = lastInStack + 1;

            if (currNumber === undefined) {
                stack.insert(text);
            } else {
                const isValidIndent = numOfSpaces <= stack.get().length;

                // if a change is required (expected != actual), push it to the changes list
                if (expectedItemNum !== currNumber && isValidIndent) {
                    const newText = text.slice(0, numOfSpaces) + expectedItemNum + ". " + text.slice(textIndex);
                    changes.push({
                        from: { line: currLine, ch: 0 },
                        to: { line: currLine, ch: text.length },
                        text: newText,
                    });
                    stack.insert(newText);
                } else if (isLocal && !firstChange) {
                    break; // ensures changes are made locally, not until the end of the block
                } else {
                    stack.insert(text);
                }
            }

            // TODO insert to stack new changes, requires stack to work without texline but with indices and offsets somehow
            firstChange = false;
            currLine++;
        }

        // console.log("out");
        return { changes, endIndex: currLine - 1 };
    }
}
