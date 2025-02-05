import { Plugin, Editor, EditorPosition } from "obsidian";
import { Mutex } from "async-mutex";
import handlePasteAndDrop from "src/pasteAndDropHandler";
import { registerCommands } from "src/command-registration";
import Renumberer from "src/Renumberer";
import PluginSettings from "./src/settings-tab";
import SettingsManager, { DEFAULT_SETTINGS } from "src/SettingsManager";
import { reorderCheckboxes } from "src/checkbox";
import { Range } from "src/types";

const mutex = new Mutex();

export default class AutoReordering extends Plugin {
    private renumberer: Renumberer;
    private settingsManager: SettingsManager;
    private blockChanges = false;
    private checkboxClickedAt: number | undefined = undefined;
    private handleKeystrokeBound: (event: KeyboardEvent) => void;
    private handleMouseBound: (event: MouseEvent) => void;

    async onload() {
        await this.loadSettings();
        registerCommands(this);
        this.addSettingTab(new PluginSettings(this.app, this));
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

                        let currIndex: number;
                        if (this.checkboxClickedAt !== undefined) {
                            currIndex = this.checkboxClickedAt;
                        } else {
                            const { anchor, head } = editor.listSelections()[0];
                            currIndex = Math.min(anchor.line, head.line);
                        }

                        // Handle checkbox updates
                        let range: Range | undefined;
                        if (this.settingsManager.getLiveCheckboxUpdate() === true) {
                            range = reorderCheckboxes(editor, currIndex);
                        }

                        // Handle numbering updates
                        if (this.settingsManager.getLiveNumberingUpdate() === true) {
                            if (range !== undefined) {
                                // if reordered checkbox, renumber between the original location and the new one
                                this.renumberer.renumber(editor, range.start, range.limit);
                            } else {
                                this.renumberer.renumber(editor, currIndex);
                            }
                        }

                        // Restore cursor position if no text is selected
                        // This prevents cursor from moving to line beginning after checkbox reordering
                        if (!editor.somethingSelected()) {
                            const newLineInOriginalPos = editor.getLine(originalPos.line);

                            const newPos: EditorPosition = {
                                line: originalPos.line,
                                ch: Math.min(originalPos.ch, newLineInOriginalPos.length),
                            };

                            editor.setCursor(newPos);
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
        // if clicked on a checkbox using the mouse (this is not the mouse location)
        mutex.runExclusive(() => {
            const target = event.target as HTMLElement;
            if (target.classList.contains("task-list-item-checkbox")) {
                const listLine = target.closest(".cm-line");
                if (listLine) {
                    const editor = listLine.closest(".cm-editor");
                    if (editor) {
                        const allLines = Array.from(editor.getElementsByClassName("cm-line"));
                        this.checkboxClickedAt = allLines.indexOf(listLine);
                    }
                }
            }

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

    getRenumberer(): Renumberer {
        return this.renumberer;
    }
}
