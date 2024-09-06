import { Editor } from "obsidian";
import { getItemNum, PATTERN } from "./utils";
import { renumberLocally } from "./renumberLocally";

type TextModificationResult = { modifiedText: string; newIndex: number };

export default class PasteHandler {
	private baseIndex: number;
	private newIndex: number | undefined;

	handlePaste(evt: ClipboardEvent, editor: Editor) {
		if (evt.defaultPrevented) {
			return;
		}
		evt.preventDefault();

		this.baseIndex = editor.listSelections()[0].head.line;
		const pasteToggle = true; // get from the settings

		const textFromClipboard = evt.clipboardData?.getData("text");

		if (!textFromClipboard) {
			return;
		}

		let modifiedText = textFromClipboard;

		if (pasteToggle) {
			const result = this.modifyText(textFromClipboard, editor);
			if (result) {
				modifiedText = result.modifiedText;
				this.newIndex = result.newIndex;
			}
		}

		editor.replaceSelection(modifiedText);
	}

	public renumberAfterPaste(editor: Editor) {
		// TODO get rid of one of them
		renumberLocally(editor, this.baseIndex - 1);
		renumberLocally(editor, this.baseIndex);

		if (this.newIndex !== undefined && this.newIndex !== this.baseIndex) {
			renumberLocally(editor, this.newIndex);
		}
	}

	modifyText(pastedText: string, editor: Editor): TextModificationResult | undefined {
		const lines = pastedText.split("\n");
		const baseIndex = editor.getCursor().line;
		const offset = this.getTextOffset(lines);

		if (offset < 0) {
			return undefined;
		}

		const matchFound = lines[offset].match(PATTERN);

		let firstItem = getItemNum(editor, baseIndex);
		firstItem = firstItem === -1 ? getItemNum(editor, baseIndex + 1) : firstItem;

		if (!matchFound || firstItem === -1) {
			return undefined;
		}

		const modifiedText = pastedText.replace(matchFound[0], `${firstItem}. `);
		const newIndex = baseIndex + offset;

		return { modifiedText, newIndex };
	}

	/*
	console.log("cursor was at index:", baseIndex);
	console.log("the starting value that is required: ", firstItem);
	console.log("@@@", newText);
	console.log("need to change the value of line: ", offset, "in the copied text, which wil be the new start");
	console.log("new list global start index: ", newIndex);
	console.log("in the new index:", editor.getLine(newIndex));
*/

	getTextOffset(lines: string[]): number {
		let offset = -1;
		for (let i = lines.length - 1; i >= 0; i--) {
			if (!lines[i].match(PATTERN)) {
				break;
			}
			offset = i;
		}
		return offset;
	}
}
