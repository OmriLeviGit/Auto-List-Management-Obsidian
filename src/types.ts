import { Editor, EditorChange } from "obsidian";

interface RenumberingStrategy {
    renumber(editor: Editor, startLine: number, isLocal?: boolean): PendingChanges;
}

interface PendingChanges {
    changes: EditorChange[];
    endIndex: number | undefined;
}

interface LineInfo {
    spaceCharsNum: number;
    spaceIndent: number;
    number: number | undefined;
    textIndex: number | undefined;
}

interface RenumberListSettings {
    liveUpdate: boolean;
    smartPaste: boolean;
    startsFromOne: boolean;
    indentSize: number;
}

interface PendingChanges {
    changes: EditorChange[];
    endIndex: number | undefined;
}

export type { RenumberingStrategy, PendingChanges, LineInfo, RenumberListSettings };
