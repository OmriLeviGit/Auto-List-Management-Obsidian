import AutoReordering from "../main";
import { Editor } from "obsidian";
import { reorderChecklist } from "./checkbox";
import SettingsManager from "./SettingsManager";

export function registerCommands(plugin: AutoReordering) {
    plugin.addCommand({
        id: "1-reneumber-selection",
        name: "Renumber selected lists or the list at the cursor position",
        editorCallback: (editor: Editor) => {
            const { anchor, head } = editor.listSelections()[0];
            const startLine = Math.min(anchor.line, head.line);
            const endLine = Math.max(anchor.line, head.line) + 1;

            plugin.getRenumberer().renumber(editor, startLine, endLine);
        },
    });

    plugin.addCommand({
        id: "2-renumber-entire-note",
        name: "Renumber all numbered lists in note",
        editorCallback: (editor: Editor) => {
            plugin.getRenumberer().renumber(editor, 0, editor.lastLine() + 1);
        },
    });

    plugin.addCommand({
        id: "3-checklist-entire-note",
        name: "Reorder checklist at cursor position",
        editorCallback: (editor: Editor) => {
            const posToReturn = editor.getCursor();
            const renumberer = plugin.getRenumberer();

            const selection = editor.listSelections()[0];
            const currIndex = Math.min(selection.anchor.line, selection.head.line);

            const reorderData = reorderChecklist(editor, currIndex);

            // Handle numbering updates
            if (SettingsManager.getInstance().getLiveNumberingUpdate() === true) {
                if (reorderData !== undefined) {
                    // if reordered checkbox, renumber between the original location and the new one
                    renumberer.renumber(editor, reorderData.start, reorderData.limit);
                } else {
                    renumberer.renumber(editor, currIndex);
                }
            }

            plugin.updateCursorPosition(editor, posToReturn, reorderData);
        },
    });
}
