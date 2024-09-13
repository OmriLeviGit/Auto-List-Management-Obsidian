import { Editor } from "obsidian";
import { getItemNum, PATTERN } from "./utils";

type TextModificationResult = { modifiedText: string; newIndex: number };

export default class PasteHandler {
    modifyText(pastedText: string, editor: Editor): TextModificationResult | undefined {
        const { anchor, head } = editor.listSelections()[0];
        const baseIndex = Math.max(anchor.line, head.line);

        const lines = pastedText.split("\n");
        const offset = this.getTextOffset(lines);

        if (offset < 0) {
            return undefined;
        }

        const matchFound = lines[offset].match(PATTERN);

        let firstItem = getItemNum(editor, baseIndex);
        if (firstItem === -1) {
            firstItem = getItemNum(editor, baseIndex + 1);
        }

        if (!matchFound || firstItem === -1) {
            return undefined;
        }

        const modifiedText = pastedText.replace(matchFound[0], `${firstItem}. `);
        const newIndex = baseIndex + offset;

        return { modifiedText, newIndex };
    }

    /*
	console.log("cursor was at index:", baseIndex);
	console.log("the starting value that is required: ", firstItem);
	console.log("@@@", newText);
	console.log("need to change the value of line: ", offset, "in the copied text, which wil be the new start");
	console.log("new list global start index: ", newIndex);
	console.log("in the new index:", editor.getLine(newIndex));
*/

    modifyLineNum(editor: Editor, currLineIndex: number): string | undefined {
        if (currLineIndex < 0) {
            return;
        }

        const currLine = editor.getLine(currLineIndex);
        const match = currLine.match(PATTERN);

        if (match === null) {
            return;
        }

        const prevLineMatch = currLineIndex > 0 ? getItemNum(editor, currLineIndex - 1) : -1;
        const matchedNum = prevLineMatch > 0 ? prevLineMatch : getItemNum(editor, currLineIndex + 1);

        if (matchedNum < 0) {
            return;
        }

        const newLineText = currLine.replace(match[0], `${matchedNum}. `);

        return newLineText;
    }

    getTextOffset(lines: string[]): number {
        let offset = -1;
        for (let i = lines.length - 1; i >= 0; i--) {
            if (!lines[i].match(PATTERN)) {
                break;
            }
            offset = i;
        }
        return offset;
    }
}
