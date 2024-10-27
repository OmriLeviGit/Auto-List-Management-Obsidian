import { Editor } from "obsidian";
import { PATTERN, getNumFromText } from "./utils";

export default class Stack {
    private stack: (number | undefined)[];

    constructor(editor: Editor, currLine: number) {
        this.stack = [];

        // console.log("curr line inside stack", currLine);
        if (currLine < 0) return;

        const offset = this.findNonSpaceIndex(editor.getLine(currLine));

        let prevIndex = currLine - 1;
        while (prevIndex > 0) {
            const prevOffset = this.findNonSpaceIndex(editor.getLine(prevIndex));
            console.log("previndex: ", prevIndex, "offset", prevOffset);
            if (prevOffset <= offset) {
                break;
            }
            prevIndex--;
        }

        for (let i = Math.max(prevIndex, 0); i < currLine; i++) {
            this.insert(editor.getLine(i));
            console.log(i);
        }

        // console.log("offset", offset, "\nprevIndex", prevIndex, "\n");
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
        const firstIndex = this.findNonSpaceIndex(textLine);

        // this.stack.length = firstIndex;

        const char = textLine[firstIndex];
        const slicedText = textLine.slice(firstIndex);
        // console.log("@@@ firstindex", firstIndex);
        // console.log("@@@ char", char);
        // console.log("@@@ textline", textLine);
        // console.log("@@@ sliced", slicedText);

        if (!PATTERN.test(textLine.slice(firstIndex))) {
            this.stack[firstIndex] = undefined;
            console.log("@@@ overriden", this.stack);
        } else {
            const res = getNumFromText(slicedText);
            console.log("@@@ res", res);
            this.stack[firstIndex] = res;
        }

        // console.log("@@@ stack", this.stack);
        // this.stack.length = firstIndex + 1;
        return firstIndex;
    }

    private findNonSpaceIndex(line: string): number {
        let i = 0;
        const length = line.length;
        while (i < length && (line[i] === " " || line[i] === "\t")) i++;
        return i;
    }
}
