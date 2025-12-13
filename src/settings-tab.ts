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

        const githubEl = createFragment();
        githubEl.appendText("For more information, visit ");
        githubEl.createEl("a", {
            href: "https://github.com/OmriLeviGit/Auto-List-Management-Obsidian",
            text: "Github",
        });

        githubEl.appendText(".");
        containerEl.appendChild(githubEl);

        new Setting(containerEl).setHeading();

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

        new Setting(containerEl).setHeading().setName("Checklists");

        new Setting(containerEl)
            .setName("Auto-sort on changes")
            .setDesc("Automatically sort checklists whenever checkboxes are checked or unchecked.")
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.getLiveCheckboxUpdate()).onChange(async (value) => {
                    this.settingsManager.setLiveCheckboxUpdate(value);
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("Place checked items at bottom")
            .setDesc(
                "When enabled, checked tasks will be placed at the bottom. When disabled, they will be at the top."
            )
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.isCheckedItemsAtBottom()).onChange(async (value) => {
                    this.settingsManager.setCheckedItemsAtBottom(value);
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("Hierarchical checkbox reordering")
            .setDesc(
                "When enabled, checking a checkbox moves it along with all indented content (sub-tasks, paragraphs) as a block. When disabled, checkbox lines moves individually."
            )
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.isHierarchicalReordering()).onChange(async (value) => {
                    this.settingsManager.setHierarchicalReordering(value);
                    await this.plugin.saveSettings();
                })
            );

        const descEl = createFragment();
        descEl.appendText("When enabled, tasks with any special checkbox characters will be sorted according to ");
        descEl.createEl("a", {
            href: "https://en.wikipedia.org/wiki/ASCII",
            text: "ASCII",
        });
        descEl.appendText(". When disabled, only tasks marked for deletion will be sorted.");

        new Setting(containerEl)
            .setName("Sort all special checkboxes")
            .setDesc(descEl)
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.getSortSpecialChars()).onChange(async (value) => {
                    this.settingsManager.setSortSpecialChars(value);
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName("Checkbox delete-characters")
            .setDesc(
                "Specify which checkbox characters mark tasks for deletion. Tasks with these characters are always sorted below tasks with other characters, and can be removed by using the delete command."
            )
            .addText((text) => {
                text.setPlaceholder("Enter characters")
                    .setValue(this.settingsManager.getCharsToDelete())
                    .onChange(async (value) => {
                        this.settingsManager.setCharsToDelete(value);
                        await this.plugin.saveSettings();
                    });
            });

        containerEl.createEl("div", {
            text: "Enter single characters separated by spaces (case-insensitive). Default: 'X'.",
            cls: "setting-item-description",
        });

        containerEl.createEl("div", {
            text: "Example: '- /' means tasks with [x], [-], or [/] will be removed, while tasks with other characters like [>] will remain.",
            cls: "setting-item-description",
        });

        new Setting(containerEl).setHeading();

        new Setting(containerEl).setHeading().setName("Numbered lists");

        // Create the dependent settings first to get their elements
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

        const startsFromOneSetting = new Setting(containerEl)
            .setName("Start numbering from 1")
            .setDesc("Whether lists always start from 1 or preserve their original starting numbers.")
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.getStartsFromOne()).onChange(async (value) => {
                    this.settingsManager.setStartsFromOne(value);
                    await this.plugin.saveSettings();
                })
            );

        const startsFromOneToggleEl = startsFromOneSetting.settingEl;

        // Now create the auto-renumber toggle and insert it at the top
        const autoRenumberSetting = new Setting(containerEl)
            .setName("Auto-renumber on changes")
            .setDesc("Automatically sort numbered lists as changes are made.")
            .addToggle((toggle) =>
                toggle.setValue(this.settingsManager.getLiveNumberingUpdate()).onChange(async (value) => {
                    this.settingsManager.setLiveNumberingUpdate(value);
                    await this.plugin.saveSettings();

                    if (value) {
                        smartPastingToggleEl.classList.add("setting-enabled");
                        smartPastingToggleEl.classList.remove("setting-disabled");
                        startsFromOneToggleEl.classList.add("setting-enabled");
                        startsFromOneToggleEl.classList.remove("setting-disabled");
                    } else {
                        smartPastingToggleEl.classList.remove("setting-enabled");
                        smartPastingToggleEl.classList.add("setting-disabled");
                        startsFromOneToggleEl.classList.remove("setting-enabled");
                        startsFromOneToggleEl.classList.add("setting-disabled");
                    }
                })
            );

        // Move the auto-renumber setting to the top by moving the DOM element
        containerEl.insertBefore(autoRenumberSetting.settingEl, smartPastingSetting.settingEl);

        const isLiveNumberingUpdateEnabled = this.settingsManager.getLiveNumberingUpdate();
        if (isLiveNumberingUpdateEnabled) {
            smartPastingToggleEl.classList.add("setting-enabled");
            smartPastingToggleEl.classList.remove("setting-disabled");
            startsFromOneToggleEl.classList.add("setting-enabled");
            startsFromOneToggleEl.classList.remove("setting-disabled");
        } else {
            smartPastingToggleEl.classList.add("setting-disabled");
            smartPastingToggleEl.classList.remove("setting-enabled");
            startsFromOneToggleEl.classList.add("setting-disabled");
            startsFromOneToggleEl.classList.remove("setting-enabled");
        }
    }
}
