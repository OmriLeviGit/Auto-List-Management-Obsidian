import { Editor } from "obsidian";
import { getItemNum, PATTERN } from "./utils";
import { renumberLocally } from "./renumberLocally";

type TextModificationResult = { modifiedText: string; newIndex: number };

export default class PasteHandler {
    private baseIndex: number | undefined;
    private newIndex: number | undefined;

    // sandwich doesnt work at the top:
    /*
61. asdfdsaasfvvvvvd
6454
fewf
1. asdfdsa3. asdfdsaf3v. asdfdsfafv
*/

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

    public renumberAfterPaste(editor: Editor) {
        // TODO check if these 2 are needed because the other listener might be enough
        // console.log("renumber after paste is called with base index: ", this.baseIndex);
        if (this.baseIndex === undefined) {
            return; // need to be called after pasting;
        }
        const first = renumberLocally(editor, this.baseIndex - 1);
        const second = renumberLocally(editor, this.baseIndex);

        if (first !== -1) {
            console.log("@@first", first, "index - 1 is: ", this.baseIndex - 1);
        }

        if (second !== -1) {
            console.log("@@second@@@", second, "index is: ", this.baseIndex);
        }

        if (this.newIndex !== undefined && this.newIndex !== this.baseIndex) {
            console.log("inside");
            renumberLocally(editor, this.newIndex);
        }

        this.reset();
    }

    private reset() {
        this.baseIndex = undefined;
        this.newIndex = undefined;
    }

    /*
	console.log("cursor was at index:", baseIndex);
	console.log("the starting value that is required: ", firstItem);
	console.log("@@@", newText);
	console.log("need to change the value of line: ", offset, "in the copied text, which wil be the new start");
	console.log("new list global start index: ", newIndex);
	console.log("in the new index:", editor.getLine(newIndex));
*/

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
