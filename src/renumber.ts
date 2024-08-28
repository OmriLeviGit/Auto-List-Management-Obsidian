import { Editor } from "obsidian";
// TODO: change flag name

const pattern = /^(\d+)\. /;

function renumberBlock(editor: Editor, currLine: number) {}

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
		const match = lineText.match(/^(\d+)\. /);

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

/*
function renumberLocally(editor: Editor, currLine: number) {
	const lastLine = editor.lastLine();

	let flag = true;
	if (currLine > 0) {
		if (getItemNum(currLine - 1, editor) !== -1) {
			currLine--;
			flag = false;
		}
	}

	let prevItemNum = getItemNum(currLine, editor);
	while (currLine < lastLine) {
		currLine++;
		const expectedItemNum = prevItemNum + 1;

		const lineText = editor.getLine(currLine);
		const match = lineText.match(/^(\d+)\. /);
		if (match === null) break;

		const actualItemNum = parseInt(match[1]);

		if (!flag) {
			flag = true;
			if (expectedItemNum === actualItemNum) {
				continue;
			}
		}

		if (expectedItemNum === actualItemNum) break; // changes are made locally, not until the end of the block

		prevItemNum = expectedItemNum;
		const newLineText = lineText.replace(match[0], `${expectedItemNum}. `);
		editor.setLine(currLine, newLineText);
	}
}
	*/

function getItemNum(lineNum: number, editor: Editor): number {
	const lineText = editor.getLine(lineNum);
	const match = lineText.match(pattern);
	return match == undefined ? -1 : parseInt(match[1]);
}

/*
public getBlockStart(currLineIndex: number) {
	if (currLineIndex == 0) return 0;

	let prevIndex = currLineIndex - 1;
	while (this.getNumInList(prevIndex) > 0) {
		prevIndex--;
	}
	return prevIndex + 1;
}
*/

export { renumberLocally, getItemNum };
