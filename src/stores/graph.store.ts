import { create } from 'zustand';
import type { CareerGraph, GraphNode, GraphEdge } from '@/types/graph.types';

interface GraphState {
  graph: CareerGraph;
  selectedNode: GraphNode | null;
  hoveredNode: GraphNode | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    nodeTypes: string[];
    showMissing: boolean;
  };

  // Actions
  setGraph: (graph: CareerGraph) => void;
  setSelectedNode: (node: GraphNode | null) => void;
  setHoveredNode: (node: GraphNode | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<GraphState['filters']>) => void;
  addNode: (node: GraphNode) => void;
  addEdge: (edge: GraphEdge) => void;
  clearGraph: () => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  graph: { nodes: [], edges: [] },
  selectedNode: null,
  hoveredNode: null,
  isLoading: false,
  error: null,
  filters: {
    nodeTypes: [],
    showMissing: true,
  },

  setGraph: (graph) => set({ graph, isLoading: false, error: null }),

  setSelectedNode: (selectedNode) => set({ selectedNode }),

  setHoveredNode: (hoveredNode) => set({ hoveredNode }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),

  addNode: (node) =>
    set((state) => ({
      graph: {
        ...state.graph,
        nodes: [...state.graph.nodes, node],
      },
    })),

  addEdge: (edge) =>
    set((state) => ({
      graph: {
        ...state.graph,
        edges: [...state.graph.edges, edge],
      },
    })),

  clearGraph: () =>
    set({
      graph: { nodes: [], edges: [] },
      selectedNode: null,
      hoveredNode: null,
    }),
}));
