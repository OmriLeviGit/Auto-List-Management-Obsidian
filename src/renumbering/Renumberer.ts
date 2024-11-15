import { Editor, EditorChange } from "obsidian";
import { getListStart, getLineInfo } from "../utils";
import { RenumberingStrategy, PendingChanges } from "../types";

// responsible for all renumbering actions
export default class Renumberer {
    private strategy: RenumberingStrategy;

    constructor(strategy: RenumberingStrategy) {
        this.strategy = strategy;
    }

    setStrategy(strategy: RenumberingStrategy) {
        this.strategy = strategy;
    }

    renumber(editor: Editor, currLine: number) {
        const changes = this.strategy.renumber(editor, currLine).changes;
        if (changes.length > 0) {
            this.applyChangesToEditor(editor, changes);
        }
    }

    // renumbers the list at cursor location from start to end
    listAtCursor = (editor: Editor) => {
        const { anchor, head } = editor.listSelections()[0];
        const currLine = Math.min(anchor.line, head.line);
        this.applyChangesToEditor(editor, this.renumberEntireList(editor, currLine).changes);
    };

    // renumbers all numbered lists in specified range
    allListsInRange = (editor: Editor, index: number, endIndex: number) => {
        const changes: EditorChange[] = [];
        while (index <= endIndex) {
            const line = editor.getLine(index);
            if (line) {
                const { number } = getLineInfo(line);
                if (number) {
                    const newChanges = this.renumberEntireList(editor, index);

                    if (newChanges.endIndex !== undefined) {
                        changes.push(...newChanges.changes);
                        index = newChanges.endIndex;
                    }
                }
            }

            index++;
        }

        this.applyChangesToEditor(editor, changes);
    };

    // updates a numbered list from start to end
    private renumberEntireList(editor: Editor, index: number): PendingChanges {
        const startIndex = getListStart(editor, index);

        if (startIndex === undefined) {
            return { changes: [], endIndex: undefined }; // not a part of a numbered list
        }

        return this.strategy.renumber(editor, startIndex, false);
    }

    private applyChangesToEditor(editor: Editor, changes: EditorChange[]) {
        if (changes.length > 0) {
            editor.transaction({ changes });
        }
    }
}
