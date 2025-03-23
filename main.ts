import { Plugin, Editor, EditorPosition, MarkdownView } from "obsidian";
import { Mutex } from "async-mutex";
import handlePasteAndDrop from "src/pasteAndDropHandler";
import { registerCommands } from "src/command-registration";
import Renumberer from "src/Renumberer";
import PluginSettings from "./src/settings-tab";
import SettingsManager, { DEFAULT_SETTINGS } from "src/SettingsManager";
import { reorderChecklist } from "src/checkbox";
import { ReorderResult } from "src/types";
import { EditorView } from "@codemirror/view";

const mutex = new Mutex();

export default class AutoReordering extends Plugin {
    private renumberer: Renumberer;
    private settingsManager: SettingsManager;
    private blockChanges = false;
    private checkboxClickedAt: number | undefined = undefined;
    private handleKeystrokeBound: (event: KeyboardEvent) => void;
    private handleMouseBound: (event: MouseEvent) => void;

    applyReordering(editor: Editor, start?: number, end?: number) {
        if (this.blockChanges) {
            return;
        }

        const posToReturn = editor.getCursor();

        this.blockChanges = true; // Prevents multiple renumbering/checkbox updates. Reset to false on mouse/keyboard input

        let startIndex = start;
        let endIndex = end;
        let newLine: number | undefined;

        if (startIndex === undefined) {
            const result = this.getCurrIndex(editor);
            startIndex = result.index;
            newLine = result.mouseAt;
        }

        if (newLine !== undefined) {
            posToReturn.line = newLine; // if the cursor is outside the screen, place it in the same line the mouse just clicked at
        }

        // Handle checkbox updates
        let reorderResult: ReorderResult | undefined;
        if (this.settingsManager.getLiveCheckboxUpdate() === true) {
            reorderResult = reorderChecklist(editor, startIndex, end);
        }

        // Handle numbering updates
        if (this.settingsManager.getLiveNumberingUpdate() === true) {
            // if reordered checkbox, renumber between the original location and the new one
            if (reorderResult !== undefined) {
                startIndex = reorderResult.start;
                endIndex = reorderResult.limit;
            }

            this.renumberer.renumber(editor, startIndex, endIndex);
        }

        this.updateCursorPosition(editor, posToReturn, reorderResult);
    }

    async onload() {
        await this.loadSettings();
        registerCommands(this);
        this.addSettingTab(new PluginSettings(this.app, this));
        this.settingsManager = SettingsManager.getInstance();
        this.renumberer = new Renumberer();

        // editor-change listener
        this.registerEvent(
            this.app.workspace.on("editor-change", (editor: Editor) => {
                // prioritize other listeners
                setTimeout(() => {
                    mutex.runExclusive(() => {
                        this.applyReordering(editor);
                    }, 0);
                });
            })
        );

        // editor-paste listener
        this.registerEvent(
            this.app.workspace.on("editor-paste", (evt: ClipboardEvent, editor: Editor) => {
                const { start, end } = handlePasteAndDrop.call(this, evt, editor, mutex);
                this.applyReordering(editor, start, end);
                mutex.release();
            })
        );

        // editor-drop listener
        this.registerEvent(
            this.app.workspace.on("editor-drop", (evt: DragEvent, editor: Editor) => {
                const { start, end } = handlePasteAndDrop.call(this, evt, editor, mutex);
                this.applyReordering(editor, start, end);
                mutex.release();
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

    //  mouse listener
    async handleMouseClick(event: MouseEvent) {
        if (!this.settingsManager.getLiveCheckboxUpdate()) {
            return;
        }

        try {
            await mutex.runExclusive(async () => {
                this.checkboxClickedAt = undefined;
                const target = event.target as HTMLElement;
                if (target.matches('[type="checkbox"]')) {
                    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                    if (activeView?.editor.hasFocus()) {
                        // @ts-expect-error, not typed
                        const editorView = activeView.editor.cm as EditorView;
                        const pos = editorView.posAtDOM(target);
                        const line = editorView.state.doc.lineAt(pos);
                        this.checkboxClickedAt = line.number - 1;
                    }
                }
                this.blockChanges = false;
            });
        } catch (error) {
            console.error("Error in handleMouseClick:", error);
            this.blockChanges = false;
            this.checkboxClickedAt = undefined;
        }
    }

    async onunload() {
        window.removeEventListener("keydown", this.handleKeystrokeBound);
        window.removeEventListener("click", this.handleMouseBound);
    }

    async loadSettings() {
        const settingsManager = SettingsManager.getInstance();
        const settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        settingsManager.setSettings(settings);
    }

    async saveSettings() {
        const settingsManager = SettingsManager.getInstance();
        await this.saveData(settingsManager.getSettings());
    }

    getRenumberer(): Renumberer {
        return this.renumberer;
    }

    updateCursorPosition(editor: Editor, originalPos: EditorPosition, reorderResult?: ReorderResult): void {
        if (editor.somethingSelected() || !reorderResult) {
            return;
        }

        // if the line where the cursor is was not reordered, leave it as it was
        // else, put it at the end of the same line
        // ideal but not implemented: follow the original line to its new location
        let newPosition: EditorPosition;
        if (originalPos.line < reorderResult.start || reorderResult.limit <= originalPos.line) {
            newPosition = {
                line: originalPos.line,
                ch: originalPos.ch,
            };
        } else {
            const line = editor.getLine(originalPos.line);
            newPosition = {
                line: originalPos.line,
                ch: line.length, // not keeping the originalPos.ch bad ux on new lines after checked items
            };
        }
        editor.setCursor(newPosition);
    }

    getCurrIndex(editor: Editor): { index: number; mouseAt?: number } {
        const isInView = this.isCursorInView();

        if (this.checkboxClickedAt !== undefined) {
            const index = this.checkboxClickedAt;
            this.checkboxClickedAt = undefined;

            if (!isInView) {
                return { index, mouseAt: index };
            }
            return { index };
        }

        const selection = editor.listSelections()[0];
        return { index: Math.min(selection.anchor.line, selection.head.line) };
    }

    isCursorInView(): boolean {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (activeView) {
            // @ts-expect-error, not typed
            const editorView = activeView.editor.cm as EditorView;
            const pos = editorView.state.selection.main.head;
            const coords = editorView.coordsAtPos(pos);
            if (coords) {
                const editorRect = editorView.dom.getBoundingClientRect();
                return coords.top >= editorRect.top && coords.bottom <= editorRect.bottom;
            }
        }

        return true;
    }
}
