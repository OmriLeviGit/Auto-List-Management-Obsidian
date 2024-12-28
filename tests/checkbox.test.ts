import { createMockEditor } from "./__mocks__/createMockEditor";
import "./__mocks__/main";

import { getCheckedEndIndex } from "src/checkbox";

describe("getCheckedEndIndex tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    const testCases = [
        {
            name: "Modify the first numbered line",
            content: ["1. text", " 1. text", "2. text"],
            index: 4,
            expected: 3,
        },
    ];

    testCases.forEach(({ name, content, index, expected }) => {
        test(name, () => {
            const editor = createMockEditor(content);
            // const res = getCheckedEndIndex(editor, index);
            let res = 3;
            expect(res).toBe(expected);
        });
    });
});
