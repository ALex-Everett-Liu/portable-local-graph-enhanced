import { GraphRenderer } from './graph-renderer.js';

class Graph {
    constructor(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.selectedNode = null;
        this.selectedEdge = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.isPanning = false;
        this.lastPanPoint = { x: 0, y: 0 };
        
        // Callbacks for database persistence
        this.callbacks = callbacks;

        // Initialize GraphRenderer
        this.renderer = new GraphRenderer(canvas);

        this.setupCanvas();
        this.bindEvents();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        } else {
            this.canvas.width = this.canvas.offsetWidth || 800;
            this.canvas.height = this.canvas.offsetHeight || 600;
        }
        this.render();
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        
        // Add tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'graph-tooltip';
        this.tooltip.style.cssText = 'position: absolute; display: none; background: rgba(0,0,0,0.8); color: white; padding: 8px 12px; border-radius: 4px; pointer-events: none; z-index: 1000; max-width: 300px; word-wrap: break-word;';
        document.body.appendChild(this.tooltip);
    }

    addNode(x, y, label = 'Node', color = '#3b82f6') {
        const node = {
            id: crypto.randomUUID(),
            x: x,
            y: y,
            label: label,
            color: color,
            radius: 20,
        };
        this.nodes.push(node);
        this.render();
        
        // Trigger callback for database persistence
        if (this.callbacks.onNodeCreate) {
            this.callbacks.onNodeCreate(node);
        }
        
        return node;
    }

    addEdge(fromNode, toNode, weight = 1) {
        const edge = {
            id: crypto.randomUUID(),
            from: fromNode.id,
            to: toNode.id,
            weight: weight
        };
        this.edges.push(edge);
        this.render();
        
        // Trigger callback for database persistence
        if (this.callbacks.onEdgeCreate) {
            this.callbacks.onEdgeCreate(edge);
        }
        
        return edge;
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - this.offset.x) / this.scale,
            y: (e.clientY - rect.top - this.offset.y) / this.scale
        };
    }

    getNodeAt(x, y) {
        return this.nodes.find(node => {
            const dx = x - node.x;
            const dy = y - node.y;
            return Math.sqrt(dx * dx + dy * dy) <= node.radius;
        });
    }

    getEdgeAt(x, y) {
        for (let edge of this.edges) {
            const fromNode = this.nodes.find(n => n.id === edge.from);
            const toNode = this.nodes.find(n => n.id === edge.to);
            if (this.isPointOnLine(x, y, fromNode.x, fromNode.y, toNode.x, toNode.y, 5)) {
                return edge;
            }
        }
        return null;
    }

    isPointOnLine(px, py, x1, y1, x2, y2, threshold) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;

        if (lenSq === 0) return Math.sqrt(A * A + B * B) <= threshold;

        let param = dot / lenSq;
        param = Math.max(0, Math.min(1, param));

        const xx = x1 + param * C;
        const yy = y1 + param * D;
        const dx = px - xx;
        const dy = py - yy;

        return Math.sqrt(dx * dx + dy * dy) <= threshold;
    }

    deleteNode(node) {
        this.nodes = this.nodes.filter(n => n.id !== node.id);
        this.edges = this.edges.filter(e => e.from !== node.id && e.to !== node.id);
        this.render();
        
        // Trigger callback for database persistence
        if (this.callbacks.onNodeDelete) {
            this.callbacks.onNodeDelete(node.id);
        }
    }

    deleteEdge(edge) {
        this.edges = this.edges.filter(e => e.id !== edge.id);
        this.render();
        
        // Trigger callback for database persistence
        if (this.callbacks.onEdgeDelete) {
            this.callbacks.onEdgeDelete(edge.id);
        }
    }

    render() {
        const viewState = {
            scale: this.scale,
            offset: this.offset
        };
        
        const selectionState = {
            selectedNode: this.selectedNode,
            selectedEdge: this.selectedEdge,
            highlightedNodes: []
        };
        
        const filterState = {
            layerFilterEnabled: false,
            activeLayers: new Set(),
            layerFilterMode: 'include'
        };
        
        // Use GraphRenderer for all rendering
        this.renderer.render(this.nodes, this.edges, viewState, selectionState, filterState);
    }

    drawNode(node) {
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = node.color;
        this.ctx.fill();
        this.ctx.strokeStyle = this.selectedNode === node ? '#000' : '#fff';
        this.ctx.lineWidth = this.selectedNode === node ? 3 : 2;
        this.ctx.stroke();

        // Draw label
        this.ctx.fillStyle = '#000';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(node.label, node.x, node.y + node.radius + 15);
    }

    drawEdge(fromNode, toNode, edge) {
        this.ctx.beginPath();
        this.ctx.moveTo(fromNode.x, fromNode.y);
        this.ctx.lineTo(toNode.x, toNode.y);

        // Line width based on weight (inverted - higher weight = thinner line)
        const lineWidth = Math.max(0.5, 8 - (edge.weight * 0.7));
        this.ctx.lineWidth = lineWidth;
        this.ctx.strokeStyle = this.selectedEdge === edge ? '#ff0000' : '#666';
        this.ctx.stroke();

        // Draw weight label
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        this.ctx.fillStyle = '#000';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(edge.weight.toFixed(1), midX, midY - 5);
    }

    handleMouseDown(e) {
        if (e.button !== 0) return; // Only handle left mouse button
        
        const pos = this.getMousePos(e);
        const node = this.getNodeAt(pos.x, pos.y);

        if (window.appMode === 'select') {
            if (node) {
                this.selectedNode = node;
                this.selectedEdge = null;
                this.isDragging = true;
                this.dragOffset.x = pos.x - node.x;
                this.dragOffset.y = pos.y - node.y;
            } else {
                const edge = this.getEdgeAt(pos.x, pos.y);
                if (edge) {
                    this.selectedEdge = edge;
                    this.selectedNode = null;
                } else {
                    // Clicked empty space - start panning
                    this.selectedNode = null;
                    this.selectedEdge = null;
                    this.isPanning = true;
                    this.lastPanPoint = { x: e.clientX, y: e.clientY };
                }
            }
        } else if (window.appMode === 'node') {
            if (!node) {
                this.addNode(pos.x, pos.y);
            }
        } else if (window.appMode === 'edge') {
            if (node) {
                if (!this.tempEdgeStart) {
                    this.tempEdgeStart = node;
                } else {
                    if (this.tempEdgeStart !== node) {
                        this.addEdge(this.tempEdgeStart, node);
                    }
                    this.tempEdgeStart = null;
                }
            }
        }

        this.render();
    }

    handleMouseMove(e) {
        const pos = this.getMousePos(e);

        if (this.isDragging && this.selectedNode) {
            // Drag node
            this.selectedNode.x = pos.x - this.dragOffset.x;
            this.selectedNode.y = pos.y - this.dragOffset.y;
            this.render();
        } else if (this.isPanning) {
            // Pan canvas
            const dx = e.clientX - this.lastPanPoint.x;
            const dy = e.clientY - this.lastPanPoint.y;
            this.offset.x += dx;
            this.offset.y += dy;
            this.lastPanPoint = { x: e.clientX, y: e.clientY };
            this.render();
        } else {
            // Show tooltip for node under cursor
            const node = this.getNodeAt(pos.x, pos.y);
            if (node && node.label) {
                this.tooltip.textContent = node.label;
                this.tooltip.style.display = 'block';
                this.tooltip.style.left = e.clientX + 10 + 'px';
                this.tooltip.style.top = e.clientY + 10 + 'px';
            } else {
                this.tooltip.style.display = 'none';
            }
        }
    }

    handleMouseUp(e) {
        if (this.isDragging && this.selectedNode) {
            // Trigger callback for database persistence when dragging ends
            if (this.callbacks.onNodeUpdate) {
                this.callbacks.onNodeUpdate(this.selectedNode);
            }
        }
        this.isDragging = false;
        this.isPanning = false;
    }

    handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.scale *= delta;
        this.scale = Math.max(0.1, Math.min(5, this.scale));
        this.render();
    }

    handleRightClick(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);

        const node = this.getNodeAt(pos.x, pos.y);
        const edge = this.getEdgeAt(pos.x, pos.y);

        if (node || edge) {
            this.selectedNode = node;
            this.selectedEdge = edge;
            this.render();
            
            // Show dialog directly instead of context menu
            if (node && window.showNodeDialog) {
                window.showNodeDialog(node);
            } else if (edge && window.showEdgeDialog) {
                window.showEdgeDialog(edge);
            } else if (window.showContextMenu) {
                // Fallback to context menu if dialogs aren't available
                window.showContextMenu(e.clientX, e.clientY);
            }
        }
    }

    clear() {
        this.nodes = [];
        this.edges = [];
        this.selectedNode = null;
        this.selectedEdge = null;
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.render();
    }

    exportData() {
        return {
            nodes: this.nodes,
            edges: this.edges,
            scale: this.scale,
            offset: this.offset
        };
    }

    importData(data, skipCallbacks = false) {
        this.nodes = data.nodes || [];
        this.edges = data.edges || [];
        this.selectedNode = null;
        this.selectedEdge = null;
        this.scale = data.scale || 1;
        this.offset = data.offset || { x: 0, y: 0 };
        this.render();
        
        // skipCallbacks is used when loading from database to avoid circular saves
        // It's not used when importing from file, which should trigger database import
    }
}

// Export Graph class for use in modules
export { Graph };

