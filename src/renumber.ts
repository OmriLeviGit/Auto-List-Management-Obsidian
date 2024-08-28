import { Editor } from "obsidian";
// TODO: change flag name
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

		const lineText = editor!.getLine(currLine);
		const match = lineText.match(/^(\d+)\. /);
		if (match === null) break;

		const actualItemNum = parseInt(match[1]);

		// changes are made locally, not until the end of the list
		if (expectedItemNum === actualItemNum) {
			if (flag == true) break;

			flag = true;
			continue;
		}

		prevItemNum = expectedItemNum;
		const newLineText = lineText.replace(match[0], `${expectedItemNum}. `);
		editor!.setLine(currLine, newLineText);
	}
}

function getItemNum(lineNum: number, editor: Editor): number {
	const lineText = editor!.getLine(lineNum);
	const match = lineText.match(/^(\d+)\. /);
	return match == undefined ? -1 : parseInt(match[1]);
}

export { renumberLocally, getItemNum };

/*
public findStartingIndex(currLineIndex: number) {
	if (currLineIndex == 0) return 0;

	let prevIndex = currLineIndex - 1;
	while (this.getNumInList(prevIndex) > 0) {
		prevIndex--;
	}
	return prevIndex + 1;
}
*/
