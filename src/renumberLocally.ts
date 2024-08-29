import { Editor, EditorChange } from "obsidian";
import { getItemNum, PATTERN } from "./utils";

function renumberLocally(editor: Editor, currLine: number) {
	const lineCount = editor.lastLine();
	let changes: EditorChange[] = [];
	let checks; // gets a value of 1 if it's first line in a numbered list, else 2

	// If not the first line in a numbered list, start from the previous one
	const isFirstInList = currLine > 0 && getItemNum(editor, currLine - 1) !== -1;
	if (isFirstInList) {
		currLine--;
		checks = 2;
	} else {
		checks = 1;
	}

	let expectedItemNum = getItemNum(editor, currLine);

	while (currLine < lineCount) {
		currLine++;
		expectedItemNum++;

		const lineText = editor.getLine(currLine);
		const match = lineText.match(PATTERN);

		if (match === null) break;

		const actualItemNum = parseInt(match[1]);

		if (checks > 0) {
			checks--;
			if (expectedItemNum === actualItemNum) {
				continue;
			}
		}

		if (expectedItemNum === actualItemNum) break; // Changes are made locally, not until the end of the block

		const newLineText = lineText.replace(match[0], `${expectedItemNum}. `);

		changes.push({
			from: { line: currLine, ch: 0 },
			to: { line: currLine, ch: editor.getLine(currLine).length },
			text: newLineText,
		});
	}

	editor.transaction({ changes });
}

export { renumberLocally };
