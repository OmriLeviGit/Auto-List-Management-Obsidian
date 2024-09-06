import { Editor, EditorChange } from "obsidian";
import { getItemNum, PATTERN } from "./utils";

function renumberLocally(editor: Editor, currLine: number): boolean {
	console.log("renmumber is called");

	let editRes = false;
	const currNum = getItemNum(editor, currLine);

	if (currNum === -1) {
		return editRes; // not a part of a numbered list
	}

	const lineCount = editor.lastLine() + 1;
	const changes: EditorChange[] = [];
	let prevNum = getItemNum(editor, currLine - 1);

	let check: boolean;
	let expectedItemNum: number;

	// if it's the first line in a numbered list
	if (prevNum === -1) {
		check = true;
		expectedItemNum = currNum + 1;
		currLine++;
	} else {
		check = false;
		expectedItemNum = prevNum + 1;
	}

	while (currLine < lineCount) {
		const lineText = editor.getLine(currLine);
		const match = lineText.match(PATTERN);
		if (match === null) break;

		const actualItemNum = parseInt(match[1]);
		if (expectedItemNum !== actualItemNum) {
			const newLineText = lineText.replace(match[0], `${expectedItemNum}. `);
			changes.push({
				from: { line: currLine, ch: 0 },
				to: { line: currLine, ch: lineText.length },
				text: newLineText,
			});

			editRes = true;
		} else if (check) {
			break; // Changes are made locally, not until the end of the block
		}

		check = true;
		currLine++;
		expectedItemNum++;
	}

	editor.transaction({ changes });

	return editRes;
}

export { renumberLocally };
