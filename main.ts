import { Plugin, Editor, EditorChange, MarkdownView } from "obsidian";
import Renumberer from "src/Renumberer";
import PasteHandler from "./src/PasteHandler";
import { Mutex } from "async-mutex";
import { getListStart, PATTERN } from "./src/utils";
import SampleSettingTab, { MyPluginSettings, DEFAULT_SETTINGS } from "./src/settings";
import { renumberFile } from "src/renumberFile";
/*
for the readme:
how we deal with 0 and 000. (consistent with markdown)
not adding a renumber to the entire block because the observer is activating every character typed
does not get activated on regular obsidian renumbering # what did i mean here?
as of now, listening to undo is not be possible. mention vim.
write about core functionalities and commands that can be found using ctrl+p

TODO: others
confirm moving between pages (which changes editors) does not break the listener assignments
check what is this.registerEditorExtension()
confirm RTL support
deal with numbering such as 0.1 text 0.2 text etc.
make functions async
understand why edit changes is called several times and avoid it 
confirm: lines to not get inserted into the renumberer list several times

TODO: paste
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


TODO:
clone to a new dir and make sure the npm command downloads all dependencies
update the package.json description, manifest, remove all logs etc, choose a name for the plugin
https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
*/

const mutex = new Mutex();
export default class RenumberList extends Plugin {
    private editor: Editor;
    private isLastActionRenumber = false;
    private pasteHandler: PasteHandler;
    private renumberer: Renumberer;
    private changes: EditorChange[] = [];
    private isProccessing = false;
    settings: MyPluginSettings;

    onload() {
        console.log("loading");
        this.loadSettings();

        const editor = this.app.workspace.activeEditor?.editor;
        console.log("set editor as: ", editor);
        if (!editor) {
            return;
        }

        this.editor = editor;
        this.pasteHandler = new PasteHandler();
        this.renumberer = new Renumberer();

        this.addSettingTab(new SampleSettingTab(this.app, this));

        const renumberBlock = (editor: Editor) => {
            try {
                this.isProccessing = true;
                const { anchor, head } = editor.listSelections()[0];
                const currLine = Math.min(anchor.line, head.line);
                const { changes } = this.renumberer.renumberBlock(editor, currLine);
                this.renumberer.apply(editor, changes);
            } finally {
                this.isProccessing = false;
            }
        };

        const renumberFileRange = (editor: Editor, start: number = 0, end = editor.lastLine()) => {
            if (start > end) {
                return -1;
            }

            let currLine = start;
            const lastLine = end;

            while (currLine < lastLine) {
                if (PATTERN.test(editor.getLine(currLine))) {
                    const newChanges = this.renumberer.renumberBlock(editor, currLine);
                    if (newChanges.endIndex > 0) {
                        this.changes.push(...newChanges.changes);
                        currLine = newChanges.endIndex;
                    }
                }
                currLine++;
            }

            this.renumberer.apply(this.editor, this.changes);
        };

        this.addCommand({
            id: "renumber-file",
            name: "Renumber all numbered lists",
            editorCallback: (editor: Editor) => renumberFileRange(editor),
        });

        // TODO maybe carry on the item number for the entire selection
        this.addCommand({
            id: "renumber-selection",
            name: "Renumber selection",
            editorCallback: (editor: Editor) => {
                const { anchor, head } = editor.listSelections()[0];
                const startLine = Math.min(anchor.line, head.line);
                const endLine = Math.max(anchor.line, head.line);
                renumberFileRange(editor, startLine, endLine);
            },
        });

        this.addCommand({
            id: "renumber-block",
            name: "Renumber current list",
            editorCallback: (editor: Editor) => renumberBlock(editor),
        });

        // this.registerEvent(
        //     this.app.workspace.on("editor-change", (editor: Editor) => {
        //         if (!this.isProccessing) {
        //             try {
        //                 this.isProccessing = true;
        //                 const { anchor, head } = editor.listSelections()[0];
        //                 const currLine = Math.min(anchor.line, head.line);
        //                 const {changes} = this.renumberer.renumberBlock(editor, currLine); // TODO renumber locally not block
        //                 this.renumberer.apply(editor, changes);

        //                 // this.isProccessing = true;
        //                 // mutex.runExclusive(() => {
        //                 //     const { anchor, head } = editor.listSelections()[0];
        //                 //     const currLine = Math.min(anchor.line, head.line);
        //                 //     console.log("\n#editor acquired, to line: ", currLine);

        //                 //     this.renumberer.addLines(currLine);
        //                 //     this.renumberer.apply(editor);
        //                 // });
        //             } finally {
        //                 this.isProccessing = false;
        //             }
        //         }
        //     })
        // );

        // this.registerEvent(
        //     this.app.workspace.on("editor-change", (editor: Editor) => {
        //         if (!this.isProccessing) {
        //             try {
        //                 this.isProccessing = true;
        //                 mutex.runExclusive(() => {
        //                     const { anchor, head } = editor.listSelections()[0];
        //                     const currLine = Math.min(anchor.line, head.line);
        //                     console.log("\n#editor acquired, to line: ", currLine);

        //                     this.renumberer.addLines(currLine);
        //                     this.renumberer.apply(editor);
        //                 });
        //             } finally {
        //                 this.isProccessing = false;
        //             }
        //         }
        //     })
        // );

        // this.registerEvent(
        //     this.app.workspace.on("editor-paste", (evt: ClipboardEvent, editor: Editor) => {
        //         if (evt.defaultPrevented) {
        //             return;
        //         }
        //         evt.preventDefault();

        //         mutex.runExclusive(() => {
        //             const textFromClipboard = evt.clipboardData?.getData("text");

        //             if (!textFromClipboard) {
        //                 return;
        //             }

        //             const { anchor, head } = editor.listSelections()[0]; // must be before pasting

        //             editor.replaceSelection(textFromClipboard); // paste

        //             this.renumberer.addLines(anchor.line);

        //             if (anchor.line !== head.line) {
        //                 const newIndex = getListStart(editor, head.line);
        //                 // TODO somehow apply the change to work in a single transaction
        //                 // const headLine = this.pasteHandler.modifyLineNum(editor, newIndex);
        //                 this.renumberer.addLines(newIndex);
        //             }

        //             this.renumberer.apply(editor);
        //         });
        //     })
        // );

        // window.addEventListener("keydown", this.handleUndo.bind(this));
    }

    // // connect to current editor
    // handleUndo(event: KeyboardEvent) {
    //     if ((event.ctrlKey || event.metaKey) && event.key === "z") {
    //         if (this.isLastActionRenumber) {
    //             console.log("last action: renumber");
    //             this.editor.undo();
    //         }
    //         console.log("last action: other");
    //     }
    // }

    // onunload() {
    //     console.log("RenumberList plugin unloaded");
    //     window.removeEventListener("keydown", this.handleUndo);
    // }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
