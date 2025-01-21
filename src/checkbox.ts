import { Editor, EditorPosition } from "obsidian";
import { getLineInfo } from "./utils";
import { LineInfo } from "./types";
import SettingsManager from "./SettingsManager";

function reorder(editor: Editor, lineNum: number) {
    console.log("reorder");
    const info = getLineInfo(editor.getLine(lineNum)); // TODO make sure is not < 0

    if (editor.getLine(lineNum + 1).length < editor.getLine(lineNum).length) {
        const pos2: EditorPosition = { line: lineNum, ch: editor.getLine(lineNum + 1).length };
    }

    console.log(info.isChecked, lineNum);
    if (info.isChecked === undefined || info.isChecked === false) {
        return;
    }

    const endIndex = getCheckboxEndIndex(editor, lineNum);

    if (endIndex !== undefined) {
        insert(editor, lineNum, endIndex);
    }
}

function insert(editor: Editor, line: number, atIndex: number) {
    const text1 = editor.getLine(line);

    const pos1: EditorPosition = { line: line, ch: 0 };
    const pos2: EditorPosition = { line: atIndex, ch: 0 };

    if (editor.lastLine() < atIndex) {
        editor.replaceRange("\n" + text1, pos2, pos2);
    } else {
        editor.replaceRange(text1 + "\n", pos2, pos2);
    }

    editor.replaceRange("", pos1, { line: line + 1, ch: 0 });
}

// gets the index of the last item in a numbered list
function getCheckboxEndIndex(editor: Editor, startIndex: number): number | undefined {
    if (startIndex < 0 || editor.lastLine() < startIndex) {
        return undefined;
    }

    const sortToBottom = SettingsManager.getInstance().getSortCheckboxesBottom();

    const startInfo = getLineInfo(editor.getLine(startIndex));

    if (startInfo.isChecked === undefined) {
        return undefined;
    }

    const startContainsNumber = startInfo.number !== undefined;

    const shouldBreak = (currentInfo: LineInfo): boolean => {
        const currentContainsNumber = currentInfo.number !== undefined;
        const hasSameNumberStatus = currentContainsNumber === startContainsNumber;
        const hasSameIndentation = currentInfo.spaceIndent === startInfo.spaceIndent;

        if (!hasSameNumberStatus || !hasSameIndentation) {
            return true;
        }

        return sortToBottom ? currentInfo.isChecked === undefined : currentInfo.isChecked !== false;
    };

    let index = startIndex;
    while (index <= editor.lastLine()) {
        const currentInfo = getLineInfo(editor.getLine(index));

        if (shouldBreak(currentInfo)) {
            break;
        }

        index++;
    }

    return index;
}

export { reorder, insert, getCheckboxEndIndex };
