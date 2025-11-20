import { getGraph, getContextMenu, setContextMenu } from '../state/appState.js';

export function setupContextMenu() {
    const menu = document.getElementById('context-menu');
    setContextMenu(menu);
    
    if (!menu) {
        // Context menu doesn't exist in new HTML - that's okay, we'll use right-click to show dialogs directly
        return;
    }

    document.querySelectorAll('.context-menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            handleContextMenuAction(action);
            hideContextMenu();
        });
    });
}

export function showContextMenu(x, y) {
    const contextMenu = getContextMenu();
    if (contextMenu) {
        contextMenu.style.display = 'block';
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
    }
}

export function hideContextMenu() {
    const contextMenu = getContextMenu();
    if (contextMenu) {
        contextMenu.style.display = 'none';
    }
}

// Make showContextMenu available globally
window.showContextMenu = showContextMenu;

function handleContextMenuAction(action) {
    const graph = getGraph();
    if (!graph) return;
    
    if (action === 'edit') {
        if (graph.selectedNode) {
            openNodeDialog();
        } else if (graph.selectedEdge) {
            openEdgeDialog();
        }
    } else if (action === 'delete') {
        if (graph.selectedNode) {
            graph.deleteNode(graph.selectedNode);
        } else if (graph.selectedEdge) {
            graph.deleteEdge(graph.selectedEdge);
        }
    }
}

function openNodeDialog() {
    const graph = getGraph();
    if (!graph || !graph.selectedNode) return;
    // Use the ui-functions.js showNodeDialog
    if (window.showNodeDialog) {
        window.showNodeDialog(graph.selectedNode);
    }
}

function openEdgeDialog() {
    const graph = getGraph();
    if (!graph || !graph.selectedEdge) return;
    // Use the ui-functions.js showEdgeDialog
    if (window.showEdgeDialog) {
        window.showEdgeDialog(graph.selectedEdge);
    }
}

