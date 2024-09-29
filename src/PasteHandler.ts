import { Editor } from "obsidian";
import { getItemNum, PATTERN } from "./utils";

type TextModificationResult = { modifiedText: string; newIndex: number };

export default class PasteHandler {
    modifyText(editor: Editor, pastedText: string): TextModificationResult | undefined {
        const { anchor, head } = editor.listSelections()[0];
        const baseIndex = Math.max(anchor.line, head.line);

        const lines = pastedText.split("\n");
        const offset = this.getTextOffset(lines);

        console.log("inside: lines: ", lines, "offset", offset);

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
        console.log("inside: mod text: ", modifiedText);
        const newIndex = baseIndex + offset;

        return { modifiedText, newIndex };
    }

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
