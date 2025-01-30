import { App, PluginSettingTab, Setting } from "obsidian";
import AutoReordering from "../main";
import SettingsManager from "./SettingsManager";

export default class AutoRenumberingSettings extends PluginSettingTab {
    plugin: AutoReordering;
    settingsManager: SettingsManager;

    constructor(app: App, plugin: AutoReordering) {
        super(app, plugin);
        this.plugin = plugin;
        this.settingsManager = SettingsManager.getInstance();
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Sort automatically")
            .setDesc("Automatically sorts checkboxes")
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.getLiveUpdate()).onChange(async (value) => {
                    this.settingsManager.setLiveUpdate(value);
                    await this.plugin.saveSettings();
                })
            );
    }
}
