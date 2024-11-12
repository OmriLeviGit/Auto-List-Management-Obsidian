// RenumberingUtils.ts
import { Editor, EditorChange } from "obsidian";
import IndentTracker from "./IndentTracker";
import { PendingChanges } from "../types";
import { getLineInfo } from "../utils";

// performs the calculation itself
export function generateChanges(
    editor: Editor,
    index: number,
    indentTracker: IndentTracker,
    isLocal = true
): PendingChanges {
    const changes: EditorChange[] = [];

    let firstChange = true;
    let prevSpaceIndent = getLineInfo(editor.getLine(index - 1)).spaceIndent;
    const endOfList = editor.lastLine() + 1;
    for (; index < endOfList; index++) {
        const text = editor.getLine(index);

        const { spaceIndent, spaceCharsNum, number: currNum, textIndex } = getLineInfo(editor.getLine(index));

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

        // console.log("currnum: ", currNum, "expected", expectedNum, "index", index);
        let newText = text;
        // if a change is required (expected != actual), push it to the changes list
        if (expectedNum !== undefined) {
            const isValidIndent = spaceIndent <= indentTracker.get().length;
            if (expectedNum !== currNum && isValidIndent) {
                newText = text.slice(0, spaceCharsNum) + expectedNum + ". " + text.slice(textIndex);
                changes.push({
                    from: { line: index, ch: 0 },
                    to: { line: index, ch: text.length },
                    text: newText,
                });
            } else if (isLocal && !firstChange && spaceIndent === 0) {
                break; // ensures changes are made locally, not until the end of the numbered list
            }
        }

        indentTracker.insert(newText);

        prevSpaceIndent = spaceIndent;
        firstChange = false;
    }

    return { changes, endIndex: index - 1 };
}
