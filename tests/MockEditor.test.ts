import { EditorChange, editorEditorField } from "obsidian";
import { createMockEditor, MockEditor } from "./__mocks__/createMockEditor";

describe("Mock editor tests", () => {
	const content = ["First line", "Second line", "Third line"];
	let mockEditor: MockEditor;

	beforeEach(() => {
		mockEditor = createMockEditor(content);
	});

	test("getLine returns correct content for valid index", () => {
		expect(mockEditor.getLine(0)).toBe("First line");
	});

	test("getLine throws error for negative index", () => {
		expect(() => mockEditor.getLine(-1)).toThrow("trying to access a negative line");
	});

	test("getLine throws error for out-of-bounds index", () => {
		expect(() => mockEditor.getLine(3)).toThrow("trying to access lines outside the file");
	});

	test("setLine sets a line correctly", () => {
		mockEditor.setLine(0, "Modified line");
		expect(mockEditor.getLine(0)).toBe("Modified line");
	});

	test("setLine throws error for negative index", () => {
		expect(() => mockEditor.setLine(-1, "Modified line")).toThrow("trying to set lines outside the file");
	});

	test("setLine throws error for out-of-bounds index", () => {
		expect(() => mockEditor.setLine(3, "Modified line")).toThrow("trying to set lines outside the file");
	});

	test("transaction", () => {
		const changes: EditorChange[] = [];

		for (let i = 0; i < mockEditor.lastLine(); i++) {
			const change: EditorChange = {
				from: { line: i, ch: 0 },
				to: { line: i, ch: mockEditor.getLine(i).length },
				text: `iter: ${i}`,
			};

			changes.push(change);
		}

		mockEditor.transaction({ changes });

		for (let i = 0; i < changes.length; i++) {
			expect(mockEditor.getLine(i)).toBe(`iter: ${i}`);
		}
	});
});
