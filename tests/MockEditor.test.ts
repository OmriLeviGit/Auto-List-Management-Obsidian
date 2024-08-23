import { createMockEditor, MockEditor } from "./createMockEditor";
import * as path from "path";
import * as fs from "fs/promises";

describe("Mock editor tests", () => {
	const content = ["First item", "Second item", "Third item"];
	let mockEditor: MockEditor;

	beforeEach(() => {
		mockEditor = createMockEditor(content);
	});

	test("getLine returns correct content for valid index", () => {
		expect(mockEditor.getLine(0)).toBe("First item");
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
});

// describe("Editor tests", () => {
// 	const createEditorWithContent = (content: string[]) => {
// 		return createMockEditor(content);
// 	};

// 	test("first test", () => {
// 		const content = ["1. First item", "2. Second item", "3. Third item"];
// 		const mockEditor = createEditorWithContent(content);

// 		expect(mockEditor.getLine(0)).toBe("2. Second item");
// 	});

// 	test("second test", () => {
// 		// want content2
// 		expect(mockEditor.getLine(1)).toBe("2. Second item");
// 	});
// });

// async function createFile(plugin: RenumberList, fileName: string, content: string) {
// 	try {
// 		const fileName = "test.md";

// 		const dirPath = path.join(__dirname, "..", "..", "..", "..", "reorder-numbered-list-tests");
// 		const filePath = path.join(dirPath, fileName);
// 		await fs.mkdir(dirPath);

// 		plugin.app.vault.create(filePath, content);
// 	} catch (error) {
// 		console.error("Error writing file:", fileName, error);
// 	}
// }

// describe("RenumberList", () => {
// 	let plugin: RenumberList;

// 	beforeEach(() => {
// 		plugin = new RenumberList({} as any, {} as any);
// 	});

// test("findStartIndex", () => {
// 	let plugin = new RenumberList({} as any, {} as any);
// 	const fileName = "test.md";
// 	const content = "test content";
// 	createFile(plugin, fileName, content);

// });
// });

// 	// test("getNumInList", () => {
// 	// 	const fileName = "test.md";
// 	// 	const content = "test content";
// 	// 	// createFile(plugin, fileName, content);

// 	// 	// expect(plugin.getNumInList(0)).toBe(1);
// 	// 	// expect(plugin.getNumInList(1)).toBe(2);
// 	// 	// expect(plugin.getNumInList(2)).toBe(-1);
// 	// });

// 	// test("updateRange", () => {
// 	// 	const fileName = "test.md";
// 	// 	const content = "test content";
// 	// 	// createFile(plugin, fileName, content);

// 	// 	// // plugin.updateRange(0, 2);
// 	// 	// expect((plugin as any).editor.setLine).toHaveBeenCalledTimes(3);
// 	// });
// });
