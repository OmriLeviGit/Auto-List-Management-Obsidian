import "./__mocks__/main";
import { createMockEditor } from "./__mocks__/createMockEditor";
import { DynamicStartStrategy, StartFromOneStrategy } from "src/renumbering/strategies";

import Renumberer from "../src/renumbering/Renumberer";

// describe("General tests", () => {
//     let renumberer: Renumberer;

//     beforeEach(() => {
//         renumberer = new Renumberer(new DynamicStartStrategy());
//         jest.clearAllMocks();
//     });

//     const testCases = [
//         {
//             name: "Renumber from index 0",
//             content: ["1. a", "3. b"],
//             startIndex: 0,
//             expected: ["1. a", "2. b"],
//         },
//         {
//             name: "Renumber from the last index",
//             content: ["text", "1. a", "3. b"],
//             startIndex: 2,
//             expected: ["text", "1. a", "2. b"],
//         },
//         {
//             name: "Renumber from the last item of a list",
//             content: ["1. a", "3. b", "text"],
//             startIndex: 1,
//             expected: ["1. a", "2. b", "text"],
//         },
//         {
//             name: "If previous was not a numbered item, start from current",
//             content: ["A", "1. a", "3. b"],
//             startIndex: 1,
//             expected: ["A", "1. a", "2. b"],
//         },
//         {
//             name: "A single item",
//             content: ["2. a"],
//             startIndex: 0,
//             expected: ["2. a"],
//         },
//         {
//             name: "A single item in the middle",
//             content: ["text", "2. a", "text"],
//             startIndex: 1,
//             expected: ["text", "2. a", "text"],
//         },
//         {
//             name: "Using the number 0",
//             content: ["0. a", "2. b"],
//             startIndex: 0,
//             expected: ["0. a", "1. b"],
//         },
//         {
//             name: "Renumber in sequence",
//             content: ["1. a", "6. b", "8. c"],
//             startIndex: 0,
//             expected: ["1. a", "2. b", "3. c"],
//         },
//         {
//             name: "Renumber in sequence with a zero",
//             content: ["1. a", "6. b", "0. c"],
//             startIndex: 0,
//             expected: ["1. a", "2. b", "3. c"],
//         },
//         {
//             name: "Renumber according to previous in sequence",
//             content: ["1. a", "6. b", "0. c"],
//             startIndex: 1,
//             expected: ["1. a", "2. b", "3. c"],
//         },
//         {
//             name: "Does not modify given a non numbered item",
//             content: ["1. a", "abc", "1. a"],
//             startIndex: 1,
//             expected: ["1. a", "abc", "1. a"],
//         },
//         {
//             name: "Renumering stops at text at offset 0",
//             content: ["1. a", "3. b", "text", "1. a", "3. b"],
//             startIndex: 0,
//             expected: ["1. a", "2. b", "text", "1. a", "3. b"],
//         },
//     ];

//     testCases.forEach(({ name, content, startIndex, expected }) => {
//         test(name, () => {
//             const editor = createMockEditor(content);
//             renumberer.renumber(editor, startIndex);

//             expected.forEach((line, i) => {
//                 expect(editor.getLine(i)).toBe(line);
//             });
//         });
//     });
// });

// describe("Dynamic strategy", () => {
//     let renumberer: Renumberer;

//     beforeEach(() => {
//         renumberer = new Renumberer(new DynamicStartStrategy());
//         jest.clearAllMocks();
//     });

//     const testCases = [
//         {
//             name: "Local changes only - begin at index 0, stop at the first correctly numbered item",
//             content: ["1. a", "3. b", "3. c", "5. d"],
//             startIndex: 0,
//             expected: ["1. a", "2. b", "3. c", "5. d"],
//         },
//         {
//             name: "Local changes only - begin at the middle, stop at the first correctly numbered item",
//             content: ["1. a", "2. b", "3. c", "5. d"],
//             startIndex: 1,
//             expected: ["1. a", "2. b", "3. c", "5. d"],
//         },
//         {
//             name: "Local changes only - correct according to previous, stop at the first correctly numbered item",
//             content: ["1. a", "3. b", "3. c", "5. d"],
//             startIndex: 1,
//             expected: ["1. a", "2. b", "3. c", "5. d"],
//         },
//     ];

//     testCases.forEach(({ name, content, startIndex, expected }) => {
//         test(name, () => {
//             const editor = createMockEditor(content);
//             renumberer.renumber(editor, startIndex);

//             expected.forEach((line, i) => {
//                 expect(editor.getLine(i)).toBe(line);
//             });
//         });
//     });
// });

// describe("Renumber/IndentTracker interaction", () => {
//     let renumberer: Renumberer;

//     beforeEach(() => {
//         renumberer = new Renumberer(new DynamicStartStrategy());
//         jest.clearAllMocks();
//     });

//     const testCases = [
//         {
//             name: "Renumber the same indent",
//             content: ["1. a", "3. b", " 10. c", "4. d"],
//             startIndex: 0,
//             expected: ["1. a", "2. b", " 10. c", "3. d"],
//         },
//         {
//             name: "Detect changes across indent forwards",
//             content: ["1. a", " 10. b", " 13. c", "4. d"],
//             expected: ["1. a", " 10. b", " 11. c", "2. d"],
//             startIndex: 0,
//         },
//         {
//             name: "Detect changes across indent backwards",
//             content: ["1. a", " 10. b", " 11. c", "4. d", "5. e"],
//             expected: ["1. a", " 10. b", " 11. c", "2. d", "3. e"],
//             startIndex: 3,
//         },
//         {
//             name: "Detect changes across indent backwards as last item",
//             content: ["1. a", " 10. b", " 11. c", "4. d"],
//             expected: ["1. a", " 10. b", " 11. c", "2. d"],
//             startIndex: 3,
//         },
//         {
//             name: "Detect indented changes across text backwards",
//             content: ["1. a", " 10. b", "   text", " 4. c"],
//             expected: ["1. a", " 10. b", "   text", " 11. c"],
//             startIndex: 3,
//         },
//         {
//             name: "Detect changes across text with greater indents (such as alt-enter)",
//             content: ["1. a", "  b", "  c", "4. d"],
//             expected: ["1. a", "  b", "  c", "2. d"],
//             startIndex: 0,
//         },
//         {
//             name: "Should not renumber lines with greater indents",
//             content: ["1. a", " 1. b"],
//             startIndex: 0,
//             expected: ["1. a", " 1. b"],
//         },
//         {
//             name: "Should not renumber lines with lesser indents",
//             content: [" 1. a", "1. b"],
//             startIndex: 0,
//             expected: [" 1. a", "1. b"],
//         },
//         {
//             name: "Renumbering stops, treats spaces and tabs with the same number of space chars differently",
//             content: [" 1. a", "\t1. b"],
//             startIndex: 0,
//             expected: [" 1. a", "\t1. b"],
//         },
//         {
//             name: "Renumbering treats spaces and tabs spaces that are tab-length the same",
//             content: ["1. text", "    5. a", "\t8. b", "    1. c"],
//             expected: ["1. text", "    5. a", "\t6. b", "    7. c"],
//             startIndex: 0,
//         },
//         {
//             name: "Local renumbering - stops on lower indents",
//             content: ["1. text", "  3. a", "  3. b", "  3. c", "5. text"],
//             expected: ["1. text", "  3. a", "  4. b", "  5. c", "5. text"],
//             startIndex: 2,
//         },
//     ];

//     testCases.forEach(({ name, content, startIndex, expected }) => {
//         test(name, () => {
//             const editor = createMockEditor(content);
//             renumberer.renumber(editor, startIndex);

//             expected.forEach((line, i) => {
//                 expect(editor.getLine(i)).toBe(line);
//             });
//         });
//     });
// });

describe("Start from one strategy", () => {
    let renumberer: Renumberer;

    beforeEach(() => {
        renumberer = new Renumberer(new StartFromOneStrategy());
        jest.clearAllMocks();
    });

    const testCases = [
        {
            name: "One item",
            content: ["3. a"],
            startIndex: 0,
            expected: ["1. a"],
        },
        {
            name: "last item",
            content: ["text", "2. a"],
            startIndex: 1,
            expected: ["text", "1. a"],
        },
        {
            name: "last item in list",
            content: ["text", "3. a", "text"],
            startIndex: 1,
            expected: ["text", "1. a"],
        },
        {
            name: "Start from index 0",
            content: ["1. a", "3. b", "10. c"],
            startIndex: 0,
            expected: ["1. a", "2. b", "3. c"],
        },
        {
            name: "Start from index 1",
            content: ["1. a", "3. b", "10. c"],
            startIndex: 1,
            expected: ["1. a", "2. b", "3. c"],
        },
        {
            name: "First index after text",
            content: ["text", "1. a", "10. b"],
            startIndex: 1,
            expected: ["text", "1. a", "2. b"],
        },
        {
            name: "First index after text - doesnt start with 1",
            content: ["text", "3. a", "10. b"],
            startIndex: 1,
            expected: ["text", "1. a", "2. b"],
        },
        {
            name: "Second index after text",
            content: ["text", "3. a", "10. b"],
            startIndex: 2,
            expected: ["text", "3. a", "4. b"],
        },
        {
            name: "Third index after text",
            content: ["text", "3. a", "10. b", "4. c"],
            startIndex: 3,
            expected: ["text", "3. a", "10. b", "11. c"],
        },
        {
            name: "Across indent",
            content: ["1. a", " 1. b", "10. c"],
            startIndex: 0,
            expected: ["1. a", " 1. b", "2. c"],
        },
        {
            name: "Across indent - doesnt start with 1",
            content: ["3. a", " 1. b", "10. c"],
            startIndex: 0,
            expected: ["1. a", " 1. b", "2. c"],
        },
        {
            name: "From indent, downwards",
            content: ["3. a", " 4. b", "1. c"],
            startIndex: 1,
            expected: ["3. a", " 1. b", "4. c"],
        },
        {
            name: "From 2 indent, downwards",
            content: ["3. a", " 4. b", "  10. c", " 2. d", "1. e"],
            startIndex: 2,
            expected: ["3. a", " 4. b", "  1. c", " 5. d", "4. e"],
        },
        {
            name: "Indented - first item is 1, first index",
            content: ["1. a", " 1. b", " 10. c", "5. d"],
            startIndex: 1,
            expected: ["1. a", " 1. b", " 2. c", "5. d"],
        },
        {
            name: "Indented - first item is 1, second index",
            content: ["1. a", " 1. b", " 10. c", "5. d"],
            startIndex: 2,
            expected: ["1. a", " 1. b", " 2. c", "2. d"],
        },
        {
            name: "Indented - first item is not 1, first index",
            content: ["1. a", " 4. b", " 10. c", "5. d"],
            startIndex: 1,
            expected: ["1. a", " 1. b", " 2. c", "5. d"],
        },
        {
            name: "Indented - first item is not 1, second index",
            content: ["1. a", " 4. b", " 10. c", "5. d"],
            startIndex: 2,
            expected: ["1. a", " 4. b", " 5. c", "2. d"],
        },
    ];

    testCases.forEach(({ name, content, startIndex, expected }) => {
        test(name, () => {
            const editor = createMockEditor(content);
            renumberer.renumber(editor, startIndex);

            expected.forEach((line, i) => {
                expect(editor.getLine(i)).toBe(line);
            });
        });
    });
});

// describe("Renumber entire list", () => {
//     beforeEach(() => {
//         jest.clearAllMocks();
//     });

//     const testCases = [
//         {
//             name: "Dynamic renumbering",
//             strategy: new DynamicStartStrategy(),
//             content: ["2. a", " 10. b", "  100. c", "    text", "  200. d", "   text", " 5. e", "6. f"],
//             expected: ["2. a", " 10. b", "  100. c", "    text", "  101. d", "   text", " 11. e", "3. f"],
//         },
//         {
//             name: "Start from one renumbering",
//             strategy: new StartFromOneStrategy(),
//             content: ["2. a", " 10. b", "  100. c", "    text", "  200. d", "   text", " 5. e", "6. f"],
//             expected: ["1. a", " 1. b", "  1. c", "    text", "  2. d", "   text", " 2. e", "2. f"],
//         },
//     ];

//     testCases.forEach(({ name, strategy, content, expected }) => {
//         test(name, () => {
//             const editor = createMockEditor(content);
//             const renumberer = new Renumberer(strategy);

//             renumberer.allListsInRange(editor, 0, content.length - 1);

//             expected.forEach((line, i) => {
//                 expect(editor.getLine(i)).toBe(line);
//             });
//         });
//     });
// });
