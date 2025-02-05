import AutoReordering from "../main";
import { Editor } from "obsidian";

export function registerCommands(plugin: AutoReordering) {
    plugin.addCommand({
        id: "1-selection",
        name: "Renumber selected lists or at cursor position",
        editorCallback: (editor: Editor) => {
            const { anchor, head } = editor.listSelections()[0];
            const startLine = Math.min(anchor.line, head.line);
            const endLine = Math.max(anchor.line, head.line) + 1;

            plugin.getRenumberer().renumber(editor, startLine, endLine);
        },
    });

    plugin.addCommand({
        id: "2-entire-note",
        name: "Renumber all numbered lists in note",
        editorCallback: (editor: Editor) => {
            plugin.getRenumberer().renumber(editor, 0, editor.lastLine() + 1);
        },
    });
}
