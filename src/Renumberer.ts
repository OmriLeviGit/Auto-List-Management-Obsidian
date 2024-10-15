import { Editor, EditorChange } from "obsidian";
import { getItemNum, getListStart, PATTERN } from "./utils";

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

    renumberLocally(editor: Editor, startIndex: number): PendingChanges {
        const currNum = getItemNum(editor, startIndex);
        const changes: EditorChange[] = [];

        if (currNum < 0) {
            return { changes, endIndex: startIndex }; // not a part of a numbered list
        }

        const prevNum = getItemNum(editor, startIndex - 1);

        if (prevNum < 0) {
            startIndex++;
        }

        return this.generateChanges(editor, startIndex, -1, true);
    }

    private renumberBlock(editor: Editor, currLine: number): PendingChanges {
        const changes: EditorChange[] = [];
        const startIndex = getListStart(editor, currLine);

        if (startIndex < 0) {
            return { changes, endIndex: startIndex };
        }

        return this.generateChanges(editor, startIndex);
    }

    private generateChanges(
        editor: Editor,
        currLine: number,
        startingValue: number = -1,
        isLocal = false
    ): PendingChanges {
        const changes: EditorChange[] = [];
        const lastLine = editor.lastLine() + 1;
        let firstChange = true;

        let expectedItemNum = startingValue < 0 ? getItemNum(editor, currLine - 1) : startingValue;
        if (expectedItemNum < 0) {
            currLine++;
            expectedItemNum = getItemNum(editor, currLine - 1);
        }

        expectedItemNum++;

        while (currLine < lastLine) {
            const lineText = editor.getLine(currLine);
            const match = lineText.match(PATTERN);

            if (!match) {
                break;
            }

            // if a change is required (expected != actual), push it to the changes list
            if (expectedItemNum !== parseInt(match[1])) {
                const newLineText = lineText.replace(match[0], `${expectedItemNum}. `);
                changes.push({
                    from: { line: currLine, ch: 0 },
                    to: { line: currLine, ch: lineText.length },
                    text: newLineText,
                });
            } else if (isLocal && !firstChange) {
                break; // ensures changes are made locally, not until the end of the block
            }

            firstChange = false;
            currLine++;
            expectedItemNum++;
        }

        return { changes, endIndex: currLine - 1 };
    }

    // private findNonSpaceIndex(line: string): number {
    //     let index = -1;
    //     const length = line.length;

    //     for (let i = 0; i < length; i++) {
    //         if (line[i] !== " ") {
    //             index = i;
    //             break;
    //         }
    //     }

    //     return index;
    // }
}
