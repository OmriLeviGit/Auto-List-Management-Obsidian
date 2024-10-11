import { Plugin, Editor, EditorChange } from "obsidian";
import Renumberer from "src/Renumberer";
import { modifyText } from "./src/pasteFunctions";
import { Mutex } from "async-mutex";
import { PATTERN } from "./src/utils";
import AutoRenumberingSettings from "./src/settings";

const mutex = new Mutex();

interface RenumberListSettings {
    autoUpdate: boolean;
}

const DEFAULT_SETTINGS: RenumberListSettings = {
    autoUpdate: false,
};

export default class AutoRenumbering extends Plugin {
    settings: RenumberListSettings;
    private renumberer: Renumberer;
    private changes: EditorChange[] = [];
    private isProccessing = false;
    private blockEditorChange = false; // if the previous action was to undo or paste

    async onload() {
        await this.loadSettings();

        this.renumberer = new Renumberer();
        this.addSettingTab(new AutoRenumberingSettings(this.app, this));

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

        console.log("auto update: ", this.settings.autoUpdate);
        if (this.settings.autoUpdate === false) {
            return;
        }

        // editor change
        this.registerEvent(
            this.app.workspace.on("editor-change", (editor: Editor) => {
                if (!this.isProccessing) {
                    this.isProccessing = true;
                    setTimeout(() => {
                        console.log("detected change");

                        if (this.blockEditorChange) {
                            return;
                        }

                        mutex.runExclusive(() => {
                            const { anchor, head } = editor.listSelections()[0];
                            const currLine = Math.min(anchor.line, head.line);
                            this.changes.push(...this.renumberer.renumberLocally(editor, currLine).changes);
                            this.renumberer.apply(editor, this.changes);
                        });
                    }, 0);

                    this.isProccessing = false;
                }
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
                    this.blockEditorChange;

                    let textFromClipboard = evt.clipboardData?.getData("text");
                    if (!textFromClipboard) {
                        return;
                    }

                    const { anchor, head } = editor.listSelections()[0]; // must be before pasting
                    const baseIndex = Math.min(anchor.line, head.line);

                    const { modifiedText, newIndex } = modifyText(editor, textFromClipboard) || {};

                    textFromClipboard = modifiedText || textFromClipboard;

                    editor.replaceSelection(textFromClipboard); // paste

                    this.changes.push(...this.renumberer.renumberLocally(editor, baseIndex).changes);

                    if (newIndex) {
                        this.changes.push(...this.renumberer.renumberLocally(editor, newIndex).changes);
                    }

                    this.renumberer.apply(editor, this.changes);
                });
            })
        );

        window.addEventListener("keydown", this.handleStroke.bind(this));
    }

    // undo
    handleStroke(event: KeyboardEvent) {
        mutex.runExclusive(() => {
            this.blockEditorChange = event.ctrlKey || event.metaKey;
        });
    }

    onunload() {
        console.log("RenumberList plugin unloaded");
        window.removeEventListener("keydown", this.handleStroke);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
