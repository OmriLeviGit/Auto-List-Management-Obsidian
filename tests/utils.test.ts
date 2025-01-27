import "./__mocks__/main";
import { createMockEditor } from "./__mocks__/createMockEditor";

import { getLineInfo, getListStart, getLastListStart, getPrevItemIndex } from "src/utils";

describe("getLineInfo numbering tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testCases = [
        {
            name: "single digit line",
            input: "1. text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: 1, textIndex: 3, isChecked: undefined },
        },
        {
            name: "multiple digits line",
            input: "123. text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: 123, textIndex: 5, isChecked: undefined },
        },
        {
            name: "no digits line",
            input: ". text",
            expected: {
                spaceCharsNum: 0,
                spaceIndent: 0,
                number: undefined,
                textIndex: 0,
                isChecked: undefined,
            },
        },
        {
            name: "line with leading spaces",
            input: "  1. test",
            expected: { spaceCharsNum: 2, spaceIndent: 2, number: 1, textIndex: 5, isChecked: undefined },
        },
        {
            name: "line with leading tab",
            input: "\t1. test",
            expected: { spaceCharsNum: 1, spaceIndent: 4, number: 1, textIndex: 4, isChecked: undefined },
        },
        {
            name: "line with leading two spaces and a tab",
            input: "  \t12. test",
            expected: { spaceCharsNum: 3, spaceIndent: 6, number: 12, textIndex: 7, isChecked: undefined },
        },
        {
            name: "line with leading space and two tab",
            input: " \t\t12. test",
            expected: { spaceCharsNum: 3, spaceIndent: 9, number: 12, textIndex: 7, isChecked: undefined },
        },
        {
            name: "line without number and with trailing spaceCharsNum",
            input: "  . text   ",
            expected: {
                spaceCharsNum: 2,
                spaceIndent: 2,
                number: undefined,
                textIndex: 2,
                isChecked: undefined,
            },
        },
        {
            name: "line with invalid format",
            input: "A text",
            expected: {
                spaceCharsNum: 0,
                spaceIndent: 0,
                number: undefined,
                textIndex: 0,
                isChecked: undefined,
            },
        },
    ];

    testCases.forEach(({ name, input, expected }) => {
        test(name, () => {
            const result = getLineInfo(input);
            expect(result).toEqual(expected);
        });
    });
});

describe("getLineInfo checkbox tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const checkboxTestCases = [
        {
            name: "Test with unchecked checkbox at the start of a line",
            input: "- [ ] text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: undefined, textIndex: 0, isChecked: false },
        },
        {
            name: "Test with checked checkbox at the start of a line",
            input: "- [x] text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: undefined, textIndex: 0, isChecked: true },
        },
        {
            name: "Test with unchecked checkbox with space at the start",
            input: " - [ ] text",
            expected: { spaceCharsNum: 1, spaceIndent: 1, number: undefined, textIndex: 1, isChecked: false },
        },
        {
            name: "Test with checked checkbox with space at the start",
            input: " - [x] text",
            expected: { spaceCharsNum: 1, spaceIndent: 1, number: undefined, textIndex: 1, isChecked: true },
        },
        {
            name: "Test with unchecked checkbox with tab indentation",
            input: "\t- [ ] text",
            expected: { spaceCharsNum: 1, spaceIndent: 4, number: undefined, textIndex: 1, isChecked: false },
        },
        {
            name: "Test with checked checkbox with tab indentation",
            input: "\t- [x] text",
            expected: { spaceCharsNum: 1, spaceIndent: 4, number: undefined, textIndex: 1, isChecked: true },
        },
        {
            name: "Test with unchecked checkbox in numbered list",
            input: "123. [ ] text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: 123, textIndex: 5, isChecked: false },
        },
        {
            name: "Test checkbox with more spaces between the numbering and the checkbox",
            input: "123.    [ ] text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: 123, textIndex: 5, isChecked: false },
        },
        {
            name: "Test with checked checkbox in numbered list",
            input: "123. [x] text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: 123, textIndex: 5, isChecked: true },
        },
        {
            name: "Test with unchecked checkbox and leading space in numbered list",
            input: " 123. [ ] text",
            expected: { spaceCharsNum: 1, spaceIndent: 1, number: 123, textIndex: 6, isChecked: false },
        },
        {
            name: "Test with checked checkbox and leading space in numbered list",
            input: " 123. [x] text",
            expected: { spaceCharsNum: 1, spaceIndent: 1, number: 123, textIndex: 6, isChecked: true },
        },
        {
            name: "Test with unchecked checkbox and tab indentation in numbered list",
            input: "\t123. [ ] text",
            expected: { spaceCharsNum: 1, spaceIndent: 4, number: 123, textIndex: 6, isChecked: false },
        },
        {
            name: "Test with checked checkbox and tab indentation in numbered list",
            input: "\t123. [x] text",
            expected: { spaceCharsNum: 1, spaceIndent: 4, number: 123, textIndex: 6, isChecked: true },
        },
    ];

    checkboxTestCases.forEach(({ name, input, expected }) => {
        test(name, () => {
            const result = getLineInfo(input);
            expect(result).toEqual(expected);
        });
    });
});

describe("getListStart tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testCases = [
        {
            name: "start of a list",
            content: ["1. item 1", "2. item 2"],
            index: 1,
            expected: 0,
        },
        {
            name: "middle of a list",
            content: ["1. item 1", "2. item 2", "3. item 3"],
            index: 2,
            expected: 0,
        },
        {
            name: "no number in the line",
            content: ["1. item 1", "2. item 2", "not a number"],
            index: 2,
            expected: 2,
        },
        {
            name: "accessing a negative line index",
            content: ["1. item 1", "2. item 2"],
            index: -1,
            expected: undefined,
        },
        {
            name: "out of bounds line index",
            content: ["1. item 1", "2. item 2"],
            index: 3,
            expected: undefined,
        },
        {
            name: "only empty lines above",
            content: ["", "", "3. item 3"],
            index: 2,
            expected: 2,
        },
        {
            name: "indented",
            content: ["1. text", " 1. text", "2. text"],
            index: 2,
            expected: 0,
        },
    ];

    testCases.forEach(({ name, content, index, expected }) => {
        test(name, () => {
            const editor = createMockEditor(content);
            const result = getListStart(editor, index);
            expect(result).toBe(expected);
        });
    });
});

describe("getLastListStart tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testCases = [
        {
            name: "Does not end in numbered list",
            content: ["1. b", "c"],
            expected: undefined,
        },
        {
            name: "Numbered lines at the end",
            content: ["a", "b", "1. c", "2. d"],
            expected: 2,
        },
        {
            name: "Interrupted numbered list at the end",
            content: ["a", "1. b", "2. c", "d", "3. e"],
            expected: 4,
        },
        {
            name: "Single number",
            content: ["1. a"],
            expected: 0,
        },
        {
            name: "Single non number",
            content: ["a"],
            expected: undefined,
        },
        {
            name: "Empty string",
            content: [""],
            expected: undefined,
        },
    ];

    testCases.forEach(({ name, content, expected }) => {
        test(name, () => {
            const res = getLastListStart(content);
            expect(res).toBe(expected);
        });
    });
});

describe("getPrevItemIndex tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testCases = [
        {
            name: "First",
            content: ["1. a", "2. b"],
            index: 0,
            expectedResult: undefined,
        },
        {
            name: "Not first",
            content: ["1. a", "2. b"],
            index: 1,
            expectedResult: 0,
        },
        {
            name: "One item",
            content: ["1. a"],
            index: 0,
            expectedResult: undefined,
        },
        {
            name: "One item indented",
            content: [" 1. a"],
            index: 0,
            expectedResult: undefined,
        },
        {
            name: "First indented",
            content: ["1. a", " 2. b"],
            index: 1,
            expectedResult: undefined,
        },
        {
            name: "Second indented",
            content: ["1. a", " 2. b", " 3. b"],
            index: 2,
            expectedResult: 1,
        },
        {
            name: "Second with indent in the middle",
            content: ["1. a", " 2. b", "3. c"],
            index: 2,
            expectedResult: 0,
        },
        {
            name: "Lower indent in the middle",
            content: ["1. a", " 2. b", "3. c", " 4. d"],
            index: 3,
            expectedResult: undefined,
        },
        {
            name: "Text alone",
            content: ["text"],
            index: 0,
            expectedResult: undefined,
        },
        {
            name: "Text before",
            content: ["text", "1. a"],
            index: 1,
            expectedResult: undefined,
        },
        {
            name: "Text before indented",
            content: ["text", " 1. a"],
            index: 1,
            expectedResult: undefined,
        },
        {
            name: "Indented text before indented",
            content: [" text", " 1. a"],
            index: 1,
            expectedResult: undefined,
        },
    ];

    testCases.forEach(({ name, content, index, expectedResult }) => {
        test(name, () => {
            const editor = createMockEditor(content);
            const res = getPrevItemIndex(editor, index);
            expect(res).toBe(expectedResult);
        });
    });
});
