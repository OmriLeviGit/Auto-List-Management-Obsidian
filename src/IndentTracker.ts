import { Editor } from "obsidian";
import { getLineInfo, getPrevItemIndex, isFirstInNumberedList } from "./utils";

// keeps track of the previous number in numbered list for each offset
export default class IndentTracker {
    private stack: (number | undefined)[];
    private lastStackIndex: number;

    // builds the stack from the beginning of a numbered list, to the current line
    constructor(editor: Editor, currLine: number) {
        this.stack = [];

        const prevIndex = getPrevItemIndex(editor, currLine);
        if (prevIndex === undefined) {
            return;
        }

        for (let i = Math.max(prevIndex, 0); i < currLine; i++) {
            this.insert(editor.getLine(i));
        }

        this.lastStackIndex = this.stack.length - 1;

        // if (isFirstInNumberedList(editor, prevIndex)) {
        //     this.stack[getLineInfo(editor.getLine(prevIndex)).spaceIndent] = 1;
        // }

        // console.log("stack after creation: ", this.stack);
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
