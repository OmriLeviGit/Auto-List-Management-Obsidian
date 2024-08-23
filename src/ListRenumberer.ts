import { Editor } from "obsidian";
export class ListRenumberer {
	constructor(private editor: Editor) {}

	public renumberLocally() {
		let currLine = this.editor.getCursor().line;
		if (currLine == undefined) return;
		if (this.getNumInList(currLine) === -1) return; // if not part of a numbered list, there's no need to renumber

		// add transaction

		// if currLine != 0, renumber starting the previous line
		let flag = true;
		if (currLine > 0) {
			if (this.getNumInList(currLine - 1) !== -1) {
				currLine--;
				flag = false;
			}
		}

		let prevNumber = this.getNumInList(currLine);

		while (true) {
			currLine++;
			const expectedNumber = prevNumber + 1;
			prevNumber = expectedNumber;

			const lineText = this.editor!.getLine(currLine);
			const match = lineText.match(/^(\d+)\. /);
			if (match === null) break;

			const actualNumber = parseInt(match[1]);

			if (expectedNumber === actualNumber) {
				if (flag == true) break;

				flag = true;
				continue;
			}

			const newLineText = lineText.replace(match[0], `${expectedNumber}. `);
			this.editor!.setLine(currLine, newLineText);
		}
	}

	// find if line starts with a num
	public getNumInList(lineNum: number): number {
		const lineText = this.editor!.getLine(lineNum);
		const match = lineText.match(/^(\d+)\. /);
		return match == undefined ? -1 : parseInt(match[1]);
	}
}

// public findStartingIndex(currLineIndex: number) {
// 	if (currLineIndex == 0) return 0;

// 	let prevIndex = currLineIndex - 1;
// 	while (this.getNumInList(prevIndex) > 0) {
// 		prevIndex--;
// 	}
// 	return prevIndex + 1;
// }
