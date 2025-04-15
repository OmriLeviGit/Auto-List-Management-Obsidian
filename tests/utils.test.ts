import "./__mocks__/main";
import { createMockEditor } from "./__mocks__/createMockEditor";

import {
    getLineInfo,
    getListStart,
    findFirstNumbersByIndentFromEnd,
    getPrevItemIndex,
    findFirstNumbersAfterIndex,
} from "src/utils";

describe("getLineInfo numbering tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testCases = [
        {
            name: "single digit line",
            input: "1. text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: 1, textOffset: 3, checkboxChar: undefined },
        },
        {
            name: "multiple digits line",
            input: "123. text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: 123, textOffset: 5, checkboxChar: undefined },
        },
        {
            name: "no digits line",
            input: ". text",
            expected: {
                spaceCharsNum: 0,
                spaceIndent: 0,
                number: undefined,
                textOffset: 0,
                checkboxChar: undefined,
            },
        },
        {
            name: "line with leading spaces",
            input: "  1. test",
            expected: { spaceCharsNum: 2, spaceIndent: 2, number: 1, textOffset: 5, checkboxChar: undefined },
        },
        {
            name: "line with leading tab",
            input: "\t1. test",
            expected: { spaceCharsNum: 1, spaceIndent: 4, number: 1, textOffset: 4, checkboxChar: undefined },
        },
        {
            name: "line with leading two spaces and a tab",
            input: "  \t12. test",
            expected: { spaceCharsNum: 3, spaceIndent: 6, number: 12, textOffset: 7, checkboxChar: undefined },
        },
        {
            name: "line with leading space and two tab",
            input: " \t\t12. test",
            expected: { spaceCharsNum: 3, spaceIndent: 9, number: 12, textOffset: 7, checkboxChar: undefined },
        },
        {
            name: "line without number and with trailing spaceCharsNum",
            input: "  . text   ",
            expected: {
                spaceCharsNum: 2,
                spaceIndent: 2,
                number: undefined,
                textOffset: 2,
                checkboxChar: undefined,
            },
        },
        {
            name: "line with invalid format",
            input: "A text",
            expected: {
                spaceCharsNum: 0,
                spaceIndent: 0,
                number: undefined,
                textOffset: 0,
                checkboxChar: undefined,
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
            name: "Test without checkbox",
            input: "text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: undefined, textOffset: 0, checkboxChar: undefined },
        },
        {
            name: "Test with unchecked checkbox at the start of a line",
            input: "- [ ] text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: undefined, textOffset: 0, checkboxChar: " " },
        },
        {
            name: "Test with checked checkbox at the start of a line",
            input: "- [x] text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: undefined, textOffset: 0, checkboxChar: "x" },
        },
        {
            name: "Test with uppercase character",
            input: "- [A] text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: undefined, textOffset: 0, checkboxChar: "A" },
        },
        {
            name: "Test with unalphabet character",
            input: "- [>] text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: undefined, textOffset: 0, checkboxChar: ">" },
        },
        {
            name: "Test with multiple characters",
            input: "- [ab] text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: undefined, textOffset: 0, checkboxChar: undefined },
        },
        {
            name: "Test with unchecked checkbox with space at the start",
            input: " - [ ] text",
            expected: { spaceCharsNum: 1, spaceIndent: 1, number: undefined, textOffset: 1, checkboxChar: " " },
        },
        {
            name: "Test with checked checkbox with space at the start",
            input: " - [x] text",
            expected: { spaceCharsNum: 1, spaceIndent: 1, number: undefined, textOffset: 1, checkboxChar: "x" },
        },
        {
            name: "Test with unchecked checkbox with tab indentation",
            input: "\t- [ ] text",
            expected: { spaceCharsNum: 1, spaceIndent: 4, number: undefined, textOffset: 1, checkboxChar: " " },
        },
        {
            name: "Test with checked checkbox with tab indentation",
            input: "\t- [x] text",
            expected: { spaceCharsNum: 1, spaceIndent: 4, number: undefined, textOffset: 1, checkboxChar: "x" },
        },
        {
            name: "Test with unchecked checkbox in numbered list",
            input: "123. [ ] text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: 123, textOffset: 5, checkboxChar: " " },
        },
        {
            name: "Test checkbox with more spaces between the numbering and the checkbox",
            input: "123.    [ ] text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: 123, textOffset: 5, checkboxChar: " " },
        },
        {
            name: "Test with checked checkbox in numbered list",
            input: "123. [x] text",
            expected: { spaceCharsNum: 0, spaceIndent: 0, number: 123, textOffset: 5, checkboxChar: "x" },
        },
        {
            name: "Test with unchecked checkbox and leading space in numbered list",
            input: " 123. [ ] text",
            expected: { spaceCharsNum: 1, spaceIndent: 1, number: 123, textOffset: 6, checkboxChar: " " },
        },
        {
            name: "Test with checked checkbox and leading space in numbered list",
            input: " 123. [x] text",
            expected: { spaceCharsNum: 1, spaceIndent: 1, number: 123, textOffset: 6, checkboxChar: "x" },
        },
        {
            name: "Test with unchecked checkbox and tab indentation in numbered list",
            input: "\t123. [ ] text",
            expected: { spaceCharsNum: 1, spaceIndent: 4, number: 123, textOffset: 6, checkboxChar: " " },
        },
        {
            name: "Test with checked checkbox and tab indentation in numbered list",
            input: "\t123. [x] text",
            expected: { spaceCharsNum: 1, spaceIndent: 4, number: 123, textOffset: 6, checkboxChar: "x" },
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

describe("findFirstNumbersByIndentFromEnd tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    const testCases = [
        {
            name: "Basic numbered list",
            lines: ["1. item", "2. item", "3. item"],
            expectedResult: [2], // Only the last line (index 2) is considered
        },
        {
            name: "List with different indent levels",
            lines: ["1. item", "    2. subitem", "    3. subitem", "4. item"],
            expectedResult: [3], // Only the last line (index 3) is considered (indent 0)
        },
        {
            name: "List with multiple indent levels",
            lines: ["1. item", "    2. subitem", "        3. subsubitem", "4. item"],
            expectedResult: [3], // Only the last line (index 3) is considered (indent 0)
        },
        {
            name: "Empty list",
            lines: [],
            expectedResult: [],
        },
        {
            name: "List with no numbers",
            lines: ["item", "subitem", "another item"],
            expectedResult: [],
        },
        {
            name: "List with mixed numbered and non-numbered lines",
            lines: ["1. item", "non-numbered", "    2. subitem", "3. item"],
            expectedResult: [3], // Only the last line (index 3) is considered (indent 0)
        },
        {
            name: "List with decreasing indentation",
            lines: ["        1. deeply nested", "    2. less nested", "3. top level"],
            expectedResult: [2], // Only the last line (index 2) is considered (indent 0)
        },
        {
            name: "List with indented last line",
            lines: ["1. item", "2. item", "    3. indented last"],
            expectedResult: [1, undefined, undefined, undefined, 2], // Indices 1 (indent 0) and 2 (indent 1) are considered
        },
        {
            name: "List where some indents have no numbers",
            lines: ["1. item", "    non-numbered", "        2. subsubitem", "3. item"],
            expectedResult: [3], // Only the last line (index 3) is considered (indent 0)
        },
        {
            name: "List with multiple indents at the end",
            lines: ["1. item", "2. item", "    3. indented", "        4. more indented"],
            expectedResult: [1, undefined, undefined, undefined, 2, undefined, undefined, undefined, 3], // Last two lines (highest indent first, then next lower)
        },
    ];

    testCases.forEach(({ name, lines, expectedResult }) => {
        test(name, () => {
            // This test directly calls the function with the lines array
            const result = findFirstNumbersByIndentFromEnd(lines);
            expect(result).toEqual(expectedResult);
        });
    });
});

describe("findFirstNumbersAfterIndex tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testCases = [
        {
            name: "Basic numbered list",
            content: "1. item\n2. item\n3. item",
            startIndex: 0,
            expectedResult: [1], // Now includes the startIndex line
        },
        {
            name: "List with different indent levels",
            content: "1. item\n    2. subitem\n    3. subitem\n4. item",
            startIndex: 0,
            expectedResult: [1], // Now includes the startIndex line
        },
        {
            name: "Starting from middle of list",
            content: "1. item\n    2. subitem\n    3. subitem\n4. item",
            startIndex: 1,
            expectedResult: [4, , , , 2], // Starts from line 1 ("2. subitem")
        },
        {
            name: "Starting from last item",
            content: "1. item\n    2. subitem\n    3. subitem\n4. item",
            startIndex: 3,
            expectedResult: [4], // Now includes the startIndex line itself
        },
        {
            name: "Starting from indented item",
            content: "1. item\n    2. subitem\n        3. subsubitem\n    4. subitem\n5. item",
            startIndex: 1,
            expectedResult: [5, , , , 2], // Starts from line 1 ("2. subitem")
        },
        {
            name: "Multiple indent levels",
            content: "1. item\n    2. subitem\n        3. subsubitem\n            4. deepitem\n5. item",
            startIndex: 0,
            expectedResult: [1], // Now includes the startIndex line
        },
        {
            name: "Non-numbered lines in between",
            content: "1. item\n    2. subitem\nnon-numbered\n    3. subitem\n4. item",
            startIndex: 1,
            expectedResult: [4, , , , 2], // Starts from line 1 ("2. subitem")
        },
        {
            name: "Starting from non-numbered line",
            content: "1. item\nnon-numbered\n2. item",
            startIndex: 1,
            expectedResult: [2], // Starts from a non-numbered line so only finds line 2
        },
    ];

    testCases.forEach(({ name, content, startIndex, expectedResult }) => {
        test(name, () => {
            const lines = content.split("\n");
            const editor = createMockEditor(lines);

            const result = findFirstNumbersAfterIndex(editor, startIndex);
            expect(result).toEqual(expectedResult);
        });
    });
});
