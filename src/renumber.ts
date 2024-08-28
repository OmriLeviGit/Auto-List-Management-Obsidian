import { Editor } from "obsidian";

function renumberLocally(editor: Editor, currLine: number) {
	let flag = true;
	if (currLine > 0) {
		if (getNumInList(currLine - 1, editor) !== -1) {
			currLine--;
			flag = false;
		}
	}

	let prevNumber = getNumInList(currLine, editor);

	while (true) {
		currLine++;
		const expectedNumber = prevNumber + 1;
		prevNumber = expectedNumber;

		const lineText = editor!.getLine(currLine);
		const match = lineText.match(/^(\d+)\. /);
		if (match === null) break;

		const actualNumber = parseInt(match[1]);

		if (expectedNumber === actualNumber) {
			if (flag == true) break;

			flag = true;
			continue;
		}

		const newLineText = lineText.replace(match[0], `${expectedNumber}. `);
		editor!.setLine(currLine, newLineText);
	}
}

function getNumInList(lineNum: number, editor: Editor): number {
	const lineText = editor!.getLine(lineNum);
	const match = lineText.match(/^(\d+)\. /);
	return match == undefined ? -1 : parseInt(match[1]);
}

export { renumberLocally, getNumInList };

/*
export default class ListRenumberer {
	constructor(private editor: Editor) {}

	public renumberLocally() {
		let currLine = this.editor.getCursor().line;
		if (currLine == undefined) return;
		if (this.getNumInList(currLine) === -1) return; // if not part of a numbered list, there's no need to renumber

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
		// while (currLine < tx.lineCount()) {
		//     currLine++;
		//     const expectedNumber = prevNumber + 1;
		//     const lineText = tx.getLine(currLine);
		//     const match = lineText.match(/^(\d+)\. /);

		//     if (match === null) {
		//         break;
		//     }

		//     const actualNumber = parseInt(match[1]);

		//     if (expectedNumber === actualNumber) {
		//         if (flag) {
		//             break;
		//         }
		//         flag = true;
		//         prevNumber = actualNumber;
		//     } else {
		//         const newLineText = lineText.replace(match[0], `${expectedNumber}. `);
		//         tx.setLine(currLine, newLineText);
		//         prevNumber = expectedNumber;
		//     }
		// }
	}

	// find if line starts with a num
	public getNumInList(lineNum: number): number {
		const lineText = this.editor!.getLine(lineNum);
		const match = lineText.match(/^(\d+)\. /);
		return match == undefined ? -1 : parseInt(match[1]);
	}
}
public findStartingIndex(currLineIndex: number) {
	if (currLineIndex == 0) return 0;

	let prevIndex = currLineIndex - 1;
	while (this.getNumInList(prevIndex) > 0) {
		prevIndex--;
	}
	return prevIndex + 1;
}
*/
