import { Plugin, Editor, EditorChange } from "obsidian";
import { Mutex } from "async-mutex";
import { handlePaste } from "./src/pasteHandler";
import { registerCommands } from "src/registerCommands";
import Renumberer from "src/Renumberer";
import AutoRenumberingSettings from "./src/SettingsTab";
import SettingsManager, { DEFAULT_SETTINGS } from "src/SettingsManager";

const mutex = new Mutex();

export default class AutoRenumbering extends Plugin {
    private renumberer: Renumberer;
    private settingsManager: SettingsManager;
    private changes: EditorChange[] = [];
    private isProccessing = false;
    private blockChanges = false; // if the previous action was a special key
    private handleKeystrokeBound: (event: KeyboardEvent) => void;

    async onload() {
        await this.loadSettings();
        registerCommands(this);
        this.addSettingTab(new AutoRenumberingSettings(this.app, this));
        this.renumberer = new Renumberer();
        this.settingsManager = SettingsManager.getInstance();

        // editor change
        this.registerEvent(
            this.app.workspace.on("editor-change", (editor: Editor) => {
                if (this.settingsManager.getSettings().liveUpdate === false) {
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
                            this.changes.push(...this.renumberer.renumberLocallyOne(editor, currLine).changes);
                            // this.changes.push(...this.renumberer.renumberLocally(editor, currLine).changes);
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
                if (this.settingsManager.getSettings().liveUpdate === false) {
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
        const settingsManager = SettingsManager.getInstance();
        settingsManager.setSettings(Object.assign({}, DEFAULT_SETTINGS, await this.loadData()));
    }

    async saveSettings() {
        const settingsManager = SettingsManager.getInstance();
        await this.saveData(settingsManager.getSettings());
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
}
