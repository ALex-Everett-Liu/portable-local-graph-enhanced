/**
 * Clustering Dialog
 * Manages graph clustering and community detection
 */

import { getGraph } from '../../state/appState.js';
import { updateGraphInfo } from '../search/searchBar.js';

let clusteringResult = null;

/**
 * Initialize clustering dialog
 */
export function initializeClusteringDialog() {
    setupClusteringDialogEvents();
}

/**
 * Setup event listeners for clustering dialog
 */
function setupClusteringDialogEvents() {
    // Algorithm selection
    const algorithmSelect = document.getElementById('clustering-algorithm');
    if (algorithmSelect) {
        algorithmSelect.addEventListener('change', handleAlgorithmChange);
    }

    // Run clustering button
    const runBtn = document.getElementById('clustering-run-btn');
    if (runBtn) {
        runBtn.addEventListener('click', runClustering);
    }

    // Apply colors button
    const applyColorsBtn = document.getElementById('clustering-apply-colors-btn');
    if (applyColorsBtn) {
        applyColorsBtn.addEventListener('click', applyClusteringColors);
    }

    // Restore colors button
    const restoreColorsBtn = document.getElementById('clustering-restore-colors-btn');
    if (restoreColorsBtn) {
        restoreColorsBtn.addEventListener('click', restoreOriginalColors);
    }

    // Close button
    const closeBtn = document.getElementById('clustering-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeClusteringDialog);
    }
}

/**
 * Handle algorithm selection change
 */
function handleAlgorithmChange() {
    const algorithm = document.getElementById('clustering-algorithm').value;
    
    // Hide all parameter sections
    document.querySelectorAll('.algorithm-params').forEach(el => {
        el.classList.add('hidden');
    });

    // Show relevant parameters
    if (algorithm === 'louvain') {
        document.getElementById('louvain-params').classList.remove('hidden');
    } else if (algorithm === 'labelprop') {
        document.getElementById('labelprop-params').classList.remove('hidden');
    }
}

/**
 * Run clustering algorithm
 */
function runClustering() {
    const graph = getGraph();
    if (!graph || graph.nodes.length === 0) {
        if (window.showNotification) {
            window.showNotification('No nodes to cluster', 'error');
        }
        return;
    }

    const algorithm = document.getElementById('clustering-algorithm').value;
    const runBtn = document.getElementById('clustering-run-btn');
    const resultsDiv = document.getElementById('clustering-results');
    const resultsContent = document.getElementById('clustering-results-content');
    const applyColorsBtn = document.getElementById('clustering-apply-colors-btn');
    const restoreColorsBtn = document.getElementById('clustering-restore-colors-btn');

    // Show loading state
    const originalText = runBtn.textContent;
    runBtn.disabled = true;
    runBtn.textContent = 'Running...';
    resultsDiv.classList.add('hidden');

    // Run clustering in timeout to allow UI update
    setTimeout(() => {
        try {
            let result;

            switch (algorithm) {
                case 'louvain':
                    const resolution = parseFloat(document.getElementById('louvain-resolution').value) || 1.0;
                    result = graph.detectCommunitiesLouvain(resolution);
                    break;
                case 'labelprop':
                    const maxIterations = parseInt(document.getElementById('labelprop-iterations').value) || 100;
                    result = graph.detectCommunitiesLabelPropagation(maxIterations);
                    break;
                case 'kcore':
                    result = graph.kCoreDecomposition();
                    break;
                case 'components':
                    result = graph.graphAnalysis.getConnectedComponentsClustering();
                    break;
                default:
                    throw new Error(`Unknown algorithm: ${algorithm}`);
            }

            clusteringResult = result;

            // Display results
            displayClusteringResults(result, algorithm);
            resultsDiv.classList.remove('hidden');
            applyColorsBtn.style.display = 'inline-block';
            restoreColorsBtn.style.display = 'inline-block';

            if (window.showNotification) {
                window.showNotification(`Clustering completed: ${result.communitiesCount || 'N/A'} communities found`);
            }
        } catch (error) {
            console.error('Error running clustering:', error);
            if (window.showNotification) {
                window.showNotification('Error running clustering algorithm', 'error');
            }
        } finally {
            runBtn.disabled = false;
            runBtn.textContent = originalText;
        }
    }, 10);
}

/**
 * Display clustering results
 */
function displayClusteringResults(result, algorithm) {
    const resultsContent = document.getElementById('clustering-results-content');
    
    let html = '';

    if (algorithm === 'louvain') {
        html = `
            <div><strong>Communities Found:</strong> ${result.communitiesCount}</div>
            <div><strong>Modularity Score:</strong> ${result.modularity.toFixed(4)}</div>
            <div><strong>Iterations:</strong> ${result.iterations}</div>
            <p style="margin-top: 8px; font-size: 11px; color: #666;">
                Modularity ranges from -1 to 1. Higher values indicate better community structure.
            </p>
        `;
    } else if (algorithm === 'labelprop') {
        html = `
            <div><strong>Communities Found:</strong> ${result.communitiesCount}</div>
            <div><strong>Iterations:</strong> ${result.iterations}</div>
        `;
    } else if (algorithm === 'kcore') {
        html = `
            <div><strong>Max Core Number:</strong> ${result.maxCore}</div>
            <p style="margin-top: 8px; font-size: 11px; color: #666;">
                K-core decomposition identifies core/periphery structure. Higher core numbers indicate more central nodes.
            </p>
        `;
    } else if (algorithm === 'components') {
        html = `
            <div><strong>Connected Components:</strong> ${result.communitiesCount}</div>
            <div style="margin-top: 8px; max-height: 150px; overflow-y: auto;">
                ${result.components.map(comp => 
                    `<div style="font-size: 11px; margin-bottom: 4px;">
                        ${comp.id}: ${comp.size} nodes
                    </div>`
                ).join('')}
            </div>
        `;
    }

    resultsContent.innerHTML = html;
}

/**
 * Apply clustering colors to nodes
 */
function applyClusteringColors() {
    const graph = getGraph();
    if (!graph || !clusteringResult) {
        if (window.showNotification) {
            window.showNotification('No clustering results to apply', 'error');
        }
        return;
    }

    // Handle different result formats
    let communities = clusteringResult.communities;
    if (!communities && clusteringResult.cores) {
        // K-core result - use cores as communities
        communities = clusteringResult.cores;
    }

    if (!communities || Object.keys(communities).length === 0) {
        if (window.showNotification) {
            window.showNotification('No communities found in clustering result', 'error');
        }
        return;
    }

    graph.applyClusteringColors(communities, true);
    updateGraphInfo();

    if (window.showNotification) {
        window.showNotification('Clustering colors applied to nodes');
    }
}

/**
 * Restore original node colors
 */
function restoreOriginalColors() {
    const graph = getGraph();
    if (!graph) return;

    graph.restoreOriginalColors();
    updateGraphInfo();

    if (window.showNotification) {
        window.showNotification('Original node colors restored');
    }
}

/**
 * Show clustering dialog
 */
export function showClusteringDialog() {
    const dialog = document.getElementById('clustering-dialog');
    if (!dialog) return;

    // Reset form
    document.getElementById('clustering-algorithm').value = 'louvain';
    handleAlgorithmChange();
    document.getElementById('clustering-results').classList.add('hidden');
    document.getElementById('clustering-apply-colors-btn').style.display = 'none';
    document.getElementById('clustering-restore-colors-btn').style.display = 'none';
    clusteringResult = null;

    dialog.classList.remove('hidden');
}

/**
 * Close clustering dialog
 */
function closeClusteringDialog() {
    const dialog = document.getElementById('clustering-dialog');
    if (dialog) {
        dialog.classList.add('hidden');
    }
}

// Close dialog when clicking outside
document.addEventListener('click', (e) => {
    const dialog = document.getElementById('clustering-dialog');
    if (dialog && !dialog.classList.contains('hidden')) {
        const dialogContent = dialog.querySelector('.dialog-content');
        if (dialogContent && !dialogContent.contains(e.target) && !e.target.closest('#clustering-btn')) {
            closeClusteringDialog();
        }
    }
});

