import { Editor, EditorChange } from "obsidian";
import { getListStart, getLineInfo, getPrevItemIndex } from "./utils";
import { ChangeResult, LineInfo, PendingChanges, Range } from "./types";
import SettingsManager from "./SettingsManager";

// responsible for all renumbering actions
export default class Renumberer {
    renumber(editor: Editor, start: number, limit?: number) {
        let pendingChanges;

        if (limit !== undefined) {
            pendingChanges = this.renumberAllListsInRange(editor, start, limit);
        } else {
            pendingChanges = this.renumberAtIndex(editor, start);
        }

        this.applyChangesToEditor(editor, pendingChanges.changes);
        return pendingChanges.endIndex;
    }

    // renumbers all numbered lists in specified range
    private renumberAllListsInRange = (editor: Editor, start: number, limit: number): PendingChanges => {
        const isInvalidRange = start < 0 || editor.lastLine() + 1 < limit || limit < start;
        const newChanges: EditorChange[] = [];
        let i = start;

        if (isInvalidRange) {
            console.debug(
                `renumbering range is invalid with index=${start}, limit=${limit}. editor.lastLine()=${editor.lastLine()}`
            );

            return { changes: newChanges, endIndex: i };
        }

        for (; i < limit; i++) {
            const line = editor.getLine(i);

            if (line === undefined) {
                continue;
            }

            const { number } = getLineInfo(line);

            if (number === undefined) {
                continue;
            }

            const startIndex = getListStart(editor, i);

            if (startIndex !== undefined) {
                const pendingChanges = this.renumberAtIndex(editor, startIndex, false);

                if (pendingChanges) {
                    newChanges.push(...pendingChanges.changes);
                    i = pendingChanges.endIndex;
                }
            }
        }

        return { changes: newChanges, endIndex: i };
    };

    // bfs where indents == junctions
    private renumberAtIndex(editor: Editor, index: number, isLocal = true): PendingChanges {
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
                num = isStartFromOne ? 1 : info.number; // is the first item number in the list
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
            firstMatchInSuccession = true; // if no match was found, set the flag to true, so two matches in a row could be detected

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
