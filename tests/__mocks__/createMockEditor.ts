import { Editor, EditorTransaction } from "obsidian";
export const createMockEditor = (initialContent: string[]) => {
    const content = [...initialContent];

    const editor = {
        getLine: jest.fn().mockImplementation((n: number): string => {
            if (n < 0 || content.length <= n) {
                throw new Error(`getLine: index is out of bound: ${n}`);
            }
            return content[n];
        }),
        setLine: jest.fn().mockImplementation((n: number, text: string) => {
            if (n < 0 || content.length <= n) {
                throw new Error(`setLine: index is out of bound: ${n}`);
            }
            content[n] = text;
        }),
        lastLine: jest.fn().mockImplementation((): number | string => {
            return content.length - 1;
        }),

        transaction: jest.fn().mockImplementation((tx: EditorTransaction) => {
            if (!tx.changes) return;

            const sortedChanges = [...tx.changes].sort((a, b) => b.from.line - a.from.line || b.from.ch - a.from.ch);

            sortedChanges.forEach((change) => {
                const fromLine = change.from.line;
                const toLine = change.to?.line ?? fromLine;
                const fromCh = change.from.ch;
                const toCh = change.to?.ch ?? fromCh;

                // Handle multi-line changes
                if (fromLine === toLine) {
                    // Single-line change
                    const line = content[fromLine];
                    const newLine = line.substring(0, fromCh) + change.text + line.substring(toCh);
                    content[fromLine] = newLine;
                } else {
                    // Multi-line change
                    const newLines = change.text.split("\n");
                    const firstLinePart = content[fromLine].substring(0, fromCh);
                    let lastLinePart;
                    if (toLine === content.length) {
                        lastLinePart = "";
                    } else {
                        lastLinePart = content[toLine].substring(toCh);
                    }

                    newLines[0] = firstLinePart + newLines[0];
                    newLines[newLines.length - 1] += lastLinePart;

                    content.splice(fromLine, toLine - fromLine + 1, ...newLines);
                }
            });

            return true;
        }),

        // transaction: jest.fn().mockImplementation((tx: EditorTransaction) => {
        //     const changes = tx.changes;
        //     if (changes == undefined) {
        //         return;
        //     }

        //     changes.forEach((change) => {
        //         editor.setLine(change.from.line, change.text);
        //     });
        // }),
    };

    return new Proxy({} as Editor, {
        get: (target, prop) => {
            if (prop in editor) {
                return editor[prop as keyof typeof editor];
            }
            return jest.fn();
        },
    });

    // return editor;
};

export type MockEditor = ReturnType<typeof createMockEditor>;
