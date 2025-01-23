import { createMockEditor } from "./__mocks__/createMockEditor";
import "./__mocks__/main";

import { getCheckboxEndIndex, insert } from "src/checkbox";
import SettingsManager from "src/SettingsManager";

describe("getCheckboxEndIndex - unchecked end detection tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    const testCases = [
        {
            name: "Test with a single non-checkbox line",
            content: ["a"],
            index: 0,
            expected: undefined,
        },
        {
            name: "Test with numbered list containing a single item",
            content: ["1. a"],
            index: 0,
            expected: undefined,
        },
        {
            name: "Test with a single unchecked checkbox",
            content: ["- [ ] a"],
            index: 0,
            expected: 1,
        },
        {
            name: "Test with two unchecked checkboxes",
            content: ["- [ ] a", "- [ ] b"],
            index: 0,
            expected: 2,
        },
        {
            name: "Test with two unchecked checkboxes, selecting second checkbox",
            content: ["- [ ] a", "- [ ] b"],
            index: 1,
            expected: 2,
        },
        {
            name: "Test with mixed checkboxes and non-checkbox lines",
            content: ["- [ ] a", "- [ ] b", "c", "- [ ] d"],
            index: 0,
            expected: 2,
        },
        {
            name: "Test with space indented checkbox and text",
            content: ["- [ ] a", " text", "- [ ] c"],
            index: 0,
            expected: 1,
        },
        {
            name: "Test with tab indented checkbox and text",
            content: ["- [ ] a", "\ttext", "- [ ] c"],
            index: 0,
            expected: 1,
        },
        {
            name: "Test with space nested checkbox and item",
            content: ["- [ ] a", " - [ ] b", "- [ ] c", "d"],
            index: 0,
            expected: 1,
        },
        {
            name: "Test with tab nested checkbox and item",
            content: ["- [ ] a", "\t- [ ] b", "- [ ] c", "d"],
            index: 0,
            expected: 1,
        },
        {
            name: "Test with space nested numbers and checkboxes",
            content: ["1. [ ] a", "2. [ ] b", " t1. [ ] c", "3. [ ] d"],
            index: 0,
            expected: 2,
        },
        {
            name: "Test with tab nested numbers and checkboxes",
            content: ["1. [ ] a", "2. [ ] b", "\t1. [ ] c", "3. [ ] d"],
            index: 0,
            expected: 2,
        },
        {
            name: "Test with space nested checkboxes and multiple levels",
            content: ["1. [ ] a", " 1. [ ] b", " 2. [ ] c", "2. [ ] d"],
            index: 1,
            expected: 3,
        },
        {
            name: "Test with tab nested checkboxes and multiple levels",
            content: ["1. [ ] a", "\t1. [ ] b", "\t2. [ ] c", "2. [ ] d"],
            index: 1,
            expected: 3,
        },
        {
            name: "Test with nested checkboxes and text",
            content: ["1. [ ] a", "\t1. [ ] b", "\t2. [ ] c", "\ttext", "2. [ ] d"],
            index: 1,
            expected: 3,
        },
        {
            name: "Test with nested checkboxes and numbered text",
            content: ["1. [ ] a", "\t1. [ ] b", "\t2. [ ] c", "\t3. text", "\ttext", "2. [ ] d"],
            index: 1,
            expected: 3,
        },
    ];

    testCases.forEach(({ name, content, index, expected }) => {
        test(name, () => {
            const editor = createMockEditor(content);
            const res = getCheckboxEndIndex(editor, index);
            expect(res).toBe(expected);
        });
    });
});

describe("getCheckboxEndIndex - sort to bottom tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    const testCases = [
        {
            name: "Test index 0 checked",
            content: ["- [x] a"],
            index: 0,
            expected: 1,
        },
        {
            name: "Test index 0 unchecked",
            content: ["- [ ] a"],
            index: 0,
            expected: 1,
        },
        {
            name: "Test default",
            content: ["- [ ] a", "- [x] b", "- [x] c"],
            index: 0,
            expected: 3,
        },
        {
            name: "Test sort to bottom with indent",
            content: ["- [ ] a", "- [x] b", "\t- [x] c", "- [ ] d"],
            index: 0,
            expected: 2,
        },
        {
            name: "Test indented sort to bottom",
            content: ["- [ ] a", "\t- [ ] b", "\t- [x] c", "\t- [x] d", "- [x] e"],
            index: 1,
            expected: 4,
        },
        {
            name: "Test indented text sort to bottom",
            content: ["- [ ] a", "\t- [ ] b", "\t- [x] c", "\ttext", "\t- [x] d", "- [x] e"],
            index: 1,
            expected: 3,
        },
        {
            name: "Test no checked item",
            content: ["- [ ] a", "- [ ] b", "- [ ] c"],
            index: 0,
            expected: 3,
        },
        {
            name: "Test all items checked",
            content: ["- [x] a", "- [x] b", "- [x] c"],
            index: 0,
            expected: 3,
        },
    ];

    testCases.forEach(({ name, content, index, expected }) => {
        test(name, () => {
            SettingsManager.getInstance().setSortCheckboxesBottom(true);
            const editor = createMockEditor(content);
            const res = getCheckboxEndIndex(editor, index);

            expect(res).toBe(expected);
        });
    });
});

describe("getCheckboxEndIndex - sort to top tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    const testCases = [
        {
            name: "Test index 0 checked",
            content: ["- [x] a"],
            index: 0,
            expected: 0,
        },
        {
            name: "Test index 0 unchecked",
            content: ["- [ ] a"],
            index: 0,
            expected: 1,
        },
        {
            name: "Test default",
            content: ["- [ ] a", "- [x] b", "- [x] c"],
            index: 0,
            expected: 1,
        },
        {
            name: "Test sort to top with indent",
            content: ["- [ ] a", "- [x] b", "\t- [x] c", "- [ ] d"],
            index: 0,
            expected: 1,
        },
        {
            name: "Test indented sort to top",
            content: ["- [ ] a", "\t- [ ] b", "\t- [x] c", "\t- [x] d", "- [x] e"],
            index: 1,
            expected: 2,
        },
        {
            name: "Test indented text sort to top",
            content: ["- [ ] a", "\t- [ ] b", "\t- [x] c", "\ttext", "\t- [x] d", "- [x] e"],
            index: 1,
            expected: 2,
        },
        {
            name: "Test no checked item",
            content: ["- [ ] a", "- [ ] b", "- [ ] c"],
            index: 0,
            expected: 3,
        },
        {
            name: "Test all items checked",
            content: ["- [x] a", "- [x] b", "- [x] c"],
            index: 0,
            expected: 0,
        },
    ];

    testCases.forEach(({ name, content, index, expected }) => {
        test(name, () => {
            SettingsManager.getInstance().setSortCheckboxesBottom(false);
            const editor = createMockEditor(content);
            const res = getCheckboxEndIndex(editor, index);

            expect(res).toBe(expected);
        });
    });
});

describe.only("insert", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testCases = [
        // {
        //     name: "Single Item",
        //     content: ["a"],
        //     index: 0,
        //     insertTo: 0,
        //     expected: ["a"],
        // },
        // {
        //     name: "Insert in place (at the beginning)",
        //     content: ["a", "b"],
        //     index: 0,
        //     insertTo: 0,
        //     expected: ["a", "b"],
        // },
        // {
        //     name: "Insert in place (at the end)",
        //     content: ["a", "b"],
        //     index: 1,
        //     insertTo: 1,
        //     expected: ["a", "b"],
        // },
        // {
        //     name: "Insert in place (at the middle)",
        //     content: ["a", "b", "c"],
        //     index: 1,
        //     insertTo: 1,
        //     expected: ["a", "b", "c"],
        // },
        {
            name: "From the start to the middle",
            content: ["a", "b", "c"],
            index: 0,
            insertTo: 1,
            expected: ["b", "a", "c"],
        },
        // {
        //     name: "From the end to the middle",
        //     content: ["a", "b", "c"],
        //     index: 2,
        //     insertTo: 1,
        //     expected: ["a", "c", "b"],
        // },
        // {
        //     name: "From the middle to the start",
        //     content: ["a", "b", "c"],
        //     index: 1,
        //     insertTo: 0,
        //     expected: ["b", "a", "c"],
        // },
        // {
        //     name: "From the middle to the end",
        //     content: ["a", "b", "c"],
        //     index: 1,
        //     insertTo: 2,
        //     expected: ["a", "c", "b"],
        // },
        // {
        //     name: "From start to end",
        //     content: ["a", "b", "c"],
        //     index: 0,
        //     insertTo: 2,
        //     expected: ["b", "c", "a"],
        // },
        // {
        //     name: "From end to start",
        //     content: ["a", "b", "c"],
        //     index: 2,
        //     insertTo: 0,
        //     expected: ["c", "a", "b"],
        // },
        // {
        //     name: "Longer sequence forward insert",
        //     content: ["a", "b", "c", "d", "e"],
        //     index: 1,
        //     insertTo: 3,
        //     expected: ["a", "c", "d", "b", "e"],
        // },
        // {
        //     name: "Longer sequence backwards insert",
        //     content: ["a", "b", "c", "d", "e"],
        //     index: 3,
        //     insertTo: 1,
        //     expected: ["a", "d", "b", "c", "e"],
        // },
    ];

    testCases.forEach(({ name, content, index, insertTo, expected }) => {
        test(name, () => {
            const editor = createMockEditor(content);
            insert(editor, index, insertTo);

            // content.forEach((_, i) => {
            //     console.debug(`@${editor.getLine(i)}@`);
            // });

            expected.forEach((_, i) => {
                expect(editor.getLine(i)).toBe(expected[i]);
            });
        });
    });
});
