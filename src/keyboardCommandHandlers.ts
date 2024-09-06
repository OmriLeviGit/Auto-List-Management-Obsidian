import { Editor } from "obsidian";
import { getItemNum, PATTERN } from "./utils";

function handleText(pastedText: string | undefined, editor: Editor): string | undefined {
	if (pastedText === undefined) {
		return pastedText;
	}

	// bugs: copy and paste the same number into the same place, copy 1 numebred line alone
	// its probably a problem with firstitemnumber
	// check how does pasting into the middle of the line works

	const baseIndex = editor.getCursor().line;

	const lines = pastedText.split("\n");
	let offset = lines.length;
	let lastMatch: RegExpMatchArray | null = null;

	for (let i = lines.length - 1; i >= 0; i--) {
		const match = lines[i].match(PATTERN);
		if (!match) {
			break;
		}
		lastMatch = match;
		offset = i;
	}

	if (lastMatch === null) {
		console.log("no match found");
		// paste as usual
		return pastedText;
	}

	const firstItemNumber = getItemNum(editor, baseIndex + 1);
	console.log("cursor was at index:", baseIndex);
	console.log("the starting value that is required: ", firstItemNumber);

	const newText = pastedText.replace(lastMatch[0], `${firstItemNumber}. `);
	console.log("@@@", newText);

	const newIndex = baseIndex + offset;
	console.log("need to change the value of line: ", offset, "in the copied text, which wil be the new start");
	console.log("new list global start index: ", newIndex);

	return newText;
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
