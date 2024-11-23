# Automatic Renumbering Plugin for Obsidian

The Automatic Renumbering plugin helps keep your numbered lists in sequential order automatically, which is particularly useful for users who frequently work with structured documents. It features live updates, smart pasting, and manual control options.

![Example](resources/example.gif)

## Installation Steps

> Step 3 is required for accurate parsing of indentations.

1. In Obsidian, go to **Options → Community plugins → Browse** and search for **Automatic Renumbering**.
2. Click **Install** and enable the plugin.
3. In the plugin settings, adjust the **tab size** to match your editor's settings (found under **Options → Editor → Tab indent size**).

Once installed, the plugin will automatically manage your numbered lists.

## Configuration Options

-   **Live Update**: Automatically renumbers lists as you edit, helping maintain accurate sequencing without manual adjustments. Additional commands are available if you prefer to manually control which lists to renumber.

-   **Smart Pasting**: Keeps the numbering intact when pasting content into an existing list, rather than adopting the numbering from the pasted text. Requires _live update_ to be active.

-   **Start numbering from 1**: When enabled, all numbered lists will be numbered starting from 1.

-   **Tab Size**: You need to manually specify your preferred tab size in the plugin settings, as the plugin cannot automatically detect tab sizes. This step is necessary to ensure proper functionality of nested numbering.

<br>
<div>
  <em>Content in clipboard:</em>
  <div>
    <ol>
      <li>Apple</li>
      <li>Banana</li>
    </ol>
  </div>
  <table>
    <tr>
      <td style="text-align: center;">
        <img src="resources/regular_paste.gif" alt="Regular paste" />
        <p><em>Regular pasting</em></p>
      </td>
      <td style="text-align: center;">
        <img src="resources/smart_paste.gif" alt="Smart paste" />
        <p><em>Smart pasting</em></p>
      </td>
    </tr>
  </table>
</div>

## Available Commands

-   **Renumber at Cursor**: This command renumbers the list that the cursor is within, regardless of where the cursor is placed.
-   **Renumber Selected Lists**: If you highlight multiple numbered lists, this command renumbers all of them at once.
-   **Renumber the Entire Note**: Renumbers every numbered list in your active note.

## Performance

The plugin was tested with documents containing lists with over 10,000 lines, and no performance issues were found on my machine.

## Limitations

-   **Undo Behavior**: Renumbering is treated as a separate action in the editor's history, as I couldn't find a reliable way to fully control the edit history.

-   **Modifier Keys**: To avoid conflicts with keyboard shortcuts, the _live update_ feature is temporarily disabled when modifier Keys (`Ctrl`, `Command` on Mac, or `Alt/Option`) held down during editing.

-   **Vim users**: The _live update_ feature only works in **Insert** mode. Manual renumbering commands, however, will function normally in any of the modes.
