import { Editor } from "obsidian";
import { getLineInfo } from "./utils";

function reorder(editor: Editor, lineNum: number) {
    const info = getLineInfo(editor.getLine(lineNum)); // TODO make sure is not < 0
    if (!info.isCheckBox) {
        return;
    }

    const endIndex = getCheckedEndIndex(editor, lineNum);

    if (info.isChecked == false) {
        // swap()
    }
}

// gets the index of the last item in a numbered list
function getCheckedEndIndex(editor: Editor, currLineIndex: number): number | undefined {
    if (currLineIndex < 0 || editor.lastLine() < currLineIndex) {
        return undefined;
    }

    const currInfo = getLineInfo(editor.getLine(currLineIndex));
    if (currInfo.number === undefined && currInfo.isCheckBox == false) {
        return undefined;
    }

    let nextIndex = currLineIndex + 1;

    while (nextIndex <= editor.lastLine()) {
        const info = getLineInfo(editor.getLine(nextIndex));
        if (info.number === undefined || info.isCheckBox === false || info.spaceIndent < currInfo.spaceIndent) {
            break;
        }
        nextIndex++;
    }

    return nextIndex - 1;
}

export { reorder, getCheckedEndIndex };
