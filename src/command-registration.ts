import AutoReordering from "../main";
import { Editor } from "obsidian";
import { reorderChecklist, deleteChecked } from "./checkbox";
import SettingsManager from "./SettingsManager";

export function registerCommands(plugin: AutoReordering) {
    plugin.addCommand({
        id: "1-reneumber-selection",
        name: "Renumber lists: in selection or at cursor",
        editorCallback: (editor: Editor) => {
            const { anchor, head } = editor.listSelections()[0];
            const startLine = Math.min(anchor.line, head.line);
            const endLine = Math.max(anchor.line, head.line) + 1;

            plugin.getRenumberer().renumber(editor, startLine, endLine);
        },
    });

    plugin.addCommand({
        id: "2-renumber-entire-note",
        name: "Renumber lists: entire note",
        editorCallback: (editor: Editor) => {
            plugin.getRenumberer().renumber(editor, 0, editor.lastLine() + 1);
        },
    });

    plugin.addCommand({
        id: "3-checklist-at-cursor",
        name: "Reorder checkboxes: in selection or at cursor",
        editorCallback: (editor: Editor) => {
            const posToReturn = editor.getCursor();
            const renumberer = plugin.getRenumberer();

            const { anchor, head } = editor.listSelections()[0];
            const startLine = Math.min(anchor.line, head.line);
            const endLine = Math.max(anchor.line, head.line) + 1;

            const reorderResult = reorderChecklist(editor, startLine, endLine);

            if (SettingsManager.getInstance().getLiveNumberingUpdate() === true) {
                if (reorderResult !== undefined) {
                    renumberer.renumber(editor, reorderResult.start, reorderResult.limit);
                }
            }

            plugin.updateCursorPosition(editor, posToReturn, reorderResult);
        },
    });

    plugin.addCommand({
        id: "4-checklist-entire-note",
        name: "Reorder checkboxes: entire note",
        editorCallback: (editor: Editor) => {
            const lineToReturn = editor.getCursor().line;
            const renumberer = plugin.getRenumberer();

            const reorderResult = reorderChecklist(editor, 0, editor.lastLine() + 1);

            if (SettingsManager.getInstance().getLiveNumberingUpdate() === true) {
                if (reorderResult !== undefined) {
                    renumberer.renumber(editor, reorderResult.start, reorderResult.limit);
                }
            }

            editor.setCursor({ line: lineToReturn, ch: editor.getLine(lineToReturn).length });
        },
    });

    plugin.addCommand({
        id: "5-checklist-delete-checked-items",
        name: "Delete checked Items",
        editorCallback: (editor: Editor) => {
            const lineToReturn = editor.getCursor().line;
            const renumberer = plugin.getRenumberer();

            const deleteResult = deleteChecked(editor);

            if (SettingsManager.getInstance().getLiveNumberingUpdate() === true) {
                renumberer.renumber(editor, deleteResult.start, deleteResult.limit);
            }

            editor.setCursor({ line: lineToReturn, ch: editor.getLine(lineToReturn).length });
        },
    });
}
