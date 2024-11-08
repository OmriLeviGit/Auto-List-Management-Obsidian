export interface RenumberListSettings {
    liveUpdate: boolean;
    smartPaste: boolean;
    startsFromOne: boolean;
    indentSize: number;
}

export const DEFAULT_SETTINGS: RenumberListSettings = {
    liveUpdate: true,
    smartPaste: true,
    startsFromOne: true,
    indentSize: 4,
};

// a singleton for the settings
export default class SettingsManager {
    private static instance: SettingsManager;
    private settings: RenumberListSettings;

    private constructor() {
        this.settings = DEFAULT_SETTINGS;
    }

    public static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }

        return SettingsManager.instance;
    }

    public setSettings(settings: RenumberListSettings): void {
        this.settings = settings;
    }

    public getSettings(): RenumberListSettings {
        return this.settings;
    }

    public setLiveUpdate(value: boolean): void {
        this.settings.liveUpdate = value;
    }

    public setSmartPaste(value: boolean): void {
        this.settings.smartPaste = value;
    }

    public setStartsFromOne(value: boolean): void {
        this.settings.startsFromOne = value;
    }
    public setIndentSize(value: number): void {
        this.settings.indentSize = value;
    }
}
