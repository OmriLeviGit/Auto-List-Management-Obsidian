import { Plugin, Editor } from "obsidian";
import { renumberLocally } from "src/renumberLocally";
import { getItemNum } from "./src/utils";

/*
for the readme:
how we deal with 0 and 000. (consistent with markdown)
not adding a renumber to the entire block because the observer is activating every character typed

TODO:
[ ] use editor.transaction(() -> {}) to change history all at once (make sure ctrl z works)
[ ] make sure numbers in sequence work with shift-enter which adds too spaces **add to readme
[ ] nested numbering

// need 3 functionalities:
listener update, from current until line correctly numbered (togglable)
update the entire file (from the menu)
update selected (hot key)

TODO:
clone to a new dir and make sure a the script downloads all dependencies
update the package.json description, manifest, remove all logs etc
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
