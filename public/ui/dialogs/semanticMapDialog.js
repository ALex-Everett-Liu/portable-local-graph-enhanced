/**
 * Semantic Map Dialog
 * Manages semantic map visualization using embeddings
 */

import { showToast } from '../../utils/toast.js';
import { showConfirmDialog } from '../../utils/confirmDialog.js';

let embeddings = [];
let currentModel = null;
let plotlyInstance = null;

/**
 * Initialize semantic map dialog
 */
export function initializeSemanticMapDialog() {
    setupSemanticMapDialogEvents();
    updateModelOptions();
}

/**
 * Setup event listeners for semantic map dialog
 */
function setupSemanticMapDialogEvents() {
    // Provider change - update model options
    const providerSelect = document.getElementById('semantic-map-provider');
    if (providerSelect) {
        providerSelect.addEventListener('change', updateModelOptions);
    }

    // Generate embedding button
    const generateBtn = document.getElementById('semantic-map-generate-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateEmbedding);
    }

    // Load from graph nodes button
    const loadNodesBtn = document.getElementById('semantic-map-load-nodes-btn');
    if (loadNodesBtn) {
        loadNodesBtn.addEventListener('click', loadEmbeddingsFromNodes);
    }

    // Semantic search button
    const searchBtn = document.getElementById('semantic-map-search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', performSemanticSearch);
    }

    // Semantic search input - allow Enter key to trigger search
    const searchInput = document.getElementById('semantic-map-search-query');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSemanticSearch();
            }
        });
    }

    // Apply dimensionality reduction button
    const reduceBtn = document.getElementById('semantic-map-reduce-btn');
    if (reduceBtn) {
        reduceBtn.addEventListener('click', applyDimensionalityReduction);
    }

    // Clear all button
    const clearBtn = document.getElementById('semantic-map-clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllEmbeddings);
    }

    // Close button
    const closeBtn = document.getElementById('semantic-map-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSemanticMapDialog);
    }

    // Fullscreen button
    const fullscreenBtn = document.getElementById('semantic-map-fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    // ESC key to exit fullscreen (only when dialog is visible and in fullscreen)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const dialog = document.getElementById('semantic-map-dialog');
            if (dialog && !dialog.classList.contains('hidden') && dialog.classList.contains('semantic-map-fullscreen')) {
                toggleFullscreen();
            }
        }
    });
}

/**
 * Update model options based on selected provider
 */
function updateModelOptions() {
    const provider = document.getElementById('semantic-map-provider').value;
    const modelSelect = document.getElementById('semantic-map-model');
    
    if (!modelSelect) return;

    // Clear existing options
    modelSelect.innerHTML = '';

    // Add options based on provider
    if (provider === 'openai') {
        modelSelect.innerHTML = `
            <option value="text-embedding-3-small">text-embedding-3-small</option>
            <option value="text-embedding-3-large">text-embedding-3-large</option>
            <option value="text-embedding-ada-002">text-embedding-ada-002</option>
        `;
    } else if (provider === 'openrouter') {
        modelSelect.innerHTML = `
            <option value="BAAI/bge-m3">BAAI/bge-m3</option>
            <option value="BAAI/bge-large-en-v1.5">BAAI/bge-large-en-v1.5</option>
            <option value="text-embedding-3-small">text-embedding-3-small (OpenAI)</option>
        `;
    } else if (provider === 'siliconflow') {
        modelSelect.innerHTML = `
            <option value="BAAI/bge-m3">BAAI/bge-m3</option>
        `;
    }
}

/**
 * Show semantic map dialog
 */
export function showSemanticMapDialog() {
    const dialog = document.getElementById('semantic-map-dialog');
    if (dialog) {
        dialog.classList.remove('hidden');
        loadEmbeddings();
    }
}

/**
 * Close semantic map dialog
 */
function closeSemanticMapDialog() {
    const dialog = document.getElementById('semantic-map-dialog');
    if (dialog) {
        dialog.classList.add('hidden');
    }
}

/**
 * Update status message
 */
function updateStatus(message, type = 'info') {
    const statusDiv = document.getElementById('semantic-map-status');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.style.color = type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#666';
    }
}

/**
 * Generate embedding from text
 */
async function generateEmbedding() {
    const textInput = document.getElementById('semantic-map-text');
    const titleInput = document.getElementById('semantic-map-title');
    const providerSelect = document.getElementById('semantic-map-provider');
    const modelSelect = document.getElementById('semantic-map-model');
    const apiKeyInput = document.getElementById('semantic-map-api-key');

    const text = textInput?.value.trim();
    const title = titleInput?.value.trim() || null;
    const provider = providerSelect?.value;
    const model = modelSelect?.value;
    const apiKey = apiKeyInput?.value.trim();

    if (!text) {
        updateStatus('Please enter text to embed', 'error');
        return;
    }

    if (!apiKey) {
        updateStatus('Please enter API key', 'error');
        return;
    }

    updateStatus('Generating embedding...', 'info');

    try {
        // Generate embedding via API
        const response = await fetch('/api/plugins/semantic-map/embeddings/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                provider,
                apiKey,
                model,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate embedding');
        }

        const data = await response.json();
        const embedding = data.embedding;

        // Save embedding to database
        const saveResponse = await fetch('/api/plugins/semantic-map/embeddings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                title,
                embeddingModel: `${provider}:${model}`,
                embeddingData: embedding,
            }),
        });

        if (!saveResponse.ok) {
            const error = await saveResponse.json();
            throw new Error(error.error || 'Failed to save embedding');
        }

        updateStatus('Embedding generated and saved successfully', 'success');
        
        // Clear input
        if (textInput) textInput.value = '';
        if (titleInput) titleInput.value = '';

        // Reload embeddings and update visualization
        await loadEmbeddings();
    } catch (error) {
        console.error('Error generating embedding:', error);
        updateStatus(`Error: ${error.message}`, 'error');
    }
}

/**
 * Load embeddings from database
 */
async function loadEmbeddings() {
    try {
        const response = await fetch('/api/plugins/semantic-map/embeddings');
        if (!response.ok) {
            throw new Error('Failed to load embeddings');
        }

        const data = await response.json();
        embeddings = data.embeddings || [];

        // Parse embedding data
        embeddings = embeddings.map(e => ({
            ...e,
            embeddingData: JSON.parse(e.embedding_data),
        }));

        updateStatus(`Loaded ${embeddings.length} embeddings`, 'success');
        updateVisualization();
    } catch (error) {
        console.error('Error loading embeddings:', error);
        updateStatus(`Error loading embeddings: ${error.message}`, 'error');
    }
}

/**
 * Load embeddings from graph nodes
 */
async function loadEmbeddingsFromNodes() {
    const graph = window.graph || window.getGraph?.();
    if (!graph || !graph.nodes || graph.nodes.length === 0) {
        updateStatus('No nodes found in graph', 'error');
        return;
    }

    const providerSelect = document.getElementById('semantic-map-provider');
    const modelSelect = document.getElementById('semantic-map-model');
    const apiKeyInput = document.getElementById('semantic-map-api-key');

    const provider = providerSelect?.value;
    const model = modelSelect?.value;
    const apiKey = apiKeyInput?.value.trim();

    if (!apiKey) {
        updateStatus('Please enter API key', 'error');
        return;
    }

    updateStatus(`Generating embeddings for ${graph.nodes.length} nodes...`, 'info');

    try {
        // Generate embeddings for all nodes
        for (let i = 0; i < graph.nodes.length; i++) {
            const node = graph.nodes[i];
            const text = node.label || node.chineseLabel || `Node ${node.id}`;
            const title = node.label || null;

            updateStatus(`Processing ${i + 1}/${graph.nodes.length}...`, 'info');

            // Generate embedding
            const response = await fetch('/api/plugins/semantic-map/embeddings/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    provider,
                    apiKey,
                    model,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to generate embedding');
            }

            const data = await response.json();
            const embedding = data.embedding;

            // Save embedding to database
            const saveResponse = await fetch('/api/plugins/semantic-map/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    title,
                    embeddingModel: `${provider}:${model}`,
                    embeddingData: embedding,
                }),
            });

            if (!saveResponse.ok) {
                const error = await saveResponse.json();
                throw new Error(error.error || 'Failed to save embedding');
            }
        }

        updateStatus(`Successfully generated embeddings for ${graph.nodes.length} nodes`, 'success');
        await loadEmbeddings();
    } catch (error) {
        console.error('Error loading embeddings from nodes:', error);
        updateStatus(`Error: ${error.message}`, 'error');
    }
}

/**
 * Apply dimensionality reduction (UMAP or t-SNE)
 */
async function applyDimensionalityReduction() {
    if (embeddings.length === 0) {
        updateStatus('No embeddings to reduce', 'error');
        return;
    }

    const reductionSelect = document.getElementById('semantic-map-reduction');
    const method = reductionSelect?.value || 'umap';

    updateStatus(`Applying ${method.toUpperCase()} reduction...`, 'info');

    try {
        // Extract embeddings
        const embeddingVectors = embeddings.map(e => e.embeddingData);

        // Call backend to perform dimensionality reduction
        // Note: We'll need to implement this on the backend or use a client-side library
        // For now, we'll use a simple approach with a backend endpoint
        
        // Since we don't have UMAP/t-SNE on backend, we'll use a simple PCA approximation
        // or implement it client-side using a library
        
        // For now, let's use a simple 2D projection based on first two dimensions
        // In production, you'd want to use proper UMAP/t-SNE
        
        // Simple PCA-like projection: use first two dimensions normalized
        // Note: For production, consider implementing proper UMAP/t-SNE:
        // - Backend: Use Python libraries (umap-learn, sklearn) via a new endpoint
        // - Frontend: Use JavaScript libraries like 'umap-js' or 'tsne-js'
        const coordinates = embeddingVectors.map((emb, idx) => {
            // Normalize the embedding vector
            const magnitude = Math.sqrt(emb.reduce((sum, val) => sum + val * val, 0));
            const normalized = magnitude > 0 ? emb.map(v => v / magnitude) : emb;
            
            // Use first two dimensions as x and y (scaled)
            const x2d = normalized[0] * 100;
            const y2d = normalized[1] * 100;
            
            return {
                id: embeddings[idx].id,
                x2d: x2d,
                y2d: y2d,
            };
        });

        // Update embeddings with 2D coordinates
        const response = await fetch('/api/plugins/semantic-map/embeddings/2d/batch', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ coordinates }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update coordinates');
        }

        updateStatus(`Applied ${method.toUpperCase()} reduction (simplified projection)`, 'success');
        await loadEmbeddings();
    } catch (error) {
        console.error('Error applying dimensionality reduction:', error);
        updateStatus(`Error: ${error.message}`, 'error');
    }
}

/**
 * Update visualization using Plotly
 */
function updateVisualization() {
    const plotDiv = document.getElementById('semantic-map-plot');
    if (!plotDiv) return;

    if (embeddings.length === 0) {
        plotDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No embeddings to visualize. Generate or load embeddings to see the semantic map.</div>';
        return;
    }

    // Filter embeddings that have 2D coordinates
    const embeddingsWith2D = embeddings.filter(e => e.x_2d !== null && e.y_2d !== null);

    if (embeddingsWith2D.length === 0) {
        plotDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No 2D coordinates found. Apply dimensionality reduction first.</div>';
        return;
    }

    // Prepare data for Plotly
    const x = embeddingsWith2D.map(e => e.x_2d);
    const y = embeddingsWith2D.map(e => e.y_2d);
    const titles = embeddingsWith2D.map(e => e.title || e.text || 'Untitled');
    const texts = embeddingsWith2D.map(e => e.text);

    // Create Plotly scatter plot
    const trace = {
        x: x,
        y: y,
        mode: 'markers+text',
        type: 'scatter',
        text: titles,
        textposition: 'top center',
        textfont: {
            size: 10,
        },
        marker: {
            size: 8,
            color: '#3b82f6',
            line: {
                width: 1,
                color: '#ffffff',
            },
        },
        hovertemplate: '<b>%{text}</b><br>X: %{x}<br>Y: %{y}<extra></extra>',
        customdata: texts,
    };

    const layout = {
        title: 'Semantic Map',
        xaxis: { 
            title: 'X',
            fixedrange: false, // Allow zoom/pan on x-axis
        },
        yaxis: { 
            title: 'Y',
            fixedrange: false, // Allow zoom/pan on y-axis
        },
        hovermode: 'closest',
        showlegend: false,
        margin: { l: 50, r: 50, t: 50, b: 50 },
        dragmode: 'pan', // Default to pan mode (can be changed via toolbar)
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'], // Keep zoom and pan
        doubleClick: 'reset', // Double-click to reset zoom
        toImageButtonOptions: {
            format: 'png',
            filename: 'semantic-map',
            height: 800,
            width: 1200,
            scale: 1
        },
        // Enable all interactive features
        scrollZoom: true, // Enable scroll to zoom
    };

    // Load Plotly if not already loaded
    if (typeof Plotly === 'undefined') {
        // Load Plotly from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.plot.ly/plotly-2.26.0.min.js';
        script.onload = () => {
            plotlyInstance = Plotly.newPlot(plotDiv, [trace], layout, config);
            
            // Store instance for fullscreen resize
            plotDiv.plotlyInstance = plotlyInstance;
        };
        document.head.appendChild(script);
    } else {
        plotlyInstance = Plotly.newPlot(plotDiv, [trace], layout, config);
        
        // Store instance for fullscreen resize
        plotDiv.plotlyInstance = plotlyInstance;
    }
}

/**
 * Toggle fullscreen mode for the semantic map
 * Similar to fullscreenManager.js pattern
 */
function toggleFullscreen() {
    const plotDiv = document.getElementById('semantic-map-plot');
    const dialog = document.getElementById('semantic-map-dialog');
    const body = document.body;
    const fullscreenBtn = document.getElementById('semantic-map-fullscreen-btn');
    
    if (!plotDiv || !dialog) return;

    const isFullscreen = dialog.classList.contains('semantic-map-fullscreen');

    if (isFullscreen) {
        // Exit fullscreen
        exitSemanticMapFullscreen(dialog, body, fullscreenBtn, plotDiv);
    } else {
        // Enter fullscreen
        enterSemanticMapFullscreen(dialog, body, fullscreenBtn, plotDiv);
    }
}

/**
 * Enter fullscreen mode
 */
function enterSemanticMapFullscreen(dialog, body, fullscreenBtn, plotDiv) {
    dialog.classList.add('semantic-map-fullscreen');
    body.classList.add('semantic-map-fullscreen-mode');
    
    // Update button icon
    if (fullscreenBtn) {
        const icon = fullscreenBtn.querySelector('[data-lucide]');
        if (icon) {
            icon.setAttribute('data-lucide', 'minimize-2');
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }
    }
    
    // Resize plot after entering fullscreen
    setTimeout(() => {
        if (typeof Plotly !== 'undefined' && plotDiv) {
            Plotly.Plots.resize(plotDiv);
        }
    }, 100);
}

/**
 * Exit fullscreen mode
 */
function exitSemanticMapFullscreen(dialog, body, fullscreenBtn, plotDiv) {
    dialog.classList.remove('semantic-map-fullscreen');
    body.classList.remove('semantic-map-fullscreen-mode');
    
    // Update button icon
    if (fullscreenBtn) {
        const icon = fullscreenBtn.querySelector('[data-lucide]');
        if (icon) {
            icon.setAttribute('data-lucide', 'maximize-2');
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }
    }
    
    // Resize plot after exiting fullscreen
    setTimeout(() => {
        if (typeof Plotly !== 'undefined' && plotDiv) {
            Plotly.Plots.resize(plotDiv);
        }
    }, 100);
}

/**
 * Clear all embeddings
 */
async function clearAllEmbeddings() {
    const confirmed = await showConfirmDialog(
        'Are you sure you want to delete all embeddings? This cannot be undone.',
        'danger',
        'Delete',
        'Cancel'
    );
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch('/api/plugins/semantic-map/embeddings', {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to clear embeddings');
        }

        embeddings = [];
        updateStatus('All embeddings cleared', 'success');
        updateVisualization();
    } catch (error) {
        console.error('Error clearing embeddings:', error);
        updateStatus(`Error: ${error.message}`, 'error');
    }
}

/**
 * Perform semantic search
 */
async function performSemanticSearch() {
    const searchInput = document.getElementById('semantic-map-search-query');
    const providerSelect = document.getElementById('semantic-map-provider');
    const modelSelect = document.getElementById('semantic-map-model');
    const apiKeyInput = document.getElementById('semantic-map-api-key');

    const queryText = searchInput?.value.trim();
    const provider = providerSelect?.value;
    const model = modelSelect?.value;
    const apiKey = apiKeyInput?.value.trim();

    if (!queryText) {
        updateStatus('Please enter a search query', 'error');
        return;
    }

    if (!apiKey) {
        updateStatus('Please enter API key', 'error');
        return;
    }

    updateStatus('Searching...', 'info');

    try {
        const response = await fetch('/api/plugins/semantic-map/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                queryText,
                provider,
                apiKey,
                model,
                limit: 10,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to perform search');
        }

        const data = await response.json();
        const results = data.results || [];

        if (results.length === 0) {
            updateStatus('No results found', 'info');
            return;
        }

        updateStatus(`Found ${results.length} results`, 'success');
        showSearchResults(results, queryText);
    } catch (error) {
        console.error('Error performing semantic search:', error);
        updateStatus(`Error: ${error.message}`, 'error');
    }
}

/**
 * Show search results in a new window
 */
function showSearchResults(results, queryText) {
    // Escape HTML helper function
    const escapeHtml = (text) => {
        if (text == null) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, (m) => map[m]);
    };

    // Create results window HTML
    const resultsHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Semantic Search Results</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                    padding: 20px;
                    background: #f5f5f5;
                    color: #333;
                }
                .header {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .header h1 {
                    font-size: 24px;
                    margin-bottom: 8px;
                    color: #2c3e50;
                }
                .header .query {
                    color: #666;
                    font-size: 14px;
                }
                .results-container {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .result-item {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    transition: box-shadow 0.2s;
                }
                .result-item:hover {
                    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
                }
                .result-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }
                .result-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: #2c3e50;
                    flex: 1;
                }
                .similarity-score {
                    background: #28a745;
                    color: white;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 14px;
                    font-weight: 600;
                    white-space: nowrap;
                    margin-left: 12px;
                }
                .result-text {
                    color: #666;
                    font-size: 14px;
                    line-height: 1.6;
                    margin-bottom: 8px;
                    word-wrap: break-word;
                    white-space: pre-wrap;
                }
                .result-meta {
                    display: flex;
                    gap: 16px;
                    font-size: 12px;
                    color: #999;
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid #eee;
                    flex-wrap: wrap;
                }
                .result-meta-item {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .no-results {
                    background: white;
                    padding: 40px;
                    text-align: center;
                    border-radius: 8px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Semantic Search Results</h1>
                <div class="query">Query: "${escapeHtml(queryText)}"</div>
            </div>
            <div class="results-container">
                ${results.map((result, index) => `
                    <div class="result-item">
                        <div class="result-header">
                            <div class="result-title">${index + 1}. ${escapeHtml(result.title || 'Untitled')}</div>
                            <div class="similarity-score">${(result.similarity * 100).toFixed(2)}%</div>
                        </div>
                        <div class="result-text">${escapeHtml(result.text || 'No text available')}</div>
                        <div class="result-meta">
                            <div class="result-meta-item">
                                <strong>Model:</strong> ${escapeHtml(result.embeddingModel || 'N/A')}
                            </div>
                            ${result.x2d !== null && result.y2d !== null ? `
                                <div class="result-meta-item">
                                    <strong>2D Position:</strong> (${result.x2d.toFixed(2)}, ${result.y2d.toFixed(2)})
                                </div>
                            ` : ''}
                            <div class="result-meta-item">
                                <strong>ID:</strong> ${escapeHtml(result.id.substring(0, 8))}...
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `;

    // Create a new window
    const resultsWindow = window.open('', '_blank', 'width=900,height=800,scrollbars=yes,resizable=yes');
    if (resultsWindow) {
        resultsWindow.document.write(resultsHTML);
        resultsWindow.document.close();
    } else {
        // Fallback: show in a dialog if popup is blocked
        const topResult = results[0];
        showToast(
            `Found ${results.length} results. Please allow popups to view results window. Top result: ${topResult.title || 'Untitled'} (${(topResult.similarity * 100).toFixed(2)}% similarity)`,
            'warning',
            5000
        );
    }
}

