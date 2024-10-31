import { Editor, EditorTransaction } from "obsidian";
export const createMockEditor = (initialContent: string[]) => {
    const content = [...initialContent];

    const editor = {
        getLine: jest.fn().mockImplementation((line: number): string => {
            if (line < 0) {
                throw new Error("trying to access a negative line");
            }
            if (content.length <= line) {
                console.error(`getLine error - content: ${content}, line: ${line}`);
                throw new Error("getLine: trying to access lines outside the note");
            }
            return content[line];
        }),
        setLine: jest.fn().mockImplementation((n: number, text: string) => {
            if (n < 0 || content.length <= n) {
                console.error(`setLine error - content: ${content}, index: ${n}`);
                throw new Error("setLine: trying to set lines outside the note");
            }
            content[n] = text;
        }),
        lastLine: jest.fn().mockImplementation((): number => {
            return content.length - 1;
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
