import { createMockEditor } from "./__mocks__/createMockEditor";
import { getItemNum } from "../src/utils";

describe("getItemNum tests", () => {
	test("single digit", () => {
		const content = ["1. text"];
		const editor = createMockEditor(content);
		expect(getItemNum(editor, 0)).toBe(1);
	});

	test("multiple digits", () => {
		const content = ["123. text"];
		const editor = createMockEditor(content);
		expect(getItemNum(editor, 0)).toBe(123);
	});

	test("no digits", () => {
		const content = [". text"];
		const editor = createMockEditor(content);
		expect(getItemNum(editor, 0)).toBe(-1);
	});

	test("line beginning", () => {
		const content = [" 1. test"];
		const editor = createMockEditor(content);
		expect(getItemNum(editor, 0)).toBe(-1);
	});
	test("access negative number", () => {
		const content = ["A"];
		const editor = createMockEditor(content);
		expect(getItemNum(editor, -1)).toBe(-1);
	});
});
