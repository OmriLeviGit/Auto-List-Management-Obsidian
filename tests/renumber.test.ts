import { createMockEditor } from "./__mocks__/createMockEditor";
import { getItemNum, renumberLocally } from "../src/renumber";

// test short files, something there doesnt work
describe("RenumberLocally tests", () => {
	test("Renumber from the first index", () => {
		const content = ["1. a", "3. b"];
		const editor = createMockEditor(content);
		renumberLocally(editor, 0);
		const expected = ["1. a", "2. b"];
		for (let i = 0; i < expected.length; i++) {
			expect(editor.getLine(i)).toBe(expected[i]);
		}
	});

	test("Renumber from the last index", () => {
		const content = ["1. a", "3. b"];
		const editor = createMockEditor(content);
		renumberLocally(editor, 1);
		const expected = ["1. a", "2. b"];
		for (let i = 0; i < expected.length; i++) {
			expect(editor.getLine(i)).toBe(expected[i]);
		}
	});

	test("If previous was not a numbered item, start from current", () => {
		const content = ["A", "1. a", "3. b"];
		const editor = createMockEditor(content);
		renumberLocally(editor, 1);
		const expected = ["A", "1. a", "2. b"];
		for (let i = 0; i < expected.length; i++) {
			expect(editor.getLine(i)).toBe(expected[i]);
		}
	});

	test("A single item", () => {
		const content = ["2. a"];
		const editor = createMockEditor(content);
		renumberLocally(editor, 0);
		const expected = ["2. a"];
		for (let i = 0; i < expected.length; i++) {
			expect(editor.getLine(i)).toBe(expected[i]);
		}
	});

	test("Using the number 0", () => {
		const content = ["0. a", "2. b"];
		const editor = createMockEditor(content);
		renumberLocally(editor, 0);
		const expected = ["0. a", "1. b"];
		for (let i = 0; i < expected.length; i++) {
			expect(editor.getLine(i)).toBe(expected[i]);
		}
	});

	test("Renumber in sequence", () => {
		const content = ["1. a", "6. b", "0. c"];
		const editor = createMockEditor(content);
		renumberLocally(editor, 0);
		const expected = ["1. a", "2. b", "3. c"];
		for (let i = 0; i < expected.length; i++) {
			expect(editor.getLine(i)).toBe(expected[i]);
		}
	});

	test("Renumber according to previous in sequence", () => {
		const content = ["1. a", "6. b", "0. c"];
		const editor = createMockEditor(content);
		renumberLocally(editor, 1);
		const expected = ["1. a", "2. b", "3. c"];
		for (let i = 0; i < expected.length; i++) {
			expect(editor.getLine(i)).toBe(expected[i]);
		}
	});

	test("Stop renumbering at the end of a numbered list", () => {
		const content = ["1. a", "1. b", "A", "5. B"];
		const editor = createMockEditor(content);
		renumberLocally(editor, 0);
		const expected = ["1. a", "2. b", "A", "5. B"];
		for (let i = 0; i < expected.length; i++) {
			expect(editor.getLine(i)).toBe(expected[i]);
		}
	});

	test("Does not modify given a non numbered item", () => {
		const content = ["1. a", "abc", "1. a"];
		const editor = createMockEditor(content);
		renumberLocally(editor, 1);
		const expected = ["1. a", "abc", "1. a"];
		for (let i = 0; i < expected.length; i++) {
			expect(editor.getLine(i)).toBe(expected[i]);
		}
	});

	test("Does not modify if 'x. ' is not in line beginning", () => {
		const content = ["1. a", " 6. A"];
		const editor = createMockEditor(content);
		renumberLocally(editor, 1);
		const expected = ["1. a", " 6. A"];
		for (let i = 0; i < expected.length; i++) {
			expect(editor.getLine(i)).toBe(expected[i]);
		}
	});

	test("Local changes only - stop at the first correctly numbered item", () => {
		console.log("\n#############\n");

		const content = ["1. a", "3. b", "3. c", "5. d"];
		const editor = createMockEditor(content);
		renumberLocally(editor, 1);
		const expected = ["1. a", "2. b", "3. c", "5. d"];
		for (let i = 0; i < expected.length; i++) {
			expect(editor.getLine(i)).toBe(expected[i]);
		}
	});
});

// test for 000.something
describe("getNumInList tests", () => {
	test("test for single digit", () => {
		const content = ["1. text"];
		const editor = createMockEditor(content);
		expect(getItemNum(0, editor)).toBe(1);
	});

	test("test for multiple digits", () => {
		const content = ["123. text"];
		const editor = createMockEditor(content);
		expect(getItemNum(0, editor)).toBe(123);
	});

	test("test for no digits", () => {
		const content = [". text"];
		const editor = createMockEditor(content);
		expect(getItemNum(0, editor)).toBe(-1);
	});

	test("test for line beginning", () => {
		const content = [" 1. test"];
		const editor = createMockEditor(content);
		expect(getItemNum(0, editor)).toBe(-1);
	});
});
