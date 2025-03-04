import { getLineInfo } from "src/utils";
import { createMockEditor } from "./__mocks__/createMockEditor";
import "./__mocks__/main";

import { reorder, getChecklistStart, deleteChecked } from "src/checkbox";
import SettingsManager from "src/SettingsManager";

describe("getChecklistStart", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        SettingsManager.getInstance().setCheckedItemsAtBottom(true);
    });

    const testCases = [
        {
            name: "One item unchecked",
            content: ["- [ ] a"],
            index: 0,
            expected: 0,
        },
        {
            name: "One item checked",
            content: ["- [x] a"],
            index: 0,
            expected: 0,
        },
        {
            name: "Several items",
            content: ["- [ ] a", "- [x] b", "- [ ] c", "- [x] d"],
            index: 3,
            expected: 0,
        },
        {
            name: "Several tabbed items",
            content: ["\t- [ ] a", "\t- [x] b", "\t- [ ] c", "\t- [x] d"],
            index: 3,
            expected: 0,
        },
        {
            name: "Stop at text",
            content: ["- [ ] a", "text", "- [x] b", "- [ ] c", "- [x] d"],
            index: 4,
            expected: 2,
        },
        {
            name: "Stop at indented box",
            content: ["\t [ ] a", "- [x] b", "- [ ] c", "- [x] d"],
            index: 3,
            expected: 1,
        },
        {
            name: "Stop at numbered checkbox",
            content: ["1. [ ] a", "- [x] b", "- [ ] c", "- [x] d"],
            index: 3,
            expected: 1,
        },
        {
            name: "Several numbered items",
            content: ["12. [ ] a", "12. [x] b", "12. [ ] c", "12. [x] d"],
            index: 3,
            expected: 0,
        },
        {
            name: "Stop at indented box",
            content: ["\t [ ] a", "- [x] b", "- [ ] c", "- [x] d"],
            index: 3,
            expected: 1,
        },
        {
            name: "Stop at numbered text",
            content: ["12. [ ] a", "12. text", "12. [x] b", "12. [ ] c", "12. [x] d"],
            index: 4,
            expected: 2,
        },
    ];

    testCases.forEach(({ name, content, index, expected }) => {
        test(name, () => {
            const editor = createMockEditor(content);
            const res = getChecklistStart(editor, index);

            expect(res).toBe(expected);
        });
    });
});

describe("reorder", () => {
    describe("with checked items at the top", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            SettingsManager.getInstance().setCheckedItemsAtBottom(false);
        });

        const testCases = [
            {
                name: "One item unchecked",
                content: ["- [ ] a"],
                index: 0,
                expected: {
                    unchecked: [],
                    checked: [],
                    startIndex: 0,
                    endIndex: 0,
                },
            },
            {
                name: "One item checked",
                content: ["- [x] a"],
                index: 0,
                expected: {
                    unchecked: [],
                    checked: [],
                    startIndex: 1,
                    endIndex: 1,
                },
            },
            {
                name: "Alternating starting unchecked",
                content: ["- [ ] a", "- [x] b", "- [ ] c", "- [x] d"],
                index: 0,
                expected: {
                    unchecked: ["- [ ] a", "- [ ] c"],
                    checked: ["- [x] b", "- [x] d"],
                    startIndex: 0,
                    endIndex: 4,
                },
            },
            {
                name: "Alternating starting checked",
                content: ["- [x] a", "- [ ] b", "- [x] c", "- [ ] d"],
                index: 0,
                expected: {
                    unchecked: ["- [ ] b"],
                    checked: ["- [x] c"],
                    startIndex: 1,
                    endIndex: 3,
                },
            },
            {
                name: "Two checked then two unchecked",
                content: ["- [x] a", "- [x] b", "- [ ] c", "- [ ] d"],
                index: 0,
                expected: {
                    unchecked: [],
                    checked: [],
                    startIndex: 2,
                    endIndex: 2,
                },
            },
            {
                name: "Two unchecked then two checked",
                content: ["- [ ] a", "- [ ] b", "- [x] c", "- [x] d"],
                index: 0,
                expected: {
                    unchecked: ["- [ ] a", "- [ ] b"],
                    checked: ["- [x] c", "- [x] d"],
                    startIndex: 0,
                    endIndex: 4,
                },
            },
            {
                name: "Multiple checked at end",
                content: ["- [ ] a", "- [ ] b", "- [x] c", "- [x] d", "- [x] e"],
                index: 0,
                expected: {
                    unchecked: ["- [ ] a", "- [ ] b"],
                    checked: ["- [x] c", "- [x] d", "- [x] e"],
                    startIndex: 0,
                    endIndex: 5,
                },
            },
            {
                name: "Multiple unchecked at end",
                content: ["- [x] a", "- [x] b", "- [ ] c", "- [ ] d", "- [ ] e"],
                index: 0,
                expected: {
                    unchecked: [],
                    checked: [],
                    startIndex: 2,
                    endIndex: 2,
                },
            },
            {
                name: "Empty list",
                content: [""],
                index: 0,
                expected: {
                    unchecked: [],
                    checked: [],
                    startIndex: 0,
                    endIndex: 0,
                },
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                const info = getLineInfo(editor.getLine(index));
                const result = reorder(editor, index, info);

                const expectedItems = [...expected.checked, ...expected.unchecked];

                expect(result).toEqual({
                    orderedItems: expectedItems,
                    reorderResult: {
                        start: expected.startIndex,
                        limit: expected.endIndex,
                    },
                });
            });
        });
    });

    describe("with checked items at the bottom", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            SettingsManager.getInstance().setCheckedItemsAtBottom(true);
        });

        const testCases = [
            {
                name: "One item unchecked",
                content: ["- [ ] a"],
                index: 0,
                expected: {
                    unchecked: [],
                    checked: [],
                    startIndex: 1,
                    endIndex: 1,
                },
            },
            {
                name: "One item checked",
                content: ["- [x] a"],
                index: 0,
                expected: {
                    unchecked: [],
                    checked: [],
                    startIndex: 1,
                    endIndex: 1,
                },
            },
            {
                name: "Alternating starting unchecked",
                content: ["- [ ] a", "- [x] b", "- [ ] c", "- [x] d"],
                index: 0,
                expected: {
                    unchecked: ["- [ ] c"],
                    checked: ["- [x] b"],
                    startIndex: 1,
                    endIndex: 3,
                },
            },
            {
                name: "Alternating starting checked",
                content: ["- [x] a", "- [ ] b", "- [x] c", "- [ ] d"],
                index: 0,
                expected: {
                    unchecked: ["- [ ] b", "- [ ] d"],
                    checked: ["- [x] a", "- [x] c"],
                    startIndex: 0,
                    endIndex: 4,
                },
            },
            {
                name: "Two checked then two unchecked",
                content: ["- [x] a", "- [x] b", "- [ ] c", "- [ ] d"],
                index: 0,
                expected: {
                    unchecked: ["- [ ] c", "- [ ] d"],
                    checked: ["- [x] a", "- [x] b"],
                    startIndex: 0,
                    endIndex: 4,
                },
            },
            {
                name: "Two unchecked then two checked",
                content: ["- [ ] a", "- [ ] b", "- [x] c", "- [x] d"],
                index: 0,
                expected: {
                    unchecked: [],
                    checked: [],
                    startIndex: 4,
                    endIndex: 4,
                },
            },
            {
                name: "Multiple checked at end",
                content: ["- [ ] a", "- [ ] b", "- [x] c", "- [x] d", "- [x] e"],
                index: 0,
                expected: {
                    unchecked: [],
                    checked: [],
                    startIndex: 5,
                    endIndex: 5,
                },
            },
            {
                name: "Multiple unchecked at end",
                content: ["- [x] a", "- [x] b", "- [ ] c", "- [ ] d", "- [ ] e"],
                index: 0,
                expected: {
                    unchecked: ["- [ ] c", "- [ ] d", "- [ ] e"],
                    checked: ["- [x] a", "- [x] b"],
                    startIndex: 0,
                    endIndex: 5,
                },
            },
            {
                name: "Empty list",
                content: [""],
                index: 0,
                expected: {
                    unchecked: [],
                    checked: [],
                    startIndex: 0,
                    endIndex: 0,
                },
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                const info = getLineInfo(editor.getLine(index));
                const result = reorder(editor, index, info);

                const expectedItems = [...expected.unchecked, ...expected.checked];

                expect(result).toEqual({
                    orderedItems: expectedItems,
                    reorderResult: {
                        start: expected.startIndex,
                        limit: expected.endIndex,
                    },
                });
            });
        });
    });
});

describe("deleteChecked", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        SettingsManager.getInstance().setCharsToDelete("A $");
    });

    const testCases = [
        {
            name: "One item unchecked",
            content: ["- [ ] a"],
            expected: ["- [ ] a"],
        },
        {
            name: "One item checked",
            content: ["- [x] a"],
            expected: [""],
        },
        {
            name: "Several items with different characters",
            content: ["- [x] x checked", "- [ ] unchecked", "- [A] A checked", "- [$] $ checked"],
            expected: ["- [ ] unchecked"],
        },
        {
            name: "Remove every checked character",
            content: [
                "text",
                "- [ ] unchecked",
                "- [A] A checked",
                "1. numbered",
                "- [$] $ checked",
                "1. [a] numbered checked",
                "2. [] numbered unchecked",
                "\t- [$] indented checked",
                "\t- [ ] indented unchecked",
                "\t1. [$] indented numbered checked",
                "\t2. [ ] indented numbered unchecked",
                "\tindented text",
            ],
            expected: [
                "text",
                "- [ ] unchecked",
                "1. numbered",
                "2. [] numbered unchecked",
                "\t- [ ] indented unchecked",
                "\t2. [ ] indented numbered unchecked",
                "\tindented text",
            ],
        },
    ];

    testCases.forEach(({ name, content, expected }) => {
        test(name, () => {
            const editor = createMockEditor(content);

            deleteChecked(editor);

            expected.forEach((line, i) => {
                expect(editor.getLine(i)).toBe(line);
            });
        });
    });
});
