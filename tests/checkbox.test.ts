import { createMockEditor } from "./__mocks__/createMockEditor";
import "./__mocks__/main";

import { reorderCheckboxes, getChecklistStart, sameStatus } from "src/checkbox";
import SettingsManager from "src/SettingsManager";

describe("getChecklistStart", () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
            SettingsManager.getInstance().setSortCheckboxesBottom(false);
            const editor = createMockEditor(content);
            const res = getChecklistStart(editor, index);

            expect(res).toBe(expected);
        });
    });
});
