import { Plugin, Editor, EditorPosition } from "obsidian";
import { Mutex } from "async-mutex";
import handlePasteAndDrop from "src/pasteAndDropHandler";
import { registerCommands } from "src/command-registration";
import Renumberer from "src/Renumberer";
import AutoRenumberingSettings from "./src/settings-tab";
import SettingsManager, { DEFAULT_SETTINGS } from "src/SettingsManager";
import { reorderCheckboxes } from "src/checkbox";

const mutex = new Mutex();

export default class AutoRenumbering extends Plugin {
    private renumberer: Renumberer;
    private settingsManager: SettingsManager;
    private blockChanges = false;
    private handleKeystrokeBound: (event: KeyboardEvent) => void;
    private handleMouseBound: (event: MouseEvent) => void;

    async onload() {
        await this.loadSettings();
        registerCommands(this);
        this.addSettingTab(new AutoRenumberingSettings(this.app, this));
        this.settingsManager = SettingsManager.getInstance();
        this.renumberer = new Renumberer();

        // editor-change listener
        this.registerEvent(
            this.app.workspace.on("editor-change", (editor: Editor) => {
                if (this.settingsManager.getLiveNumberingUpdate() === false) {
                    return;
                }

                setTimeout(() => {
                    mutex.runExclusive(() => {
                        const originalPos: EditorPosition = editor.getCursor();
                        if (this.blockChanges) {
                            return;
                        }
                        this.blockChanges = true; // prevent several renumbering/checkbox calls, becomes false on each keyboard stroke

                        const { anchor, head } = editor.listSelections()[0];
                        const currIndex = Math.min(anchor.line, head.line);

                        // if reordered checkbox, renumber between the original location and the new one
                        const range = reorderCheckboxes(editor, currIndex);
                        if (range !== undefined) {
                            this.renumberer.renumber(editor, range.start, range.limit);
                        } else {
                            this.renumberer.renumber(editor, currIndex);
                        }

                        // swapping lines in checkbox reordering sometimes moves the cursor to line beginning
                        if (!editor.somethingSelected()) {
                            // if something is selected, restoring cursor position interferes with the selection
                            const newLineInOriginalPos = editor.getLine(originalPos.line);

                            const newPos: EditorPosition = {
                                line: originalPos.line,
                                ch: Math.min(originalPos.ch, newLineInOriginalPos.length),
                            };

                            editor.setCursor(newPos); // restore the cursor location to how it was before checkbox reordering
                        }
                    });
                }, 0);
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

        // keyboard stroke listener
        this.handleKeystrokeBound = this.handleKeystroke.bind(this);
        window.addEventListener("keydown", this.handleKeystrokeBound); // Keystroke listener

        // mouse listener
        this.handleMouseBound = this.handleMouseClick.bind(this);
        window.addEventListener("click", this.handleMouseBound); // mouse listener
    }

    handleKeystroke(event: KeyboardEvent) {
        // if special key, dont renumber automatically
        mutex.runExclusive(() => {
            this.blockChanges = event.ctrlKey || event.metaKey || event.altKey;
        });
    }

    handleMouseClick(event: MouseEvent) {
        // if detected a mouse click, can renumber or checkbox (is used for checking with the mouse)
        mutex.runExclusive(() => {
            this.blockChanges = false;
        });
    }

    async onunload() {
        window.removeEventListener("keydown", this.handleKeystrokeBound);
        window.removeEventListener("mouse", this.handleMouseBound);
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
}
