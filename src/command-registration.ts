import AutoRenumbering from "../main";
import { Editor } from "obsidian";

export function registerCommands(plugin: AutoRenumbering) {
    plugin.addCommand({
        id: "1-cursor",
        name: "At cursor position",
        editorCallback: (editor: Editor) => {
            plugin.setIsProcessing(true);
            plugin.getRenumberer().listAtCursor(editor);
            plugin.setIsProcessing(false);
        },
    });

    plugin.addCommand({
        id: "2-selection",
        name: "All selected numbered lists",
        editorCallback: (editor: Editor) => {
            const { anchor, head } = editor.listSelections()[0];
            const startLine = Math.min(anchor.line, head.line);
            const endLine = Math.max(anchor.line, head.line);

            plugin.getRenumberer().allListsInRange(editor, startLine, endLine);
        },
    });

    plugin.addCommand({
        id: "3-note",
        name: "All numbered lists in the entire note",
        editorCallback: (editor: Editor) => {
            plugin.getRenumberer().allListsInRange(editor, 0, editor.lastLine());
        },
    });
}
