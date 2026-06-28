'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { slideInRight } from '@/lib/motion';
import type { GraphNode, GraphEdge, NodeType } from '@/types/graph.types';
import { NODE_COLORS, NODE_SIZES } from '@/types/graph.types';



const LEGEND_ITEMS: { type: NodeType; label: string }[] = [
  { type: 'user', label: 'You' },
  { type: 'skill', label: 'Acquired Skill' },
  { type: 'skill_missing', label: 'Missing Skill' },
  { type: 'role_target', label: 'Target Role' },
  { type: 'role', label: 'Role' },
  { type: 'technology', label: 'Technology' },
  { type: 'certification', label: 'Certification' },
];

interface SelectedNode {
  node: GraphNode;
  connections: { node: GraphNode; relationship: string }[];
}

export default function GraphPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data from Neo4j
  useEffect(() => {
    fetch('/api/graph')
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          // Clone arrays since d3 mutates the objects
          setNodes(json.data.nodes.map((n: any) => ({ ...n })) || []);
          setEdges(json.data.edges.map((e: any) => ({ ...e })) || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load graph:', err);
        setLoading(false);
      });
  }, []);

  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      const connections = edges
        .filter((e) => {
          const sId = typeof e.source === 'object' ? (e.source as any).id : e.source;
          const tId = typeof e.target === 'object' ? (e.target as any).id : e.target;
          return sId === node.id || tId === node.id;
        })
        .map((e) => {
          const sId = typeof e.source === 'object' ? (e.source as any).id : e.source;
          const tId = typeof e.target === 'object' ? (e.target as any).id : e.target;
          const connectedId = sId === node.id ? tId : sId;
          const connectedNode = nodes.find((n) => n.id === connectedId);
          return connectedNode
            ? { node: connectedNode, relationship: e.type }
            : null;
        })
        .filter(Boolean) as { node: GraphNode; relationship: string }[];

      setSelectedNode({ node, connections });
    },
    [edges, nodes]
  );

  // Measure container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // D3 Force Graph
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);
    zoomRef.current = zoom;

    // Keep simulation gently moving forever to feel alive
    const simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(edges).id((d: any) => d.id).distance((d: any) => {
        if (d.type === 'TARGETS_ROLE') return 180;
        if (d.type === 'CURRENTLY_IN') return 150;
        return 110;
      }))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(45))
      .alphaDecay(0.01) // slow decay
      .alphaMin(0.01);  // never stops moving

    // Premium SVG Filters & Gradients
    const defs = svg.append('defs');
    
    // Smooth Drop Shadow for 3D elevation
    const dropShadow = defs.append('filter')
      .attr('id', 'premium-shadow')
      .attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
      
    dropShadow.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '6')
      .attr('stdDeviation', '8')
      .attr('flood-color', 'var(--foreground)')
      .attr('flood-opacity', '0.15');

    Object.entries(NODE_COLORS).forEach(([type, color]) => {
      // Intense Glow for hover states
      const filter = defs.append('filter').attr('id', `glow-${type}`);
      filter.append('feGaussianBlur')
        .attr('stdDeviation', type === 'user' || type === 'role_target' ? '8' : '5')
        .attr('result', 'coloredBlur');
      const feMerge = filter.append('feMerge');
      feMerge.append('feMergeNode').attr('in', 'coloredBlur');
      feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

      // 3D Spherical Radial Gradient
      const gradient = defs.append('radialGradient')
        .attr('id', `grad-${type}`)
        .attr('cx', '35%')
        .attr('cy', '35%')
        .attr('r', '65%');
        
      gradient.append('stop')
        .attr('offset', '0%')
        .style('stop-color', `color-mix(in srgb, #ffffff 50%, ${color})`)
        .attr('stop-opacity', '1');

      gradient.append('stop')
        .attr('offset', '100%')
        .style('stop-color', color)
        .attr('stop-opacity', '1');
    });

    // Draw edges
    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', (d: any) => {
         if (d.type === 'TARGETS_ROLE') return NODE_COLORS['role_target'];
         if (d.type === 'CURRENTLY_IN') return NODE_COLORS['role'];
         if (d.type === 'HAS_SKILL') return NODE_COLORS['skill'];
         return 'var(--border)';
      })
      .attr('stroke-width', (d: any) => (d.type === 'TARGETS_ROLE' ? 3 : d.type === 'CURRENTLY_IN' ? 2 : 1.5))
      .attr('stroke-opacity', (d: any) => (d.type === 'TARGETS_ROLE' ? 0.9 : 0.3))
      .attr('stroke-dasharray', (d: any) => {
         if (d.type === 'TARGETS_ROLE' || d.type === 'HAS_SKILL') return '5, 5';
         return 'none';
      });

    // Add moving data flow animation to active connections
    link.filter((d: any) => d.type === 'TARGETS_ROLE' || d.type === 'HAS_SKILL')
      .append('animate')
      .attr('attributeName', 'stroke-dashoffset')
      .attr('from', '20')
      .attr('to', '0')
      .attr('dur', '1.5s')
      .attr('repeatCount', 'indefinite');

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.01);
            d.fx = null;
            d.fy = null;
          }) as any
      );

    // Add pulsing halos behind important nodes (User & Target Role)
    const halo1 = node.filter(d => d.type === 'user' || d.type === 'role_target')
      .append('circle')
      .attr('r', (d) => NODE_SIZES[d.type] * 1.5)
      .attr('fill', (d) => NODE_COLORS[d.type])
      .attr('opacity', 0);
      
    halo1.append('animate')
      .attr('attributeName', 'opacity')
      .attr('values', '0.1;0.4;0.1')
      .attr('dur', '3s')
      .attr('repeatCount', 'indefinite');

    const halo2 = node.filter(d => d.type === 'user' || d.type === 'role_target')
      .append('circle')
      .attr('fill', 'transparent')
      .attr('stroke', (d) => NODE_COLORS[d.type])
      .attr('stroke-width', 1)
      .attr('opacity', 0.1);
      
    halo2.append('animate')
      .attr('attributeName', 'r')
      .attr('values', (d) => `${NODE_SIZES[d.type] * 1.5};${NODE_SIZES[d.type] * 2.8};${NODE_SIZES[d.type] * 1.5}`)
      .attr('dur', '3s')
      .attr('repeatCount', 'indefinite');

    // Main Node circles
    node.append('circle')
      .attr('r', (d) => NODE_SIZES[d.type])
      .attr('fill', (d) => d.type === 'skill_missing' ? 'transparent' : `url(#grad-${d.type})`)
      .attr('stroke', (d) => NODE_COLORS[d.type])
      .attr('stroke-width', (d) => (d.type === 'skill_missing' ? 1.5 : d.type === 'user' ? 2 : 0))
      .attr('stroke-dasharray', (d) => (d.type === 'skill_missing' ? '3,3' : 'none'))
      .attr('filter', (d) => d.type !== 'skill_missing' ? 'url(#premium-shadow)' : null)
      .attr('opacity', 0)
      .transition()
      .duration(600)
      .delay((_, i) => i * 40)
      .attr('opacity', (d) => (d.type === 'skill_missing' ? 0.6 : 1));

    // Hover interactions
    node
      .on('mouseover', function (event, d: any) {
        // Expand circle and add glow
        d3.select(this).select('circle')
          .transition().duration(200).ease(d3.easeBackOut)
          .attr('r', NODE_SIZES[d.type as NodeType] * 1.25)
          .attr('filter', `url(#glow-${d.type})`)
          .attr('opacity', 1);

        // Highlight connected edges
        link.attr('stroke', (l: any) => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          if (sId === d.id || tId === d.id) {
            // Use the color of the *other* node for the line, or fallback to primary if both are the same
            const otherId = sId === d.id ? tId : sId;
            const otherNode = (nodes as any).find((n: any) => n.id === otherId);
            return otherNode ? NODE_COLORS[otherNode.type as NodeType] : 'var(--primary)';
          }
          return 'color-mix(in srgb, var(--foreground) 5%, transparent)';
        }).attr('stroke-width', (l: any) => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          return sId === d.id || tId === d.id ? 2.5 : 0.5;
        }).attr('stroke-opacity', (l: any) => {
          const sId = typeof l.source === 'object' ? l.source.id : l.source;
          const tId = typeof l.target === 'object' ? l.target.id : l.target;
          return sId === d.id || tId === d.id ? 1 : 0.1;
        });
      })
      .on('mouseout', function (event, d: any) {
        // Restore circle
        d3.select(this).select('circle')
          .transition().duration(300).ease(d3.easeCubicOut)
          .attr('r', NODE_SIZES[d.type as NodeType])
          .attr('filter', d.type !== 'skill_missing' ? 'url(#premium-shadow)' : null)
          .attr('opacity', d.type === 'skill_missing' ? 0.6 : 1);

        // Reset edges
        link.attr('stroke', (l: any) => {
           if (l.type === 'TARGETS_ROLE') return NODE_COLORS['role_target'];
           if (l.type === 'CURRENTLY_IN') return NODE_COLORS['role'];
           if (l.type === 'HAS_SKILL') return NODE_COLORS['skill'];
           return 'color-mix(in srgb, var(--border) 60%, transparent)';
        })
        .attr('stroke-width', (l: any) => (l.type === 'TARGETS_ROLE' ? 3 : l.type === 'CURRENTLY_IN' ? 2 : 1.5))
        .attr('stroke-opacity', (l: any) => (l.type === 'TARGETS_ROLE' ? 0.9 : 0.3));
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        handleNodeClick(d);
      });

    // Node labels
    node.append('text')
      .text((d: any) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => NODE_SIZES[d.type as NodeType] + 16)
      .attr('fill', 'var(--foreground)')
      .attr('opacity', 0.7)
      .attr('font-size', '11px')
      .attr('font-weight', (d: any) => d.type === 'user' || d.type === 'role_target' ? 'bold' : 'normal')
      .attr('font-family', 'Inter, sans-serif')
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay((_, i) => 200 + i * 40)
      .attr('opacity', 1);

    // Close detail panel on background click
    svg.on('click', () => setSelectedNode(null));

    // Simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [dimensions, handleNodeClick, nodes, edges]);

  function handleZoom(direction: 'in' | 'out') {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    if (direction === 'in') {
      svg.transition().duration(300).call(zoomRef.current.scaleBy, 1.3);
    } else {
      svg.transition().duration(300).call(zoomRef.current.scaleBy, 0.7);
    }
  }

  function handleReset() {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
  }

  return (
    <div className="relative h-screen overflow-hidden bg-gradient-graph">
      {/* Graph Canvas */}
      <div ref={containerRef} className="h-full w-full">
        {loading ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Sparkles className="h-8 w-8 animate-pulse text-primary/50" />
              <p className="text-sm font-medium text-muted-foreground">Constructing your graph...</p>
            </div>
          </div>
        ) : (
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="h-full w-full"
          />
        )}
      </div>

      {/* Floating Controls — Top Right */}
      <div className="absolute right-4 top-4 flex flex-col gap-2 z-40">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 glass"
          onClick={() => handleZoom('in')}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 glass"
          onClick={() => handleZoom('out')}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 glass"
          onClick={handleReset}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Floating Legend — Bottom Left */}
      <div className="absolute bottom-4 left-4 rounded-lg glass p-5 max-w-[280px] z-40">
        <p className="mb-4 text-xs font-semibold leading-relaxed text-foreground/80">Career Intelligence Graph&apos;s color meaning of each element</p>
        <div className="space-y-3">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.type} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{
                  background:
                    item.type === 'skill_missing' ? 'transparent' : NODE_COLORS[item.type],
                  border:
                    item.type === 'skill_missing'
                      ? `1.5px dashed ${NODE_COLORS[item.type]}`
                      : 'none',
                }}
              />
              <span className="text-[11px] font-medium text-foreground/80">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Page Title — Top Left */}
      <div className="absolute left-4 top-4 z-40">
        <div className="flex items-center gap-2 rounded-lg glass px-3 py-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Career Intelligence Graph</span>
        </div>
      </div>

      {/* Detail Panel — Right Side */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            className="absolute bottom-4 right-4 top-16 w-80 overflow-hidden rounded-xl glass-strong z-50 shadow-2xl"
            {...slideInRight}
          >
            <ScrollArea className="h-full p-5">
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="text-[10px]"
                  style={{ 
                    borderColor: selectedNode.node.type === 'user' ? 'var(--border)' : NODE_COLORS[selectedNode.node.type] + '50', 
                    color: selectedNode.node.type === 'user' ? 'var(--foreground)' : NODE_COLORS[selectedNode.node.type] 
                  }}
                >
                  {selectedNode.node.type.replace('_', ' ').toUpperCase()}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSelectedNode(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              <h3 className="mt-3 text-lg font-bold">{selectedNode.node.label}</h3>

              {Boolean(selectedNode.node.properties.proficiency) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Proficiency: {String(selectedNode.node.properties.proficiency)}
                </p>
              )}

              <div className="mt-5">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Connections ({selectedNode.connections.length})
                </p>
                <div className="space-y-2">
                  {selectedNode.connections.map((conn) => (
                    <div
                      key={conn.node.id}
                      className="flex items-center gap-2 rounded-md bg-white/[0.03] px-3 py-2"
                    >
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: NODE_COLORS[conn.node.type] }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{conn.node.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {conn.relationship.replace(/_/g, ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>


            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
