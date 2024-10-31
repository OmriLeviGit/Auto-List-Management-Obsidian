import { createMockEditor } from "./__mocks__/createMockEditor";
import { getLineInfo, getListStart, getLastListIndex } from "../src/utils";

describe("getLineInfo tests", () => {
    const testCases = [
        {
            name: "single digit line",
            input: "1. text",
            expected: { numOfSpaceChars: 0, spaceIndent: 0, number: 1, textOffset: 3 },
        },
        {
            name: "multiple digits line",
            input: "123. text",
            expected: { numOfSpaceChars: 0, spaceIndent: 0, number: 123, textOffset: 5 },
        },
        {
            name: "no digits line",
            input: ". text",
            expected: { numOfSpaceChars: 0, spaceIndent: 0, number: undefined, textOffset: undefined },
        },
        {
            name: "line with leading spaces",
            input: "  1. test",
            expected: { numOfSpaceChars: 2, spaceIndent: 2, number: 1, textOffset: 5 },
        },
        {
            name: "line with leading tab",
            input: "\t1. test",
            expected: { numOfSpaceChars: 1, spaceIndent: 4, number: 1, textOffset: 4 },
        },
        {
            name: "line with leading two spaces and a tab",
            input: "  \t12. test",
            expected: { numOfSpaceChars: 3, spaceIndent: 6, number: 12, textOffset: 7 },
        },
        {
            name: "line with leading space and two tab",
            input: " \t\t12. test",
            expected: { numOfSpaceChars: 3, spaceIndent: 9, number: 12, textOffset: 7 },
        },
        {
            name: "line without number and with trailing numOfSpaceChars",
            input: "  . text   ",
            expected: { numOfSpaceChars: 2, spaceIndent: 2, number: undefined, textOffset: undefined },
        },
        {
            name: "line with invalid format",
            input: "A text",
            expected: { numOfSpaceChars: 0, spaceIndent: 0, number: undefined, textOffset: undefined },
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
            expected: undefined,
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

describe("getLastListIndex tests", () => {
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
            const res = getLastListIndex(content);
            expect(res).toBe(expectedResult);
        });
    });
});
