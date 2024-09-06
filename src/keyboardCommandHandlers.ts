import { Editor } from "obsidian";
import { getItemNum, PATTERN } from "./utils";

// bugs: copy and paste multi line, copy 1 numebred line alone, paste into the middle multi line
// its probably a problem with firstitemnumber
// check how does pasting into the middle of the line works

// renumebr first line and last line of the pasted content

type TextModificationResult = { modifiedText: string; newIndex: number };

function handleText(pastedText: string, editor: Editor): TextModificationResult | undefined {
	console.log("in handleText");
	const lines = pastedText.split("\n");
	const baseIndex = editor.getCursor().line;
	const offset = getTextOffset(lines);

	if (offset < 0) {
		return undefined;
	}
	const matchFound = lines[offset].match(PATTERN);

	let firstItem = getItemNum(editor, baseIndex);
	firstItem = firstItem === -1 ? getItemNum(editor, baseIndex + 1) : firstItem;

	console.log("first item: ", firstItem);

	if (!matchFound || firstItem === -1) {
		return undefined; // paste as usual
	}

	const modifiedText = pastedText.replace(matchFound[0], `${firstItem}. `);
	console.log("modified text:\n", modifiedText);
	const newIndex = baseIndex + offset;

	// console.log("cursor was at index:", baseIndex);
	// console.log("the starting value that is required: ", firstItem);
	// console.log("@@@", newText);
	// console.log("need to change the value of line: ", offset, "in the copied text, which wil be the new start");
	// console.log("new list global start index: ", newIndex);
	// console.log("in the new index:", editor.getLine(newIndex));

	return { modifiedText, newIndex };
}

function getTextOffset(lines: string[]): number {
	let offset = -1;
	for (let i = lines.length - 1; i >= 0; i--) {
		if (!lines[i].match(PATTERN)) {
			break;
		}
		offset = i;
	}
	return offset;
}

// connect to current editor
function handleUndo(event: KeyboardEvent) {
	// if ((event.ctrlKey || event.metaKey) && event.key === "z") {
	// 	if (this.isLastActionRenumber) {
	// 		console.log("last action: renumber");
	// 		this.currentEditor.undo();
	// 	}
	// 	console.log("last action: other");
	// }
}

export { handleText, handleUndo };
