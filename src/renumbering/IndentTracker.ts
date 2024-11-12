import { Editor } from "obsidian";
import { getLineInfo, getPrevItemIndex, isFirstInNumberedList } from "../utils";
import SettingsManager from "../SettingsManager";

// keeps track of the previous number in numbered list for each offset
export default class IndentTracker {
    private stack: (number | undefined)[];
    private lastStackIndex: number;

    // builds the stack from the beginning of a numbered list, to the current line
    constructor(editor: Editor, currLine: number) {
        this.stack = [];

        let prevIndex = getPrevItemIndex(editor, currLine);
        if (prevIndex === undefined) {
            return;
        }

        if (SettingsManager.getInstance().getStartsFromOne() && isFirstInNumberedList(editor, prevIndex)) {
            this.insert(editor.getLine(prevIndex), 1); // set 1 to prev
            prevIndex++;
        }

        for (let i = prevIndex; i < currLine; i++) {
            this.insert(editor.getLine(i));
        }

        /*
        for (let i = Math.max(prevIndex, 0); i <= currLine; i++) {
            this.insert2(editor, i);
            console.log("in loop");
            // this.insert(editor.getLine(i));
        }
        */

        this.lastStackIndex = this.stack.length - 1;

        // console.log("stack after creation: ", this.stack);
    }

    /*
    constructor(editor: Editor, currLine: number) {
        this.stack = [];

        const prevIndex = getPrevItemIndex(editor, currLine);

        if (prevIndex === undefined) {
            return;
        }

        for (let i = Math.max(prevIndex, 0); i < currLine; i++) {
            this.insert(editor.getLine(i));
        }

        
        // for (let i = Math.max(prevIndex, 0); i <= currLine; i++) {
        //     this.insert2(editor, i);
        //     console.log("in loop");
        //     // this.insert(editor.getLine(i));
        // }
        

        this.lastStackIndex = this.stack.length - 1;

        const instance = SettingsManager.getInstance();

        if (instance.getStartsFromOne()) {
            if (isFirstInNumberedList(editor, prevIndex)) {
                this.stack[getLineInfo(editor.getLine(prevIndex)).spaceIndent] = 1;
            }
        }

        // console.log("stack after creation: ", this.stack);
    }
    */

    // inserts a line to the stack, ensuring its the last one each time. items in higher indices do not affect lower ones.
    insert(textLine: string, num: number | undefined = undefined) {
        const info = getLineInfo(textLine);
        this.lastStackIndex = info.spaceIndent;

        this.stack[this.lastStackIndex] = num === undefined ? info.number : num; // undefined means no numbered list in that offset
        this.stack.length = this.lastStackIndex + 1;
        //console.debug("stack after insertion: ", this.stack, "last index: ", this.lastStackIndex);
    }

    insert2(editor: Editor, line: number) {
        const info = getLineInfo(editor.getLine(line));
        this.lastStackIndex = info.spaceIndent;
        const manager = SettingsManager.getInstance();
        if (manager.getStartsFromOne()) {
            if (isFirstInNumberedList(editor, line)) {
                console.log("is first", line);
                this.stack[this.lastStackIndex] = 1; // undefined means no numbered list in that offset
                console.log("laststack", this.lastStackIndex, "stack: ", this.stack);
            } else {
                console.log("not first", line);
                this.stack[this.lastStackIndex] = info.number; // undefined means no numbered list in that offset
            }
        }
        // this.stack[this.lastStackIndex] = info.number; // undefined means no numbered list in that offset
        this.stack.length = this.lastStackIndex + 1;
        //console.debug("stack after insertion: ", this.stack, "last index: ", this.lastStackIndex);
    }

    get(): (number | undefined)[] {
        return this.stack;
    }
}
