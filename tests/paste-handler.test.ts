import { createMockEditor } from "./__mocks__/createMockEditor";
import "./__mocks__/main";

import { modifyText } from "src/pasteAndDropHandler";

describe("modifyText tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testCases = [
        {
            name: "Modify the first numbered line",
            editorContent: "5. editor content\n6. more content",
            pastedText: "1. a\n2. b\n3. c",
            indexAfterPasting: 0,
            expectedResult: "5. a\n2. b\n3. c",
        },
        {
            name: "Modify the last numbered line",
            editorContent: "5. editor content\n6. more content",
            pastedText: "2. a\n3. b\n2. c",
            indexAfterPasting: 1,
            expectedResult: "6. a\n3. b\n2. c",
        },
        {
            name: "Modify the last numbered line, fronted by text",
            editorContent: "5. editor content\n6. more content\n7. last line",
            pastedText: "text\n2. a\n3. b\n2. c",
            indexAfterPasting: 2,
            expectedResult: "text\n7. a\n3. b\n2. c",
        },
        {
            name: "Modify a single line",
            editorContent: "10. single editor line",
            pastedText: "1. single paste line",
            indexAfterPasting: 0,
            expectedResult: "10. single paste line",
        },
        {
            name: "With different indent levels",
            editorContent: "5. level 1\n    6. level 2\n7. back to level 1",
            pastedText: "1. top level\n    2. indented\n3. top level again",
            indexAfterPasting: 2,
            expectedResult: "7. top level\n    2. indented\n3. top level again",
        },
        {
            name: "With multiple indent levels",
            editorContent: "10. level 1\n    11. level 2\n        12. level 3\n13. level 1 again",
            pastedText: "1. level 1\n    2. level2\n        3. level3\n4. level 1 again",
            indexAfterPasting: 3,
            expectedResult: "13. level 1\n    2. level2\n        3. level3\n4. level 1 again",
        },
        {
            name: "between different indent levels",
            editorContent: "4. level 2\n    6. level 2",
            pastedText: "1. level1\n    2. level2",
            indexAfterPasting: 1,
            expectedResult: "1. level1\n    6. level2",
        },
        {
            name: "Start from higher intent",
            editorContent: "    10. level 2\n11. level 2",
            pastedText: "1. level1\n    2. level2",
            indexAfterPasting: 0,
            expectedResult: "11. level1\n    10. level2",
        },
        {
            name: "Don't modify with leading spaces",
            editorContent: "5. first line\n6. second line",
            pastedText: "   1. indented line\n2. another line",
            indexAfterPasting: 1,
            expectedResult: "   1. indented line\n6. another line",
        },
        {
            name: "No numbered lines in source, but target is numbered",
            editorContent: "5. editor content",
            pastedText: "no numbers here",
            indexAfterPasting: 0,
            expectedResult: "no numbers here",
        },
        {
            name: "Target line is not numbered",
            editorContent: "5. editor content\nnot numbered",
            pastedText: "1. numbered line\nno numbers here",
            indexAfterPasting: 1,
            expectedResult: undefined,
        },

        {
            name: "Empty content",
            editorContent: "5. some content",
            pastedText: "",
            indexAfterPasting: 0,
            expectedResult: "",
        },
    ];

    testCases.forEach(({ name, editorContent, pastedText, indexAfterPasting, expectedResult }) => {
        test(name, () => {
            const editorLines = editorContent.split("\n");
            const editor = createMockEditor(editorLines);
            const res = modifyText(editor, pastedText, indexAfterPasting);
            expect(res).toBe(expectedResult);
        });
    });
});
