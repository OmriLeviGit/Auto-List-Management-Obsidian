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
    textIndex: number;
    isChecked: boolean | undefined;
}

interface PluginSettings {
    liveNumberingUpdate: boolean;
    smartPasting: boolean;
    startsFromOne: boolean;
    indentSize: number;
    liveCheckboxUpdate: boolean;
    checklistSortPosition: string;
}

interface ReorderData {
    start: number;
    limit: number;
    placeCursorAt: number;
}

export type { RenumberingStrategy, PendingChanges, ChangeResult, LineInfo, PluginSettings, ReorderData };
