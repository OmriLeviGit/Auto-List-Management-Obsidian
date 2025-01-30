interface LineInfo {
    spaceCharsNum: number; // number of space characters (\t or ' ' both count as 1)
    spaceIndent: number; // the indentation size, i.e. if \t is set to be 4 then '\t ' is an indent of 5
    number: number | undefined;
    textIndex: number;
    isChecked: boolean | undefined;
}

interface RenumberListSettings {
    liveNumberingUpdate: boolean;
    smartPasting: boolean;
    startsFromOne: boolean;
    indentSize: number;
    liveCheckboxUpdate: boolean;
    sortCheckboxesToBottom: boolean;
}

export type { LineInfo, RenumberListSettings };
