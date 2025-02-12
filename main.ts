import { Plugin, Editor, EditorPosition, MarkdownView, MarkdownFileInfo, EditorChange } from "obsidian";
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
                console.log("hol");
                setTimeout(() => {
                    mutex.runExclusive(() => {
                        const originalPos = editor.getCursor();

                        if (this.blockChanges) {
                            return;
                        }

                        this.blockChanges = true; // Prevents multiple renumbering/checkbox updates. Reset to false on mouse/keyboard input

                        let currIndex: number;
                        if (this.checkboxClickedAt !== undefined) {
                            currIndex = this.checkboxClickedAt;
                            this.checkboxClickedAt = undefined;
                        } else {
                            const { anchor, head } = editor.listSelections()[0];
                            currIndex = Math.min(anchor.line, head.line);
                        }

                        console.log("ind1", currIndex);
                        console.log("ind2", editor.getCursor().line);

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

                        // Restore if the current line was reordered and no text was selected, place the cursor at the end of the line
                        if (
                            !editor.somethingSelected() &&
                            range !== undefined &&
                            range.start <= originalPos.line &&
                            originalPos.line < range.limit
                        ) {
                            const newLineInOriginalPos = editor.getLine(originalPos.line);
                            const newPos: EditorPosition = {
                                line: originalPos.line,
                                ch: newLineInOriginalPos.length,
                            };
                            editor.setCursor(newPos);
                        }
                    });
                }, 0);
            })
        );
        // this.registerEvent(
        //     this.app.workspace.on("editor-change", (editor: Editor) => {
        //         console.log("hol");
        //         setTimeout(() => {
        //             mutex.runExclusive(() => {
        //                 const originalPos = editor.getCursor();

        //                 if (this.blockChanges) {
        //                     return;
        //                 }

        //                 this.blockChanges = true; // Prevents multiple renumbering/checkbox updates. Reset to false on mouse/keyboard input

        //                 let currIndex: number;
        //                 if (this.checkboxClickedAt !== undefined) {
        //                     currIndex = this.checkboxClickedAt;
        //                     this.checkboxClickedAt = undefined;
        //                 } else {
        //                     const { anchor, head } = editor.listSelections()[0];
        //                     currIndex = Math.min(anchor.line, head.line);
        //                 }

        //                 const ind1 = this.checkboxClickedAt;
        //                 const ind2 = editor.getCursor().line;

        //                 console.log("ind1", currIndex);
        //                 console.log("ind2", ind2);

        //                 // Handle checkbox updates
        //                 let range: Range | undefined;
        //                 if (this.settingsManager.getLiveCheckboxUpdate() === true) {
        //                     range = reorderCheckboxes(editor, currIndex);
        //                 }

        //                 // Handle numbering updates
        //                 if (this.settingsManager.getLiveNumberingUpdate() === true) {
        //                     if (range !== undefined) {
        //                         // if reordered checkbox, renumber between the original location and the new one
        //                         this.renumberer.renumber(editor, range.start, range.limit);
        //                     } else {
        //                         this.renumberer.renumber(editor, currIndex);
        //                     }
        //                 }

        //                 // Restore if the current line was reordered and no text was selected, place the cursor at the end of the line
        //                 if (
        //                     !editor.somethingSelected() &&
        //                     range !== undefined &&
        //                     range.start <= originalPos.line &&
        //                     originalPos.line < range.limit
        //                 ) {
        //                     const newLineInOriginalPos = editor.getLine(originalPos.line);
        //                     const newPos: EditorPosition = {
        //                         line: originalPos.line,
        //                         ch: newLineInOriginalPos.length,
        //                     };
        //                     editor.setCursor(newPos);
        //                 }
        //             });
        //         }, 0);
        //     })
        // );

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
        // Attach event listener in your main class
        // // TODO bug, does not release the listener on unload?
        // if clicked on a checkbox using the mouse (this is not the mouse location)
        console.log("bye");
        mutex.runExclusive(() => {
            this.checkboxClickedAt = undefined;

            const target = event.target as HTMLElement;
            if (target.classList.contains("task-list-item-checkbox")) {
                const listLine = target.closest(".cm-line");
                const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (listLine && view) {
                    const textContent = listLine.textContent;

                    const editor = view.editor;
                    for (let i = 0; i < editor.lineCount(); i++) {
                        const lineContent = editor.getLine(i);
                        const noCheckbox = extractTextAfterCheckbox(lineContent);
                        if (textContent!.endsWith(noCheckbox)) {
                            this.checkboxClickedAt = i;
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
        window.removeEventListener("click", this.handleMouseBound);
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
