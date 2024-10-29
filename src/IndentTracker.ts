import { Editor } from "obsidian";
import { getLineInfo } from "./utils";

export default class IndentTracker {
    private stack: (number | undefined)[];
    private lastStackIndex: number;

    constructor(editor: Editor, currLine: number) {
        this.stack = [];

        if (currLine < 0) return;

        const offset = this.findNonSpaceIndex(editor.getLine(currLine));

        let prevIndex = currLine - 1;
        while (prevIndex > 0) {
            const prevOffset = this.findNonSpaceIndex(editor.getLine(prevIndex));
            if (prevOffset <= offset) {
                break;
            }
            prevIndex--;
        }

        for (let i = Math.max(prevIndex, 0); i < currLine; i++) {
            this.insert(editor.getLine(i));
        }

        this.lastStackIndex = this.stack.length - 1;
        console.debug("stack after creation: ", this.stack);
    }

    get(): (number | undefined)[] {
        return this.stack;
    }

    setLastValue(value: number) {
        if (this.lastStackIndex > 0) {
            this.stack[this.lastStackIndex] = value;
        } else {
            console.debug("the stack is empty");
        }
    }

    insert(textLine: string) {
        const info = getLineInfo(textLine);
        this.lastStackIndex = info.spaces;

        this.stack[this.lastStackIndex] = info.number; // undefined means no numbered list in that offset
        this.stack.length = this.lastStackIndex + 1;
        console.debug("stack after insertion: ", this.stack, "last index: ", this.lastStackIndex);
    }

    private findNonSpaceIndex(line: string): number {
        let i = 0;
        const length = line.length;

        while (i < length && (line[i] === " " || line[i] === "\t")) i++;
        return i;
    }
}
