import { App, Plugin, Editor, EditorChange, PluginSettingTab, Setting } from "obsidian";
import Renumberer from "src/Renumberer";
import PasteHandler from "./src/PasteHandler";
import { Mutex } from "async-mutex";
import { PATTERN } from "./src/utils";
/*
for the readme:
confirm how we deal with 0 and 000.
explain that liveUpdate does not renumber the entire block because the observer is activating every character typed
does not get activated on regular obsidian renumbering # what did i mean here?
as of now, listening to undo is not be possible. mention vim.
write about core functionalities and commands that can be found using ctrl+p

TODO: reload plugin to apply settings change

TODO: others
confirm moving between pages (which changes editors) does not break the listener assignments
check what is this.registerEditorExtension()
confirm RTL support
deal with numbering such as 0.1 text 0.2 text etc.
make functions async, apply mutex on this.changes
understand why edit changes is called several times and avoid it 
confirm: lines to not get inserted into the renumberer list several times
use less regex, use .test() over some of the current functions

TODO: undo:
make sure other plugins do not get triggered twice. it might already be like that.
confirm it works when holding "ctrl z" down.
should function like a stack, not just the last one
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

interface RenumberListSettings {
    LiveUpdate: boolean;
}

const DEFAULT_SETTINGS: RenumberListSettings = {
    LiveUpdate: false,
};

export default class RenumberList extends Plugin {
    settings: RenumberListSettings;
    private editor: Editor;
    private pasteHandler: PasteHandler;
    private renumberer: Renumberer;
    private changes: EditorChange[] = [];
    private twoHistory: boolean[] = [];
    private isProccessing = false;
    private lastEventWasPaste = false;
    private lastEventWasUndo = false;

    async onload() {
        console.log("loading");
        await this.loadSettings();

        const editor = this.app.workspace.activeEditor?.editor;
        console.log("set editor as: ", editor);
        if (!editor) {
            return;
        }

        this.editor = editor;
        this.pasteHandler = new PasteHandler();
        this.renumberer = new Renumberer();

        this.addSettingTab(new RenumberSettings(this.app, this));

        const renumberBlock = (editor: Editor) => {
            try {
                this.isProccessing = true;
                const { anchor, head } = editor.listSelections()[0];
                const currLine = Math.min(anchor.line, head.line);
                const { changes } = this.renumberer.renumberBlock(editor, currLine);
                this.changes.push(...changes);
                this.renumberer.apply(editor, this.changes);
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

            this.renumberer.apply(editor, this.changes);
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

        if (this.settings.LiveUpdate === false) {
            return;
        }

        // editor change
        this.registerEvent(
            this.app.workspace.on("editor-change", (editor: Editor) => {
                setTimeout(() => {
                    // if (this.lastEventWasPaste) {
                    //     this.lastEventWasPaste = false;
                    //     return;
                    // }

                    // console.log(this.lastEventWasUndo);
                    // if (this.lastEventWasUndo) {
                    //     this.lastEventWasUndo = false;
                    //     return;
                    // }
                    mutex.runExclusive(() => {
                        console.log("detected change");
                        if (!this.isProccessing) {
                            this.isProccessing = true;

                            const { anchor, head } = editor.listSelections()[0];
                            const currLine = Math.min(anchor.line, head.line);

                            this.changes.push(...this.renumberer.renumberLocally(editor, currLine).changes);
                            this.twoHistory.push(this.renumberer.apply(editor, this.changes));

                            this.isProccessing = false;
                        }
                    });
                }, 0);
            })
        );

        // paste
        this.registerEvent(
            this.app.workspace.on("editor-paste", (evt: ClipboardEvent, editor: Editor) => {
                if (evt.defaultPrevented) {
                    return;
                }
                evt.preventDefault();
                mutex.runExclusive(() => {
                    // this.lastEventWasPaste = true;

                    let textFromClipboard = evt.clipboardData?.getData("text");
                    if (!textFromClipboard) {
                        return;
                    }

                    const { anchor, head } = editor.listSelections()[0]; // must be before pasting
                    const baseIndex = Math.min(anchor.line, head.line);

                    const { modifiedText, newIndex } = this.pasteHandler.modifyText(editor, textFromClipboard) || {};

                    textFromClipboard = modifiedText || textFromClipboard;

                    editor.replaceSelection(textFromClipboard); // paste

                    this.changes.push(...this.renumberer.renumberLocally(editor, baseIndex).changes);

                    if (newIndex) {
                        this.changes.push(...this.renumberer.renumberLocally(editor, newIndex).changes);
                    }

                    // this.renumberer.apply(editor, this.changes);
                });
            })
        );
        // window.addEventListener("keydown", this.handleUndo.bind(this));
    }

    //undo
    // handleUndo(event: KeyboardEvent) {
    //     mutex.runExclusive(() => {
    //         this.lastEventWasUndo = true;
    //         console.log(this.twoHistory);
    //         if ((event.ctrlKey || event.metaKey) && event.key === "z") {
    //             if (this.twoHistory.pop() === true) {
    //                 this.editor.undo();
    //             }
    //         }
    //     });
    // }

    onunload() {
        console.log("RenumberList plugin unloaded");
        // window.removeEventListener("keydown", this.handleUndo);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    applySettings() {
        if (this.settings.LiveUpdate) {
            // Activate live update functionality
        } else {
            // Deactivate live update functionality
        }
    }
}

class RenumberSettings extends PluginSettingTab {
    plugin: RenumberList;
    settings: RenumberListSettings;

    constructor(app: App, plugin: RenumberList) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Live update")
            .setDesc("Renumber as changes are made (requires a restart")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.LiveUpdate).onChange(async (value) => {
                    this.plugin.settings.LiveUpdate = value;
                    await this.plugin.saveSettings();
                    this.plugin.applySettings();
                })
            );
    }
}
