import { createMockEditor } from "./__mocks__/createMockEditor";
import { getLineInfo, getListStart } from "../src/utils";

// describe("getLineInfo tests", () => {
//     test("single digit line", () => {
//         const line = "1. text";
//         const result = getLineInfo(line);
//         expect(result).toEqual({ spaces: 0, number: 1, textOffset: 3 });
//     });

//     test("multiple digits line", () => {
//         const line = "123. text";
//         const result = getLineInfo(line);
//         expect(result).toEqual({ spaces: 0, number: 123, textOffset: 5 });
//     });

//     test("no digits line", () => {
//         const line = ". text";
//         const result = getLineInfo(line);
//         expect(result).toEqual({ spaces: 0, number: undefined, textOffset: undefined });
//     });

//     test("line with leading spaces", () => {
//         const line = "  1. test";
//         const result = getLineInfo(line);
//         expect(result).toEqual({ spaces: 2, number: 1, textOffset: 5 });
//     });

//     test("line without number and with trailing spaces", () => {
//         const line = "  . text   ";
//         const result = getLineInfo(line);
//         expect(result).toEqual({ spaces: 2, number: undefined, textOffset: undefined });
//     });

//     test("line with invalid format", () => {
//         const line = "A text";
//         const result = getLineInfo(line);
//         expect(result).toEqual({ spaces: 0, number: undefined, textOffset: undefined });
//     });
// });

describe("getListStart tests", () => {
    test("start of a list", () => {
        const content = ["1. item 1", "2. item 2"];
        const editor = createMockEditor(content);
        expect(getListStart(editor, 1)).toBe(0);
    });

    test("middle of a list", () => {
        const content = ["1. item 1", "2. item 2", "3. item 3"];
        const editor = createMockEditor(content);
        expect(getListStart(editor, 2)).toBe(0);
    });

    test("no number in the line", () => {
        const content = ["1. item 1", "2. item 2", "not a number"];
        const editor = createMockEditor(content);
        expect(getListStart(editor, 2)).toBeUndefined();
    });

    test("accessing a negative line index", () => {
        const content = ["1. item 1", "2. item 2"];
        const editor = createMockEditor(content);
        expect(getListStart(editor, -1)).toBeUndefined();
    });

    test("out of bounds line index", () => {
        const content = ["1. item 1", "2. item 2"];
        const editor = createMockEditor(content);
        expect(getListStart(editor, 3)).toBeUndefined();
    });

    test("only empty lines above", () => {
        const content = ["", "", "3. item 3"];
        const editor = createMockEditor(content);
        expect(getListStart(editor, 2)).toBe(2); // Starts at the same line
    });
});
