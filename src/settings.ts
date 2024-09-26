import { App, PluginSettingTab, Setting } from "obsidian";
import RenumberList from "main";

export interface MyPluginSettings {
    mySetting: string;
    hotkey: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
    mySetting: "default",
    hotkey: "Ctrl+=",
};

export default class SampleSettingTab extends PluginSettingTab {
    plugin: RenumberList;

    constructor(app: App, plugin: RenumberList) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl)
            .setName("Hotkey")
            .setDesc("The hotkey to trigger the plugin command.")
            .addText((text) =>
                text
                    .setPlaceholder("Enter a hotkey")
                    .setValue(this.plugin.settings.hotkey)
                    .onChange(async (value) => {
                        this.plugin.settings.hotkey = value;
                        await this.plugin.saveSettings();
                    })
            );

        new Setting(containerEl)
            .setName("Settng #1")
            .setDesc("It's a secret")
            .addText((text) =>
                text
                    .setPlaceholder("Enter your secret")
                    .setValue(this.plugin.settings.mySetting)
                    .onChange(async (value) => {
                        this.plugin.settings.mySetting = value;
                        await this.plugin.saveSettings();
                    })
            );
    }
}
