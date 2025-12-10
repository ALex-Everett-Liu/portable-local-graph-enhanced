// Template functionality - Start new graph from template
// This creates a fresh graph with 2 nodes and 1 edge as a sample template

import { getGraph } from '../state/appState.js';
import { createNewDatabase, saveNodeToDb, saveEdgeToDb, saveViewStateToDb, loadGraphFromDb } from '../services/databaseService.js';
import { unsavedChanges, originalState } from '../state/appState.js';
import { updateSaveButtonVisibility } from './saveDiscardUI.js';
import { showToast } from '../utils/toast.js';

export async function createNewGraphTemplate() {
    // Get graph instance
    const graph = getGraph();
    if (!graph) {
        showToast('Graph instance not available. Please wait for the application to load.', 'warning', 4000);
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

        // Create two nodes positioned horizontally (left and right of center)
        const nodeSpacing = 150; // World coordinate spacing between nodes
        const node1 = graph.addNode(worldCenterX - nodeSpacing / 2, worldCenterY, 'Node 1');
        const node2 = graph.addNode(worldCenterX + nodeSpacing / 2, worldCenterY, 'Node 2');

        // Save both nodes to database
        await saveNodeToDb(node1);
        await saveNodeToDb(node2);

        // Create an edge connecting the two nodes
        const edge = graph.addEdge(node1, node2, 1.0);

        // Save the edge to database
        await saveEdgeToDb(edge);

        // Save view state (scale and offset) to database
        await saveViewStateToDb();

        // Reload from database to ensure originalState is properly populated
        await loadGraphFromDb();

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
        showToast(`Failed to create template: ${error.message}`, 'error', 5000);
    }
}

