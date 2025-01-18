import { App, PluginSettingTab, Setting } from "obsidian";
import AutoRenumbering from "../main";
import SettingsManager from "./SettingsManager";
import "styles.css";

export default class AutoRenumberingSettings extends PluginSettingTab {
    plugin: AutoRenumbering;
    settingsManager: SettingsManager;

    constructor(app: App, plugin: AutoRenumbering) {
        super(app, plugin);
        this.plugin = plugin;
        this.settingsManager = SettingsManager.getInstance();
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Live update")
            .setDesc("Automatically update numbered lists as changes are made.")
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.getLiveNumberingUpdate()).onChange(async (value) => {
                    // Update live update setting
                    this.settingsManager.setLiveNumberingUpdate(value);

                    await this.plugin.saveSettings();

                    if (value) {
                        smartPastingToggleEl.classList.add("smart-paste-toggle");
                        smartPastingToggleEl.classList.remove("smart-paste-toggle-disabled");
                    } else {
                        smartPastingToggleEl.classList.remove("smart-paste-toggle");
                        smartPastingToggleEl.classList.add("smart-paste-toggle-disabled");
                    }
                })
            );

        const smartPastingSetting = new Setting(containerEl)
            .setName("Smart pasting")
            .setDesc("Pasting keeps the sequencing consistent with the original numbered list.")
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.getSmartPasting()).onChange(async (value) => {
                    this.settingsManager.setSmartPasting(value);
                    await this.plugin.saveSettings();
                })
            );

        const smartPastingToggleEl = smartPastingSetting.settingEl;

        const isLiveNumberingUpdateEnabled = this.settingsManager.getLiveNumberingUpdate();
        if (isLiveNumberingUpdateEnabled) {
            smartPastingToggleEl.classList.add("smart-paste-toggle");
            smartPastingToggleEl.classList.remove("smart-paste-toggle-disabled");
        } else {
            smartPastingToggleEl.classList.add("smart-paste-toggle-disabled");
            smartPastingToggleEl.classList.remove("smart-paste-toggle");
        }

        new Setting(containerEl)
            .setName("Start numbering from 1")
            .setDesc("The first item of every numbered list is 1.")
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.getStartsFromOne()).onChange(async (value) => {
                    this.settingsManager.setStartsFromOne(value);
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("Tab indent size")
            .setDesc(
                "Set the indent size to the same size as in the editor's settings. Can be found under: Options > Editor > Tab indent size."
            )
            .addSlider((slider) => {
                slider
                    .setValue(this.settingsManager.getIndentSize())
                    .setLimits(2, 8, 1)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.settingsManager.setIndentSize(value);
                        await this.plugin.saveSettings();
                    });
            });
    }
}
