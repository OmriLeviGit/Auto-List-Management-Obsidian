import { Editor } from "obsidian";

const PATTERN = /^(\d+)\. /;

function getItemNum(lineNum: number, editor: Editor): number {
	const lineText = editor.getLine(lineNum);
	const match = lineText.match(PATTERN);
	return match == undefined ? -1 : parseInt(match[1]);
}

function getBlockStart(currLineIndex: number) {
	if (currLineIndex == 0) return 0;

	let prevIndex = currLineIndex - 1;
	while (this.getNumInList(prevIndex) > 0) {
		prevIndex--;
	}
	return prevIndex + 1;
}

export { getItemNum, getBlockStart, PATTERN };
