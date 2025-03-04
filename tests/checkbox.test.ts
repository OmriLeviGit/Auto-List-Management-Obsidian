import { getLineInfo } from "src/utils";
import { createMockEditor } from "./__mocks__/createMockEditor";
import "./__mocks__/main";

import { reorder, getChecklistStart, deleteChecked, reorderChecklist } from "src/checkbox";
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
                name: "Return the correct ending index of the first change",
                content: ["- [x] a", "- [ ] b", "- [x] c"],
                index: 0,
                expected: {
                    unchecked: ["- [ ] b"],
                    checked: ["- [x] c"],
                    startIndex: 1,
                    endIndex: 3,
                },
            },
            {
                name: "Not the same indentation",
                content: ["- [ ] a", "- [ ] b", "- [x] c", "\t- [x] d", "- [ ] e", "- [x] f"],
                index: 0,
                expected: {
                    unchecked: ["- [ ] a", "- [ ] b"],
                    checked: ["- [x] c"],
                    startIndex: 0,
                    endIndex: 3,
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
                name: "Return the correct starting index of the first change",
                content: ["- [ ] a", "- [x] b", "- [ ] c"],
                index: 0,
                expected: {
                    unchecked: ["- [ ] c"],
                    checked: ["- [x] b"],
                    startIndex: 1,
                    endIndex: 3,
                },
            },
            {
                name: "Not the same indentation",
                content: ["- [x] a", "- [ ] b", "- [ ] c", "\t- [x] d", "- [ ] e", "- [x] f"],
                index: 0,
                expected: {
                    unchecked: ["- [ ] b", "- [ ] c"],
                    checked: ["- [x] a"],
                    startIndex: 0,
                    endIndex: 3,
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

describe("reorderChecklist", () => {
    describe("Checked items at the top", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            SettingsManager.getInstance().setCheckedItemsAtBottom(false);
        });

        const testCases = [
            {
                name: "Empty list",
                content: [""],
                index: 0,
                expected: {
                    content: [""],
                    result: undefined,
                },
            },
            {
                name: "One item unchecked",
                content: ["- [ ] a"],
                index: 0,
                expected: {
                    content: ["- [ ] a"],
                    result: undefined,
                },
            },
            {
                name: "One item checked",
                content: ["- [x] a"],
                index: 0,
                expected: {
                    content: ["- [x] a"],
                    result: undefined,
                },
            },
            {
                name: "Return the correct ending index of the first change",
                content: ["- [x] a", "- [ ] b", "- [x] c"],
                index: 0,
                expected: {
                    content: ["- [x] a", "- [x] c", "- [ ] b"],
                    result: {
                        start: 1,
                        limit: 3,
                    },
                },
            },
            {
                name: "Not the same indentation",
                content: ["- [ ] a", "- [ ] b", "- [x] c", "\t- [x] d", "- [ ] e", "- [x] f"],
                index: 0,
                expected: {
                    content: ["- [x] c", "- [ ] a", "- [ ] b", "\t- [x] d", "- [ ] e", "- [x] f"],
                    result: {
                        start: 0,
                        limit: 3,
                    },
                },
            },
            {
                name: "Alternating starting unchecked",
                content: ["- [ ] a", "- [x] b", "- [ ] c", "- [x] d"],
                index: 0,
                expected: {
                    content: ["- [x] b", "- [x] d", "- [ ] a", "- [ ] c"],
                    result: {
                        start: 0,
                        limit: 4,
                    },
                },
            },
            {
                name: "Alternating starting checked",
                content: ["- [x] a", "- [ ] b", "- [x] c", "- [ ] d"],
                index: 0,
                expected: {
                    content: ["- [x] a", "- [x] c", "- [ ] b", "- [ ] d"],
                    result: {
                        start: 1,
                        limit: 3,
                    },
                },
            },
            {
                name: "Two checked then two unchecked",
                content: ["- [x] a", "- [x] b", "- [ ] c", "- [ ] d"],
                index: 0,
                expected: {
                    content: ["- [x] a", "- [x] b", "- [ ] c", "- [ ] d"],
                    result: undefined,
                },
            },
            {
                name: "Two unchecked then two checked",
                content: ["- [ ] a", "- [ ] b", "- [x] c", "- [x] d"],
                index: 0,
                expected: {
                    content: ["- [x] c", "- [x] d", "- [ ] a", "- [ ] b"],
                    result: {
                        start: 0,
                        limit: 4,
                    },
                },
            },
            {
                name: "Multiple checked at end",
                content: ["- [ ] a", "- [ ] b", "- [x] c", "- [x] d", "- [x] e"],
                index: 0,
                expected: {
                    content: ["- [x] c", "- [x] d", "- [x] e", "- [ ] a", "- [ ] b"],
                    result: {
                        start: 0,
                        limit: 5,
                    },
                },
            },
            {
                name: "Multiple unchecked at end",
                content: ["- [x] a", "- [x] b", "- [ ] c", "- [ ] d", "- [ ] e"],
                index: 0,
                expected: {
                    content: ["- [x] a", "- [x] b", "- [ ] c", "- [ ] d", "- [ ] e"],
                    result: undefined,
                },
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                const result = reorderChecklist(editor, index);

                for (let i = 0; i < content.length; i++) {
                    expect(editor.getLine(i)).toBe(expected.content[i]);
                }

                expect(result).toStrictEqual(expected.result);
            });
        });
    });

    describe("Checked items at the bottom", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            SettingsManager.getInstance().setCheckedItemsAtBottom(true);
        });

        const testCases = [
            {
                name: "Empty list",
                content: [""],
                index: 0,
                expected: {
                    content: [""],
                    result: undefined,
                },
            },
            {
                name: "One item unchecked",
                content: ["- [ ] a"],
                index: 0,
                expected: {
                    content: ["- [ ] a"],
                    result: undefined,
                },
            },
            {
                name: "One item checked",
                content: ["- [x] a"],
                index: 0,
                expected: {
                    content: ["- [x] a"],
                    result: undefined,
                },
            },
            {
                name: "Return the correct starting index of the first change",
                content: ["- [ ] a", "- [x] b", "- [ ] c"],
                index: 0,
                expected: {
                    content: ["- [ ] a", "- [ ] c", "- [x] b"],
                    result: {
                        start: 1,
                        limit: 3,
                    },
                },
            },
            {
                name: "Not the same indentation",
                content: ["- [x] a", "- [ ] b", "- [ ] c", "\t- [x] d", "- [ ] e", "- [x] f"],
                index: 0,
                expected: {
                    content: ["- [ ] b", "- [ ] c", "- [x] a", "\t- [x] d", "- [ ] e", "- [x] f"],
                    result: {
                        start: 0,
                        limit: 3,
                    },
                },
            },
            {
                name: "Alternating starting unchecked",
                content: ["- [ ] a", "- [x] b", "- [ ] c", "- [x] d"],
                index: 0,
                expected: {
                    content: ["- [ ] a", "- [ ] c", "- [x] b", "- [x] d"],
                    result: {
                        start: 1,
                        limit: 3,
                    },
                },
            },
            {
                name: "Alternating starting checked",
                content: ["- [x] a", "- [ ] b", "- [x] c", "- [ ] d"],
                index: 0,
                expected: {
                    content: ["- [ ] b", "- [ ] d", "- [x] a", "- [x] c"],
                    result: {
                        start: 0,
                        limit: 4,
                    },
                },
            },
            {
                name: "Two checked then two unchecked",
                content: ["- [x] a", "- [x] b", "- [ ] c", "- [ ] d"],
                index: 0,
                expected: {
                    content: ["- [ ] c", "- [ ] d", "- [x] a", "- [x] b"],
                    result: {
                        start: 0,
                        limit: 4,
                    },
                },
            },
            {
                name: "Two unchecked then two checked",
                content: ["- [ ] a", "- [ ] b", "- [x] c", "- [x] d"],
                index: 0,
                expected: {
                    content: ["- [ ] a", "- [ ] b", "- [x] c", "- [x] d"],
                    result: undefined,
                },
            },
            {
                name: "Multiple checked at end",
                content: ["- [ ] a", "- [ ] b", "- [x] c", "- [x] d", "- [x] e"],
                index: 0,
                expected: {
                    content: ["- [ ] a", "- [ ] b", "- [x] c", "- [x] d", "- [x] e"],
                    result: undefined,
                },
            },
            {
                name: "Multiple unchecked at end",
                content: ["- [x] a", "- [x] b", "- [ ] c", "- [ ] d", "- [ ] e"],
                index: 0,
                expected: {
                    content: ["- [ ] c", "- [ ] d", "- [ ] e", "- [x] a", "- [x] b"],
                    result: {
                        start: 0,
                        limit: 5,
                    },
                },
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                const result = reorderChecklist(editor, index);

                // for (let i = 0; i < content.length; i++) {
                //     expect(editor.getLine(i)).toBe(expected.content[i]);
                // }

                for (let i = 0; i < content.length; i++) {
                    expect(editor.getLine(i)).toBe(expected.content[i]);
                }

                expect(result).toStrictEqual(expected.result);
            });
        });
    });

    test("Multiple lists", () => {
        jest.clearAllMocks();
        SettingsManager.getInstance().setCheckedItemsAtBottom(true);

        const content = [
            "- [ ] a",
            "- [x] b",
            "- [ ] c",
            "text",
            "- [ ] a",
            "- [x] b",
            "- [ ] c",
            "text",
            "- [ ] a",
            "- [x] b",
            "- [ ] c",
        ];

        const expected = [
            "- [ ] a",
            "- [ ] c",
            "- [x] b",
            "text",
            "- [ ] a",
            "- [ ] c",
            "- [x] b",
            "text",
            "- [ ] a",
            "- [x] b",
            "- [ ] c",
        ];

        const editor = createMockEditor(content);
        const result = reorderChecklist(editor, 0, 6);

        for (let i = 0; i < content.length; i++) {
            expect(editor.getLine(i)).toBe(expected[i]);
        }

        expect(result).toStrictEqual({
            start: 1,
            limit: 7,
        });
    });
});
