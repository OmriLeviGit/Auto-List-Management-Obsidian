import { App, PluginSettingTab, Setting } from "obsidian";
import AutoRenumbering from "../main";

export default class AutoRenumberingSettings extends PluginSettingTab {
    plugin: AutoRenumbering;

    constructor(app: App, plugin: AutoRenumbering) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Live update")
            .setDesc("Automatically renumber numbered lists as changes are made. Does not support Vim.")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.liveUpdate).onChange(async (value) => {
                    this.plugin.settings.liveUpdate = value;
                    await this.plugin.saveSettings();
                    smartPasteToggleEl.style.opacity = value ? "1" : "0.5";
                    smartPasteToggleEl.style.pointerEvents = value ? "auto" : "none";
                })
            );

        const smartPasteSetting = new Setting(containerEl)
            .setName("Smart paste")
            .setDesc("Pasting keeps the sequencing consistent with the original numbered list.")
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.smartPaste).onChange(async (value) => {
                    this.plugin.settings.smartPaste = value;
                    await this.plugin.saveSettings();
                })
            );

        const smartPasteToggleEl = smartPasteSetting.settingEl;
        smartPasteToggleEl.style.opacity = this.plugin.settings.liveUpdate ? "1" : "0.5";
        smartPasteToggleEl.style.pointerEvents = this.plugin.settings.liveUpdate ? "auto" : "none";

        new Setting(containerEl)
            .setName("Tab indent size")
            .setDesc(
                "Should be set to the same size as in the editor's settings. Can be found under: Options > Editor > Tab indent size."
            )
            .addSlider((slider) =>
                slider
                    .setValue(this.plugin.settings.indentSize)
                    .setLimits(2, 8, 1)
                    .onChange(async (value) => {
                        this.plugin.settings.indentSize = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
