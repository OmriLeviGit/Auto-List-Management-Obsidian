import { Plugin, Editor, EditorChange } from "obsidian";
import Renumberer from "src/Renumberer";
import { modifyText, countNewlines, handlePaste } from "./src/pasteHandler";
import { Mutex } from "async-mutex";
import AutoRenumberingSettings from "./src/settings";
import { registerCommands } from "src/registerCommands";
import { getLineInfo } from "src/utils";

const mutex = new Mutex();

interface RenumberListSettings {
    liveUpdate: boolean;
    smartPaste: boolean;
}

const DEFAULT_SETTINGS: RenumberListSettings = {
    liveUpdate: true,
    smartPaste: true,
};

export default class AutoRenumbering extends Plugin {
    settings: RenumberListSettings;
    renumberer: Renumberer;
    changes: EditorChange[] = [];
    isProccessing = false;
    blockChanges = false; // if the previous action was a special key
    handleKeystrokeBound: (event: KeyboardEvent) => void;

    async onload() {
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
                    console.log("editor called");

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
                console.log("paste is called");
                if (this.settings.liveUpdate === false) {
                    return;
                }

                if (evt.defaultPrevented) {
                    return;
                }

                evt.preventDefault();

                mutex.runExclusive(() => {
                    this.blockChanges = true;

                    let textFromClipboard = evt.clipboardData?.getData("text");
                    if (!textFromClipboard) {
                        return;
                    }
                    const { baseIndex, offset } = handlePaste(editor, textFromClipboard, this.settings.smartPaste);
                    /*
                    const { anchor, head } = editor.listSelections()[0];
                    const baseIndex = Math.min(anchor.line, head.line);

                    let numOfLines: number;

                    if (this.settings.smartPaste) {
                        const afterPasteIndex = Math.max(anchor.line, head.line) + 1;
                        const line = editor.getLine(afterPasteIndex);
                        const info = getLineInfo(line);

                        if (info.number !== undefined) {
                            const retval = modifyText(textFromClipboard, info.number);
                            textFromClipboard = retval.modifiedText ?? textFromClipboard;
                            numOfLines = retval.numOfLines;
                        } else {
                            numOfLines = countNewlines(textFromClipboard);
                        }
                    } else {
                        numOfLines = countNewlines(textFromClipboard);
                    }

                    const lastIndex = baseIndex + numOfLines;
                    // console.debug("base: ", baseIndex, "last:", lastIndex);
                    editor.replaceSelection(textFromClipboard); // paste
                    */
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
            // console.log("handlestroke", this.blockChanges);
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
}
