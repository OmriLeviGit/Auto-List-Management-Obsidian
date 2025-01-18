import AutoRenumbering from "../main";
import { Editor } from "obsidian";

export function registerCommands(plugin: AutoRenumbering) {
    plugin.addCommand({
        id: "1-at-cursor",
        name: "At cursor",
        // editorCallback: (editor: Editor) => {
        //     plugin.setIsProcessing(true);
        //     plugin.getRenumberer().renumberAtCursor(editor);
        //     plugin.setIsProcessing(false);
        // },
        editorCallback: (editor: Editor) => {
            const { anchor, head } = editor.listSelections()[0];
            const startLine = Math.min(anchor.line, head.line);
            const endLine = Math.max(anchor.line, head.line) + 1;

            console.log(`startline: ${startLine}, endline: ${endLine}`);

            plugin.getRenumberer().renumberAllInRange(editor, startLine, endLine);
        },
    });

    plugin.addCommand({
        id: "1-selection",
        name: "At cursor position or selected lists",
        editorCallback: (editor: Editor) => {
            const { anchor, head } = editor.listSelections()[0];
            const startLine = Math.min(anchor.line, head.line);
            const endLine = Math.max(anchor.line, head.line) + 1;

            plugin.getRenumberer().renumberAllInRange(editor, startLine, endLine);
        },
    });

    plugin.addCommand({
        id: "3-entire-note",
        name: "All numbered lists note",
        editorCallback: (editor: Editor) => {
            plugin.getRenumberer().renumberAllInRange(editor, 0, editor.lastLine() + 1);
        },
    });
}
