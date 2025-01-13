import { Editor, EditorChange } from "obsidian";
import { getListStart, getLineInfo, getPrevItemIndex } from "./utils";
import { ChangeResult, LineInfo, PendingChanges } from "./types";
import SettingsManager from "./SettingsManager";

// responsible for all renumbering actions
export default class Renumberer {
    renumberAtIndex(editor: Editor, index: number) {
        const newChanges = this.renumber(editor, index).changes;
        this.applyChangesToEditor(editor, newChanges);
    }

    // renumbers the list at cursor location from start to end
    renumberAtCursor = (editor: Editor) => {
        const { anchor, head } = editor.listSelections()[0];
        const currLine = Math.min(anchor.line, head.line);
        const newChanges = this.renumberEntireList(editor, currLine)?.changes;

        if (newChanges !== undefined) {
            this.applyChangesToEditor(editor, newChanges);
        }
    };

    // renumbers all numbered lists in specified range
    renumberAllInRange = (editor: Editor, index: number, endIndex: number) => {
        const newChanges: EditorChange[] = [];
        while (index < endIndex) {
            const line = editor.getLine(index);
            if (line) {
                const { number } = getLineInfo(line);
                if (number) {
                    const pendingChanges = this.renumberEntireList(editor, index);

                    if (pendingChanges !== undefined) {
                        newChanges.push(...pendingChanges.changes);
                        index = pendingChanges.endIndex;
                    }
                }
            }

            index++;
        }
        this.applyChangesToEditor(editor, newChanges);
    };

    // updates a numbered list from start to end
    private renumberEntireList(editor: Editor, index: number): PendingChanges | undefined {
        const startIndex = getListStart(editor, index);

        if (startIndex !== undefined) {
            return this.renumber(editor, startIndex, false);
        }

        return undefined;
    }

    private renumber(editor: Editor, index: number, isLocal = true): PendingChanges {
        const revisitIndices = [index]; // contains indices to revisit
        const changes: EditorChange[] = [];

        if (index > 0) {
            revisitIndices.unshift(index - 1);
        }

        if (index < editor.lastLine()) {
            revisitIndices.push(index + 1);
        }

        let lastCheckedIndex = revisitIndices[0]; // the last checked indent for that offset
        let lastCheckedOffset = undefined; // the last checked offset for that offset
        while (0 < revisitIndices.length) {
            const indexToRenumber = revisitIndices.shift()!;
            const info = getLineInfo(editor.getLine(indexToRenumber));
            if (indexToRenumber < lastCheckedIndex && info.spaceIndent === lastCheckedOffset) {
                continue;
            }

            if (info.number === undefined) {
                continue;
            }

            const prevIndex = getPrevItemIndex(editor, indexToRenumber);
            const isStartFromOne = SettingsManager.getInstance().getStartsFromOne();

            let num: number;
            if (prevIndex === undefined) {
                num = isStartFromOne ? 1 : info.number; // is the item number in the list
            } else {
                num = getLineInfo(editor.getLine(prevIndex)).number! + 1;
            }

            const changeResult = this.generateChanges(editor, indexToRenumber, num, info.spaceIndent, isLocal);
            changes.push(...changeResult.changes);
            revisitIndices.push(...changeResult.revisitIndices);
            lastCheckedIndex = changeResult.endIndex;
            lastCheckedOffset = info.spaceIndent;
        }

        return { changes, endIndex: lastCheckedIndex };
    }

    // performs the calculation itself
    private generateChanges(
        editor: Editor,
        firstIndex: number,
        currentNumber: number,
        indent: number,
        isLocal = true
    ): ChangeResult {
        const revisitIndices: number[] = [];
        const changes: EditorChange[] = [];
        let isFirstChange = true;

        if (firstIndex < 0) {
            return { changes, revisitIndices, endIndex: firstIndex };
        }

        let currentIndex = firstIndex;
        let indexToRevisit = true; // true if the first line with higher indent needs to be revisited, false o.w.
        for (; currentIndex <= editor.lastLine(); currentIndex++) {
            const lineText = editor.getLine(currentIndex);
            const info = getLineInfo(lineText);

            // if on a higher indent, add it's first index to the the queue to revisit
            if (info.spaceIndent > indent) {
                if (indexToRevisit) {
                    revisitIndices.push(currentIndex);
                    indexToRevisit = false;
                }
                continue;
            } else {
                indexToRevisit = true;
            }

            // if not a number or on a lower indent
            if (info.number === undefined || info.spaceIndent < indent) {
                break;
            }

            // if is local, allow the current line's numbering to be already what it's supposed to be only once
            if (isLocal) {
                if (info.number === currentNumber) {
                    if (!isFirstChange) {
                        break;
                    }

                    isFirstChange = false;
                    currentNumber++;
                    continue;
                }
            }

            const updatedLine = this.getUpdatedLine(currentIndex, currentNumber, info, lineText);
            changes.push(updatedLine);

            currentNumber++;

            if (currentIndex !== firstIndex) {
                isFirstChange = false; // even if the first line is renumbered, dont stop on the next correctly numbered line
            }
        }

        return { changes, revisitIndices, endIndex: currentIndex };
    }

    private getUpdatedLine(index: number, expectedNum: number, info: LineInfo, text: string): EditorChange {
        const newText = `${text.slice(0, info.spaceCharsNum)}${expectedNum}. ${text.slice(info.textIndex)}`;
        const updatedLine = {
            from: { line: index, ch: 0 },
            to: { line: index, ch: text.length },
            text: newText,
        };
        return updatedLine;
    }

    private applyChangesToEditor(editor: Editor, changes: EditorChange[]) {
        if (changes.length > 0) {
            editor.transaction({ changes });
        }
    }
}
