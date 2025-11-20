import { setAppMode } from '../state/appState.js';
import { getGraph } from '../state/appState.js';

export function setMode(mode) {
    setAppMode(mode);

    // Update button states
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    const modeBtn = document.getElementById(mode + '-mode');
    if (modeBtn) {
        modeBtn.classList.add('active');
    }

    // Update cursor
    const canvas = document.getElementById('graph-canvas');
    if (canvas) {
        canvas.style.cursor = mode === 'select' ? 'default' : 'crosshair';
    }

    // Reset edge creation state
    const graph = getGraph();
    if (graph) {
        graph.tempEdgeStart = null;
    }
}

