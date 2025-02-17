import { getLastListStart, getLineInfo } from "src/utils";
import { createMockEditor } from "./__mocks__/createMockEditor";
import "./__mocks__/main";

import { getChecklistDetails, getChecklistStart } from "src/checkbox";
import SettingsManager from "src/SettingsManager";

describe("getChecklistStart", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        SettingsManager.getInstance().setChecklistSortPosition("bottom");
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

describe("getChecklistDetails", () => {
    describe("with checked items at the top", () => {
        const checkedAtTop = true;
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
                    cursorAt: 0,
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
                    cursorAt: 1,
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
                    cursorAt: 2,
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
                    cursorAt: 2,
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
                    cursorAt: 2,
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
                    cursorAt: 2,
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
                    cursorAt: 3,
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
                    cursorAt: 2,
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
                    cursorAt: 0,
                },
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                const info = getLineInfo(editor.getLine(index));
                const result = getChecklistDetails(editor, index, info, checkedAtTop);

                expect(result).toEqual({
                    uncheckedItems: expected.unchecked,
                    checkedItems: expected.checked,
                    startIndex: expected.startIndex,
                    endIndex: expected.endIndex,
                    placeCursorAt: expected.cursorAt,
                });
            });
        });
    });

    describe("with checked items at the bottom", () => {
        const checkedAtTop = false;
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
                    cursorAt: 0,
                },
            },
            {
                name: "One item checked",
                content: ["- [x] a"],
                index: 0,
                expected: {
                    unchecked: [],
                    checked: [],
                    startIndex: 0,
                    endIndex: 0,
                    cursorAt: -1,
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
                    cursorAt: 1,
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
                    cursorAt: 1,
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
                    cursorAt: 1,
                },
            },
            {
                name: "Two unchecked then two checked",
                content: ["- [ ] a", "- [ ] b", "- [x] c", "- [x] d"],
                index: 0,
                expected: {
                    unchecked: [],
                    checked: [],
                    startIndex: 2,
                    endIndex: 2,
                    cursorAt: 1,
                },
            },
            {
                name: "Multiple checked at end",
                content: ["- [ ] a", "- [ ] b", "- [x] c", "- [x] d", "- [x] e"],
                index: 0,
                expected: {
                    unchecked: [],
                    checked: [],
                    startIndex: 2,
                    endIndex: 2,
                    cursorAt: 1,
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
                    cursorAt: 2,
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
                    cursorAt: -1,
                },
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                const info = getLineInfo(editor.getLine(index));
                const result = getChecklistDetails(editor, index, info, checkedAtTop);

                expect(result).toEqual({
                    uncheckedItems: expected.unchecked,
                    checkedItems: expected.checked,
                    startIndex: expected.startIndex,
                    endIndex: expected.endIndex,
                    placeCursorAt: expected.cursorAt,
                });
            });
        });
    });
});
