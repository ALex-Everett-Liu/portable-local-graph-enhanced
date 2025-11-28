/**
 * ClusteringEngine - Community detection and clustering algorithms
 * Implements various clustering algorithms for graph analysis
 */
import { getConnectedComponents } from '../algorithms.js';

export class ClusteringEngine {
    constructor(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        this.nodeMap = this.buildNodeMap();
        this.edgeMap = this.buildEdgeMap();
        this.adjacency = this.buildAdjacencyMatrix();
    }

    /**
     * Build node map for quick lookup
     * @returns {Map} Node map by ID
     */
    buildNodeMap() {
        const map = new Map();
        this.nodes.forEach(node => {
            map.set(node.id, node);
        });
        return map;
    }

    /**
     * Build edge map for quick lookup
     * @returns {Map} Edge map by node ID
     */
    buildEdgeMap() {
        const map = new Map();
        this.nodes.forEach(node => {
            map.set(node.id, []);
        });

        this.edges.forEach(edge => {
            const fromId = edge.from || edge.from_node_id;
            const toId = edge.to || edge.to_node_id;
            const weight = edge.weight || 1;
            
            if (map.has(fromId) && map.has(toId)) {
                map.get(fromId).push({ to: toId, weight: weight });
                if (fromId !== toId) {
                    map.get(toId).push({ to: fromId, weight: weight });
                }
            }
        });

        return map;
    }

    /**
     * Build adjacency matrix
     * @returns {Map} Adjacency matrix
     */
    buildAdjacencyMatrix() {
        const adjacency = new Map();
        this.nodes.forEach(node => {
            adjacency.set(node.id, new Map());
        });

        this.edges.forEach(edge => {
            const fromId = edge.from || edge.from_node_id;
            const toId = edge.to || edge.to_node_id;
            const weight = edge.weight || 1;
            
            if (adjacency.has(fromId) && adjacency.has(toId)) {
                adjacency.get(fromId).set(toId, weight);
                adjacency.get(toId).set(fromId, weight);
            }
        });

        return adjacency;
    }

    /**
     * Calculate total edge weight (for modularity calculation)
     * @returns {number} Total edge weight
     */
    getTotalWeight() {
        let total = 0;
        this.edges.forEach(edge => {
            total += edge.weight || 1;
        });
        return total;
    }

    /**
     * Calculate node degree (sum of edge weights)
     * @param {string} nodeId - Node ID
     * @returns {number} Node degree
     */
    getNodeDegree(nodeId) {
        const connections = this.edgeMap.get(nodeId) || [];
        return connections.reduce((sum, conn) => sum + conn.weight, 0);
    }

    /**
     * Louvain algorithm for community detection
     * Based on modularity optimization
     * @param {number} resolution - Resolution parameter (default: 1.0)
     * @returns {Object} Communities and modularity score
     */
    louvain(resolution = 1.0) {
        if (this.nodes.length === 0) {
            return { communities: {}, modularity: 0, communitiesCount: 0 };
        }

        const totalWeight = this.getTotalWeight();
        if (totalWeight === 0) {
            // All nodes in separate communities
            const communities = {};
            this.nodes.forEach(node => {
                communities[node.id] = node.id;
            });
            return { communities, modularity: 0, communitiesCount: this.nodes.length };
        }

        // Initialize: each node in its own community
        const communities = {};
        const nodeDegrees = new Map();
        
        this.nodes.forEach(node => {
            communities[node.id] = node.id;
            nodeDegrees.set(node.id, this.getNodeDegree(node.id));
        });

        let improved = true;
        let iterations = 0;
        const maxIterations = 100;

        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;

            // Try moving each node to neighboring communities
            for (const node of this.nodes) {
                const nodeId = node.id;
                const currentCommunity = communities[nodeId];
                const nodeDegree = nodeDegrees.get(nodeId);

                // Calculate modularity gain for each neighbor's community
                let bestCommunity = currentCommunity;
                let bestGain = 0;

                const neighbors = this.edgeMap.get(nodeId) || [];
                const neighborCommunities = new Set();
                neighborCommunities.add(currentCommunity);

                neighbors.forEach(neighbor => {
                    neighborCommunities.add(communities[neighbor.to]);
                });

                neighborCommunities.forEach(community => {
                    if (community === currentCommunity) return;

                    // Calculate modularity gain
                    const gain = this.calculateModularityGain(
                        nodeId,
                        currentCommunity,
                        community,
                        communities,
                        nodeDegree,
                        totalWeight,
                        resolution
                    );

                    if (gain > bestGain) {
                        bestGain = gain;
                        bestCommunity = community;
                    }
                });

                // Move node to best community if improvement found
                if (bestCommunity !== currentCommunity && bestGain > 0) {
                    communities[nodeId] = bestCommunity;
                    improved = true;
                }
            }
        }

        // Calculate final modularity
        const modularity = this.calculateModularity(communities, totalWeight, resolution);
        
        // Count communities
        const communitySet = new Set(Object.values(communities));
        const communitiesCount = communitySet.size;

        return { communities, modularity, communitiesCount, iterations };
    }

    /**
     * Calculate modularity gain for moving a node
     * @param {string} nodeId - Node ID
     * @param {string} oldCommunity - Old community ID
     * @param {string} newCommunity - New community ID
     * @param {Object} communities - Current community assignments
     * @param {number} nodeDegree - Node degree
     * @param {number} totalWeight - Total graph weight
     * @param {number} resolution - Resolution parameter
     * @returns {number} Modularity gain
     */
    calculateModularityGain(nodeId, oldCommunity, newCommunity, communities, nodeDegree, totalWeight, resolution) {
        let ki_in_new = 0; // Weight of edges from node to new community
        let ki_in_old = 0; // Weight of edges from node to old community

        const neighbors = this.edgeMap.get(nodeId) || [];
        neighbors.forEach(neighbor => {
            const neighborCommunity = communities[neighbor.to];
            if (neighborCommunity === newCommunity) {
                ki_in_new += neighbor.weight;
            } else if (neighborCommunity === oldCommunity) {
                ki_in_old += neighbor.weight;
            }
        });

        // Calculate community degrees
        let sigma_tot_new = 0;
        let sigma_tot_old = 0;
        let ki_new = 0;
        let ki_old = 0;

        Object.entries(communities).forEach(([nId, commId]) => {
            const nDegree = this.getNodeDegree(nId);
            if (commId === newCommunity) {
                sigma_tot_new += nDegree;
                if (nId === nodeId) ki_new = nDegree;
            } else if (commId === oldCommunity) {
                sigma_tot_old += nDegree;
                if (nId === nodeId) ki_old = nDegree;
            }
        });

        // Modularity gain formula
        const gain = (ki_in_new - ki_in_old) / totalWeight 
            - resolution * nodeDegree * (sigma_tot_new - sigma_tot_old + nodeDegree) / (2 * totalWeight * totalWeight);
        
        return gain;
    }

    /**
     * Calculate modularity of current partition
     * @param {Object} communities - Community assignment
     * @param {number} totalWeight - Total graph weight
     * @param {number} resolution - Resolution parameter
     * @returns {number} Modularity score
     */
    calculateModularity(communities, totalWeight, resolution) {
        if (totalWeight === 0) return 0;

        let modularity = 0;
        const communityNodes = new Map();

        // Group nodes by community
        Object.entries(communities).forEach(([nodeId, communityId]) => {
            if (!communityNodes.has(communityId)) {
                communityNodes.set(communityId, []);
            }
            communityNodes.get(communityId).push(nodeId);
        });

        // Calculate modularity for each community
        communityNodes.forEach((nodeIds, communityId) => {
            let internalWeight = 0;
            let communityDegree = 0;

            nodeIds.forEach(nodeId => {
                const neighbors = this.edgeMap.get(nodeId) || [];
                communityDegree += neighbors.reduce((sum, n) => sum + n.weight, 0);

                neighbors.forEach(neighbor => {
                    if (communities[neighbor.to] === communityId) {
                        internalWeight += neighbor.weight;
                    }
                });
            });

            // Each edge counted twice (once per direction), so divide by 2
            internalWeight = internalWeight / 2;
            modularity += (internalWeight / totalWeight) - resolution * Math.pow(communityDegree / (2 * totalWeight), 2);
        });

        return modularity;
    }

    /**
     * Label Propagation Algorithm for community detection
     * Fast and simple algorithm, good for large graphs
     * @param {number} maxIterations - Maximum iterations (default: 100)
     * @returns {Object} Communities and statistics
     */
    labelPropagation(maxIterations = 100) {
        if (this.nodes.length === 0) {
            return { communities: {}, communitiesCount: 0, iterations: 0 };
        }

        // Initialize: each node has its own label
        const labels = new Map();
        this.nodes.forEach(node => {
            labels.set(node.id, node.id);
        });

        let changed = true;
        let iterations = 0;

        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;

            // Shuffle node order for randomness
            const shuffledNodes = [...this.nodes].sort(() => Math.random() - 0.5);

            shuffledNodes.forEach(node => {
                const nodeId = node.id;
                const neighbors = this.edgeMap.get(nodeId) || [];

                if (neighbors.length === 0) return;

                // Count labels of neighbors (weighted)
                const labelCounts = new Map();
                neighbors.forEach(neighbor => {
                    const neighborLabel = labels.get(neighbor.to);
                    const count = labelCounts.get(neighborLabel) || 0;
                    labelCounts.set(neighborLabel, count + neighbor.weight);
                });

                // Find most frequent label
                let maxCount = 0;
                let mostFrequentLabel = labels.get(nodeId);

                labelCounts.forEach((count, label) => {
                    if (count > maxCount || (count === maxCount && Math.random() > 0.5)) {
                        maxCount = count;
                        mostFrequentLabel = label;
                    }
                });

                // Update label if changed
                if (mostFrequentLabel !== labels.get(nodeId)) {
                    labels.set(nodeId, mostFrequentLabel);
                    changed = true;
                }
            });
        }

        // Convert to communities object
        const communities = {};
        labels.forEach((label, nodeId) => {
            communities[nodeId] = label;
        });

        const communitySet = new Set(Object.values(communities));
        const communitiesCount = communitySet.size;

        return { communities, communitiesCount, iterations };
    }

    /**
     * K-core decomposition
     * Identifies core/periphery structure by removing nodes with degree < k
     * @returns {Object} K-core assignments and core numbers
     */
    kCoreDecomposition() {
        if (this.nodes.length === 0) {
            return { cores: {}, maxCore: 0 };
        }

        const cores = new Map();
        const degrees = new Map();
        const remaining = new Set();

        // Initialize
        this.nodes.forEach(node => {
            const degree = this.getNodeDegree(node.id);
            degrees.set(node.id, degree);
            cores.set(node.id, 0);
            remaining.add(node.id);
        });

        let k = 0;
        const maxDegree = Math.max(...Array.from(degrees.values()));

        while (remaining.size > 0 && k <= maxDegree) {
            let changed = true;

            while (changed) {
                changed = false;
                const toRemove = [];

                remaining.forEach(nodeId => {
                    if (degrees.get(nodeId) <= k) {
                        cores.set(nodeId, k);
                        toRemove.push(nodeId);
                        changed = true;
                    }
                });

                // Remove nodes and update degrees
                toRemove.forEach(nodeId => {
                    remaining.delete(nodeId);
                    const neighbors = this.edgeMap.get(nodeId) || [];
                    neighbors.forEach(neighbor => {
                        if (remaining.has(neighbor.to)) {
                            degrees.set(neighbor.to, degrees.get(neighbor.to) - neighbor.weight);
                        }
                    });
                });
            }

            k++;
        }

        // Convert to object
        const coresObj = {};
        cores.forEach((core, nodeId) => {
            coresObj[nodeId] = core;
        });

        const maxCore = Math.max(...Array.from(cores.values()));

        return { cores: coresObj, maxCore };
    }

    /**
     * Find communities using connected components
     * Simple baseline clustering method
     * @returns {Object} Communities based on connected components
     */
    connectedComponentsClustering() {
        const components = getConnectedComponents(this.nodes, this.edges);
        const communities = {};
        
        components.forEach((component, index) => {
            const communityId = `component_${index}`;
            component.forEach(node => {
                communities[node.id] = communityId;
            });
        });

        return {
            communities,
            communitiesCount: components.length,
            components: components.map((comp, idx) => ({
                id: `component_${idx}`,
                nodes: comp.map(n => n.id),
                size: comp.length
            }))
        };
    }

    /**
     * Update graph data
     * @param {Array} nodes - New nodes array
     * @param {Array} edges - New edges array
     */
    updateGraph(nodes, edges) {
        this.nodes = nodes;
        this.edges = edges;
        this.nodeMap = this.buildNodeMap();
        this.edgeMap = this.buildEdgeMap();
        this.adjacency = this.buildAdjacencyMatrix();
    }
}

