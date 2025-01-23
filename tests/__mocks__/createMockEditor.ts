import { Editor, EditorPosition, EditorTransaction } from "obsidian";
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
        lastLine: jest.fn().mockImplementation((): number => {
            return content.length - 1;
        }),
        replaceRange: jest.fn().mockImplementation((replacement: string, from: EditorPosition, to: EditorPosition) => {
            if (replacement === "") {
                content.splice(from.line, 1);
            } else {
                // content.splice(from.line, 0, replacement);
                content.splice(from.line, 0, replacement.replace("\n", ""));
            }
        }),
        transaction: jest.fn().mockImplementation((tx: EditorTransaction, origin?: string) => {
            const changes = tx.changes;
            if (changes == undefined) {
                return;
            }

            changes.forEach((change) => {
                editor.setLine(change.from.line, change.text);
            });
        }),
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
