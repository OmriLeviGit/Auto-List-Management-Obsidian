import { Editor, EditorChange, EditorTransaction } from "obsidian";
import { getItemNum, getListStart, PATTERN } from "./utils";

interface PendingChanges {
    changes: EditorChange[];
    endIndex: number;
}

export default class Renumberer {
    constructor() {}

    apply(editor: Editor, changes: EditorChange[]) {
        editor.transaction({ changes });
        const changesApplied = changes.length > 0;
        changes.splice(0, changes.length);

        return changesApplied;
    }

    renumberBlock(editor: Editor, currLine: number, startFrom: number = -1): PendingChanges {
        const changes: EditorChange[] = [];
        const linesInFile = editor.lastLine() + 1;

        let currLineIndex = getListStart(editor, currLine);

        if (currLineIndex < 0) {
            return { changes, endIndex: currLineIndex };
        }

        let currValue = startFrom !== -1 ? startFrom : getItemNum(editor, currLineIndex);

        // TODO make the comparison string-based, to avoid scientific notations, also need to make it larger than Number
        while (currLineIndex < linesInFile) {
            const lineText = editor.getLine(currLineIndex);
            const match = lineText.match(PATTERN);

            if (match === null) {
                break;
            }

            // if a change is required (expected != actual), push it to the changes list
            if (currValue !== parseInt(match[1])) {
                const newLineText = lineText.replace(match[0], `${currValue}. `);

                changes.push({
                    from: { line: currLineIndex, ch: 0 },
                    to: { line: currLineIndex, ch: lineText.length },
                    text: newLineText,
                });
            }

            currLineIndex++;
            currValue++;
        }

        return { changes, endIndex: currLineIndex - 1 };
    }

    renumberLocally(editor: Editor, currLine: number): PendingChanges {
        const linesInFile = editor.lastLine() + 1;
        const currNum = getItemNum(editor, currLine);
        const changes: EditorChange[] = [];

        if (currNum === -1) {
            return { changes, endIndex: currLine }; // not a part of a numbered list
        }

        let prevNum = getItemNum(editor, currLine - 1);

        let flag: boolean;
        let expectedItemNum: number;

        // if it's not the first line in a numbered list, we match the number to the line above and check one extra time
        if (prevNum !== -1) {
            flag = false;
            expectedItemNum = prevNum + 1;
        } else {
            flag = true;
            expectedItemNum = currNum + 1;
            currLine++;
        }

        // TODO make the comparison string-based, to avoid scientific notations, also need to make it larger than Number

        while (currLine < linesInFile) {
            const lineText = editor.getLine(currLine);
            const match = lineText.match(PATTERN);

            if (match === null) {
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
            } else if (flag) {
                break; // ensure changes are made locally, not until the end of the block
            }

            flag = true;
            currLine++;
            expectedItemNum++;
        }

        return { changes, endIndex: currLine - 1 };
    }
}
