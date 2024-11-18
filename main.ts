import { Plugin, Editor } from "obsidian";
import { Mutex } from "async-mutex";
import handlePasteAndDrop from "src/renumbering/pasteAndDropHandler";
import { registerCommands } from "src/command-registration";
import Renumberer from "src/renumbering/Renumberer";
import AutoRenumberingSettings from "./src/settings-tab";
import SettingsManager, { DEFAULT_SETTINGS } from "src/SettingsManager";
import { DynamicStartStrategy, StartFromOneStrategy } from "src/renumbering/strategies";
import { RenumberingStrategy } from "src/types";

const mutex = new Mutex();

export default class AutoRenumbering extends Plugin {
    private renumberer: Renumberer;
    private settingsManager: SettingsManager;
    private isProccessing = false;
    private blockChanges = false; // if the previous action was a special key
    private handleKeystrokeBound: (event: KeyboardEvent) => void;

    async onload() {
        await this.loadSettings();
        registerCommands(this);
        this.addSettingTab(new AutoRenumberingSettings(this.app, this));
        this.settingsManager = SettingsManager.getInstance();

        if (this.settingsManager.getStartsFromOne()) {
            this.renumberer = new Renumberer(new StartFromOneStrategy());
        } else {
            this.renumberer = new Renumberer(new DynamicStartStrategy());
        }

        // editor-change listener
        this.registerEvent(
            this.app.workspace.on("editor-change", (editor: Editor) => {
                // TODO: writing in the first line
                if (this.settingsManager.getLiveUpdate() === false) {
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
                            this.renumberer.renumber(editor, currLine);
                        });
                        this.isProccessing = false;
                    }, 0);
                }
            })
        );

        // editor-paste listener
        this.registerEvent(
            this.app.workspace.on("editor-paste", (evt: ClipboardEvent, editor: Editor) => {
                handlePasteAndDrop.call(this, evt, editor, mutex);
            })
        );

        // editor-drop listener
        this.registerEvent(
            this.app.workspace.on("editor-drop", (evt: DragEvent, editor: Editor) => {
                handlePasteAndDrop.call(this, evt, editor, mutex);
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
        // console.log("settings: ", settingsManager.getSettings(), "strategy: ", this.renumberer);
    }

    getRenumberer() {
        return this.renumberer;
    }

    getIsProcessing() {
        return this.isProccessing;
    }

    setIsProcessing(value: boolean) {
        this.isProccessing = value;
    }

    setStrategy(strategy: RenumberingStrategy) {
        this.renumberer.setStrategy(strategy);
    }
}
