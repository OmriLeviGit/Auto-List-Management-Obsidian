import { Editor, EditorPosition } from "obsidian";
import { getLineInfo } from "./utils";
import SettingsManager from "./SettingsManager";

function reorder(editor: Editor, lineNum: number) {
    const info = getLineInfo(editor.getLine(lineNum)); // TODO make sure is not < 0
    let originalPos = editor.getCursor(); // TODO better cursor pos elsewhere

    if (editor.getLine(lineNum + 1).length < editor.getLine(lineNum).length) {
        const pos2: EditorPosition = { line: lineNum, ch: editor.getLine(lineNum + 1).length };
        originalPos = pos2;
    }
    // TODO better cursor pos elsewhere

    if (!info.isCheckbox || info.isChecked === false || originalPos.ch < info.textIndex) {
        console.log(`out ${lineNum}`);
        return;
    }

    const endIndex = getCheckboxEndIndex(editor, lineNum);

    if (endIndex !== undefined) {
        insert(editor, lineNum, endIndex);
    }

    editor.setCursor(originalPos);
}

function insert(editor: Editor, line1: number, line2: number) {
    const text1 = editor.getLine(line1);

    const pos1: EditorPosition = { line: line1, ch: 0 };
    const pos2: EditorPosition = { line: line2, ch: 0 };

    if (editor.lastLine() < line2) {
        editor.replaceRange("\n" + text1, pos2, pos2);
    } else {
        editor.replaceRange(text1 + "\n", pos2, pos2);
    }

    editor.replaceRange("", pos1, { line: line1 + 1, ch: 0 });
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
    let isPartOfCheckedSequence = lineInfo.isChecked;
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

        // if sort to bottom or found another unchecked box, the list of checked items must be below
        if (sortToBottom || !nextLineInfo.isChecked) {
            lastUncheckedIndex = index;
            isPartOfCheckedSequence = false;
        } else {
            if (nextLineInfo.isChecked && !isPartOfCheckedSequence) {
                lastUncheckedIndex = index;
                isPartOfCheckedSequence = true;
            }
        }

        index++;
    }

    return lastUncheckedIndex + 1;
}

export { reorder, getCheckboxEndIndex };
