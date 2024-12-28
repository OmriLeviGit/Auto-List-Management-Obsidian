import { createMockEditor } from "./__mocks__/createMockEditor";
import "./__mocks__/main";

import { getCheckboxInfo } from "src/utils";

describe("getCheckBoxInfo checkbox tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const testCases = [
        {
            name: "",
            input: "- [ ] text",
            index: 0,
            isNumberDetected: false,
            expected: { isCheckBox: true, isChecked: false },
        },
        {
            name: "",
            input: "- [x] text",
            index: 0,
            isNumberDetected: false,
            expected: { isCheckBox: true, isChecked: true },
        },
        {
            name: "",
            input: " - [ ] text",
            index: 0,
            isNumberDetected: false,
            expected: { isCheckBox: true, isChecked: false },
        },
        {
            name: "",
            input: " - [x] text",
            index: 0,
            isNumberDetected: false,
            expected: { isCheckBox: true, isChecked: true },
        },
        {
            name: "",
            input: "\t- [ ] text",
            index: 0,
            isNumberDetected: false,
            expected: { isCheckBox: true, isChecked: false },
        },
        {
            name: "",
            input: "\t- [x] text",
            index: 0,
            isNumberDetected: false,
            expected: { isCheckBox: true, isChecked: true },
        },
        {
            name: "",
            input: "123. [ ] text",
            index: 5,
            isNumberDetected: true,
            expected: { isCheckBox: true, isChecked: false },
        },
        {
            name: "",
            input: "123. [x] text",
            index: 5,
            isNumberDetected: true,
            expected: { isCheckBox: true, isChecked: true },
        },
        {
            name: "",
            input: " 123. [ ] text",
            index: 6,
            isNumberDetected: true,
            expected: { isCheckBox: true, isChecked: false },
        },
        {
            name: "",
            input: " 123. [x] text",
            index: 6,
            isNumberDetected: true,
            expected: { isCheckBox: true, isChecked: true },
        },
        {
            name: "",
            input: "\t123. [ ] text",
            index: 6,
            isNumberDetected: true,
            expected: { isCheckBox: true, isChecked: false },
        },
        {
            name: "",
            input: "\t123. [x] text",
            index: 6,
            isNumberDetected: true,
            expected: { isCheckBox: true, isChecked: true },
        },
    ];

    testCases.forEach(({ name, input, index, isNumberDetected, expected }) => {
        test(name, () => {
            const result = getCheckboxInfo(input, index, isNumberDetected);
            expect(result).toEqual(expected);
        });
    });
});

// describe("getCheckedEndIndex tests", () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });
//     const testCases = [
//         {
//             name: "Modify the first numbered line",
//             content: ["1. text", " 1. text", "2. text"],
//             index: 4,
//             expected: 3,
//         },
//     ];

//     testCases.forEach(({ name, content, index, expected }) => {
//         test(name, () => {
//             const editor = createMockEditor(content);
//             // const res = getCheckedEndIndex(editor, index);
//             let res = 3;
//             expect(res).toBe(expected);
//         });
//     });
// });
