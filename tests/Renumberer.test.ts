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
            name: "Renumering stops at text at offset 0",
            content: ["1. a", "3. b", "text", "1. a", "3. b"],
            startIndex: 0,
            expected: ["1. a", "2. b", "text", "1. a", "3. b"],
        },
        {
            name: "With empty list before",
            content: ["9. a", "", "3. a", "\t- text", "5. c"],
            startIndex: 2,
            expected: ["9. a", "", "3. a", "\t- text", "4. c"],
        },
    ];

    testCases.forEach(({ name, content, startIndex, expected }) => {
        test(name, () => {
            const editor = createMockEditor(content);
            renumberer.renumberAtIndex(editor, startIndex);

            expected.forEach((line, i) => {
                expect(editor.getLine(i)).toBe(line);
            });
        });
    });
});

describe("Start from one", () => {
    let renumberer: Renumberer;

    beforeEach(() => {
        jest.clearAllMocks();
        SettingsManager.getInstance().setStartsFromOne(true);
        renumberer = new Renumberer();
    });

    const testCases = [
        {
            name: "One item",
            content: ["3. a"],
            startIndex: 0,
            expected: ["1. a"],
        },
        {
            name: "last item",
            content: ["text", "2. a"],
            startIndex: 1,
            expected: ["text", "1. a"],
        },
        {
            name: "last item in list",
            content: ["text", "3. a", "text"],
            startIndex: 1,
            expected: ["text", "1. a", "text"],
        },
        {
            name: "Start from index 0",
            content: ["1. a", "3. b", "10. c"],
            startIndex: 0,
            expected: ["1. a", "2. b", "3. c"],
        },
        {
            name: "Start from index 1",
            content: ["1. a", "3. b", "10. c"],
            startIndex: 1,
            expected: ["1. a", "2. b", "3. c"],
        },
        {
            name: "First index after text",
            content: ["text", "1. a", "10. b"],
            startIndex: 1,
            expected: ["text", "1. a", "2. b"],
        },
        {
            name: "First index after text - doesnt start with 1",
            content: ["text", "3. a", "10. b"],
            startIndex: 1,
            expected: ["text", "1. a", "2. b"],
        },
        {
            name: "Second index after text",
            content: ["text", "3. a", "10. b"],
            startIndex: 2,
            expected: ["text", "1. a", "2. b"],
        },
        {
            name: "Third index after text",
            content: ["text", "3. a", "10. b", "4. c"],
            startIndex: 3,
            expected: ["text", "3. a", "4. b", "5. c"],
        },
        {
            name: "Across indent",
            content: ["1. a", " 1. b", "10. c"],
            startIndex: 0,
            expected: ["1. a", " 1. b", "2. c"],
        },
        {
            name: "Across indented text",
            content: ["text", "1. a", " text", " text", "10. b"],
            startIndex: 2,
            expected: ["text", "1. a", " text", " text", "2. b"],
        },
        {
            name: "Across indent - doesnt start with 1",
            content: ["3. a", " 1. b", "10. c"],
            startIndex: 0,
            expected: ["1. a", " 1. b", "2. c"],
        },
        {
            name: "From indent, downwards",
            content: [" 3. a", " 4. b", " 1. c", "1. e"],
            startIndex: 2,
            expected: [" 3. a", " 4. b", " 5. c", "1. e"],
        },
        {
            name: "Renumber when ascending",
            content: ["3. a", "4. b", " 4. c", "  4. d"],
            startIndex: 0,
            expected: ["1. a", "2. b", " 1. c", "  1. d"],
        },
        {
            name: "Dont renumber when descending",
            content: ["  3. a", "  4. b", " 4. c", "4. d"],
            startIndex: 0,
            expected: ["  1. a", "  2. b", " 4. c", "4. d"],
        },
        {
            name: "Indented - do not renumber downwards, second index",
            content: ["1. a", " 1. b", " 10. c", " 13. d", "5. e"],
            startIndex: 2,
            expected: ["1. a", " 1. b", " 2. c", " 3. d", "5. e"],
        },
    ];

    testCases.forEach(({ name, content, startIndex, expected }) => {
        test(name, () => {
            const editor = createMockEditor(content);
            renumberer.renumberAtIndex(editor, startIndex);

            expected.forEach((line, i) => {
                expect(editor.getLine(i)).toBe(line);
            });
        });
    });
});

describe("Complete example", () => {
    test("should renumber lines correctly (starting from one)", () => {
        const content = [
            "1. a",
            "1. b",
            "    5. c",
            "    2. d",
            "        9. e",
            "        2. f",
            "    10. g",
            "    4. h",
            "2. i",
            "3. j",
            "5. k",
            "5. l",
            "5. m",
        ];
        const expected = [
            "1. a",
            "2. b",
            "    1. c",
            "    2. d",
            "        1. e",
            "        2. f",
            "    3. g",
            "    4. h",
            "3. i",
            "4. j",
            "5. k",
            "5. l",
            "5. m",
        ];

        const editor = createMockEditor(content);
        const renumberer = new Renumberer();
        SettingsManager.getInstance().setStartsFromOne(true);

        renumberer.renumberAtIndex(editor, 0);

        expected.forEach((line, i) => {
            expect(editor.getLine(i)).toBe(line);
        });
    });

    test("should renumber lines correctly (dynamic renumbering)", () => {
        const content = [
            "1. a",
            "1. b",
            "    5. c",
            "     text",
            "    2. d",
            "        9. e",
            "        2. f",
            "    10. g",
            "    4. h",
            "2. i",
            "3. j",
            "5. k",
            "5. l",
            "5. m",
        ];
        const expected = [
            "1. a",
            "2. b",
            "    5. c",
            "     text",
            "    6. d",
            "        9. e",
            "        10. f",
            "    7. g",
            "    8. h",
            "3. i",
            "4. j",
            "5. k",
            "5. l",
            "5. m",
        ];

        const editor = createMockEditor(content);
        const renumberer = new Renumberer();
        SettingsManager.getInstance().setStartsFromOne(false);

        renumberer.renumberAtIndex(editor, 0);

        expected.forEach((line, i) => {
            expect(editor.getLine(i)).toBe(line);
        });
    });
});

describe("Renumber entire list", () => {
    test("Renumber entire list (starting from one)", () => {
        const content = ["1. a", "3. b", "4. c", "4. d", "5. e", "6. f", "6. g", "8. h", "9. i"];
        const expected = ["1. a", "2. b", "3. c", "4. d", "5. e", "6. f", "7. g", "8. h", "9. i"];

        const editor = createMockEditor(content);
        const renumberer = new Renumberer();
        SettingsManager.getInstance().setStartsFromOne(true);

        renumberer.renumberAllInRange(editor, 0, content.length - 1);

        expected.forEach((line, i) => {
            expect(editor.getLine(i)).toBe(line);
        });
    });

    test("Renumber entire list (dynamic renumbering)", () => {
        const content = ["2. a", "4. b", "5. c", "5. d", "6. e", "7. f", "7. g", "9. h", "10. i"];
        const expected = ["2. a", "3. b", "4. c", "5. d", "6. e", "7. f", "8. g", "9. h", "10. i"];

        const editor = createMockEditor(content);
        const renumberer = new Renumberer();
        SettingsManager.getInstance().setStartsFromOne(false);

        renumberer.renumberAllInRange(editor, 0, content.length - 1);

        expected.forEach((line, i) => {
            expect(editor.getLine(i)).toBe(line);
        });
    });
});
