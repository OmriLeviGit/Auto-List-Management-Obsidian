import AutoRenumbering from "../main";
import { Editor } from "obsidian";

export function registerCommands(plugin: AutoRenumbering) {
    plugin.addCommand({
        id: "renumber-file",
        name: "Renumber all numbered lists in file",
        editorCallback: (editor: Editor) => {
            plugin.renumberer.renumberAllListsInRange(editor, plugin.changes, 0, editor.lastLine());
            plugin.renumberer.applyChangesToEditor(editor, plugin.changes);
        },
    });

    plugin.addCommand({
        id: "renumber-selection",
        name: "Renumber all selected numbered lists",
        editorCallback: (editor: Editor) => {
            const { anchor, head } = editor.listSelections()[0];
            const startLine = Math.min(anchor.line, head.line);
            const endLine = Math.max(anchor.line, head.line);

            plugin.renumberer.renumberAllListsInRange(editor, plugin.changes, startLine, endLine);
            plugin.renumberer.applyChangesToEditor(editor, plugin.changes);
        },
    });

    plugin.addCommand({
        id: "renumber-block",
        name: "Renumber the numbered list at cursor location",
        editorCallback: (editor: Editor) => {
            plugin.isProccessing = true;
            plugin.renumberer.renumberListAtCursor(editor, plugin.changes);
            plugin.renumberer.applyChangesToEditor(editor, plugin.changes);
            plugin.isProccessing = false;
        },
    });
}
