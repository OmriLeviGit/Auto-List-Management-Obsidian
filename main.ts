import { App, Plugin, Editor, EditorChange, PluginSettingTab, Setting } from "obsidian";
import Renumberer from "src/Renumberer";
import PasteHandler from "./src/PasteHandler";
import { Mutex } from "async-mutex";
import { PATTERN } from "./src/utils";

const mutex = new Mutex();

interface RenumberListSettings {
    autoUpdate: boolean;
}

const DEFAULT_SETTINGS: RenumberListSettings = {
    autoUpdate: false,
};

export default class AutoRenumbering extends Plugin {
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

        if (this.settings.autoUpdate === false) {
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
}

class RenumberSettings extends PluginSettingTab {
    plugin: AutoRenumbering;
    settings: RenumberListSettings;

    constructor(app: App, plugin: AutoRenumbering) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Automatically renumber")
            .setDesc("Renumber as changes are made (requires a restart)")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.autoUpdate).onChange(async (value) => {
                    this.plugin.settings.autoUpdate = value;
                    await this.plugin.saveSettings();
                })
            );
    }
}
