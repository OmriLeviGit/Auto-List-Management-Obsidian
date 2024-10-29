import { createMockEditor } from "./__mocks__/createMockEditor";
import Renumberer from "../src/Renumberer";

describe("generateChanges", () => {
    let renumberer: Renumberer;

    beforeEach(() => {
        renumberer = new Renumberer();
    });

    const testCases = [
        {
            name: "No renumbering is done",
            content: ["1. a", "2. b"],
            startIndex: 0,
            expectedResult: false,
        },
        {
            name: "Renumbering is done",
            content: ["1. a", "3. b"],
            startIndex: 0,
            expectedResult: true,
        },
        {
            name: "Renumber from index 0",
            content: ["1. a", "3. b"],
            startIndex: 0,
            expected: ["1. a", "2. b"],
        },
        {
            name: "Renumber from the last index",
            content: ["text", "1. a", "3. b"],
            startIndex: 2,
            expected: ["text", "1. a", "2. b"],
        },
        {
            name: "Renumber from the last item of a list",
            content: ["1. a", "3. b", "text"],
            startIndex: 1,
            expected: ["1. a", "2. b", "text"],
        },
        {
            name: "If previous was not a numbered item, start from current",
            content: ["A", "1. a", "3. b"],
            startIndex: 1,
            expected: ["A", "1. a", "2. b"],
        },
        {
            name: "A single item",
            content: ["2. a"],
            startIndex: 0,
            expected: ["2. a"],
        },
        {
            name: "A single item in the middle",
            content: ["text", "2. a", "text"],
            startIndex: 1,
            expected: ["text", "2. a", "text"],
        },
        {
            name: "Using the number 0",
            content: ["0. a", "2. b"],
            startIndex: 0,
            expected: ["0. a", "1. b"],
        },
        {
            name: "Renumber in sequence",
            content: ["1. a", "6. b", "8. c"],
            startIndex: 0,
            expected: ["1. a", "2. b", "3. c"],
        },
        {
            name: "Renumber in sequence with a zero",
            content: ["1. a", "6. b", "0. c"],
            startIndex: 0,
            expected: ["1. a", "2. b", "3. c"],
        },
        {
            name: "Renumber according to previous in sequence",
            content: ["1. a", "6. b", "0. c"],
            startIndex: 1,
            expected: ["1. a", "2. b", "3. c"],
        },
        {
            name: "Stop renumbering at the end of a numbered list",
            content: ["1. a", "1. b", "A", "5. B"],
            startIndex: 0,
            expected: ["1. a", "2. b", "A", "5. B"],
        },
        {
            name: "Does not modify given a non numbered item",
            content: ["1. a", "abc", "1. a"],
            startIndex: 1,
            expected: ["1. a", "abc", "1. a"],
        },
        {
            name: "Renumering stops at text",
            content: ["1. a", "3. b", "text", "1. a", "3. b"],
            startIndex: 0,
            expected: ["1. a", "2. b", "text", "1. a", "3. b"],
            expectedResult: undefined,
        },
    ];

    testCases.forEach(({ name, content, startIndex, expected, expectedResult }) => {
        test(name, () => {
            const editor = createMockEditor(content);
            const { changes } = renumberer.renumberLocally(editor, startIndex);
            const res = renumberer.applyChangesToEditor(editor, changes);

            if (expectedResult !== undefined) {
                expect(res).toBe(expectedResult);
            } else {
                expected.forEach((line, i) => {
                    expect(editor.getLine(i)).toBe(line);
                });
            }
        });
    });
});

describe("generateChanges - local changes only", () => {
    let renumberer: Renumberer;

    beforeEach(() => {
        renumberer = new Renumberer();
    });

    const testCases = [
        {
            name: "Local changes only - begin at index 0, stop at the first correctly numbered item",
            content: ["1. a", "3. b", "3. c", "5. d"],
            startIndex: 0,
            expected: ["1. a", "2. b", "3. c", "5. d"],
        },
        {
            name: "Local changes only - begin at the middle, stop at the first correctly numbered item",
            content: ["1. a", "2. b", "3. c", "5. d"],
            startIndex: 1,
            expected: ["1. a", "2. b", "3. c", "5. d"],
        },
        {
            name: "Local changes only - correct according to previous, stop at the first correctly numbered item",
            content: ["1. a", "3. b", "3. c", "5. d"],
            startIndex: 1,
            expected: ["1. a", "2. b", "3. c", "5. d"],
        },
    ];

    testCases.forEach(({ name, content, startIndex, expected }) => {
        test(name, () => {
            const editor = createMockEditor(content);
            const { changes } = renumberer.renumberLocally(editor, startIndex);
            renumberer.applyChangesToEditor(editor, changes);

            expected.forEach((line, i) => {
                expect(editor.getLine(i)).toBe(line);
            });
        });
    });
});

describe("Generate changes with the IndentTracker", () => {
    let renumberer: Renumberer;

    beforeEach(() => {
        renumberer = new Renumberer();
    });

    const testCases = [
        {
            name: "Renumber the same indent",
            content: ["1. a", "1. b", " 10. c", "4. d"],
            startIndex: 0,
            expected: ["1. a", "2. b", " 10. c", "3. d"],
        },
        {
            name: "Renumber the same indent",
            content: ["1. a", "1. b", " 10. c", "4. d"],
            startIndex: 0,
            expected: ["1. a", "2. b", " 10. c", "3. d"],
        },
        {
            name: "Detect changes across indent",
            content: ["1. a", " 10. b", " 11. c", "4. d"],
            expected: ["1. a", " 10. b", " 11. c", "2. d"],
            startIndex: 0,
        },

        {
            name: "Should not renumber lines with greater indents",
            content: ["1. a", " 1. b"],
            startIndex: 0,
            expected: ["1. a", " 1. b"],
        },
        {
            name: "Should not renumber lines with lesser indents",
            content: [" 1. a", "1. b"],
            startIndex: 0,
            expected: [" 1. a", "1. b"],
        },
        {
            name: "Renumbering stops ",
            content: [" 1. a", "1. b"],
            startIndex: 0,
            expected: [" 1. a", "1. b"],
        },
    ];

    testCases.forEach(({ name, content, startIndex, expected }) => {
        test(name, () => {
            const editor = createMockEditor(content);
            const { changes } = renumberer.renumberLocally(editor, startIndex);
            renumberer.applyChangesToEditor(editor, changes);

            expected.forEach((line, i) => {
                expect(editor.getLine(i)).toBe(line);
            });
        });
    });
});
