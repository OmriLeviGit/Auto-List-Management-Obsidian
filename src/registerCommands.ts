import AutoRenumbering from "../main";
import { Editor } from "obsidian";

export function registerCommands(plugin: AutoRenumbering) {
    plugin.addCommand({
        id: "renumber-file",
        name: "Renumber all numbered lists in file",
        editorCallback: (editor: Editor) => {
            plugin.renumberer.allListsInRange(editor, plugin.changes, 0, editor.lastLine());
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

            plugin.renumberer.allListsInRange(editor, plugin.changes, startLine, endLine);
            plugin.renumberer.applyChangesToEditor(editor, plugin.changes);
        },
    });

    plugin.addCommand({
        id: "renumber-block-at-cursor",
        name: "Renumber at current cursor position",
        editorCallback: (editor: Editor) => {
            plugin.isProccessing = true;
            plugin.renumberer.listAtCursor(editor, plugin.changes);
            plugin.renumberer.applyChangesToEditor(editor, plugin.changes);
            plugin.isProccessing = false;
        },
    });
}
