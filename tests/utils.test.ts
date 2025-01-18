import "./__mocks__/main";
import { createMockEditor } from "./__mocks__/createMockEditor";

import { getLineInfo, getListStart, getLastListStart, getPrevItemIndex } from "src/utils";

describe("getLineInfo tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testCases = [
        {
            name: "single digit line",
            input: "1. text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: 1, textIndex: 3 },
        },
        {
            name: "multiple digits line",
            input: "123. text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: 123, textIndex: 5 },
        },
        {
            name: "no digits line",
            input: ". text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: undefined, textIndex: undefined },
        },
        {
            name: "line with leading spaces",
            input: "  1. test",
            expected: { spaceCharsNum: 2, spaceIndent: 2, number: 1, textIndex: 5 },
        },
        {
            name: "line with leading tab",
            input: "\t1. test",
            expected: { spaceCharsNum: 1, spaceIndent: 4, number: 1, textIndex: 4 },
        },
        {
            name: "line with leading two spaces and a tab",
            input: "  \t12. test",
            expected: { spaceCharsNum: 3, spaceIndent: 6, number: 12, textIndex: 7 },
        },
        {
            name: "line with leading space and two tab",
            input: " \t\t12. test",
            expected: { spaceCharsNum: 3, spaceIndent: 9, number: 12, textIndex: 7 },
        },
        {
            name: "line without number and with trailing spaceCharsNum",
            input: "  . text   ",
            expected: { spaceCharsNum: 2, spaceIndent: 2, number: undefined, textIndex: undefined },
        },
        {
            name: "line with invalid format",
            input: "A text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: undefined, textIndex: undefined },
        },
    ];

    testCases.forEach(({ name, input, expected }) => {
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
            expectedResult: undefined,
        },
        {
            name: "Numbered lines at the end",
            content: ["a", "b", "1. c", "2. d"],
            expectedResult: 2,
        },
        {
            name: "Interrupted numbered list at the end",
            content: ["a", "1. b", "2. c", "d", "3. e"],
            expectedResult: 4,
        },
        {
            name: "Single number",
            content: ["1. a"],
            expectedResult: 0,
        },
        {
            name: "Single non number",
            content: ["a"],
            expectedResult: undefined,
        },
        {
            name: "Empty string",
            content: [""],
            expectedResult: undefined,
        },
    ];

    testCases.forEach(({ name, content, expectedResult }) => {
        test(name, () => {
            const res = getLastListStart(content);
            expect(res).toBe(expectedResult);
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
