import RenumberList from "../main";
import * as path from "path";
import * as fs from "fs/promises";

async function createFile(plugin: RenumberList, fileName: string, content: string) {
	try {
		const fileName = "test.md";

		const dirPath = path.join(__dirname, "..", "..", "..", "..", "reorder-numbered-list-tests");
		const filePath = path.join(dirPath, fileName);
		await fs.mkdir(dirPath);

		plugin.app.vault.create(filePath, content);
	} catch (error) {
		console.error("Error writing file:", fileName, error);
	}
}

describe("RenumberList", () => {
	let plugin: RenumberList;

	beforeEach(() => {
		plugin = new RenumberList({} as any, {} as any);
	});

	test("findStartIndex", () => {
		const fileName = "test.md";
		const content = "test content";
		createFile(plugin, fileName, content);

		expect(plugin.findStartingIndex(3)).toBe(0);
		expect(plugin.findStartingIndex(1)).toBe(0);
	});

	test("getNumInList", () => {
		const fileName = "test.md";
		const content = "test content";
		createFile(plugin, fileName, content);

		expect(plugin.getNumInList(0)).toBe(1);
		expect(plugin.getNumInList(1)).toBe(2);
		expect(plugin.getNumInList(2)).toBe(-1);
	});

	test("updateRange", () => {
		const fileName = "test.md";
		const content = "test content";
		createFile(plugin, fileName, content);

		plugin.updateRange(0, 2);
		expect((plugin as any).editor.setLine).toHaveBeenCalledTimes(3);
	});
});
