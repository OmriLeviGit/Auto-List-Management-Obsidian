import { App, PluginSettingTab, Setting } from "obsidian";
import AutoRenumbering from "../main";
import SettingsManager from "./SettingsManager";
import { startFromOneStrategy, dynamicStartStrategy } from "./renumbering/renumbering-strategies";
import "./styles.css";

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
            .setDesc("Automatically update numbered lists as changes are made. Does not support Vim.")
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.getLiveUpdate()).onChange(async (value) => {
                    this.settingsManager.setLiveUpdate(value);

                    await this.plugin.saveSettings();
                    smartPasteToggleEl.classList.toggle("smart-paste-toggle", value);
                    smartPasteToggleEl.classList.toggle("smart-paste-toggle-disabled", !value);
                })
            );

        const smartPasteSetting = new Setting(containerEl)
            .setName("Smart paste")
            .setDesc("Pasting keeps the sequencing consistent with the original numbered list.")
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.getSmartPaste()).onChange(async (value) => {
                    this.settingsManager.setSmartPaste(value);
                    await this.plugin.saveSettings();
                })
            );

        const smartPasteToggleEl = smartPasteSetting.settingEl;
        const isLiveUpdateEnabled = this.settingsManager.getLiveUpdate();
        smartPasteToggleEl.classList.add(isLiveUpdateEnabled ? "smart-paste-toggle" : "smart-paste-toggle-disabled");

        new Setting(containerEl)
            .setName("Start numbering from 1")
            .setDesc("The first item of every numbered list is 1.")
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.getStartsFromOne()).onChange(async (value) => {
                    this.settingsManager.setStartsFromOne(value);

                    if (value) {
                        this.plugin.setStrategy(new startFromOneStrategy());
                    } else {
                        this.plugin.setStrategy(new dynamicStartStrategy());
                    }
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
