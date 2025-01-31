import { Plugin, Editor, EditorPosition } from "obsidian";
import { Mutex } from "async-mutex";
import AutoRenumberingSettings from "./src/settings-tab";
import SettingsManager, { DEFAULT_SETTINGS } from "src/SettingsManager";
import { reorderCheckboxes } from "src/checkbox";

const mutex = new Mutex();

export default class AutoRenumbering extends Plugin {
    private settingsManager: SettingsManager;
    private blockChanges = false;
    private checkboxClickedAt: number | undefined = undefined;
    private handleKeystrokeBound: (event: KeyboardEvent) => void;
    private handleMouseBound: (event: MouseEvent) => void;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new AutoRenumberingSettings(this.app, this));
        this.settingsManager = SettingsManager.getInstance();

        // editor-change listener
        this.registerEvent(
            this.app.workspace.on("editor-change", (editor: Editor) => {
                if (this.settingsManager.getLiveUpdate() === false) {
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

                        // if reordered checkbox, renumber between the original location and the new one
                        reorderCheckboxes(editor, currIndex);

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
            this.checkboxClickedAt = undefined; // set undefiend as default, changed only if checked
            const target = event.target as HTMLElement;
            if (target.classList.contains("task-list-item-checkbox")) {
                // Find the parent list line div
                const listLine = target.closest(".HyperMD-list-line");
                if (listLine) {
                    // Get all list lines to determine index
                    const editor = listLine.closest(".cm-editor");
                    if (editor) {
                        const allListLines = Array.from(editor.getElementsByClassName("HyperMD-list-line"));
                        this.checkboxClickedAt = allListLines.indexOf(listLine);
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
}
