import { Plugin, Editor, EditorChange } from "obsidian";
import Renumberer from "src/Renumberer";
import { handlePaste } from "./src/pasteHandler";
import { Mutex } from "async-mutex";
import AutoRenumberingSettings from "./src/settings";
import { registerCommands } from "src/registerCommands";

const mutex = new Mutex();
export let pluginInstance: AutoRenumbering;

export interface RenumberListSettings {
    liveUpdate: boolean;
    smartPaste: boolean;
    indentSize: number;
}

export const DEFAULT_SETTINGS: RenumberListSettings = {
    liveUpdate: true,
    smartPaste: true,
    indentSize: 4,
};

export default class AutoRenumbering extends Plugin {
    private settings: RenumberListSettings;
    private renumberer: Renumberer;
    private changes: EditorChange[] = [];
    private isProccessing = false;
    private blockChanges = false; // if the previous action was a special key
    private handleKeystrokeBound: (event: KeyboardEvent) => void;

    async onload() {
        pluginInstance = this;
        await this.loadSettings();
        registerCommands(this);
        this.addSettingTab(new AutoRenumberingSettings(this.app, this));
        this.renumberer = new Renumberer();

        // editor change
        this.registerEvent(
            this.app.workspace.on("editor-change", (editor: Editor) => {
                if (this.settings.liveUpdate === false) {
                    return;
                }

                if (!this.isProccessing) {
                    this.isProccessing = true;

                    setTimeout(() => {
                        mutex.runExclusive(() => {
                            if (this.blockChanges) {
                                return;
                            }

                            this.blockChanges = true;
                            const { anchor, head } = editor.listSelections()[0];
                            const currLine = Math.min(anchor.line, head.line);
                            this.changes.push(...this.renumberer.renumberLocally(editor, currLine).changes);
                            this.renumberer.applyChangesToEditor(editor, this.changes);
                        });
                        this.isProccessing = false;
                    }, 0);
                }
            })
        );

        // paste
        this.registerEvent(
            this.app.workspace.on("editor-paste", (evt: ClipboardEvent, editor: Editor) => {
                if (this.settings.liveUpdate === false) {
                    return;
                }

                const clipboardContent = evt.clipboardData?.getData("text");

                if (evt.defaultPrevented || !clipboardContent) {
                    return;
                }

                evt.preventDefault();

                mutex.runExclusive(() => {
                    this.blockChanges = true;
                    const { baseIndex, offset } = handlePaste(editor, clipboardContent);
                    this.renumberer.allListsInRange(editor, this.changes, baseIndex, baseIndex + offset);
                    this.renumberer.applyChangesToEditor(editor, this.changes);
                });
            })
        );

        this.handleKeystrokeBound = this.handleKeystroke.bind(this);
        window.addEventListener("keydown", this.handleKeystrokeBound); // Keystroke listener
    }

    handleKeystroke(event: KeyboardEvent) {
        // if special key, dont renumber automatically
        mutex.runExclusive(() => {
            this.blockChanges = event.ctrlKey || event.metaKey || event.altKey;
            // console.debug("handlestroke", this.blockChanges);
        });
    }

    async onunload() {
        window.removeEventListener("keydown", this.handleKeystrokeBound);
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    getSettings() {
        return this.settings;
    }

    getRenumberer() {
        return this.renumberer;
    }

    getIsProcessing() {
        return this.isProccessing;
    }

    getChanges() {
        return this.changes;
    }

    setIsProcessing(value: boolean) {
        this.isProccessing = value;
    }

    setLiveUpdate(value: boolean) {
        this.settings.liveUpdate = value;
    }

    setSmartPaste(value: boolean) {
        this.settings.smartPaste = value;
    }

    setIndentSize(size: number) {
        this.settings.indentSize = size;
    }
}
