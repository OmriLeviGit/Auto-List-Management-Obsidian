import { Editor, EditorChange } from "obsidian";
import { getItemNum, PATTERN } from "./utils";

function renumberLocally(editor: Editor, ...lines: (number | number[])[]): boolean {
    console.log("renumber locally is called with: ", lines);
    const linesToProcess: number[] = lines.flat().filter((line) => typeof line === "number") as number[];

    if (linesToProcess.length === 0) {
        return false;
    }

    const changes: EditorChange[] = [];
    const lineCount = editor.lastLine() + 1;

    // renumber every line in the list
    let currLine: number | undefined;
    while ((currLine = linesToProcess.shift()) !== undefined) {
        const currNum = getItemNum(editor, currLine);

        if (currNum === -1) {
            return false; // not a part of a numbered list
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

        // renumber as long as
        while (currLine < lineCount) {
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
                break; // make sure changes are made locally, not until the end of the block
            }

            flag = true;
            currLine++;
            expectedItemNum++;
        }
    }

    console.log("@lines left in list: ", linesToProcess.length);

    editor.transaction({ changes });

    return changes.length > 0 ? true : false;
}

export { renumberLocally };
