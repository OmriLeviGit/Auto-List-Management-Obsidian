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
    spaceCharsNum: number; // number of space characters (\t or ' ' both count as 1)
    spaceIndent: number; // the indentation size, i.e. if \t is set to be 4 then '\t ' is an indent of 5
    number: number | undefined;
    textOffset: number;
    checkboxChar: string | undefined;
}

interface PluginSettings {
    renumbering: RenumberingSettings;
    checklist: ChecklistSettings;
    indentSize: number;
}

interface RenumberingSettings {
    liveUpdate: boolean;
    smartPasting: boolean;
    startsFromOne: boolean;
}

interface ChecklistSettings {
    liveUpdate: boolean;
    sortToTop: boolean;
    charsToDelete: string;
}

interface ReorderResult {
    start: number;
    limit: number;
}

export type {
    RenumberingStrategy,
    PendingChanges,
    ChangeResult,
    LineInfo,
    PluginSettings,
    RenumberingSettings,
    ChecklistSettings,
    ReorderResult,
};
