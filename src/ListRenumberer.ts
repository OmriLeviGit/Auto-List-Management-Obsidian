import { Editor } from "obsidian";
export class ListRenumberer {
	constructor(private editor: Editor) {}

	public core() {
		// rename core
		const currLineIndex = this.editor?.getCursor()?.line; // get the line the cursor is at
		if (currLineIndex == undefined) return;
		if (this.getNumInList(currLineIndex) == -1) return; // check if is in a numbered list
		this.renumber(currLineIndex);
	}

	public renumber(startIndex: number) {
		// add transaction
		if (startIndex < 0) {
			console.log("error, line index must be non negative");
			return;
		}

		let flag = true;
		let currIndex = startIndex;

		if (currIndex > 0) {
			if (this.getNumInList(currIndex - 1) !== -1) {
				currIndex--;
				flag = false;
			}
		}

		let prevVal = this.getNumInList(currIndex);

		while (true) {
			currIndex++;
			const expectedVal = prevVal + 1;
			prevVal = expectedVal;

			const lineText = this.editor!.getLine(currIndex);
			const match = lineText.match(/^(\d+)\. /);
			if (match === null) break;

			const actualVal = parseInt(match[1]);

			if (expectedVal === actualVal) {
				if (flag == true) break;

				flag = true;
				continue;
			}

			const newLineText = lineText.replace(match[0], `${expectedVal}. `);
			this.editor!.setLine(currIndex, newLineText);
		}
	}

	public updateRangeFromOne(startIndex: number, endIndex: number) {
		const val = 1;

		for (let i: number = 0; i < endIndex - startIndex + 1; i++) {
			const currIndex = startIndex + i;
			const currVal = val + i;

			const lineText = this.editor!.getLine(currIndex);
			const match = lineText.match(/^(\d+)\. /);

			if (match == undefined) return;

			const newLineText = lineText.replace(match[0], `${currVal}. `);
			this.editor!.setLine(currIndex, newLineText);
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

	// find if line starts with a num
	public getNumInList(lineNum: number): number {
		const lineText = this.editor!.getLine(lineNum);
		const match = lineText.match(/^(\d+)\. /);
		return match == undefined ? -1 : parseInt(match[1]);
	}
}
