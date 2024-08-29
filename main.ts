import { Plugin, Editor } from "obsidian";
import { renumberLocally } from "src/renumberLocally";
import { getItemNum } from "./src/utils";

/*
for the readme:
how we deal with 0 and 000. (consistent with markdown)
not adding a renumber to the entire block because the observer is activating every character typed

TODO: transaction:
[ ] support undo by listening, disabling action and redoing twice (make sure other plugins do not get triggered twice). redo is automatic.
[ ] work with copy and paste. when pasting before a list:
  if pasted into the beginning, the pasted should get the previous first number. if at the end, sort as usual.

TODO: spaces:
[ ] make sure numbers in sequence work with shift-enter which adds two spaces **add to readme
[ ] nested numbering
	3 spaces -- shift enter
	4 spaces == tab character -- indented (insert according to settings)

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

	onload() {
		this.registerEvent(
			this.app.workspace.on("editor-change", (editor: Editor) => {
				if (!this.isProcessing) {
					try {
						this.isProcessing = true;
						const currLine = editor.getCursor().line;
						console.log(currLine);
						if (!currLine) return;
						if (getItemNum(editor, currLine) === -1) return; // not a part of a numbered list

						renumberLocally(editor, currLine);
					} finally {
						this.isProcessing = false;
					}
				}
			})
		);
	}
}
