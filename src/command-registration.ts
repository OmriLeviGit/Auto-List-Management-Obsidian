import AutoRenumbering from "../main";
import { Editor } from "obsidian";

export function registerCommands(plugin: AutoRenumbering) {
    plugin.addCommand({
        id: "at-cursor",
        name: "At cursor position",
        editorCallback: (editor: Editor) => {
            plugin.setIsProcessing(true);
            plugin.getRenumberer().listAtCursor(editor);
            plugin.setIsProcessing(false);
        },
    });

    plugin.addCommand({
        id: "selection",
        name: "Selected lists",
        editorCallback: (editor: Editor) => {
            const { anchor, head } = editor.listSelections()[0];
            const startLine = Math.min(anchor.line, head.line);
            const endLine = Math.max(anchor.line, head.line);

            plugin.getRenumberer().allListsInRange(editor, startLine, endLine);
        },
    });

    plugin.addCommand({
        id: "entire-note",
        name: "All numbered lists note",
        editorCallback: (editor: Editor) => {
            plugin.getRenumberer().allListsInRange(editor, 0, editor.lastLine());
        },
    });
}
