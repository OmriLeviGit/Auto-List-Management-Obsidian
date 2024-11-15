import { RenumberListSettings } from "./types";

export const DEFAULT_SETTINGS: RenumberListSettings = {
    liveUpdate: false,
    smartPaste: true,
    startsFromOne: false,
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
    public getSettings(): RenumberListSettings {
        return this.settings;
    }

    public getLiveUpdate(): boolean {
        return this.settings.liveUpdate;
    }

    public getSmartPaste(): boolean {
        return this.settings.smartPaste;
    }

    public getStartsFromOne(): boolean {
        return this.settings.startsFromOne;
    }

    public getIndentSize(): number {
        return this.settings.indentSize;
    }

    public setSettings(settings: RenumberListSettings): void {
        this.settings = settings;
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
