import { Editor } from "obsidian";
import { getLineInfo } from "./utils";

export default class Stack {
    private stack: (number | undefined)[];

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

        console.debug("stack after creation: ", this.stack);
    }

    get(): (number | undefined)[] {
        return this.stack;
    }

    peek(): number | undefined {
        return this.stack[this.stack.length - 1];
    }

    setLastValue(value: number) {
        this.stack[this.stack.length - 1] = value;
    }

    insert(textLine: string) {
        const info = getLineInfo(textLine);
        const firstIndex = info.spaces;

        this.stack[firstIndex] = info.number; // undefined means no numbered list in that offset
        this.stack.length = firstIndex + 1;
        console.debug("stack after insertion: ", this.stack);

        return firstIndex;
    }

    private findNonSpaceIndex(line: string): number {
        let i = 0;
        const length = line.length;
        while (i < length && (line[i] === " " || line[i] === "\t")) i++;
        return i;
    }
}
