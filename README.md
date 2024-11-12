# Automatic Renumbering Plugin for Obsidian

The Automatic Renumbering plugin helps keep your numbered lists in sequential order automatically, which is particularly useful for users who frequently work with structured documents. It features live updates, smart pasting, and manual control options.

![Example](resources/example.gif)

## Installation Steps

1. In Obsidian, go to **Options → Community plugins → Browse** and search for **Automatic Renumbering**.
2. Click **Install** and enable the plugin.
3. In the plugin settings, adjust the **tab size** to match your editor's settings (found under **Options → Editor → Tab indent size**).

Once installed, the plugin will automatically manage your numbered lists.

## Features

-   **Live Update**: Automatically renumbers lists as you edit, helping maintain accurate sequencing without manual adjustments.

-   **Pasting**: Ensures correct sequencing when pasting numbered content. When live update is enabled, an optional smart pasting feature can be enabled to keep the sequencing consistent with the original numbered list.

-   **Special Key Handling**: Temporarily disables the live update when special keys (`Ctrl`, `Command` on Mac, or `Alt/Option`) are pressed during editing, enabling actions such as undo without triggering unnecessary renumbering.

-   **Manual Control**: Offers commands for manual renumbering if you prefer to manage updates yourself.

<br>
<br>

![Regular paste](resources/regular_paste.gif)
![Smart paste](resources/smart_paste.gif)

> Regular paste (left) | Smart paste (right).

## Available Commands

-   **Renumber at Cursor**: This command renumbers the list that the cursor is within, regardless of where the cursor is placed.
-   **Renumber Selected Lists**: If you highlight multiple numbered lists, this command renumbers all of them at once.
-   **Renumber Entire Note**: Renumbers every numbered list in your active note.

## Performance

The live update feature renumbers lists locally, adjusting only the lines up to the first correctly numbered line, which reduces unnecessary calculations.
The plugin was tested with documents containing lists with over 10,000 lines, and no performance issues were found on my machine.

## Limitations

The plugin does not support automatic renumbering in Vim mode, but you can still trigger renumbering commands manually. Additionally, it requires manual specification of tab sizes for correct nested numbering, as automatic detection is not available.
