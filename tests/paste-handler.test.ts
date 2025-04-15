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
            indexAfterPasting: 0, // Points to line "5. editor content"
            expectedResult: "5. a\n2. b\n3. c",
        },
        // {
        //     name: "Modify the last numbered line",
        //     editorContent: "5. editor content\n6. more content",
        //     pastedText: "2. a\n3. b\n2. c",
        //     indexAfterPasting: 1, // Points to line "6. more content"
        //     expectedResult: "6. a\n3. b\n2. c", // First line gets number 6 from editor
        // },
        // {
        //     name: "Modify the last numbered line, fronted by text",
        //     editorContent: "5. editor content\n6. more content\n7. last line",
        //     pastedText: "text\n2. a\n3. b\n2. c",
        //     indexAfterPasting: 2, // Points to line "7. last line"
        //     expectedResult: "text\n7. a\n3. b\n2. c", // Line "2. a" gets number 7
        // },
        // {
        //     name: "Modify a single line",
        //     editorContent: "10. single editor line",
        //     pastedText: "1. single paste line",
        //     indexAfterPasting: 0, // Points to the only line
        //     expectedResult: "10. single paste line", // Line gets number 10 from editor
        // },
        // {
        //     name: "With different indent levels",
        //     editorContent: "5. level 1\n    6. level 2\n7. back to level 1",
        //     pastedText: "1. top level\n    2. indented\n3. top level again",
        //     indexAfterPasting: 2, // Points to line "7. back to level 1"
        //     expectedResult: "7. top level\n    6. indented\n3. top level again",
        //     // First line gets 7, indented gets 6
        // },
        // {
        //     name: "With multiple indent levels",
        //     editorContent: "10. level 1\n    11. level 2\n        12. level 3\n13. level 1 again",
        //     pastedText: "1. level1\n    2. level2\n        3. level3\n4. level1 again",
        //     indexAfterPasting: 3, // Points to "13. level 1 again"
        //     expectedResult: "13. level1\n    11. level2\n        12. level3\n4. level1 again",
        //     // Each level gets numbered from editor
        // },
        // {
        //     name: "Don't modify with leading spaces",
        //     editorContent: "5. first line\n6. second line",
        //     pastedText: "   1. indented line\n2. another line",
        //     indexAfterPasting: 1, // Points to "6. second line"
        //     expectedResult: "   6. indented line\n2. another line",
        //     // First line gets number 6
        // },
        // {
        //     name: "No numbered lines in source, but target is numbered",
        //     editorContent: "5. editor content",
        //     pastedText: "no numbers here",
        //     indexAfterPasting: 0, // Points to a numbered line in editor
        //     expectedResult: undefined,
        //     // No numbered lines in pasted content, so function returns undefined
        // },
        // {
        //     name: "Target line is not numbered",
        //     editorContent: "5. editor content\nnot numbered",
        //     pastedText: "1. numbered line\nno numbers here",
        //     indexAfterPasting: 1, // Points to a non-numbered line
        //     expectedResult: undefined,
        //     // Target line has no number, function should return undefined
        // },
        // {
        //     name: "Complex indentation case",
        //     editorContent: "10. level1\n    20. level2\n        30. level3\n    40. level2 again\n50. level1 again",
        //     pastedText: "1. item\n    2. subitem\n        3. subsubitem\n    4. another subitem\n5. item",
        //     indexAfterPasting: 2, // Points to "30. level3"
        //     expectedResult: "1. item\n    30. subitem\n        30. subsubitem\n    4. another subitem\n5. item",
        //     // Only indent level matching target gets renumbered
        // },
        // {
        //     name: "Multiple levels all renumbered",
        //     editorContent: "5. first\n    6. second\n        7. third\n            8. fourth",
        //     pastedText: "1. first\n    2. second\n        3. third\n            4. fourth",
        //     indexAfterPasting: 0, // Pointing to line with number 5
        //     expectedResult: "5. first\n    6. second\n        7. third\n            8. fourth",
        //     // All levels renumbered to match editor
        // },
        // {
        //     name: "Empty content",
        //     editorContent: "5. some content",
        //     pastedText: "",
        //     indexAfterPasting: 0,
        //     expectedResult: "",
        // },
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
