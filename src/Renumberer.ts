import { Editor, EditorChange } from "obsidian";
import { getListStart, getLineInfo, getPrevItemIndex } from "./utils";
import { ChangeResult, LineInfo, PendingChanges } from "./types";
import SettingsManager from "./SettingsManager";

// responsible for all renumbering actions
export default class Renumberer {
    renumberAtIndex(editor: Editor, index: number) {
        const pendingChanges = this.renumber(editor, index);
        this.applyChangesToEditor(editor, pendingChanges.changes);
        return pendingChanges.endIndex;
    }

    // renumbers all numbered lists in specified range
    renumberAllInRange = (editor: Editor, index: number, limit: number) => {
        if (index < 0 || editor.lastLine() + 1 < limit || limit < index) {
            console.debug(
                `renumbering range is invalid with index=${index}, limit=${limit}. editor.lastLine()=${editor.lastLine()}`
            );
            return;
        }

        const newChanges: EditorChange[] = [];
        while (index < limit) {
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
    renumberEntireList(editor: Editor, index: number): PendingChanges | undefined {
        const startIndex = getListStart(editor, index);

        if (startIndex !== undefined) {
            return this.renumber(editor, startIndex, false);
        }

        return undefined;
    }

    // bfs where indents == junctions
    public renumber(editor: Editor, index: number, isLocal = true): PendingChanges {
        const changes: EditorChange[] = [];
        const queue = [index]; // contains indices to revisit
        let endIndex = index;

        if (index > 0) {
            queue.unshift(index - 1);
        }

        if (index < editor.lastLine()) {
            queue.push(index + 1);
        }

        const visited: number[] = []; // visited[spaceIndent] == lastVisitedIndex
        const firstSpaceIndent = getLineInfo(editor.getLine(queue[0])).spaceIndent;
        visited[firstSpaceIndent] = queue[0];

        while (0 < queue.length) {
            const indexToRenumber = queue.shift()!;
            if (indexToRenumber > editor.lastLine()) {
                break;
            }
            const info = getLineInfo(editor.getLine(indexToRenumber));
            if (indexToRenumber < visited[info.spaceIndent]) {
                // if this indentation has been visited and its this index had already been renumbered
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
            queue.push(...changeResult.revisitIndices);

            visited[info.spaceIndent] = changeResult.endIndex;
            endIndex = Math.max(endIndex, changeResult.endIndex);
        }

        return { changes, endIndex };
    }

    // performs the calculation itself
    private generateChanges(
        editor: Editor,
        firstIndex: number,
        currentNumber: number,
        firstIndent: number,
        isLocal = true
    ): ChangeResult {
        const revisitIndices: number[] = [];
        const changes: EditorChange[] = [];
        let firstMatchInSuccession = true;

        if (firstIndex < 0) {
            return { changes, revisitIndices, endIndex: firstIndex };
        }

        let currentIndex = firstIndex;
        let indexToRevisit = true; // true if the first line with higher indent needs to be revisited, false o.w.
        for (; currentIndex <= editor.lastLine(); currentIndex++) {
            const lineText = editor.getLine(currentIndex);
            const info = getLineInfo(lineText);

            // if on a higher indent, add it's first index to the the queue to revisit
            if (info.spaceIndent > firstIndent) {
                if (indexToRevisit) {
                    revisitIndices.push(currentIndex);
                    indexToRevisit = false;
                }
                continue;
            }

            // if on a lower indent, add it as a junction and break
            if (info.spaceIndent < firstIndent) {
                revisitIndices.push(currentIndex);
                break;
            }

            indexToRevisit = true;

            // if not a number or on a lower indent
            if (info.number === undefined) {
                break;
            }

            // if already equal to the current line, no need to update
            if (info.number === currentNumber) {
                // if isLocal and there are 2 matches in a row, break
                if (isLocal && firstMatchInSuccession === false) {
                    currentIndex += 1;
                    break;
                }
                firstMatchInSuccession = false;

                currentNumber++;
                continue;
            }
            firstMatchInSuccession = true;

            const updatedLine = this.getUpdatedLine(currentIndex, currentNumber, info, lineText);
            changes.push(updatedLine);
            currentNumber++;
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
