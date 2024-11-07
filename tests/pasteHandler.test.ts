import "./__mocks__/main";

import { modifyText } from "src/pasteHandler";

describe("modifyText tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    const testCases = [
        {
            name: "Modify the first numbered line",
            content: "1. a\n2. b\n3. c",
            newNumber: 4,
            expectedResult: "4. a\n2. b\n3. c",
        },
        {
            name: "Modify the last numbered line",
            content: "2. a\n3. b\n2. c",
            expectedResult: "5. a\n3. b\n2. c",
            newNumber: 5,
        },
        {
            name: "Modify the last numbered line, fronted by text",
            content: "text\n2. a\n3. b\n2. c",
            expectedResult: "text\n5. a\n3. b\n2. c",
            newNumber: 5,
        },
        {
            name: "Modify a single line",
            content: "1. single line",
            newNumber: 2,
            expectedResult: "2. single line",
        },
        {
            name: "Modify with leading spaces",
            content: "   1. indented line\n2. another line",
            newNumber: 3,
            expectedResult: "   3. indented line\n2. another line",
        },
        {
            name: "No numbered lines",
            content: "no numbers here",
            newNumber: 1,
            expectedResult: undefined,
        },
    ];

    testCases.forEach(({ name, content, newNumber, expectedResult }) => {
        test(name, () => {
            const res = modifyText(content, newNumber);
            expect(res.modifiedText).toBe(expectedResult);
        });
    });
});
