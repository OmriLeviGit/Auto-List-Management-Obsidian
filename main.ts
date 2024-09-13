import { Plugin, Editor, EditorChange, MarkdownView } from "obsidian";
import { renumberLocally } from "src/renumberLocally";
import PasteHandler from "./src/PasteHandler";
import { Mutex } from "async-mutex";
import { getListStart } from "./src/utils";

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

TODO:
clone to a new dir and make sure the npm command downloads all dependencies
update the package.json description, manifest, remove all logs etc, choose a name for the plugin
https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
*/
const mutex = new Mutex();

export default class RenumberList extends Plugin {
    private editor: Editor;
    private isLastActionRenumber = false;
    private linesToEdit: number[] = [];
    private pasteHandler: PasteHandler;
    private changes: EditorChange[] = [];

    onload() {
        console.log("loading");
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) {
            return;
        }

        this.editor = view.editor;
        this.pasteHandler = new PasteHandler();

        console.log("active editor detected");

        this.registerEvent(
            this.app.workspace.on("editor-change", (editor: Editor) => {
                mutex.runExclusive(() => {
                    const { anchor, head } = editor.listSelections()[0];
                    const currLine = Math.min(anchor.line, head.line);
                    console.log("\n#editor acquired, to line: ", currLine);

                    renumberLocally(editor, currLine);
                });
            })
        );

        this.registerEvent(
            this.app.workspace.on("editor-paste", (evt: ClipboardEvent, editor: Editor) => {
                // pasting before something changes to 9 instead of 11, after doesnt work at all
                /*
9. something
11. wef101. wef101. wef10. few
12. wef101. wef101. wef10. few
13. wf101. wef101. we7. 10. few

solution:
# this logic is somewhat related to renumberlocally, but i would do it from scratch and maybe incorporate it into renumberlocally then
make a function that given a line number: 
checks if before us there is a numbered list. if there is, take its number and change text accordingly
else, check if after us there is a numbered list. if so, take its number and change text accordingly.

first, paste, then calculate the new index.
use the function on the anchor, and push it to the linesToedit
if the anchor and the new index are not the same, use the function on the new index, and push the new index aswell.

call renumber on the lines to edit.


^this should be done ONLY inside paste
                */

                if (evt.defaultPrevented) {
                    return;
                }
                evt.preventDefault();

                mutex.runExclusive(() => {
                    console.log("\n###########paste acquired with", this.linesToEdit);

                    const textFromClipboard = evt.clipboardData?.getData("text");

                    if (!textFromClipboard) {
                        console.log("clipboard data is undefined");
                        return;
                    }

                    editor.replaceSelection(textFromClipboard); // paste either way

                    const { anchor, head } = editor.listSelections()[0];

                    // change the anchor line and head line on the editor, without remembering history
                    const anchorLine = this.pasteHandler.modifyLineNum(editor, anchor.line); // string
                    this.linesToEdit.push(anchor.line); // number

                    if (anchor.line !== head.line) {
                        const newIndex = getListStart(editor, head.line);
                        const headLine = this.pasteHandler.modifyLineNum(editor, newIndex);
                        this.linesToEdit.push(newIndex);
                    }

                    renumberLocally(editor, this.linesToEdit);
                });
            })
        );

        window.addEventListener("keydown", this.handleUndo.bind(this));
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
