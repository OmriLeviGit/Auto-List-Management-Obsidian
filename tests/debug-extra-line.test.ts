import { getLineInfo } from "src/utils";
import { createMockEditor } from "./__mocks__/createMockEditor";
import "./__mocks__/main";

import { reorderChecklist } from "src/checkbox";
import SettingsManager from "src/SettingsManager";

describe("Debug: One line too many issue", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        SettingsManager.getInstance().setCheckedItemsAtBottom(true);
    });

    test("Simple case - 3 items, check middle one", () => {
        const content = [
            "- [ ] Task A",
            "- [x] Task B",
            "- [ ] Task C",
        ];

        const editor = createMockEditor(content);
        console.log("BEFORE:");
        for (let i = 0; i <= editor.lastLine(); i++) {
            console.log(`  Line ${i}: "${editor.getLine(i)}"`);
        }

        reorderChecklist(editor, 1);

        console.log("\nAFTER:");
        for (let i = 0; i <= editor.lastLine(); i++) {
            console.log(`  Line ${i}: "${editor.getLine(i)}"`);
        }
        console.log(`Total lines: ${editor.lastLine() + 1}`);

        expect(editor.lastLine() + 1).toBe(3);
        expect(editor.getLine(0)).toBe("- [ ] Task A");
        expect(editor.getLine(1)).toBe("- [ ] Task C");
        expect(editor.getLine(2)).toBe("- [x] Task B");
    });

    test("With text after checklist", () => {
        const content = [
            "- [ ] Task A",
            "- [x] Task B",
            "- [ ] Task C",
            "Some text after",
        ];

        const editor = createMockEditor(content);
        console.log("BEFORE:");
        for (let i = 0; i <= editor.lastLine(); i++) {
            console.log(`  Line ${i}: "${editor.getLine(i)}"`);
        }

        reorderChecklist(editor, 1);

        console.log("\nAFTER:");
        for (let i = 0; i <= editor.lastLine(); i++) {
            console.log(`  Line ${i}: "${editor.getLine(i)}"`);
        }
        console.log(`Total lines: ${editor.lastLine() + 1}`);

        expect(editor.lastLine() + 1).toBe(4);
        expect(editor.getLine(0)).toBe("- [ ] Task A");
        expect(editor.getLine(1)).toBe("- [ ] Task C");
        expect(editor.getLine(2)).toBe("- [x] Task B");
        expect(editor.getLine(3)).toBe("Some text after");
    });

    test("With empty line after checklist", () => {
        const content = [
            "- [ ] Task A",
            "- [x] Task B",
            "- [ ] Task C",
            "",
        ];

        const editor = createMockEditor(content);
        console.log("BEFORE:");
        for (let i = 0; i <= editor.lastLine(); i++) {
            console.log(`  Line ${i}: "${editor.getLine(i)}"`);
        }

        reorderChecklist(editor, 1);

        console.log("\nAFTER:");
        for (let i = 0; i <= editor.lastLine(); i++) {
            console.log(`  Line ${i}: "${editor.getLine(i)}"`);
        }
        console.log(`Total lines: ${editor.lastLine() + 1}`);

        expect(editor.lastLine() + 1).toBe(4);
        expect(editor.getLine(0)).toBe("- [ ] Task A");
        expect(editor.getLine(1)).toBe("- [ ] Task C");
        expect(editor.getLine(2)).toBe("- [x] Task B");
        expect(editor.getLine(3)).toBe("");
    });
});
