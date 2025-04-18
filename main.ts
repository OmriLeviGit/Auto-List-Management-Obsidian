import { Plugin, Editor, EditorPosition, MarkdownView } from "obsidian";
import { handlePaste, handleDrop } from "src/pasteAndDropHandler";
import { registerCommands } from "src/command-registration";
import Renumberer from "src/Renumberer";
import PluginSettings from "./src/settings-tab";
import SettingsManager, { DEFAULT_SETTINGS } from "src/SettingsManager";
import { reorderChecklist } from "src/checkbox";
import { ReorderResult } from "src/types";
import { EditorView } from "@codemirror/view";

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
        this.blockChanges = true; // Prevents multiple renumbering/checkbox updates. Reset to false on mouse/keyboard input

        const posToReturn = editor.getCursor();

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
                setTimeout(() => {
                    this.applyReordering(editor);
                });
            })
        );

        // editor-paste listener
        this.registerEvent(
            this.app.workspace.on("editor-paste", (evt: ClipboardEvent, editor: Editor) => {
                const { start, end } = handlePaste.call(this, evt, editor);
                // console.log(`start: ${start}, end: ${end}`);
                this.blockChanges = false;
                this.applyReordering(editor, start, end);
            })
        );

        // editor-drop listener
        this.registerEvent(
            this.app.workspace.on("editor-drop", (evt: DragEvent, editor: Editor) => {
                const { start, end } = handleDrop.call(this, evt, editor);
                this.blockChanges = false;
                this.applyReordering(editor, start, end);
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
        this.blockChanges = event.ctrlKey || event.metaKey || event.altKey;
    }

    //  mouse listener
    async handleMouseClick(event: MouseEvent) {
        try {
            if (!this.settingsManager.getLiveCheckboxUpdate()) {
                return;
            }
            this.checkboxClickedAt = undefined;
            const target = event.target as HTMLElement;
            if (target.matches('[type="checkbox"]')) {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView?.editor.hasFocus()) {
                    // @ts-expect-error, not typed
                    const editorView = activeView.editor.cm as EditorView;
                    const editor = activeView.editor; // obsidian's editor
                    const pos = editorView.posAtCoords({ x: event.clientX, y: event.clientY });

                    if (pos) {
                        this.checkboxClickedAt = editor.offsetToPos(pos).line;
                    }
                }
            }
        } catch (error) {
            console.error("Error in handleMouseClick:", error);
            this.checkboxClickedAt = undefined;
        } finally {
            this.blockChanges = false;
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
