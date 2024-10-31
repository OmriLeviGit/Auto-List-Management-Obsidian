import { Editor } from "obsidian";
import { getLineInfo } from "./utils";

// keeps track of the previous number in numbered list for each offset
export default class IndentTracker {
    private stack: (number | undefined)[];
    private lastStackIndex: number;

    // builds the stack from the beginning of a numbered list, to the current line
    constructor(editor: Editor, currLine: number) {
        this.stack = [];

        if (currLine < 0) return;

        const offset = getLineInfo(editor.getLine(currLine)).spaceIndent;

        let prevIndex = currLine - 1;
        while (prevIndex > 0) {
            const prevOffset = getLineInfo(editor.getLine(currLine)).spaceIndent;
            if (prevOffset <= offset) {
                break;
            }
            prevIndex--;
        }

        for (let i = Math.max(prevIndex, 0); i < currLine; i++) {
            this.insert(editor.getLine(i));
        }

        this.lastStackIndex = this.stack.length - 1;
        //console.debug("stack after creation: ", this.stack);
    }

    get(): (number | undefined)[] {
        return this.stack;
    }

    // inserts a line to the stack, ensuring its the last one each time. items in higher indices do not affect lower ones.
    insert(textLine: string) {
        const info = getLineInfo(textLine);
        this.lastStackIndex = info.spaceIndent;

        this.stack[this.lastStackIndex] = info.number; // undefined means no numbered list in that offset
        this.stack.length = this.lastStackIndex + 1;
        //console.debug("stack after insertion: ", this.stack, "last index: ", this.lastStackIndex);
    }
}
