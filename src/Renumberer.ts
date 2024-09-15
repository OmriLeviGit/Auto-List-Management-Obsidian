import { Editor, EditorChange, EditorTransaction } from "obsidian";
import { getItemNum, getListStart, PATTERN } from "./utils";

export default class Renumberer {
    private linesToProcess: number[] = [];

    constructor() {}

    apply(editor: Editor, changes: EditorChange[]) {
        editor.transaction({ changes });
        const hasMadeChanges = changes.length > 0 ? true : false;
        changes.splice(0, changes.length);

        return hasMadeChanges;
    }

    applyLocal(editor: Editor, changes: EditorChange[]): boolean {
        if (this.linesToProcess.length === 0) {
            return false;
        }

        // renumber every line in the list
        let currLine: number | undefined;
        while ((currLine = this.linesToProcess.shift()) !== undefined) {
            changes.push(...this.renumberLocally(editor, currLine));
        }

        editor.transaction({ changes });
        const hasMadeChanges = changes.length > 0 ? true : false;
        changes.splice(0, changes.length);

        return hasMadeChanges;
    }

    renumberBlock(editor: Editor, currLine: number, startFrom: number = -1): EditorChange[] {
        const changes: EditorChange[] = [];
        const linesInFile = editor.lastLine() + 1;

        let currLineIndex = getListStart(editor, currLine);

        if (currLineIndex < 0) {
            return changes;
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

        return changes;
    }

    private renumberLocally(editor: Editor, currLine: number): EditorChange[] {
        const linesInFile = editor.lastLine() + 1;
        const currNum = getItemNum(editor, currLine);
        const changes: EditorChange[] = [];

        if (currNum === -1) {
            return changes; // not a part of a numbered list
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

        return changes;
    }

    addLines(...lines: (number | number[])[]) {
        const linesToProcess: number[] = lines
            .flat()
            .filter((line) => typeof line === "number" && line >= 0) as number[];
        this.linesToProcess.push(...linesToProcess);
    }

    getLines() {
        return this.linesToProcess;
    }
}
