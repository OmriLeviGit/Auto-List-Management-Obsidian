import { PATTERN, getNumFromText } from "./utils";

export default class Stack {
    private stack: (number | undefined)[] = [undefined];

    constructor() {}
    get(): (number | undefined)[] {
        return this.stack;
    }

    insert(textLine: string) {
        const firstIndex = this.findNonSpaceIndex(textLine);

        this.stack.length = firstIndex;

        console.log("@@@ firstindex", firstIndex);
        const char = textLine[firstIndex];
        console.log("@@@ char", char);
        const slicedText = textLine.slice(firstIndex);
        console.log("@@@ textline", textLine);
        console.log("@@@ sliced", slicedText);

        if (!PATTERN.test(textLine.slice(firstIndex))) {
            this.stack[firstIndex] = undefined;
        } else {
            const res = getNumFromText(slicedText);
            console.log("@@@ res", res);
            this.stack[firstIndex] = res;
        }

        console.log("@@@ stack", this.stack);
    }

    private findNonSpaceIndex(line: string): number {
        let i = 0;
        const length = line.length;

        for (i = 0; i < length; i++) {
            if (line[i] !== " ") {
                break;
            }
        }

        return i;
    }
}
