import { RenumberListSettings } from "./types";

export const DEFAULT_SETTINGS: RenumberListSettings = {
    liveNumberingUpdate: true,
    smartPasting: true,
    startsFromOne: true,
    indentSize: 4,
    liveCheckboxUpdate: true,
    sortCheckboxesToBottom: true,
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
    public getSettings(): RenumberListSettings {
        return this.settings;
    }

    public setSettings(settings: RenumberListSettings): void {
        this.settings = settings;
    }

    public getLiveUpdate(): boolean {
        return this.settings.liveNumberingUpdate;
    }

    public setLiveUpdate(value: boolean): void {
        this.settings.liveNumberingUpdate = value;
    }

    public getIndentSize(): number {
        return this.settings.indentSize;
    }

    public setIndentSize(value: number): void {
        this.settings.indentSize = value;
    }

    public getSortCheckboxesBottom(): boolean {
        return this.settings.sortCheckboxesToBottom;
    }

    public setSortCheckboxesBottom(value: boolean): void {
        this.settings.sortCheckboxesToBottom = value;
    }
}
