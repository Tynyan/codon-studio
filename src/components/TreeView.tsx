import { useMemo } from "react";
import type { OrthologSpecies, TreeNode } from "../lib/evolution";
import { treeLeaves } from "../lib/evolution";
import { cx } from "../lib/cx";

interface Position {
  x: number;
  y: number;
  depth: number;
}

interface Edge {
  id: string;
  parentId: string;
  childId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface VerticalEdge {
  id: string;
  x: number;
  y1: number;
  y2: number;
}

export function TreeView({
  tree,
  species,
  selectedSpecies,
  onSelectSpecies,
}: {
  tree: TreeNode;
  species: OrthologSpecies[];
  selectedSpecies: string;
  onSelectSpecies: (id: string) => void;
}) {
  const layout = useMemo(() => {
    const leaves = treeLeaves(tree);
    const byId = new Map(species.map((item) => [item.id, item]));
    const positions = new Map<string, Position>();
    const parents = new Map<string, string>();
    const rowHeight = 42;
    const top = 34;
    const width = 760;
    const left = 28;
    const plotWidth = 500;
    const height = top + leaves.length * rowHeight + 64;

    let maxDepth = 0;
    const depthWalk = (node: TreeNode, depth: number) => {
      maxDepth = Math.max(maxDepth, depth);
      for (const child of node.children) depthWalk(child, depth + child.length);
    };
    depthWalk(tree, 0);

    let leafIndex = 0;
    const walk = (node: TreeNode, depth: number): number => {
      if (!node.children.length) {
        const y = top + leafIndex * rowHeight;
        leafIndex += 1;
        positions.set(node.id, { x: left + (maxDepth ? (depth / maxDepth) * plotWidth : 0), y, depth });
        return y;
      }
      const childYs = node.children.map((child) => {
        parents.set(child.id, node.id);
        return walk(child, depth + child.length);
      });
      const y = childYs.reduce((sum, value) => sum + value, 0) / Math.max(1, childYs.length);
      positions.set(node.id, { x: left + (maxDepth ? (depth / maxDepth) * plotWidth : 0), y, depth });
      return y;
    };
    walk(tree, 0);

    const horizontalEdges: Edge[] = [];
    const verticalEdges: VerticalEdge[] = [];
    const collectEdges = (node: TreeNode) => {
      const parent = positions.get(node.id);
      if (!parent || !node.children.length) return;
      const childYs = node.children
        .map((child) => positions.get(child.id)?.y)
        .filter((value): value is number => value !== undefined);
      if (childYs.length) {
        verticalEdges.push({
          id: `v-${node.id}`,
          x: parent.x,
          y1: Math.min(...childYs),
          y2: Math.max(...childYs),
        });
      }
      for (const child of node.children) {
        const childPosition = positions.get(child.id);
        if (!childPosition) continue;
        horizontalEdges.push({
          id: `h-${node.id}-${child.id}`,
          parentId: node.id,
          childId: child.id,
          x1: parent.x,
          y1: childPosition.y,
          x2: childPosition.x,
          y2: childPosition.y,
        });
        collectEdges(child);
      }
    };
    collectEdges(tree);

    const path = new Set<string>();
    let cursor: string | undefined = selectedSpecies;
    while (cursor) {
      path.add(cursor);
      cursor = parents.get(cursor);
    }

    const scale = maxDepth >= 0.2 ? 0.1 : Math.max(0.01, Math.round(maxDepth * 100) / 200);
    return {
      leaves,
      byId,
      positions,
      parents,
      path,
      width,
      height,
      left,
      plotWidth,
      maxDepth,
      scale,
      horizontalEdges,
      verticalEdges,
    };
  }, [selectedSpecies, species, tree]);

  const leafIds = new Set(layout.leaves.map((leaf) => leaf.id));

  return (
    <div className="tree-wrap">
      <svg
        className="tree-svg"
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label="Neighbor-joining phylogeny of seven HBB orthologs, rooted on zebrafish"
      >
        <line
          x1={layout.left}
          x2={layout.left + layout.plotWidth}
          y1={layout.height - 36}
          y2={layout.height - 36}
          className="tree-scale-line"
        />
        <line
          x1={layout.left}
          x2={layout.left}
          y1={layout.height - 40}
          y2={layout.height - 32}
          className="tree-scale-tick"
        />
        <line
          x1={layout.left + (layout.scale / Math.max(0.001, layout.maxDepth)) * layout.plotWidth}
          x2={layout.left + (layout.scale / Math.max(0.001, layout.maxDepth)) * layout.plotWidth}
          y1={layout.height - 40}
          y2={layout.height - 32}
          className="tree-scale-tick"
        />
        <text x={layout.left} y={layout.height - 20} className="tree-scale-label">
          0
        </text>
        <text
          x={layout.left + (layout.scale / Math.max(0.001, layout.maxDepth)) * layout.plotWidth}
          y={layout.height - 20}
          textAnchor="middle"
          className="tree-scale-label"
        >
          {layout.scale.toFixed(2)}
        </text>
        <text x={layout.width - 12} y={layout.height - 20} textAnchor="end" className="tree-scale-label">
          p-distance
        </text>

        {layout.verticalEdges.map((edge) => (
          <line
            key={edge.id}
            x1={edge.x}
            x2={edge.x}
            y1={edge.y1}
            y2={edge.y2}
            className={cx("tree-branch", layout.path.has(edge.id.slice(2)) && "is-on-path")}
          />
        ))}
        {layout.horizontalEdges.map((edge) => (
          <line
            key={edge.id}
            x1={edge.x1}
            x2={edge.x2}
            y1={edge.y1}
            y2={edge.y2}
            className={cx(
              "tree-branch",
              layout.path.has(edge.parentId) && layout.path.has(edge.childId) && "is-on-path",
            )}
          />
        ))}

        {Array.from(layout.positions.entries())
          .filter(([id]) => !leafIds.has(id))
          .map(([id, position]) => (
            <circle
              key={id}
              cx={position.x}
              cy={position.y}
              r={2.2}
              className={cx("tree-node", layout.path.has(id) && "is-on-path")}
            />
          ))}

        {layout.leaves.map((leaf) => {
          const speciesInfo = layout.byId.get(leaf.id);
          const position = layout.positions.get(leaf.id);
          if (!speciesInfo || !position) return null;
          const selected = selectedSpecies === leaf.id;
          return (
            <g
              key={leaf.id}
              className={cx("tree-leaf", selected && "is-selected", layout.path.has(leaf.id) && "is-on-path")}
              onClick={() => onSelectSpecies(leaf.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectSpecies(leaf.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${speciesInfo.commonNameZh}, ${speciesInfo.latin}`}
            >
              <circle cx={position.x} cy={position.y} r={selected ? 4 : 2.6} className="tree-tip" />
              <text x={position.x + 10} y={position.y + 3} className="tree-leaf-name">
                {speciesInfo.commonNameZh}
              </text>
              <text x={position.x + 10} y={position.y + 14} className="tree-leaf-latin">
                {speciesInfo.latin}
              </text>
              {leaf.id === "zebrafish" && (
                <text x={position.x + 10} y={position.y + 25} className="tree-outgroup">
                  outgroup
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
