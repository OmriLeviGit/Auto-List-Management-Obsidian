# Auto Renumbering Plugin for Obsidian

Automatically updates numbered lists, ensuring they stay in sequential order and eliminating the need for manual adjustments.

> **Note:** This plugin is still in development and is **not** yet recommended for production use.

## Features

### Live Update

With live updates enabled, the plugin automatically renumbers your lists as you edit them in real time. This means that whenever you make changes to your lists, the numbering updates instantly to reflect the correct sequence, whether you're adding, deleting, or modifying items.

### Pasting

When you paste text into a numbered list, the plugin processes the pasted content, ensuring that any included numbered lists are consistent with the original list that is pasted into.

### Special Key Handling

The plugin recognizes when special keys (`Ctrl`, `Command` on Mac, or `Alt/Option`) are pressed during editing. When these keys are detected, the plugin temporarily disables the automatic renumbering feature. This allows you to perform actions like undo without triggering unwanted renumbering.

#### Live Update Disabled

If you choose to turn off the live update feature, the plugin will not automatically renumber your lists as you make changes. Instead, you can manually trigger renumbering through the commands provided. This is particularly useful if you prefer to have more control over when changes are applied.

### Commands

The plugin offers several commands (Ctrl + P functions) to manage your lists:

-   **Renumber the numbered list at cursor location**: Renumbers the list where your cursor is currently positioned.
-   **Renumber all selected numbered lists**: Renumbers only the lists within your selected text.
-   **Renumber all numbered lists in file**: Renumbers every numbered list in your current note.

## Performance

The live update feature renumbers lists locally, adjusting the current line based on the previous line until it reaches the first correctly numbered line. This approach minimizes unnecessary calculations.
In addition, the plugin was tested with documents containing lists with over 10,000 lines, and no performance issues were found on my machine, in case where the lists are extremely long.

### Limitations

Please note that the plugin currently does not support Vim mode for automatic renumbering. If you are using Vim, you can still trigger the renumbering commands.
