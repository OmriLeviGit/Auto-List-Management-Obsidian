# Automatic List Reordering Plugin for Obsidian

This plugin automatically maintains numbered lists and sorts checklists as you edit. Features include automatic renumbering and reordering, control of whether lists always start from 1 or preserve their original starting numbers, and support for checklist reordering when using the mouse.

![Example](resources/example.gif)

## Installation Steps

> Step 3 is required for accurate parsing of indented lists.

1. In Obsidian, go to **Options → Community plugins → Browse** and search for **Automatic List Reordering**.
2. Click **Install** and enable the plugin.
3. In the plugin settings, adjust the **tab size** to match your editor's settings (found under **Options → Editor → Tab indent size/Indent visual width**).

Once installed, the plugin will automatically manage your numbered lists.

## Configuration Options

### Checklist

-   **Automatically sort checklists**: Sorts checklist items automatically when they are checked.

-   **Sort position**: Choose where completed items should be placed (top or bottom of the list).

### Numbered lists

-   **Automatically update numbered lists**: Automatically update numbered lists as you edit without manual adjustments. Additional commands are available if you prefer to manually control which lists to renumber.

-   **Smart pasting**: Keeps the numbering intact when pasting content into an existing list, rather than adopting the numbering from the pasted text.

-   **Start numbering from 1**: When enabled, all numbered lists will be numbered starting from 1.

<br>
<div>
  <em>Content in clipboard:</em>
    <ol>
      <li>Apple</li>
      <li>Banana</li>
    </ol>
  <table>
    <tr>
      <td style="text-align: center;">
        <img src="resources/regular_paste.gif" alt="Regular paste" style="display: block; margin: auto;" />
        <p><em>Regular pasting</em></p>
      </td>
      <td style="text-align: center;">
        <img src="resources/smart_paste.gif" alt="Smart paste" style="display: block; margin: auto;" />
        <p><em>Smart pasting</em></p>
      </td>
    </tr>
  </table>
</div>

## Available Commands

-   **Renumber selected lists or at cursor position**: This command renumbers the list that the cursor is within, regardless of where the cursor is placed. If multiple lists are highlighted, renumbers both of them separately.

-   **Renumber all numbered lists in note**: Renumbers every numbered list in your active note.

## Performance

The plugin was tested with documents containing lists with over 10,000 lines, and no performance issues were found on my machine.

## Limitations

-   **Undo behavior**: Updates are treated as a separate action in the editor's history, as I couldn't find a reliable way to fully control the edit history.

-   **Modifier keys**: To avoid conflicts with keyboard shortcuts, the _live update_ feature is temporarily disabled when modifier Keys (`Ctrl`, `Command` on Mac, or `Alt/Option`) held down during editing.
