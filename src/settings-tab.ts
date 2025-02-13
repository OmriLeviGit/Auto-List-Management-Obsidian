import { App, PluginSettingTab, Setting } from "obsidian";
import AutoReordering from "../main";
import SettingsManager from "./SettingsManager";
import "styles.css";

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
            .setName("Tab size")
            .setDesc(
                "Set the indent size to the same size as in the editor's settings. Can be found under: Options > Editor > Tab indent size/Indent visual width."
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

        new Setting(containerEl).setHeading().setName("Numbered lists");

        new Setting(containerEl)
            .setName("Automatically update numbered lists")
            .setDesc("Update numbered lists as changes are made.")
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.getLiveNumberingUpdate()).onChange(async (value) => {
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
            .setDesc("Ensure that the first item of every numbered list is set to 1.")
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.getStartsFromOne()).onChange(async (value) => {
                    this.settingsManager.setStartsFromOne(value);
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl).setHeading().setName("Checklists");

        new Setting(containerEl)
            .setName("Automatically sort checklists")
            .setDesc("Sort checklist items when boxes are checked")
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.getLiveCheckboxUpdate()).onChange(async (value) => {
                    this.settingsManager.setLiveCheckboxUpdate(value);
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl).setName("Where items should be placed").addDropdown((dropdown) =>
            dropdown
                .addOption("top", "Top")
                .addOption("bottom", "Bottom")
                .setValue(this.settingsManager.getChecklistSortPosition())
                .onChange(async (value) => {
                    this.settingsManager.setChecklistSortPosition(value);
                    await this.plugin.saveSettings();
                })
        );
    }
}
