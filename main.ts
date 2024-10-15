import { Plugin, Editor, EditorChange } from "obsidian";
import Renumberer from "src/Renumberer";
import { modifyText } from "./src/pasteFunctions";
import { Mutex } from "async-mutex";
import AutoRenumberingSettings from "./src/settings";
import { registerCommands } from "src/registerCommands";

const mutex = new Mutex();

interface RenumberListSettings {
    autoUpdate: boolean;
}

const DEFAULT_SETTINGS: RenumberListSettings = {
    autoUpdate: true,
};

export default class AutoRenumbering extends Plugin {
    settings: RenumberListSettings;
    renumberer: Renumberer;
    changes: EditorChange[] = [];
    isProccessing = false;
    blockEditorChange = false; // if the previous action was a special key

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new AutoRenumberingSettings(this.app, this));

        this.renumberer = new Renumberer();

        registerCommands(this);

        // editor change
        this.registerEvent(
            this.app.workspace.on("editor-change", (editor: Editor) => {
                if (this.settings.autoUpdate === false) {
                    return;
                }

                if (!this.isProccessing) {
                    this.isProccessing = true;

                    setTimeout(() => {
                        if (this.blockEditorChange) {
                            return; // not removing the block immediately prevents adding the same line several times to changes without updating
                        }

                        mutex.runExclusive(() => {
                            const { anchor, head } = editor.listSelections()[0];
                            const currLine = Math.min(anchor.line, head.line);
                            this.changes.push(...this.renumberer.renumberLocally(editor, currLine).changes);
                            this.renumberer.applyChangesToEditor(editor, this.changes);
                        });
                    }, 0);

                    this.isProccessing = false;
                }
            })
        );

        // paste
        this.registerEvent(
            this.app.workspace.on("editor-paste", (evt: ClipboardEvent, editor: Editor) => {
                if (this.settings.autoUpdate === false) {
                    return;
                }

                if (evt.defaultPrevented) {
                    return;
                }
                evt.preventDefault();
                mutex.runExclusive(() => {
                    this.blockEditorChange = true;

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

                    this.renumberer.applyChangesToEditor(editor, this.changes);
                });
            })
        );

        window.addEventListener("keydown", this.handleKeystroke.bind(this)); // Keystroke listener
    }

    handleKeystroke(event: KeyboardEvent) {
        // if special key, dont renumber automatically
        mutex.runExclusive(() => {
            this.blockEditorChange = event.ctrlKey || event.metaKey || event.altKey;
        });
    }

    onunload() {
        window.removeEventListener("keydown", this.handleKeystroke);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
