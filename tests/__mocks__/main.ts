import DEFAULT_SETTINGS from "src/SettingsManager";

jest.mock("main", () => ({
    pluginInstance: {
        getSettings: jest.fn().mockReturnValue(DEFAULT_SETTINGS),
    },
}));
