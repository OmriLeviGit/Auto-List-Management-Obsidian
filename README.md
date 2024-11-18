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

-   **Smart Pasting**: Keeps the numbering intact when pasting content into an existing list, rather than adopting the numbering from the pasted text.

-   **Start numbering from 1**: When enabled, all numbered lists will be numbered starting from 1.

-   **Tab Size**: You need to manually specify your preferred tab size in the plugin settings, as the plugin cannot automatically detect tab sizes. This step is necessary to ensure proper functionality of nested numbering.

<br>
<table>
  <tr>
    <td colspan="2">
      <em>Content in clipboard:</em>
      <div>
        1. Apple<br> 
        2. Banana
      </div>
    </td>
  </tr>
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

## Available Commands

-   **Renumber at Cursor**: This command renumbers the list that the cursor is within, regardless of where the cursor is placed.
-   **Renumber Selected Lists**: If you highlight multiple numbered lists, this command renumbers all of them at once.
-   **Renumber the Entire Note**: Renumbers every numbered list in your active note.

## Performance

The live update feature renumbers lists locally, adjusting only the lines up to the first correctly numbered line, which reduces unnecessary calculations.
The plugin was tested with documents containing lists with over 10,000 lines, and no performance issues were found on my machine.

## Limitations

For **Vim** users: The _live update_ feature is only active while in **Insert** mode. Manual commands work as usual in all modes.
