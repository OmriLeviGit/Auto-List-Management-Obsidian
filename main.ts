import { Plugin, Editor } from "obsidian";
import { renumberLocally } from "src/renumberLocally";
import { getItemNum } from "./src/utils";

/*
for the readme:
how we deal with 0 and 000. (consistent with markdown)
not adding a renumber to the entire block because the observer is activating every character typed

TODO: bugs
splitting an existing numbered list using 'enter' sets the first item to 1
fix the tests

TODO: transaction:
[ ] support undo by listening, disabling action and redoing twice (make sure other plugins do not get triggered twice). redo is automatic.
[ ] work with copy and paste. when pasting before a list:
  if pasted into the beginning, the pasted should get the previous first number.
lsitening to undo is probably not possible, set as default and ask user to set it up, and check how it works with vim
TODO: spaces:
[ ] make sure numbers in sequence work with shift-enter which adds two spaces **add to readme
[ ] nested numbering
	3 spaces -- shift enter
	4 spaces == tab character -- indented (insert according to settings)
	other languages support

TODO: 3 core functionalities:
listener update, from current until line correctly numbered (togglable)
update the entire file (from the menu)
update selected (hot key)

TODO:
clone to a new dir and make sure a the script downloads all dependencies
update the package.json description, manifest, remove all logs etc, choose a name for the plugin
https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
*/

export default class RenumberList extends Plugin {
	private isProcessing: boolean = false;
	private currentEditor: Editor;
	private isLastActionRenumber = false;

	onload() {
		this.registerEvent(
			this.app.workspace.on("editor-change", (editor: Editor) => {
				// check on youtube if need to first remove other listeners, check if need to remove it in unload
				if (!this.isProcessing) {
					try {
						console.log("editor-change");
						this.isProcessing = true;
						this.currentEditor = editor;

						const currLine = editor.getCursor().line;
						if (currLine === undefined) return;

						if (getItemNum(editor, currLine) === -1) {
							return; // not a part of a numbered list
						}

						this.isLastActionRenumber = renumberLocally(editor, currLine);
					} finally {
						this.isProcessing = false;
					}
				}
			})
		);

		// 	// pasting support
		// 	this.registerEvent(
		// 		this.app.workspace.on("editor-paste", (event, editor: Editor) => {
		// 			const beforePaste = editor.getCursor().line; // bug when pasting something thats not a numbered list before a numbered list

		// 			const l = editor.getLine(beforePaste + 1);

		// 			const n = getItemNum(editor, beforePaste + 1);

		// 			console.log("n", n);

		// 			// console.log(beforePaste + 1, l);

		// 			const changeHandler = (editor: Editor) => {
		// 				renumberLocally(editor, beforePaste);
		// 				this.app.workspace.off("editor-change", changeHandler);
		// 			};

		// 			this.registerEvent(this.app.workspace.on("editor-change", changeHandler));
		// 		})
		// 	);

		// 	this.registerKeyDownListener();
		// }

		// onunload() {
		// 	console.log("RenumberList plugin unloaded");
		// 	window.removeEventListener("keydown", this.handleKeyDown);
		// }

		// registerKeyDownListener() {
		// 	window.addEventListener("keydown", this.handleKeyDown.bind(this));
		// }

		// handleKeyDown(event: KeyboardEvent) {
		// 	if ((event.ctrlKey || event.metaKey) && event.key === "z") {
		// 		// TODO: find the undo button
		// 		if (this.isLastActionRenumber) {
		// 			this.currentEditor.undo();
		// 			console.log("last action");
		// 		}
		// 		console.log("not last action");
		// 	}
	}
}
