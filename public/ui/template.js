// Template functionality - Start new graph from template
// This creates a fresh graph with 1 node at center and scale set to 2

import { getGraph } from '../state/appState.js';
import { createNewDatabase, saveNodeToDb, saveViewStateToDb, loadGraphFromDb } from '../services/databaseService.js';
import { unsavedChanges, originalState } from '../state/appState.js';
import { updateSaveButtonVisibility } from './saveDiscardUI.js';

export async function createNewGraphTemplate() {
    // Get graph instance
    const graph = getGraph();
    if (!graph) {
        alert('Graph instance not available. Please wait for the application to load.');
        return;
    }

    try {
        // Generate a unique filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `graph-${timestamp}.db`;

        // Create a new empty database file and switch to it
        await createNewDatabase(filename);

        // Clear the graph instance (this resets scale to 1, offset to {0,0})
        graph.clear();

        // Get canvas dimensions
        const canvas = graph.canvas;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Set scale to 2 and keep offset at {0, 0}
        graph.scale = 2;
        graph.offset = { x: 0, y: 0 };

        // Calculate world coordinates for center of canvas
        // screenToWorld: worldX = (screenX - offsetX) / scale
        // With offset = {0, 0} and scale = 2:
        // worldX = screenX / 2
        const screenCenterX = canvasWidth / 2;
        const screenCenterY = canvasHeight / 2;
        const worldCenterX = (screenCenterX - graph.offset.x) / graph.scale;
        const worldCenterY = (screenCenterY - graph.offset.y) / graph.scale;

        // Create a node at the center
        const node = graph.addNode(worldCenterX, worldCenterY, 'Node 1');

        // Save the node to database
        await saveNodeToDb(node);

        // Save view state (scale and offset) to database
        await saveViewStateToDb();

        // Clear unsaved changes tracking
        unsavedChanges.nodes.clear();
        unsavedChanges.edges.clear();
        unsavedChanges.viewState = null;
        originalState.nodes.clear();
        originalState.edges.clear();
        originalState.viewState = null;

        // Update UI
        updateSaveButtonVisibility();

        // Update graph info if function exists
        if (window.updateGraphInfo) {
            window.updateGraphInfo();
        }

        // Render the graph
        graph.render();

        console.log('New graph template created successfully');
    } catch (error) {
        console.error('Error creating template:', error);
        alert('Failed to create template: ' + error.message);
    }
}

