import { Plugin, Editor, MarkdownView } from "obsidian";
import { renumberLocally } from "src/renumberLocally";
import { getItemNum } from "./src/utils";
import PasteHandler from "./src/PasteHandler";

/*
for the readme:
how we deal with 0 and 000. (consistent with markdown)
not adding a renumber to the entire block because the observer is activating every character typed
does not get activated on regular obsidian renumbering # what did i mean here?
as of now, listening to undo is not be possible. mention vim.

TODO: others
confirm moving between pages (which changes editors) does not break the listener assignments
check what is this.registerEditorExtension()
confirm RTL support
deal with numbering such as 0.1 text 0.2 text etc.
make functions async

TODO: paste
split into functions, make pasting accoring to the previous number
one transaction with the renumbering

TODO: undo:
make sure other plugins do not get triggered twice. it might already be like that.
confirm it works when holding "ctrl z" down.
support vim users

TODO: spaces:
make sure numbers in sequence work with shift-enter which adds two spaces **add to readme
nested numbering: 3 spaces - shift+enter, 4 spaces\tab character - indented (insert according to settings)

TODO: core functionalities:
listener update, from current until line correctly numbered (togglable)
update the entire file (from the menu)
update selected (hot key)
paste accoring to the previous number (togglabele)

TODO:
clone to a new dir and make sure the npm command downloads all dependencies
update the package.json description, manifest, remove all logs etc, choose a name for the plugin
https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
*/

export default class RenumberList extends Plugin {
    private isProcessing: boolean = false;
    private editor: Editor;
    private isLastActionRenumber = false;
    private pasteHandler: PasteHandler;

    /*
	console.log(checkLastLineIsNumbered("Some text\n1. Numbered item")); // true
	console.log(checkLastLineIsNumbered("Some text\nNot numbered")); // false
	console.log(checkLastLineIsNumbered("1. Single numbered line")); // true
	console.log(checkLastLineIsNumbered("Text without newline")); // false
	console.log(checkLastLineIsNumbered("1. First\n2. Second\n3. Third")); // true
	console.log(checkLastLineIsNumbered("1. First\n2. Second\nNot numbered")); // false
	*/

    onload() {
        console.log("loading");
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) {
            return;
        }

        this.editor = view.editor;
        this.pasteHandler = new PasteHandler();

        console.log("active editor detected");

        this.registerEvent(this.app.workspace.on("editor-change", (editor: Editor) => this.handleEditorChange(editor)));

        this.registerEvent(
            this.app.workspace.on("editor-paste", (evt: ClipboardEvent, editor: Editor) => {
                this.app.workspace.off("editor-change", (editor: Editor) => this.handleEditorChange(editor));
                this.pasteHandler.handlePaste(evt, editor);
                this.pasteHandler.renumberAfterPaste(editor);
                this.app.workspace.on("editor-change", (editor: Editor) => this.handleEditorChange(editor));
            })
        );

        window.addEventListener("keydown", this.handleUndo.bind(this));
    }

    handleEditorChange(editor: Editor) {
        if (!this.isProcessing) {
            try {
                this.isProcessing = true;

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
    }

    // connect to current editor
    handleUndo(event: KeyboardEvent) {
        // if ((event.ctrlKey || event.metaKey) && event.key === "z") {
        // 	if (this.isLastActionRenumber) {
        // 		console.log("last action: renumber");
        // 		this.currentEditor.undo();
        // 	}
        // 	console.log("last action: other");
        // }
    }

    onunload() {
        console.log("RenumberList plugin unloaded");
        window.removeEventListener("keydown", this.handleUndo);
    }
}
