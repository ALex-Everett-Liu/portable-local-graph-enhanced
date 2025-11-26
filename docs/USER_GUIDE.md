# User Guide

Complete guide to using the Graph App desktop application for creating and visualizing graph networks.

## Table of Contents

- [Getting Started](#getting-started)
- [Basic Operations](#basic-operations)
- [Search & Navigation](#search--navigation)
- [Layer Management](#layer-management)
- [Node & Edge Editing](#node--edge-editing)
- [Canvas Navigation](#canvas-navigation)
- [Database Operations](#database-operations)
- [Advanced Features](#advanced-features)
- [Tips & Best Practices](#tips--best-practices)

## Getting Started

### First Launch

1. Start the application using `npm start`
2. The app will open with an empty canvas
3. The default mode is **Select Mode** (indicated by the highlighted button in the toolbar)

### Understanding the Interface

- **Toolbar** (top): Mode selection, search, and action buttons
- **Canvas** (center): Main graph visualization area
- **Sidebar** (right): Graph info, selection details, and display options

## Basic Operations

### Creating Nodes

1. Click the **"Add Node"** button in the toolbar (or press the corresponding mode button)
2. Click anywhere on the canvas to create a new node
3. The node will appear at the clicked position
4. Click **"Select"** mode to return to selection mode

### Creating Edges

#### Method 1: Direct Connection
1. Click the **"Add Edge"** button in the toolbar
2. Click on the source node (first node)
3. Click on the target node (second node)
4. An edge will be created connecting the two nodes

#### Method 2: Via Search (for distant nodes)
1. Click **"Create Edge"** button in the sidebar (under "Create Edge" section)
2. In the dialog, search for the source node in the first search box
3. Search for the target node in the second search box
4. Optionally set weight and category
5. Click **"Create Edge"** to connect them

### Selecting Elements

- **Nodes**: Click directly on a node
- **Edges**: Click on the edge line (or hold Alt/Ctrl/Cmd while clicking)
- **Multiple overlapping elements**: Click the same position multiple times to cycle through candidates
- **Empty space**: Click empty canvas to deselect

### Moving Nodes

1. Enter **Select Mode** (default)
2. Click and drag a node to move it
3. Release to drop the node at the new position

### Editing Nodes

1. **Right-click** on a node to open the context menu
2. Select **"Edit Node"**
3. In the dialog, you can modify:
   - **English Label**: Primary node label
   - **Chinese Label**: Secondary label (optional)
   - **Color**: Click color picker or enter hex code
   - **Size**: Adjust node radius (slider or input)
   - **Category**: Assign a category tag
   - **Layers**: Add/remove layer assignments
4. Click **"OK"** to save changes

### Editing Edges

1. **Right-click** on an edge to open the context menu
2. Select **"Edit Edge"**
3. In the dialog, you can modify:
   - **Weight**: Edge weight value (affects line thickness)
   - **Category**: Assign a category tag
   - **Reverse Direction**: Swap source and target nodes
4. Click **"OK"** to save changes

### Deleting Elements

1. **Right-click** on a node or edge
2. Select **"Delete"** from the context menu
3. Confirm deletion if prompted

## Search & Navigation

### Inline Search Bar

1. Use the search input in the toolbar
2. Type to search nodes by English or Chinese labels
3. Results appear in a dropdown below the search box
4. Use **Arrow keys** to navigate results
5. Press **Enter** to select and focus on a node
6. Press **Escape** to close the dropdown

### Search Dialog

1. Click the **"Search"** button (magnifying glass icon) in the toolbar
2. The search dialog opens with a search input
3. Type to filter nodes in real-time
4. Results show:
   - Node labels (English and Chinese)
   - Total count of matching nodes
   - Pagination controls (if more than 20 results)
5. **Navigate results**:
   - Use **Arrow keys** to move through results
   - Press **Enter** to select and focus on a node
   - Click any result item to focus on that node
6. **Pagination**:
   - Use **Previous/Next** buttons
   - Type page number in the input field and press **Enter** or click **Go**
   - Shows current page and total pages (e.g., "Page 1 of 5")

### Visual Highlighting

- When you search, matching nodes are highlighted on the canvas
- Selected nodes remain highlighted until you search again or clear selection
- The sidebar shows the count of highlighted nodes

## Layer Management

### Understanding Layers

Layers allow you to organize nodes into groups and filter the view. Each node can belong to multiple layers.

### Assigning Layers to Nodes

1. Right-click a node and select **"Edit Node"**
2. In the **"Layers"** field, enter layer names separated by commas
   - Example: `layer1, layer2, important`
3. Click **"OK"** to save

### Layer Management Dialog

1. Click **"Manage Layers"** button in the sidebar (under "Layer Management")
2. The dialog shows:
   - List of all layers with node counts
   - Pagination controls (15 items per page)
   - Filter mode selection
   - Active layer selection

### Filtering by Layers

1. Open the **Layer Management** dialog
2. Select **Filter Mode**:
   - **Include**: Show only nodes in selected layers
   - **Exclude**: Hide nodes in selected layers
3. Check the boxes next to layers you want to filter by
4. Click **"Apply Filter"** to update the view
5. Edges connecting filtered-out nodes are automatically hidden

### Layer Operations

- **Rename Layer**: Click the rename icon next to a layer name
- **View Layer Summary**: See total layers and filter status in the sidebar
- **Clear Filter**: Uncheck all layers or switch filter mode to "None"

### Layer Filter Persistence

- Filter state is automatically saved per database
- When you load a database, your previous filter settings are restored
- Filter state persists across app restarts

## Node & Edge Editing

### View All Connections

1. Right-click a node and select **"Edit Node"**
2. Click the **"Connections"** button in the dialog
3. The connections dialog shows:
   - **Incoming**: Edges pointing to this node (red indicator)
   - **Outgoing**: Edges from this node (blue indicator)
   - **Bidirectional**: Pairs of edges in both directions (green indicator)
   - Connection count and details (labels, weights, categories)

### Connection Actions

- **Highlight All Connections**: Highlights all connected nodes plus the current node
- **Highlight Individual Connection**: Click any connection item to highlight that specific node pair
- **Focus on Node**: Click **"Focus on Node"** button to center the view on a connected node

### Selection Info Sidebar

When you select a node or edge, the sidebar shows detailed information:

**For Nodes**:
- English and Chinese labels
- Position (x, y coordinates)
- Color
- Size (radius)
- Category
- Layers
- Creation and modification timestamps

**For Edges**:
- Source and target node labels
- Weight
- Category

## Canvas Navigation

### Panning (Moving the Canvas)

1. Enter **Select Mode**
2. Click and drag on empty canvas space
3. The entire graph moves with your mouse
4. Release to stop panning

### Zooming

- **Zoom In**: Scroll mouse wheel up
- **Zoom Out**: Scroll mouse wheel down
- **Zoom Range**: 0.1x (very zoomed out) to 5x (very zoomed in)

### View State Persistence

- Your pan and zoom position is automatically saved
- When you reload the database, the view state is restored
- View state is saved per database file

### Resizing Sidebar

1. Hover over the left edge of the sidebar
2. The cursor changes to a resize indicator
3. Click and drag left/right to adjust sidebar width
4. Sidebar width is saved and restored on next launch
5. Maximum width is 60% of viewport

## Database Operations

### Loading a Database

1. Click **"Load"** button in the toolbar
2. The load dialog shows all available `.db` files in the `data/` directory
3. **Navigate databases**:
   - Use pagination controls if there are many files
   - Type page number and press **Enter** or click **Go**
   - Use **Previous/Next** buttons
4. Click on a database file to select it
5. Click **"Load"** to switch to that database
6. If you have unsaved changes, you'll be prompted to save or discard first

### Saving Changes

- Changes are tracked automatically as you edit
- Click **"Save Changes"** button in the sidebar to persist all modifications
- The button appears when there are unsaved changes
- After saving, the button disappears

### Discarding Changes

- Click **"Discard Changes"** button to revert all unsaved modifications
- This restores the graph to the last saved state
- Use with caution - discarded changes cannot be recovered

### Save As (Creating New Database)

1. Click **"Save As"** button in the toolbar
2. Enter a new database filename (must end with `.db`)
3. Click **"Save"** to create the new database
4. Optionally choose to switch to the newly created database
5. The new database contains all current graph data

### Merging Databases

1. Click **"Merge Database"** button in the sidebar (under "Database Operations")
2. Select a source database file from the list
3. Choose a **Conflict Resolution Strategy**:
   - **Skip Conflicts** (default): Keep existing items, skip duplicates
   - **Replace Conflicts**: Replace existing items with new ones
   - **Rename Conflicts**: Create new items with renamed IDs
4. Click **"Merge"** to start the merge process
5. Review the merge statistics:
   - Nodes added, skipped, renamed
   - Edges added, skipped, renamed
6. The graph automatically reloads to show merged data

### Database Directory

- Default location: `data/` directory at project root
- Custom location: Set `GRAPH_DB_DIR` environment variable
- Database files are automatically created if the directory doesn't exist

## Advanced Features

### Edge Flow Visualization

Visualize edge direction with animated particles:

1. Check **"Show Edge Arrows"** in the sidebar (under "Display Options")
2. Animated blue particles flow along edges showing direction
3. Particles move from source node to target node
4. Uncheck to disable the effect

### Smart Selection

The app includes intelligent selection features:

- **Distance-based Priority**: Selects the closest node to your click
- **Overlap Detection**: Detects all overlapping elements at click position
- **Cycling**: Click the same position multiple times to cycle through candidates
- **Visual Feedback**: Shows notification like "1 of 3: Node Name" when cycling
- **Modifier Keys**: Hold Alt/Ctrl/Cmd while clicking to prioritize edge selection

### Categories

Both nodes and edges support categories:

- **Assign Categories**: Use the category field in edit dialogs
- **Categories**: Help organize and filter your graph data
- **Multiple Categories**: Separate multiple categories with commas

### Chinese Labels

Nodes support bilingual labels:

- **English Label**: Primary label (required)
- **Chinese Label**: Secondary label (optional)
- Both labels are searchable
- Both labels display in tooltips and selection info

### Clear All Data

1. Click **"Clear"** button in the toolbar
2. Confirm the action
3. All nodes and edges are permanently deleted
4. This action cannot be undone

## Tips & Best Practices

### Organization Tips

1. **Use Layers**: Organize nodes into logical layers for better management
2. **Use Categories**: Tag nodes and edges with categories for easy identification
3. **Naming Conventions**: Use consistent naming for nodes and layers
4. **Regular Saves**: Save your work frequently to avoid data loss

### Navigation Tips

1. **Search First**: Use search to find nodes quickly instead of panning/zooming
2. **Create Edge via Search**: Connect distant nodes without manual navigation
3. **View Connections**: Use the connections dialog to explore node relationships
4. **Layer Filtering**: Use layer filters to focus on specific parts of your graph

### Performance Tips

1. **Layer Filtering**: Hide unnecessary layers to improve rendering performance
2. **Pagination**: Search results are paginated for better performance with large graphs
3. **Edge Flow**: Disable edge flow visualization if performance is slow

### Keyboard Shortcuts

- **Arrow Keys**: Navigate search results
- **Enter**: Select search result or confirm dialog
- **Escape**: Close dropdowns and dialogs
- **Alt/Ctrl/Cmd + Click**: Select edges when nodes overlap

### Workflow Recommendations

1. **Plan Your Layers**: Decide on layer structure before creating many nodes
2. **Use Save As**: Create backups before major changes
3. **Merge Strategically**: Use merge to combine related databases
4. **Regular Backups**: Copy database files to backup locations periodically

### Troubleshooting

**Graph not displaying correctly**:
- Check if layer filters are hiding nodes
- Try clearing filters in Layer Management dialog

**Can't find a node**:
- Use the search dialog with different search terms
- Check if the node is in a filtered-out layer

**Changes not saving**:
- Ensure you click "Save Changes" button after making edits
- Check the sidebar for unsaved changes indicator

**Performance issues**:
- Disable edge flow visualization
- Use layer filtering to reduce visible nodes
- Close and reopen the application

## Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md) - Technical architecture details
- [Development Guide](./DEVELOPMENT_GUIDE.md) - For contributors
- [Roadmap](./ROADMAP.md) - Planned features
- [Changelog](../CHANGELOG.md) - Version history

