import { Editor } from "obsidian";
import { getLineInfo, getPrevItemIndex, isFirstInNumberedList } from "../utils";

// keeps track of the previous number in numbered list for each offset
export default class IndentTracker {
    private stack: (number | undefined)[];
    private lastStackIndex: number;

    // builds the stack from the beginning of a numbered list, to the current line
    constructor(editor: Editor, index: number, startFromOne: boolean) {
        this.stack = [];

        if (index > editor.lastLine()) {
            return;
        }

        let prevIndex = getPrevItemIndex(editor, index);

        if (prevIndex === undefined) {
            this.insert(editor.getLine(index), startFromOne);
            return;
        }

        if (startFromOne) {
            if (isFirstInNumberedList(editor, prevIndex)) {
                this.insert(editor.getLine(prevIndex), startFromOne);
                prevIndex++;
            } else if (isFirstInNumberedList(editor, index)) {
                this.insert(editor.getLine(index), startFromOne);
                return;
            }
        }

        for (let i = prevIndex; i < index; i++) {
            this.insert(editor.getLine(i));
            // console.debug(`inserted i = ${i}, stack = ${this.stack}`);
        }

        this.lastStackIndex = this.stack.length - 1;

        // console.debug("stack after creation: ", this.stack);
    }

    // inserts a line to the stack, ensuring its the last one each time. items in higher indices do not affect lower ones.
    insert(textLine: string, startsFromOne: boolean = false) {
        const info = getLineInfo(textLine);
        this.lastStackIndex = info.spaceIndent;

        this.stack[this.lastStackIndex] = startsFromOne ? 1 : info.number; // undefined means no numbered list in that offset
        this.stack.length = this.lastStackIndex + 1;
        //console.debug("stack after insertion: ", this.stack, "last index: ", this.lastStackIndex);
    }

    get(): (number | undefined)[] {
        return this.stack;
    }
}
