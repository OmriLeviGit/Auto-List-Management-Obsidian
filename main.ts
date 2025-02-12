import { Plugin, Editor, EditorPosition, MarkdownView } from "obsidian";
import { Mutex } from "async-mutex";
import handlePasteAndDrop from "src/pasteAndDropHandler";
import { registerCommands } from "src/command-registration";
import Renumberer from "src/Renumberer";
import PluginSettings from "./src/settings-tab";
import SettingsManager, { DEFAULT_SETTINGS } from "src/SettingsManager";
import { reorderCheckboxes } from "src/checkbox";
import { Range } from "src/types";
import { extractTextAfterCheckbox } from "src/utils";

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
                setTimeout(() => {
                    mutex.runExclusive(() => {
                        if (this.blockChanges) {
                            return;
                        }

                        this.blockChanges = true; // Prevents multiple renumbering/checkbox updates. Reset to false on mouse/keyboard input

                        let currIndex: number;
                        if (this.checkboxClickedAt !== undefined) {
                            currIndex = this.checkboxClickedAt;
                            // console.log("currIndex", currIndex);
                            // this.checkboxClickedAt = undefined;
                        } else {
                            const { anchor, head } = editor.listSelections()[0];
                            currIndex = Math.min(anchor.line, head.line);
                        }
                        // console.log("this.checkboxClickedAt:", this.checkboxClickedAt);
                        // console.log("index:", currIndex, editor.getCursor().line);

                        const ind1 = this.checkboxClickedAt;
                        const ind2 = editor.getCursor().line;

                        // console.log("ind1", ind1);
                        // console.log("ind2", ind2);

                        // const l1 = editor.getLine(ind1!);
                        // const l2 = editor.getLine(ind2);

                        // console.log("l1", l1);
                        // console.log("l2", l2);

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
                        if (range !== undefined && !editor.somethingSelected()) {
                            const newLineInOriginalPos = editor.getLine(range.start);
                            const newPos: EditorPosition = {
                                line: range.start,
                                ch: newLineInOriginalPos.length,
                            };
                            editor.setCursor(newPos);
                        }

                        this.checkboxClickedAt = undefined;
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
        // TODO bug, does not release the listener on unload
        // if clicked on a checkbox using the mouse (this is not the mouse location)
        mutex.runExclusive(() => {
            this.checkboxClickedAt = undefined;

            const target = event.target as HTMLElement;
            if (target.classList.contains("task-list-item-checkbox")) {
                const listLine = target.closest(".cm-line");
                const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (listLine && view) {
                    const textContent = listLine.textContent;
                    console.log("txt", textContent);

                    const editor = view.editor;
                    for (let i = 0; i < editor.lineCount(); i++) {
                        // console.log("@in", textContent); // they dont end with the same
                        const lineContent = editor.getLine(i);
                        console.log("lin", lineContent);
                        const noCheckbox = extractTextAfterCheckbox(lineContent);
                        console.log(" cx", noCheckbox);
                        if (textContent!.endsWith(noCheckbox)) {
                            this.checkboxClickedAt = i;
                            console.log("breaks at: ", i);
                            break;
                        }
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
