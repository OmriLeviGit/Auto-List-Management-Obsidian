import "./__mocks__/main";
import { createMockEditor } from "./__mocks__/createMockEditor";

import Renumberer from "../src/Renumberer";
import SettingsManager from "src/SettingsManager";

describe("Dynamic renumbering tests", () => {
    let renumberer: Renumberer;

    beforeEach(() => {
        renumberer = new Renumberer();
        SettingsManager.getInstance().setStartsFromOne(false);
        jest.clearAllMocks();
    });

    const testCases = [
        {
            name: "First index of file",
            content: ["2. a", "4. b"],
            startIndex: 0,
            expectedContent: ["2. a", "3. b"],
            expectedEndIndex: 2,
        },
        {
            name: "Last index of file",
            content: ["2. a", "6. c"],
            startIndex: 1,
            expectedContent: ["2. a", "3. c"],
            expectedEndIndex: 2,
        },
        {
            name: "A single item",
            content: ["2. a"],
            startIndex: 0,
            expectedContent: ["2. a"],
            expectedEndIndex: 1,
        },
        {
            name: "First index of list",
            content: ["text", "2. a", "4. b"],
            startIndex: 1,
            expectedContent: ["text", "2. a", "3. b"],
            expectedEndIndex: 3,
        },
        {
            name: "Last index of list",
            content: ["2. a", "4. b", "text"],
            startIndex: 1,
            expectedContent: ["2. a", "3. b", "text"],
            expectedEndIndex: 2,
        },
        {
            name: "A single item in the middle",
            content: ["text", "2. a", "text"],
            startIndex: 1,
            expectedContent: ["text", "2. a", "text"],
            expectedEndIndex: 2,
        },
        {
            name: "Renumber the middle",
            content: ["2. a", "4. b", "5. c"],
            startIndex: 1,
            expectedContent: ["2. a", "3. b", "4. c"],
            expectedEndIndex: 3,
        },
        {
            name: "Starting the number 0",
            content: ["0. a", "2. b"],
            startIndex: 0,
            expectedContent: ["0. a", "1. b"],
            expectedEndIndex: 2,
        },
        {
            name: "Renumber in sequence",
            content: ["2. a", "6. b", "8. c"],
            startIndex: 0,
            expectedContent: ["2. a", "3. b", "4. c"],
            expectedEndIndex: 3,
        },
        {
            name: "Should stop at text",
            content: ["2. a", "4. b", "text", "7. a", "9. b"],
            startIndex: 0,
            expectedContent: ["2. a", "3. b", "text", "7. a", "9. b"],
            expectedEndIndex: 2,
        },
        {
            name: "Should stop at empty line",
            content: ["2. a", "4. b", "", "7. c"],
            startIndex: 0,
            expectedContent: ["2. a", "3. b", "", "7. c"],
            expectedEndIndex: 2,
        },
        {
            name: "Renumber across indent (two spaces)",
            content: ["2. a", "  4. b", "7. c"],
            startIndex: 0,
            expectedContent: ["2. a", "  4. b", "3. c"],
            expectedEndIndex: 3,
        },

        {
            name: "Renumber across indent (tab)",
            content: ["2. a", "\t4. b", "7. c"],
            startIndex: 0,
            expectedContent: ["2. a", "\t4. b", "3. c"],
            expectedEndIndex: 3,
        },
        {
            name: "Renumber across indent (text)",
            content: ["2. a", "\ttext", "7. c"],
            startIndex: 0,
            expectedContent: ["2. a", "\ttext", "3. c"],
            expectedEndIndex: 3,
        },
        {
            name: "Start from base and renumber the indent",
            content: ["2. a", "\t7. b", "\t3. c", "1. d"],
            startIndex: 0,
            expectedContent: ["2. a", "\t7. b", "\t8. c", "3. d"],
            expectedEndIndex: 4,
        },
        {
            name: "Start from the indent, and renumber index before",
            content: ["2. a", "\t7. b", "1. c"],
            startIndex: 1,
            expectedContent: ["2. a", "\t7. b", "3. c"],
            expectedEndIndex: 3,
        },
        {
            name: "Continues on descension",
            content: ["\t7. a", "\t5. b", "8. c", "4. d"],
            startIndex: 0,
            expectedContent: ["\t7. a", "\t8. b", "8. c", "9. d"],
            expectedEndIndex: 4,
        },
        {
            name: "Cascade into multiple indents",
            content: [
                "2. a",
                "2. b",
                "    5. c",
                "     text",
                "    2. d",
                "        9. e",
                "        2. f",
                "    10. g",
                "    4. h",
                "3. i",
                "5. j",
                "6. k",
                "9. l",
            ],
            startIndex: 0,
            expectedContent: [
                "2. a",
                "3. b",
                "    5. c",
                "     text",
                "    6. d",
                "        9. e",
                "        10. f",
                "    7. g",
                "    8. h",
                "4. i",
                "5. j",
                "6. k",
                "9. l",
            ],
            expectedEndIndex: 12,
        },
    ];

    testCases.forEach(({ name, content, startIndex, expectedContent, expectedEndIndex }) => {
        test(name, () => {
            const editor = createMockEditor(content);
            const endIndex = renumberer.renumber(editor, startIndex);

            expectedContent.forEach((line, i) => {
                expect(editor.getLine(i)).toBe(line);
            });

            expect(endIndex).toBe(expectedEndIndex);
        });
    });

    test("Renumber entire list (dynamic renumbering)", () => {
        const content = [
            "2. a",
            "4. b",
            "5. c",
            "5. d",
            "6. e",
            "7. f",
            "7. g",
            "9. h",
            "10. i",
            "",
            "3. dontrenumber",
            "5. dontrenumber",
        ];
        const expectedContent = [
            "2. a",
            "3. b",
            "4. c",
            "5. d",
            "6. e",
            "7. f",
            "8. g",
            "9. h",
            "10. i",
            "",
            "3. dontrenumber",
            "5. dontrenumber",
        ];

        const editor = createMockEditor(content);
        const renumberer = new Renumberer();
        SettingsManager.getInstance().setStartsFromOne(false);
        renumberer.renumber(editor, 0, content.indexOf(""));

        expectedContent.forEach((line, i) => {
            expect(editor.getLine(i)).toBe(line);
        });
    });
});

describe("Start from one renumbering tests", () => {
    let renumberer: Renumberer;

    beforeEach(() => {
        renumberer = new Renumberer();
        SettingsManager.getInstance().setStartsFromOne(true);
        jest.clearAllMocks();
    });

    const testCases = [
        {
            name: "First index of file",
            content: ["2. a", "4. b"],
            startIndex: 0,
            expectedContent: ["1. a", "2. b"],
            expectedEndIndex: 2,
        },
        {
            name: "Last index of file",
            content: ["2. a", "6. c"],
            startIndex: 1,
            expectedContent: ["1. a", "2. c"],
            expectedEndIndex: 2,
        },
        {
            name: "A single item",
            content: ["2. a"],
            startIndex: 0,
            expectedContent: ["1. a"],
            expectedEndIndex: 1,
        },
        {
            name: "First index of list",
            content: ["text", "2. a", "4. b"],
            startIndex: 1,
            expectedContent: ["text", "1. a", "2. b"],
            expectedEndIndex: 3,
        },
        {
            name: "Last index of list",
            content: ["2. a", "4. b", "text"],
            startIndex: 1,
            expectedContent: ["1. a", "2. b", "text"],
            expectedEndIndex: 2,
        },
        {
            name: "A single item in the middle",
            content: ["text", "2. a", "text"],
            startIndex: 1,
            expectedContent: ["text", "1. a", "text"],
            expectedEndIndex: 2,
        },
        {
            name: "Renumber the middle",
            content: ["2. a", "4. b", "5. c"],
            startIndex: 1,
            expectedContent: ["1. a", "2. b", "3. c"],
            expectedEndIndex: 3,
        },
        {
            name: "Starting the number 0",
            content: ["0. a", "2. b"],
            startIndex: 0,
            expectedContent: ["1. a", "2. b"],
            expectedEndIndex: 2,
        },
        {
            name: "Renumber in sequence",
            content: ["2. a", "6. b", "8. c"],
            startIndex: 0,
            expectedContent: ["1. a", "2. b", "3. c"],
            expectedEndIndex: 3,
        },
        {
            name: "Should stop at text",
            content: ["2. a", "4. b", "text", "7. a", "9. b"],
            startIndex: 0,
            expectedContent: ["1. a", "2. b", "text", "7. a", "9. b"],
            expectedEndIndex: 2,
        },
        {
            name: "Should stop at empty line",
            content: ["2. a", "4. b", "", "7. c"],
            startIndex: 0,
            expectedContent: ["1. a", "2. b", "", "7. c"],
            expectedEndIndex: 2,
        },
        {
            name: "Renumber across indent (two spaces)",
            content: ["2. a", "  4. b", "7. c"],
            startIndex: 0,
            expectedContent: ["1. a", "  1. b", "2. c"],
            expectedEndIndex: 3,
        },

        {
            name: "Renumber across indent (tab)",
            content: ["2. a", "\t4. b", "7. c"],
            startIndex: 0,
            expectedContent: ["1. a", "\t1. b", "2. c"],
            expectedEndIndex: 3,
        },
        {
            name: "Renumber across indent (text)",
            content: ["2. a", "\ttext", "7. c"],
            startIndex: 0,
            expectedContent: ["1. a", "\ttext", "2. c"],
            expectedEndIndex: 3,
        },
        {
            name: "Start from base and renumber the indent",
            content: ["2. a", "\t7. b", "\t3. c", "1. d"],
            startIndex: 0,
            expectedContent: ["1. a", "\t1. b", "\t2. c", "2. d"],
            expectedEndIndex: 4,
        },
        {
            name: "Start from the indent, and renumber index before",
            content: ["2. a", "\t7. b", "5. c", "8. d"],
            startIndex: 1,
            expectedContent: ["1. a", "\t1. b", "2. c", "3. d"],
            expectedEndIndex: 4,
        },
        {
            name: "Continues on descension",
            content: ["\t7. a", "\t5. b", "8. c", "4. d"],
            startIndex: 0,
            expectedContent: ["\t1. a", "\t2. b", "1. c", "2. d"],
            expectedEndIndex: 4,
        },
        {
            name: "Cascade into multiple indents",
            content: [
                "5. a",
                "3. b",
                "    5. c",
                "     text",
                "    3. d",
                "        9. e",
                "        11. f",
                "    10. g",
                "    4. h",
                "4. i",
                "4. j",
                "5. k",
                "9. l",
            ],
            startIndex: 0,
            expectedContent: [
                "1. a",
                "2. b",
                "    1. c",
                "     text",
                "    2. d",
                "        1. e",
                "        2. f",
                "    3. g",
                "    4. h",
                "3. i",
                "4. j",
                "5. k",
                "9. l",
            ],
            expectedEndIndex: 12,
        },
    ];

    testCases.forEach(({ name, content, startIndex, expectedContent, expectedEndIndex }) => {
        test(name, () => {
            const editor = createMockEditor(content);
            const endIndex = renumberer.renumber(editor, startIndex);

            expectedContent.forEach((line, i) => {
                expect(editor.getLine(i)).toBe(line);
            });

            expect(endIndex).toBe(expectedEndIndex);
        });
    });

    test("Renumber entire list (starting from one)", () => {
        const content = [
            "1. a",
            "3. b",
            "4. c",
            "4. d",
            "5. e",
            "6. f",
            "6. g",
            "8. h",
            "9. i",
            "",
            "3. dontrenumber",
            "5. dontrenumber",
        ];
        const expectedContent = [
            "1. a",
            "2. b",
            "3. c",
            "4. d",
            "5. e",
            "6. f",
            "7. g",
            "8. h",
            "9. i",
            "",
            "3. dontrenumber",
            "5. dontrenumber",
        ];

        const editor = createMockEditor(content);
        const renumberer = new Renumberer();
        SettingsManager.getInstance().setStartsFromOne(true);

        renumberer.renumber(editor, 0, content.indexOf(""));

        expectedContent.forEach((line, i) => {
            expect(editor.getLine(i)).toBe(line);
        });
    });
});
