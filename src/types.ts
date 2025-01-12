import { Editor, EditorChange } from "obsidian";

interface RenumberingStrategy {
    renumber(editor: Editor, startLine: number, isLocal?: boolean): PendingChanges;
}

interface PendingChanges {
    changes: EditorChange[];
    endIndex: number;
}

interface ChangeResult {
    changes: EditorChange[];
    revisitIndices: number[];
    endIndex: number;
}

interface LineInfo {
    spaceCharsNum: number;
    spaceIndent: number;
    number: number | undefined;
    textIndex: number | undefined;
}

interface RenumberListSettings {
    liveUpdate: boolean;
    smartPasting: boolean;
    startsFromOne: boolean;
    indentSize: number;
}

export type { RenumberingStrategy, PendingChanges, ChangeResult, LineInfo, RenumberListSettings };
