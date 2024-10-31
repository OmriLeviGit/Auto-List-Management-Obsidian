// __mocks__/main.ts
import { RenumberListSettings } from "main"; // adjust path as needed

export const DEFAULT_SETTINGS: RenumberListSettings = {
    liveUpdate: true,
    smartPaste: true,
    indentSize: 4,
};

export const pluginInstance = {
    getSettings: () => DEFAULT_SETTINGS, // simple function return
};
