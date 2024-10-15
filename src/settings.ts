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
                toggle.setValue(this.plugin.settings.autoUpdate).onChange(async (value) => {
                    this.plugin.settings.autoUpdate = value;
                    await this.plugin.saveSettings();
                })
            );
    }
}
