import AutoRenumbering from "../main";
import { Editor } from "obsidian";

export function registerCommands(plugin: AutoRenumbering) {
    plugin.addCommand({
        id: "renumber-note",
        name: "Renumber all numbered lists in note",
        editorCallback: (editor: Editor) => {
            plugin.getRenumberer().allListsInRange(editor, plugin.getChanges(), 0, editor.lastLine());
            plugin.getRenumberer().applyChangesToEditor(editor, plugin.getChanges());
        },
    });

    plugin.addCommand({
        id: "renumber-selection",
        name: "Renumber all selected numbered lists",
        editorCallback: (editor: Editor) => {
            const { anchor, head } = editor.listSelections()[0];
            const startLine = Math.min(anchor.line, head.line);
            const endLine = Math.max(anchor.line, head.line);

            plugin.getRenumberer().allListsInRange(editor, plugin.getChanges(), startLine, endLine);
            plugin.getRenumberer().applyChangesToEditor(editor, plugin.getChanges());
        },
    });

    plugin.addCommand({
        id: "renumber-block-at-cursor",
        name: "Renumber at cursor position",
        editorCallback: (editor: Editor) => {
            plugin.setIsProcessing(true);
            plugin.getRenumberer().listAtCursor(editor, plugin.getChanges());
            plugin.getRenumberer().applyChangesToEditor(editor, plugin.getChanges());
            plugin.setIsProcessing(false);
        },
    });
}
