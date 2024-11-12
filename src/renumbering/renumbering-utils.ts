// RenumberingUtils.ts
import { Editor, EditorChange } from "obsidian";
import IndentTracker from "./IndentTracker";
import { PendingChanges } from "../types";
import { getLineInfo } from "../utils";

// performs the calculation itself
export function generateChanges(
    editor: Editor,
    currLine: number,
    indentTracker: IndentTracker,
    isLocal = false
): PendingChanges {
    const changes: EditorChange[] = [];

    let firstChange = true;
    let prevSpaceIndent = getLineInfo(editor.getLine(currLine - 1)).spaceIndent;
    const endOfList = editor.lastLine() + 1;
    for (; currLine < endOfList; currLine++) {
        const text = editor.getLine(currLine);

        const { spaceIndent, spaceCharsNum, number: currNum, textIndex } = getLineInfo(editor.getLine(currLine));

        // console.log("tracker: ", indentTracker.get());
        // console.debug(
        //     `line: ${currLine}, spaceIndent: ${spaceIndent}, curr num: ${currNum}, text index: ${textIndex}`
        // );

        // make sure indented text does not stop the search
        if (currNum === undefined) {
            firstChange = false;
            if (prevSpaceIndent < spaceIndent) {
                indentTracker.insert(text);

                continue;
            }
            break;
        }

        const previousNum = indentTracker.get()[spaceIndent];
        const expectedNum = previousNum === undefined ? undefined : previousNum + 1;

        let newText = text;
        // if a change is required (expected != actual), push it to the changes list
        if (expectedNum !== undefined) {
            const isValidIndent = spaceIndent <= indentTracker.get().length;
            if (expectedNum !== currNum && isValidIndent) {
                newText = text.slice(0, spaceCharsNum) + expectedNum + ". " + text.slice(textIndex);
                changes.push({
                    from: { line: currLine, ch: 0 },
                    to: { line: currLine, ch: text.length },
                    text: newText,
                });
            } else if (isLocal && !firstChange && spaceIndent === 0) {
                break; // ensures changes are made locally, not until the end of the block
            }
        }

        indentTracker.insert(newText);

        prevSpaceIndent = spaceIndent;
        firstChange = false;
    }

    return { changes, endIndex: currLine - 1 };
}
