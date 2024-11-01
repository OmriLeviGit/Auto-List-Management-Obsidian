import IndentTracker from "../src/IndentTracker";
import { createMockEditor } from "./__mocks__/createMockEditor";
import { pluginInstance, DEFAULT_SETTINGS } from "main";

jest.mock("main");

describe("IndentTracker tests", () => {
    let indentTracker: IndentTracker;

    beforeEach(() => {
        jest.clearAllMocks();

        (pluginInstance.getSettings as jest.Mock).mockReturnValue(DEFAULT_SETTINGS);
        indentTracker = new IndentTracker(createMockEditor([""]), 0);
    });

    const testCases = [
        {
            name: "Leading space before numbers",
            inputs: [" 1. text", "  1. text", "  2. text"],
            expected: [undefined, 1, 2],
        },
        {
            name: "Single number entry (1 indentation)",
            inputs: ["1. text", "2. text"],
            expected: [2],
        },
        {
            name: "Number followed by empty space",
            inputs: ["1. text", " text"],
            expected: [1, undefined],
        },
        {
            name: "Same number with space",
            inputs: ["1. text", " 1. text"],
            expected: [1, 1],
        },
        {
            name: "Two lines with offset space",
            inputs: ["1. text", " 1. text", " text"],
            expected: [1, undefined],
        },
        {
            name: "Multiple indentations with sequential numbers",
            inputs: ["1. text", " 1. text", "2. text"],
            expected: [2],
        },
        {
            name: "Multiple indentations with last entry",
            inputs: ["1. text", " 1. text", "2. text", "    1. text"],
            expected: [2, undefined, undefined, undefined, 1],
        },
        {
            name: "Sequential entries with varied indentation",
            inputs: ["1. text", " 1. text", "2. text", "    1. text", "    2. text"],
            expected: [2, undefined, undefined, undefined, 2],
        },
        {
            name: "Additional numbered entry with same indentation",
            inputs: ["1. text", " 1. text", "2. text", "    1. text", "    2. text", "   3. text"],
            expected: [2, undefined, undefined, 3],
        },
        {
            name: "No valid entry after several inputs",
            inputs: ["1. text", " 1. text", "2. text", "    1. text", "    2. text", "   3. text", "text"],
            expected: [],
        },
        {
            name: "Final number entry at end",
            inputs: ["1. text", " 1. text", "2. text", "    1. text", "    2. text", "   3. text", "3. text"],
            expected: [3],
        },
        {
            name: "Final entry with previous indentation",
            inputs: [
                "1. text",
                " 1. text",
                "2. text",
                "    1. text",
                "    2. text",
                "   3. text",
                "3. text",
                " 1. text",
                " text",
            ],
            expected: [3, undefined],
        },
        {
            name: "Multiple entries with repeated indentation",
            inputs: [
                "1. text",
                " 1. text",
                "2. text",
                "    1. text",
                "    2. text",
                "   3. text",
                "3. text",
                " 1. text",
                " text",
                "    1. text",
            ],
            expected: [3, undefined, undefined, undefined, 1],
        },
        {
            name: "Multiple entries with repeated indentation, multiple digits",
            inputs: [
                "11. text",
                " 10. text",
                "12. text",
                "    11. text",
                "    12. text",
                "   13. text",
                "13. text",
                " 11. text",
                " text",
                "    11. text",
            ],
            expected: [13, undefined, undefined, undefined, 11],
        },
        {
            name: "Tab character indentation",
            inputs: ["1. text", "\t1. text"],
            expected: [1, undefined, undefined, undefined, 1],
        },
        {
            name: "Tab character with two space indentation",
            inputs: ["12. text", "  \t12. text"],
            expected: [12, undefined, undefined, undefined, undefined, undefined, 12],
        },
        {
            name: "Two tab characters with a space indentation",
            inputs: ["12. text", " \t\t12. text"],
            expected: [12, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 12],
        },
        {
            name: "Update with tabs",
            inputs: ["12. text", "\t12. text", "\t1. text"],
            expected: [12, undefined, undefined, undefined, 1],
        },
    ];

    testCases.forEach(({ name, inputs, expected }) => {
        test(name, () => {
            inputs.forEach((input) => indentTracker.insert(input));
            expect(indentTracker.get()).toEqual(expected);
        });
    });
});

describe("IndentTracker creation tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        (pluginInstance.getSettings as jest.Mock).mockReturnValue(DEFAULT_SETTINGS);
    });

    const testCases = [
        {
            name: "One item",
            content: ["1. text"],
            index: 0,
            expected: [],
        },
        {
            name: "One text",
            content: ["text"],
            index: 0,
            expected: [],
        },
        {
            name: "Text and number",
            content: ["text", "1. text"],
            index: 1,
            expected: [],
        },
        {
            name: "Two numbers",
            content: ["1. text", "2. text"],
            index: 1,
            expected: [1],
        },
        {
            name: "Same indent overide",
            content: [" 1. text", " 2. text", " 3. text"],
            index: 2,
            expected: [undefined, 2],
        },
        {
            name: "ascending", // TODO definition: stop at the first same or lower
            content: ["1. text", " 2. text", "  3. text"],
            index: 2,
            expected: [undefined, 2],
        },
        {
            name: "Decending", // TODO not defined
            content: ["  1. text", " 2. text", "3. text"],
            index: 2,
            expected: [],
        },
        {
            name: "Split by numbers with higher indentation",
            content: ["2. text", " 3. text", "4. text"],
            index: 2,
            expected: [2, 3],
        },
        {
            name: "Split by text with higher indentation",
            content: ["2. text", " text", "4. text"],
            index: 2,
            expected: [2, undefined],
        },
        {
            name: "stop at text that is the same indentation",
            content: [" 2. text", " text", "  3. text", " 4. text"],
            index: 3,
            expected: [undefined, undefined, 3],
        },
        {
            name: "start creation at the first item with lower indentation",
            content: ["   1. text", " 2. text", "   3. text", "  4. text"],
            index: 3,
            expected: [undefined, 2, undefined, 3],
        },
        {
            name: "start creation at the first item with equal indentation",
            content: [" 1. text", " 2. text", "  3. text", " 4. text"],
            index: 3,
            expected: [undefined, 2, 3],
        },
        {
            name: "Split by both text and numbering with higher indentation",
            content: ["1. text", " 2. text", "  3. text", "  4. text", "  text one", "  text two", " 5. text"],
            index: 6,
            expected: [undefined, 2],
        },
        {
            name: "Mixed",
            content: ["1. text", " 2. text", "  3. text", "  4. text", "   text one", "   text two", "  5. text"],
            index: 6,
            expected: [undefined, undefined, 4],
        },
    ];

    testCases.forEach(({ name, content, index, expected }) => {
        test(name, () => {
            const indentTracker = new IndentTracker(createMockEditor(content), index);

            expect(indentTracker.get()).toEqual(expected);
        });
    });
});
