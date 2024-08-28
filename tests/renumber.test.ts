import { createMockEditor } from "./__mocks__/createMockEditor";
import { getNumInList, renumberLocally } from "../src/renumber";

// test short files, something there doesnt work
// describe("renumberLocally tests", () => {
// 	test("renumber line", () => {
// 		const content = [
// 			"1. First line",
// 			"2. Second line",
// 			"3. Third line",
// 			"1. First line",
// 			"2. Second line",
// 			"3. Third line",
// 		];
// 		const editor = createMockEditor(content);

// 		renumberLocally(editor, 1);

// 		expect(content[1]).toBe("1. Second line");
// 	});
// });

// test for 000.something
describe("getNumInList tests", () => {
	test("test for single digit", () => {
		const content = ["1. text"];
		const editor = createMockEditor(content);
		expect(getNumInList(0, editor)).toBe(1);
	});

	test("test for multiple digits", () => {
		const content = ["123. text"];
		const editor = createMockEditor(content);
		expect(getNumInList(0, editor)).toBe(123);
	});

	test("test for no digits", () => {
		const content = [". text"];
		const editor = createMockEditor(content);
		expect(getNumInList(0, editor)).toBe(-1);
	});

	test("test for line beginning", () => {
		const content = [" 1. test"];
		const editor = createMockEditor(content);
		expect(getNumInList(0, editor)).toBe(-1);
	});
});
