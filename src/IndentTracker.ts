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
        const currSpaceOffset = getLineInfo(editor.getLine(currLine)).spaceIndent;

        let prevIndex = currLine - 1;
        let prevSpaceOffset: number | undefined = undefined;
        for (; prevIndex >= 0; prevIndex--) {
            prevSpaceOffset = getLineInfo(editor.getLine(prevIndex)).spaceIndent;
            if (prevSpaceOffset === currSpaceOffset) {
                break;
            }
        }
        console.log("prev", prevIndex);
        for (let i = Math.max(prevIndex, 0); i < currLine; i++) {
            this.insert(editor.getLine(i));
        }

        this.lastStackIndex = this.stack.length - 1;
        console.debug("stack after creation: ", this.stack);
    }
    // constructor(editor: Editor, currLine: number) {
    //     this.stack = [];

    //     if (currLine < 0) return;
    //     const currSpaceOffset = getLineInfo(editor.getLine(currLine)).spaceIndent;

    //     let prevIndex = currLine - 1;
    //     console.log("line: ", editor.getLine(currLine), "line number", currLine, "currspaceoffset", currSpaceOffset);
    //     while (prevIndex > 0) {
    //         let prevSpaceOffset = getLineInfo(editor.getLine(prevIndex)).spaceIndent;
    //         console.log("prevline", editor.getLine(prevIndex), "prev space offset", prevSpaceOffset);
    //         if (prevSpaceOffset <= currSpaceOffset) {
    //             break;
    //         }
    //         prevIndex--;
    //     }

    //     console.log("out with prevIndex: ", prevIndex);

    //     for (let i = Math.max(prevIndex, 0); i < currLine; i++) {
    //         this.insert(editor.getLine(i));
    //         console.log("inserted: ", editor.getLine(i));
    //     }

    //     this.lastStackIndex = this.stack.length - 1;
    //     console.debug("stack after creation: ", this.stack);
    // }

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
