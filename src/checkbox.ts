import { Editor } from "obsidian";
import { getLineInfo } from "./utils";
import SettingsManager from "./SettingsManager";

function reorder(editor: Editor, lineNum: number) {
    const info = getLineInfo(editor.getLine(lineNum)); // TODO make sure is not < 0
    if (!info.isCheckbox) {
        return;
    }

    const endIndex = getCheckboxEndIndex(editor, lineNum);

    if (info.isChecked == false) {
        // swap()
    }
}

// gets the index of the last item in a numbered list
function getCheckboxEndIndex(editor: Editor, index: number): number | undefined {
    if (index < 0 || editor.lastLine() < index) {
        return undefined;
    }

    const sortToBottom = SettingsManager.getInstance().getSortCheckboxesBottom();

    const lineInfo = getLineInfo(editor.getLine(index));
    const lineHasNumber = lineInfo.number !== undefined;

    if (lineInfo.isCheckbox === false) {
        return undefined;
    }

    let lastUncheckedIndex = index;
    let firstItemChecked = true;
    while (index <= editor.lastLine()) {
        const nextLineInfo = getLineInfo(editor.getLine(index));
        // Check if both the current and next lines either both have numbers or both lack numbers
        const bothLinesHaveSameNumberStatus = (nextLineInfo.number !== undefined) === lineHasNumber;

        if (
            !nextLineInfo.isCheckbox ||
            !bothLinesHaveSameNumberStatus ||
            nextLineInfo.spaceIndent !== lineInfo.spaceIndent
        ) {
            break;
        }

        if (nextLineInfo.isChecked === false) {
            firstItemChecked = true;
        }

        if (sortToBottom) {
            lastUncheckedIndex = index;
        } else {
            if (nextLineInfo.isChecked && firstItemChecked === true) {
                lastUncheckedIndex = index;
                firstItemChecked = false;
            }
        }

        index++;
    }

    return lastUncheckedIndex + 1;
}

export { reorder, getCheckboxEndIndex };
