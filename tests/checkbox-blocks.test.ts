import { getLineInfo } from "src/utils";
import { createMockEditor } from "./__mocks__/createMockEditor";
import "./__mocks__/main";

import { reorder, reorderChecklist } from "src/checkbox";
import SettingsManager from "src/SettingsManager";

describe("Block-based checkbox reordering", () => {
    describe("Single level with indented content", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            SettingsManager.getInstance().setCheckedItemsAtBottom(true);
        });

        const testCases = [
            {
                name: "Unchecked checkbox with indented text moves as a block",
                content: [
                    "- [ ] Task A",
                    "    Some description",
                    "- [x] Task B",
                ],
                index: 0,
                expected: [
                    "- [ ] Task A",
                    "    Some description",
                    "- [x] Task B",
                ],
            },
            {
                name: "Checked checkbox with indented text moves to bottom as a block",
                content: [
                    "- [x] Task A",
                    "    Some description",
                    "- [ ] Task B",
                ],
                index: 0,
                expected: [
                    "- [ ] Task B",
                    "- [x] Task A",
                    "    Some description",
                ],
            },
            {
                name: "Multiple checkboxes with their indented content move as blocks",
                content: [
                    "- [ ] Task A",
                    "    Description A",
                    "- [x] Task B",
                    "    Description B",
                    "- [ ] Task C",
                    "    Description C",
                ],
                index: 0,
                expected: [
                    "- [ ] Task A",
                    "    Description A",
                    "- [ ] Task C",
                    "    Description C",
                    "- [x] Task B",
                    "    Description B",
                ],
            },
            {
                name: "Multiple lines of indented content stay with parent",
                content: [
                    "- [x] Task A",
                    "    Line 1",
                    "    Line 2",
                    "    Line 3",
                    "- [ ] Task B",
                ],
                index: 0,
                expected: [
                    "- [ ] Task B",
                    "- [x] Task A",
                    "    Line 1",
                    "    Line 2",
                    "    Line 3",
                ],
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                reorderChecklist(editor, index);

                for (let i = 0; i < expected.length; i++) {
                    expect(editor.getLine(i)).toBe(expected[i]);
                }
            });
        });
    });

    describe("Nested checkboxes", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            SettingsManager.getInstance().setCheckedItemsAtBottom(true);
        });

        const testCases = [
            {
                name: "Parent checkbox with nested unchecked children",
                content: [
                    "- [ ] Parent A",
                    "    - [ ] Child A1",
                    "    - [ ] Child A2",
                    "- [ ] Parent B",
                ],
                index: 0,
                expected: [
                    "- [ ] Parent A",
                    "    - [ ] Child A1",
                    "    - [ ] Child A2",
                    "- [ ] Parent B",
                ],
            },
            {
                name: "Parent checkbox with nested checked children - children reorder within parent",
                content: [
                    "- [ ] Parent A",
                    "    - [x] Child A1",
                    "    - [ ] Child A2",
                    "- [ ] Parent B",
                ],
                index: 0,
                expected: [
                    "- [ ] Parent A",
                    "    - [ ] Child A2",
                    "    - [x] Child A1",
                    "- [ ] Parent B",
                ],
            },
            {
                name: "Checked parent with children moves entire block to bottom",
                content: [
                    "- [x] Parent A",
                    "    - [ ] Child A1",
                    "    - [ ] Child A2",
                    "- [ ] Parent B",
                ],
                index: 0,
                expected: [
                    "- [ ] Parent B",
                    "- [x] Parent A",
                    "    - [ ] Child A1",
                    "    - [ ] Child A2",
                ],
            },
            {
                name: "Checked parent with mixed children - parent moves, children reorder within",
                content: [
                    "- [x] Parent A",
                    "    - [x] Child A1",
                    "    - [ ] Child A2",
                    "- [ ] Parent B",
                ],
                index: 0,
                expected: [
                    "- [ ] Parent B",
                    "- [x] Parent A",
                    "    - [ ] Child A2",
                    "    - [x] Child A1",
                ],
            },
            {
                name: "Multiple parents with nested checkboxes",
                content: [
                    "- [ ] Parent A",
                    "    - [x] Child A1",
                    "    - [ ] Child A2",
                    "- [x] Parent B",
                    "    - [ ] Child B1",
                    "    - [x] Child B2",
                ],
                index: 0,
                expected: [
                    "- [ ] Parent A",
                    "    - [ ] Child A2",
                    "    - [x] Child A1",
                    "- [x] Parent B",
                    "    - [ ] Child B1",
                    "    - [x] Child B2",
                ],
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                reorderChecklist(editor, index);

                for (let i = 0; i < expected.length; i++) {
                    expect(editor.getLine(i)).toBe(expected[i]);
                }
            });
        });
    });

    describe("Deeply nested checkboxes", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            SettingsManager.getInstance().setCheckedItemsAtBottom(true);
        });

        const testCases = [
            {
                name: "Three levels of nesting - grandchild checked",
                content: [
                    "- [ ] Parent",
                    "    - [ ] Child",
                    "        - [x] Grandchild A",
                    "        - [ ] Grandchild B",
                ],
                index: 0,
                expected: [
                    "- [ ] Parent",
                    "    - [ ] Child",
                    "        - [ ] Grandchild B",
                    "        - [x] Grandchild A",
                ],
            },
            {
                name: "Three levels - checking child moves child block within parent",
                content: [
                    "- [ ] Parent",
                    "    - [x] Child A",
                    "        - [ ] Grandchild A1",
                    "        - [ ] Grandchild A2",
                    "    - [ ] Child B",
                ],
                index: 0,
                expected: [
                    "- [ ] Parent",
                    "    - [ ] Child B",
                    "    - [x] Child A",
                    "        - [ ] Grandchild A1",
                    "        - [ ] Grandchild A2",
                ],
            },
            {
                name: "Three levels - checking parent moves entire tree",
                content: [
                    "- [x] Parent A",
                    "    - [ ] Child A1",
                    "        - [ ] Grandchild A1a",
                    "    - [ ] Child A2",
                    "- [ ] Parent B",
                ],
                index: 0,
                expected: [
                    "- [ ] Parent B",
                    "- [x] Parent A",
                    "    - [ ] Child A1",
                    "        - [ ] Grandchild A1a",
                    "    - [ ] Child A2",
                ],
            },
            {
                name: "Complex nested scenario with mixed states",
                content: [
                    "- [ ] Parent A",
                    "    - [x] Child A1",
                    "        - [x] Grandchild A1a",
                    "        - [ ] Grandchild A1b",
                    "    - [ ] Child A2",
                    "        - [ ] Grandchild A2a",
                    "- [x] Parent B",
                    "    - [ ] Child B1",
                ],
                index: 0,
                expected: [
                    "- [ ] Parent A",
                    "    - [ ] Child A2",
                    "        - [ ] Grandchild A2a",
                    "    - [x] Child A1",
                    "        - [ ] Grandchild A1b",
                    "        - [x] Grandchild A1a",
                    "- [x] Parent B",
                    "    - [ ] Child B1",
                ],
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                reorderChecklist(editor, index);

                for (let i = 0; i < expected.length; i++) {
                    expect(editor.getLine(i)).toBe(expected[i]);
                }
            });
        });
    });

    describe("Mixed content (checkboxes + text + nested items)", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            SettingsManager.getInstance().setCheckedItemsAtBottom(true);
        });

        const testCases = [
            {
                name: "Checkbox with description before nested checkbox",
                content: [
                    "- [x] Parent",
                    "    This is a description",
                    "    - [ ] Child",
                    "- [ ] Other",
                ],
                index: 0,
                expected: [
                    "- [ ] Other",
                    "- [x] Parent",
                    "    This is a description",
                    "    - [ ] Child",
                ],
            },
            {
                name: "Checkbox with description before and after nested checkbox",
                content: [
                    "- [ ] Parent",
                    "    Before description",
                    "    - [x] Child A",
                    "    - [ ] Child B",
                    "    After description",
                ],
                index: 0,
                expected: [
                    "- [ ] Parent",
                    "    Before description",
                    "    - [ ] Child B",
                    "    - [x] Child A",
                    "    After description",
                ],
            },
            {
                name: "Multiple indentation levels with mixed content",
                content: [
                    "- [x] Parent",
                    "    Parent description",
                    "    - [ ] Child",
                    "        Child description",
                    "    More parent text",
                    "- [ ] Other",
                ],
                index: 0,
                expected: [
                    "- [ ] Other",
                    "- [x] Parent",
                    "    Parent description",
                    "    - [ ] Child",
                    "        Child description",
                    "    More parent text",
                ],
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                reorderChecklist(editor, index);

                for (let i = 0; i < expected.length; i++) {
                    expect(editor.getLine(i)).toBe(expected[i]);
                }
            });
        });
    });

    describe("Checked items at top setting", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            SettingsManager.getInstance().setCheckedItemsAtBottom(false);
        });

        const testCases = [
            {
                name: "Checked parent moves to top with all children",
                content: [
                    "- [ ] Parent A",
                    "    - [ ] Child A1",
                    "- [x] Parent B",
                    "    - [ ] Child B1",
                ],
                index: 0,
                expected: [
                    "- [x] Parent B",
                    "    - [ ] Child B1",
                    "- [ ] Parent A",
                    "    - [ ] Child A1",
                ],
            },
            {
                name: "Nested checked items move to top within their parent",
                content: [
                    "- [ ] Parent",
                    "    - [ ] Child A",
                    "    - [x] Child B",
                    "        - [ ] Grandchild",
                ],
                index: 0,
                expected: [
                    "- [ ] Parent",
                    "    - [x] Child B",
                    "        - [ ] Grandchild",
                    "    - [ ] Child A",
                ],
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                reorderChecklist(editor, index);

                for (let i = 0; i < expected.length; i++) {
                    expect(editor.getLine(i)).toBe(expected[i]);
                }
            });
        });
    });

    describe("Tab indentation", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            SettingsManager.getInstance().setCheckedItemsAtBottom(true);
        });

        const testCases = [
            {
                name: "Tab-indented children move with parent",
                content: [
                    "- [x] Parent",
                    "\t- [ ] Child A",
                    "\t- [ ] Child B",
                    "- [ ] Other",
                ],
                index: 0,
                expected: [
                    "- [ ] Other",
                    "- [x] Parent",
                    "\t- [ ] Child A",
                    "\t- [ ] Child B",
                ],
            },
            {
                name: "Tab-indented nested checkboxes reorder within parent",
                content: [
                    "- [ ] Parent",
                    "\t- [x] Child A",
                    "\t- [ ] Child B",
                ],
                index: 0,
                expected: [
                    "- [ ] Parent",
                    "\t- [ ] Child B",
                    "\t- [x] Child A",
                ],
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                reorderChecklist(editor, index);

                for (let i = 0; i < expected.length; i++) {
                    expect(editor.getLine(i)).toBe(expected[i]);
                }
            });
        });
    });

    describe("Edge cases", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            SettingsManager.getInstance().setCheckedItemsAtBottom(true);
        });

        const testCases = [
            {
                name: "Empty indented lines are preserved",
                content: [
                    "- [x] Parent",
                    "    ",
                    "    - [ ] Child",
                    "- [ ] Other",
                ],
                index: 0,
                expected: [
                    "- [ ] Other",
                    "- [x] Parent",
                    "    ",
                    "    - [ ] Child",
                ],
            },
            {
                name: "Only parent checkbox, no children",
                content: [
                    "- [x] Task A",
                    "- [ ] Task B",
                ],
                index: 0,
                expected: [
                    "- [ ] Task B",
                    "- [x] Task A",
                ],
            },
            {
                name: "All checkboxes checked - no reordering needed",
                content: [
                    "- [x] Parent A",
                    "    - [x] Child A1",
                    "- [x] Parent B",
                ],
                index: 0,
                expected: [
                    "- [x] Parent A",
                    "    - [x] Child A1",
                    "- [x] Parent B",
                ],
            },
            {
                name: "All checkboxes unchecked - no reordering needed",
                content: [
                    "- [ ] Parent A",
                    "    - [ ] Child A1",
                    "- [ ] Parent B",
                ],
                index: 0,
                expected: [
                    "- [ ] Parent A",
                    "    - [ ] Child A1",
                    "- [ ] Parent B",
                ],
            },
            {
                name: "No extra lines added - line count preserved after reordering",
                content: [
                    "- [ ] Task A",
                    "    Description A",
                    "- [x] Task B",
                    "    Description B",
                    "- [ ] Task C",
                ],
                index: 0,
                expected: [
                    "- [ ] Task A",
                    "    Description A",
                    "- [ ] Task C",
                    "- [x] Task B",
                    "    Description B",
                ],
            },
            {
                name: "No extra lines with unchanged prefix",
                content: [
                    "- [ ] Unchanged",
                    "- [ ] Task A",
                    "- [x] Task B",
                ],
                index: 0,
                expected: [
                    "- [ ] Unchanged",
                    "- [ ] Task A",
                    "- [x] Task B",
                ],
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                const initialLineCount = content.length;

                reorderChecklist(editor, index);

                // Check line count is preserved (no extra lines added)
                expect(editor.lastLine() + 1).toBe(initialLineCount);

                // Check content matches expected
                for (let i = 0; i < expected.length; i++) {
                    expect(editor.getLine(i)).toBe(expected[i]);
                }
            });
        });
    });

    describe("Numbered lists with checkboxes", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            SettingsManager.getInstance().setCheckedItemsAtBottom(true);
            SettingsManager.getInstance().setLiveNumberingUpdate(false);
        });

        const testCases = [
            {
                name: "Numbered checkbox with indented children",
                content: [
                    "1. [x] Parent",
                    "    - [ ] Child A",
                    "    - [ ] Child B",
                    "2. [ ] Other",
                ],
                index: 0,
                expected: [
                    "2. [ ] Other",
                    "1. [x] Parent",
                    "    - [ ] Child A",
                    "    - [ ] Child B",
                ],
            },
            {
                name: "Numbered parent with numbered checked children",
                content: [
                    "1. [ ] Parent",
                    "    1. [x] Child A",
                    "    2. [ ] Child B",
                ],
                index: 0,
                expected: [
                    "1. [ ] Parent",
                    "    2. [ ] Child B",
                    "    1. [x] Child A",
                ],
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                reorderChecklist(editor, index);

                for (let i = 0; i < expected.length; i++) {
                    expect(editor.getLine(i)).toBe(expected[i]);
                }
            });
        });
    });

    describe("Numbered checkboxes - reorder and maintain proper numbering", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            SettingsManager.getInstance().setCheckedItemsAtBottom(true);
            SettingsManager.getInstance().setLiveNumberingUpdate(false);
        });

        const testCases = [
            {
                name: "Simple numbered list - checkboxes reorder, numbers stay sequential",
                content: [
                    "1. [ ] Task A",
                    "2. [x] Task B",
                    "3. [ ] Task C",
                ],
                index: 0,
                expected: [
                    "1. [ ] Task A",
                    "3. [ ] Task C",
                    "2. [x] Task B",
                ],
            },
            {
                name: "Numbered list with blocks - entire blocks move together",
                content: [
                    "1. [x] Parent A",
                    "    Description A",
                    "2. [ ] Parent B",
                    "    Description B",
                    "3. [x] Parent C",
                ],
                index: 0,
                expected: [
                    "2. [ ] Parent B",
                    "    Description B",
                    "1. [x] Parent A",
                    "    Description A",
                    "3. [x] Parent C",
                ],
            },
            {
                name: "Numbered list with nested numbered checkboxes",
                content: [
                    "1. [ ] Parent A",
                    "    1. [x] Child A1",
                    "    2. [ ] Child A2",
                    "2. [x] Parent B",
                    "    1. [ ] Child B1",
                ],
                index: 0,
                expected: [
                    "1. [ ] Parent A",
                    "    2. [ ] Child A2",
                    "    1. [x] Child A1",
                    "2. [x] Parent B",
                    "    1. [ ] Child B1",
                ],
            },
            {
                name: "Complex numbered hierarchy with mixed checkbox states",
                content: [
                    "1. [x] Parent A",
                    "    1. [ ] Child A1",
                    "    2. [x] Child A2",
                    "2. [ ] Parent B",
                    "3. [x] Parent C",
                    "    1. [ ] Child C1",
                ],
                index: 0,
                expected: [
                    "2. [ ] Parent B",
                    "1. [x] Parent A",
                    "    1. [ ] Child A1",
                    "    2. [x] Child A2",
                    "3. [x] Parent C",
                    "    1. [ ] Child C1",
                ],
            },
            {
                name: "Multiple levels of numbered nesting with checkboxes",
                content: [
                    "1. [ ] Level 1 A",
                    "    1. [x] Level 2 A1",
                    "        1. [ ] Level 3 A1a",
                    "    2. [ ] Level 2 A2",
                    "2. [x] Level 1 B",
                ],
                index: 0,
                expected: [
                    "1. [ ] Level 1 A",
                    "    2. [ ] Level 2 A2",
                    "    1. [x] Level 2 A1",
                    "        1. [ ] Level 3 A1a",
                    "2. [x] Level 1 B",
                ],
            },
            {
                name: "Numbered list starting from non-1 value",
                content: [
                    "5. [x] Task A",
                    "6. [ ] Task B",
                    "7. [x] Task C",
                ],
                index: 0,
                expected: [
                    "6. [ ] Task B",
                    "5. [x] Task A",
                    "7. [x] Task C",
                ],
            },
            {
                name: "Numbered blocks with mixed content and nested lists",
                content: [
                    "1. [x] Parent A",
                    "    Description text",
                    "    1. [ ] Child A1",
                    "    Some more text",
                    "2. [ ] Parent B",
                    "    1. [x] Child B1",
                    "    2. [ ] Child B2",
                ],
                index: 0,
                expected: [
                    "2. [ ] Parent B",
                    "    2. [ ] Child B2",
                    "    1. [x] Child B1",
                    "1. [x] Parent A",
                    "    Description text",
                    "    1. [ ] Child A1",
                    "    Some more text",
                ],
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                reorderChecklist(editor, index);

                for (let i = 0; i < expected.length; i++) {
                    expect(editor.getLine(i)).toBe(expected[i]);
                }
            });
        });
    });

    describe("Numbered checkboxes - checked items at top", () => {
        beforeEach(() => {
            jest.clearAllMocks();
            SettingsManager.getInstance().setCheckedItemsAtBottom(false);
            SettingsManager.getInstance().setLiveNumberingUpdate(false);
        });

        const testCases = [
            {
                name: "Checked numbered items move to top",
                content: [
                    "1. [ ] Task A",
                    "2. [x] Task B",
                    "3. [ ] Task C",
                ],
                index: 0,
                expected: [
                    "2. [x] Task B",
                    "1. [ ] Task A",
                    "3. [ ] Task C",
                ],
            },
            {
                name: "Numbered blocks with checked parent moves to top",
                content: [
                    "1. [ ] Parent A",
                    "    1. [ ] Child A1",
                    "2. [x] Parent B",
                    "    1. [ ] Child B1",
                ],
                index: 0,
                expected: [
                    "2. [x] Parent B",
                    "    1. [ ] Child B1",
                    "1. [ ] Parent A",
                    "    1. [ ] Child A1",
                ],
            },
        ];

        testCases.forEach(({ name, content, index, expected }) => {
            test(name, () => {
                const editor = createMockEditor(content);
                reorderChecklist(editor, index);

                for (let i = 0; i < expected.length; i++) {
                    expect(editor.getLine(i)).toBe(expected[i]);
                }
            });
        });
    });
});
