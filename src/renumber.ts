import { Editor } from "obsidian";
import { getItemNum, PATTERN } from "./utils";

function renumberLocally(editor: Editor, currLine: number) {
	const lastLine = editor.lastLine();

	// If not the starting line, start from the previous one
	if (currLine > 0 && getItemNum(currLine - 1, editor) !== -1) {
		currLine--;
	}

	let prevItemNum = getItemNum(currLine, editor);
	let isFirstItem = true;

	while (currLine < lastLine) {
		currLine++;
		const expectedItemNum = prevItemNum + 1;
		const lineText = editor.getLine(currLine);
		const match = lineText.match(PATTERN);

		if (match === null) break;

		const actualItemNum = parseInt(match[1]);

		if (isFirstItem) {
			isFirstItem = false;
			if (expectedItemNum === actualItemNum) {
				continue;
			}
		}

		if (expectedItemNum === actualItemNum) break; // Changes are made locally, not until the end of the block

		prevItemNum = expectedItemNum;
		const newLineText = lineText.replace(match[0], `${expectedItemNum}. `);
		editor.setLine(currLine, newLineText);
	}
}

export { renumberLocally };
