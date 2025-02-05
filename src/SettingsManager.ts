import { PluginSettings } from "./types";

export const DEFAULT_SETTINGS: PluginSettings = {
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
    private settings: PluginSettings;

    private constructor() {
        this.settings = DEFAULT_SETTINGS;
    }

    public static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }

        return SettingsManager.instance;
    }

    public getSettings(): PluginSettings {
        return this.settings;
    }

    public setSettings(settings: PluginSettings): void {
        this.settings = settings;
    }

    public getLiveNumberingUpdate(): boolean {
        return this.settings.liveNumberingUpdate;
    }

    public setLiveNumberingUpdate(value: boolean): void {
        this.settings.liveNumberingUpdate = value;
    }

    public getSmartPasting(): boolean {
        return this.settings.smartPasting;
    }

    public setSmartPasting(value: boolean): void {
        this.settings.smartPasting = value;
    }

    public getStartsFromOne(): boolean {
        return this.settings.startsFromOne;
    }

    public setStartsFromOne(value: boolean): void {
        this.settings.startsFromOne = value;
    }

    public getLiveUpdate(): boolean {
        // TODO
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

    public getLiveCheckboxUpdate(): boolean {
        return this.settings.liveCheckboxUpdate;
    }

    public setLiveCheckboxUpdate(value: boolean): void {
        this.settings.liveCheckboxUpdate = value;
    }

    public getSortCheckboxesBottom(): boolean {
        return this.settings.sortCheckboxesToBottom;
    }

    public setSortCheckboxesBottom(value: boolean): void {
        this.settings.sortCheckboxesToBottom = value;
    }
}
