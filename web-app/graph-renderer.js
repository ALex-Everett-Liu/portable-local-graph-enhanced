/**
 * GraphRenderer - Handles all canvas rendering operations (read-only version)
 */
import { GRAPH_CONSTANTS } from './utils/constants.js';
import { 
    calculateGridBounds, 
    getVisibleBounds
} from './utils/geometry.js';
import {
    getEdgeLineWidth,
    getScaledRadius,
    getScaledLineWidth,
    getScaledTextSize,
    truncateText,
    getTextDimensions,
    needsTextBackground,
    getFontString
} from './utils/styles.js';

export class GraphRenderer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.options = {
            showGrid: options.showGrid !== false,
            showLabels: options.showLabels !== false,
            showNodeBorders: options.showNodeBorders !== false,
            ...options
        };
    }

    /**
     * Main render method - orchestrates all rendering
     */
    render(nodes, edges, viewState, selectionState = {}) {
        if (!viewState) {
            viewState = { scale: 1, offset: { x: 0, y: 0 } };
        }
        const { scale, offset } = viewState;
        const { selectedNode, highlightedNodes = [] } = selectionState;
        
        this.clearCanvas();
        
        this.ctx.save();
        this.ctx.translate(offset.x, offset.y);
        this.ctx.scale(scale, scale);
        
        if (this.options.showGrid) {
            this.renderGrid(viewState);
        }
        
        this.renderEdges(edges, nodes, viewState, null);
        this.renderNodes(nodes, viewState, selectionState);
        
        this.ctx.restore();
    }
    
    /**
     * Clear the entire canvas
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Render the grid background
     */
    renderGrid(viewState) {
        const { scale, offset } = viewState;
        const bounds = getVisibleBounds(offset.x, offset.y, scale, this.canvas.width, this.canvas.height);
        const gridBounds = calculateGridBounds(bounds.left, bounds.top, bounds.right, bounds.bottom, GRAPH_CONSTANTS.GRID_SIZE);
        
        this.ctx.strokeStyle = GRAPH_CONSTANTS.GRID_COLOR;
        this.ctx.lineWidth = getScaledLineWidth(GRAPH_CONSTANTS.GRID_LINE_WIDTH, scale);
        
        // Draw vertical lines
        for (let x = gridBounds.startX; x <= gridBounds.endX; x += GRAPH_CONSTANTS.GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, gridBounds.startY);
            this.ctx.lineTo(x, gridBounds.endY);
            this.ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = gridBounds.startY; y <= gridBounds.endY; y += GRAPH_CONSTANTS.GRID_SIZE) {
            this.ctx.beginPath();
            this.ctx.moveTo(gridBounds.startX, y);
            this.ctx.lineTo(gridBounds.endX, y);
            this.ctx.stroke();
        }
    }

    /**
     * Render all edges
     */
    renderEdges(edges, nodes, viewState, selectedEdge) {
        const { scale } = viewState;
        
        edges.forEach(edge => {
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            
            if (!from || !to) return;
            
            const isSelected = selectedEdge && selectedEdge.id === edge.id;
            this.renderEdge(from, to, edge, scale, isSelected);
        });
    }

    /**
     * Render a single edge
     */
    renderEdge(from, to, edge, scale, isSelected) {
        this.ctx.strokeStyle = isSelected ? '#F4A460' : '#EFF0E9';
        this.ctx.lineWidth = getScaledLineWidth(
            isSelected ? 3 : getEdgeLineWidth(edge.weight), 
            scale
        );
        
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
        
        // Draw weight label
        this.renderEdgeLabel(from, to, edge, scale);
    }

    /**
     * Render edge weight label
     */
    renderEdgeLabel(from, to, edge, scale) {
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        
        this.ctx.fillStyle = '#000000';
        this.ctx.font = getFontString(12, scale);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(edge.weight.toString(), midX, midY - 10 / scale);
    }

    /**
     * Render all nodes
     */
    renderNodes(nodes, viewState, selectionState) {
        const { scale } = viewState;
        const { selectedNode, highlightedNodes = [] } = selectionState;
        
        nodes.forEach(node => {
            const isSelected = selectedNode && selectedNode.id === node.id;
            const isHighlighted = highlightedNodes.includes(node.id);
            this.renderNode(node, scale, isSelected, isHighlighted);
        });
    }

    /**
     * Render a single node
     */
    renderNode(node, scale, isSelected, isHighlighted) {
        const radius = getScaledRadius(node.radius || GRAPH_CONSTANTS.DEFAULT_NODE_RADIUS, scale);
        
        if (isHighlighted) {
            this.renderHighlightedNode(node, radius, scale);
        } else {
            this.renderStandardNode(node, radius, scale, isSelected);
        }
        
        if (this.options.showLabels) {
            this.renderNodeLabel(node, radius, scale);
        }
    }

    /**
     * Render a highlighted node with animation effects
     */
    renderHighlightedNode(node, radius, scale) {
        const time = Date.now() * 0.005;
        const pulsingRadius = radius * (1 + GRAPH_CONSTANTS.PULSE_AMPLITUDE * Math.sin(time * GRAPH_CONSTANTS.PULSE_FREQUENCY));
        
        // Create multi-layer halo effect
        const haloRadius = pulsingRadius * 1.5;
        const gradient = this.ctx.createRadialGradient(
            node.x, node.y, pulsingRadius,
            node.x, node.y, haloRadius
        );
        gradient.addColorStop(0, "rgba(255, 215, 0, 0.8)");
        gradient.addColorStop(0.4, "rgba(255, 215, 0, 0.4)");
        gradient.addColorStop(0.7, "rgba(255, 215, 0, 0.2)");
        gradient.addColorStop(1, "rgba(255, 215, 0, 0)");
        
        // Draw outer glow/halo
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, haloRadius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw bright ring around the halo
        this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        this.ctx.lineWidth = getScaledLineWidth(2, scale);
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, haloRadius * 0.8, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        // Main node with bright border
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, pulsingRadius, 0, 2 * Math.PI);
        this.ctx.fillStyle = node.color || GRAPH_CONSTANTS.DEFAULT_NODE_COLOR;
        this.ctx.fill();
        
        // Bright gold border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = getScaledLineWidth(4, scale);
        this.ctx.stroke();
        
        // Inner white highlight ring
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = getScaledLineWidth(1.5, scale);
        this.ctx.stroke();
    }

    /**
     * Render a standard node
     */
    renderStandardNode(node, radius, scale, isSelected) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = isSelected ? GRAPH_CONSTANTS.SELECTED_NODE_COLOR : (node.color || GRAPH_CONSTANTS.DEFAULT_NODE_COLOR);
        this.ctx.fill();
        
        if (this.options.showNodeBorders) {
            this.ctx.strokeStyle = isSelected ? GRAPH_CONSTANTS.SELECTED_NODE_BORDER : GRAPH_CONSTANTS.DEFAULT_NODE_BORDER;
            this.ctx.lineWidth = getScaledLineWidth(isSelected ? 3 : 2, scale);
            this.ctx.stroke();
        }
    }

    /**
     * Render node label
     */
    renderNodeLabel(node, radius, scale) {
        const displayLabel = truncateText(node.label);
        const fontSize = getScaledTextSize(GRAPH_CONSTANTS.DEFAULT_FONT_SIZE, scale);
        
        this.ctx.font = getFontString(GRAPH_CONSTANTS.DEFAULT_FONT_SIZE, scale);
        const textDimensions = getTextDimensions(this.ctx, displayLabel, fontSize);
        
        // Add background if text is larger than node
        if (needsTextBackground(textDimensions.width, radius)) {
            this.ctx.fillStyle = GRAPH_CONSTANTS.TEXT_BACKGROUND_COLOR;
            const padding = 4 / scale;
            this.ctx.fillRect(
                node.x - textDimensions.width / 2 - padding,
                node.y - textDimensions.height / 2 - padding / 2,
                textDimensions.width + padding * 2,
                textDimensions.height + padding
            );
        }
        
        // Draw text
        this.ctx.fillStyle = GRAPH_CONSTANTS.TEXT_COLOR;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(displayLabel, node.x, node.y);
    }

    /**
     * Resize the canvas
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }
}

