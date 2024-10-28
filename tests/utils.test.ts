import { createMockEditor } from "./__mocks__/createMockEditor";
import { getLineInfo, getListStart } from "../src/utils";

describe("getLineInfo tests", () => {
    const testCases = [
        {
            name: "single digit line",
            input: "1. text",
            expected: { spaces: 0, number: 1, textOffset: 3 },
        },
        {
            name: "multiple digits line",
            input: "123. text",
            expected: { spaces: 0, number: 123, textOffset: 5 },
        },
        {
            name: "no digits line",
            input: ". text",
            expected: { spaces: 0, number: undefined, textOffset: undefined },
        },
        {
            name: "line with leading spaces",
            input: "  1. test",
            expected: { spaces: 2, number: 1, textOffset: 5 },
        },
        {
            name: "line without number and with trailing spaces",
            input: "  . text   ",
            expected: { spaces: 2, number: undefined, textOffset: undefined },
        },
        {
            name: "line with invalid format",
            input: "A text",
            expected: { spaces: 0, number: undefined, textOffset: undefined },
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
