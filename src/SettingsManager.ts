export interface RenumberListSettings {
    liveUpdate: boolean;
    smartPaste: boolean;
    indentSize: number;
}

export const DEFAULT_SETTINGS: RenumberListSettings = {
    liveUpdate: true,
    smartPaste: true,
    indentSize: 4,
};

// a singleton for the settings
export default class SettingsManager {
    private static instance: SettingsManager;
    settings: RenumberListSettings;

    constructor() {
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

    public setIndentSize(value: number): void {
        this.settings.indentSize = value;
    }
}
