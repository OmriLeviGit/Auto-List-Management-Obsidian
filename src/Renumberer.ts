import { Editor, EditorChange } from "obsidian";
import { getItemNum, getListStart, PATTERN, PATTERNTwo, getNumFromText, findNonSpaceIndex } from "./utils";
import Stack from "./Stack";

interface PendingChanges {
    changes: EditorChange[];
    endIndex: number;
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
            if (PATTERN.test(editor.getLine(currLine))) {
                const newChanges = this.renumberBlock(editor, currLine);

                if (newChanges.endIndex > 0) {
                    changes.push(...newChanges.changes);
                    currLine = newChanges.endIndex;
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

        if (startIndex < 0) {
            return { changes: [], endIndex: startIndex }; // not a part of a numbered list
        }

        return this.generateChanges(editor, startIndex);
    }

    renumberLocally(editor: Editor, startIndex: number): PendingChanges {
        console.log("index", startIndex);

        const currLine = editor.getLine(startIndex);
        const spaceIndex = findNonSpaceIndex(currLine);
        const currNum = getNumFromText(currLine.slice(spaceIndex));

        if (currNum < 0) {
            return { changes: [], endIndex: startIndex }; // not a part of a numbered list
        }

        if (startIndex <= 0) {
            startIndex++;
        } else {
            const prevLine = editor.getLine(startIndex - 1);
            const prevSpaceIndex = findNonSpaceIndex(prevLine);
            const prevNum = getNumFromText(prevLine.slice(prevSpaceIndex));

            const shouldIncrementStartIndex = prevSpaceIndex < spaceIndex || prevNum < 0;

            if (shouldIncrementStartIndex) {
                startIndex++;
                console.log("inside con");
            }
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

        console.log("currLine", currLine);

        if (startingValue > 0) {
            stack.setLastValue(startingValue);
        }

        console.log("stack = ", stack, "startindex", currLine);

        let firstChange = true;
        const endOfList = editor.lastLine() + 1;
        //console.log("currLine: ", currLine, "endoflist: ", endOfList);
        //console.log("stack = ", stack.get());
        while (currLine < endOfList) {
            // let lastInStack = stack.peek();
            const lineText = editor.getLine(currLine);
            const spaceIndex = findNonSpaceIndex(lineText);

            console.log(lineText);
            let lastInStack = stack.get()[spaceIndex];
            console.log("spaceindex", spaceIndex);

            // console.log("lastinstack", lastInStack);
            // console.log("stack = ", stack.get());

            if (lastInStack === undefined) {
                console.log("Error: last in stack is **undefined**\nstack = ", stack.get());
                firstChange = false;
                currLine++;
                break;
            }

            let expectedItemNum = lastInStack + 1;

            const sameLength = spaceIndex !== stack.get().length;

            const match = lineText.match(PATTERNTwo);

            const aText = getNumFromText(lineText.slice(spaceIndex));

            if (!match) {
                break;
            }

            console.log(expectedItemNum, match[1]);

            // if a change is required (expected != actual), push it to the changes list
            if (!sameLength || expectedItemNum !== parseInt(match[1])) {
                const newLineText = lineText.replace(match[1], `${expectedItemNum}`);
                changes.push({
                    from: { line: currLine, ch: 0 },
                    to: { line: currLine, ch: lineText.length },
                    text: newLineText,
                });

                stack.insert(newLineText);
            } else if (isLocal && !firstChange) {
                break; // ensures changes are made locally, not until the end of the block
            } else {
                stack.insert(lineText);
            }

            // TODO insert to stack new changes, requires stack to work without texline but with indices and offsets somehow
            firstChange = false;
            currLine++;
        }

        // console.log("out");
        return { changes, endIndex: currLine - 1 };
    }

    // private generateChanges(
    //     editor: Editor,
    //     currLine: number,
    //     startingValue: number = -1,
    //     isLocal = false
    // ): PendingChanges {
    //     const changes: EditorChange[] = [];
    //     const lastLine = editor.lastLine() + 1;
    //     let firstChange = true;

    //     let expectedItemNum = startingValue < 0 ? getItemNum(editor, currLine - 1) : startingValue;
    //     if (expectedItemNum < 0) {
    //         currLine++;
    //         expectedItemNum = getItemNum(editor, currLine - 1);
    //     }

    //     expectedItemNum++;

    //     while (currLine < lastLine) {
    //         const lineText = editor.getLine(currLine);
    //         const match = lineText.match(PATTERN);

    //         if (!match) {
    //             break;
    //         }

    //         // if a change is required (expected != actual), push it to the changes list
    //         if (expectedItemNum !== parseInt(match[1])) {
    //             const newLineText = lineText.replace(match[0], `${expectedItemNum}. `);
    //             changes.push({
    //                 from: { line: currLine, ch: 0 },
    //                 to: { line: currLine, ch: lineText.length },
    //                 text: newLineText,
    //             });
    //         } else if (isLocal && !firstChange) {
    //             break; // ensures changes are made locally, not until the end of the block
    //         }

    //         firstChange = false;
    //         currLine++;
    //         expectedItemNum++;
    //     }

    //     return { changes, endIndex: currLine - 1 };
    // }
}
