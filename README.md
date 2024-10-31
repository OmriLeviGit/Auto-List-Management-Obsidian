# Automatic Renumbering Plugin for Obsidian

Automatically updates numbered lists to maintain sequential order, eliminating the need for manual adjustments. The plugin also supports nested lists and offers several commands for users who prefer manual control.

## Installation

1. Download and install from the Obsidian plugin directory.
2. Enable the plugin in **Settings > Community plugins**.
3. In the plugin's settings, match the tab size to the one in the editor's settings (4 by default). This can be found at **Options → Editor → Tab indent size**.

## Features

-   **Live Update**:
    Automatically renumbers lists in real time as edits are made, maintaining accurate keeping sequencing.

-   **Pasting**:
    Maintains correct sequencing when pasting numbered content. When live update is enabled, an optional smart-pasting feature can be activated to keep the sequencing consistent with the original numbered list.

-   **Special Key Handling**:
    Temporarily disables the live update when special keys (`Ctrl`, `Command` on Mac, or `Alt/Option`) are pressed during editing, enabling actions such as undo without triggering unnecessary renumbering.

-   **Live Update Disabled**:
    The live update feature can be disabled. Renumbering can be manually triggered through the available commands, allowing for greater control over when updates are applied.

### Commands (Ctrl + P)

-   **Renumber at cursor position**: Renumbers the list at the position of the cursor.
-   **Renumber all selected numbered lists**: Renumbers all lists within your selected text.
-   **Renumber all numbered lists in note**: Renumbers every numbered list in the active note.

## Performance

The live update feature renumbers lists _locally_, adjusting the current line based on the previous line until it reaches the first correctly numbered line. This approach minimizes unnecessary calculations.
In addition, the plugin was tested with documents containing lists with over 10,000 lines, and no performance issues were found on my machine.

## Limitations

-   **Vim Mode**: It is important to note that the plugin does not support automatic renumbering in Vim mode. However, renumbering commands can still be triggered while using Vim.

-   **Tab Size**: As far as i can tell, the number of spaces represented by a tab character cannot be accessed by plugins and must be specified manually. This is required in order to ensure correct nested numbering.
