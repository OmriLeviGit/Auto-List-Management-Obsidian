import { PluginSettings, RenumberingSettings, ChecklistSettings } from "./types";

const DEFAULT_RENUMBERING_SETTINGS: RenumberingSettings = {
    liveUpdate: true,
    smartPasting: true,
    startsFromOne: true,
};

const DEFAULT_CHECKLIST_SETTINGS: ChecklistSettings = {
    liveUpdate: true,
    sortPosition: "bottom",
    charsToDelete: "",
};

export const DEFAULT_SETTINGS: PluginSettings = {
    renumbering: DEFAULT_RENUMBERING_SETTINGS,
    checklist: DEFAULT_CHECKLIST_SETTINGS,
    indentSize: 4,
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
        return this.settings.renumbering.liveUpdate;
    }

    public setLiveNumberingUpdate(value: boolean): void {
        this.settings.renumbering.liveUpdate = value;
    }

    public getRenumberingSmartPasting(): boolean {
        return this.settings.renumbering.smartPasting;
    }

    public setSmartPasting(value: boolean): void {
        this.settings.renumbering.smartPasting = value;
    }

    public getStartsFromOne(): boolean {
        return this.settings.renumbering.startsFromOne;
    }

    public setStartsFromOne(value: boolean): void {
        this.settings.renumbering.startsFromOne = value;
    }

    public getIndentSize(): number {
        return this.settings.indentSize;
    }

    public setIndentSize(value: number): void {
        this.settings.indentSize = value;
    }

    public getLiveCheckboxUpdate(): boolean {
        return this.settings.checklist.liveUpdate;
    }

    public setLiveCheckboxUpdate(value: boolean): void {
        this.settings.checklist.liveUpdate = value;
    }

    public getChecklistSortPosition(): string {
        return this.settings.checklist.sortPosition;
    }

    public setChecklistSortPosition(value: string): void {
        this.settings.checklist.sortPosition = value;
    }

    public getCharsToDelete(): string {
        return this.settings.checklist.charsToDelete;
    }

    public setCharsToDelete(value: string): void {
        this.settings.checklist.charsToDelete = value;
    }
}
