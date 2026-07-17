import { CurriculumGraphSchema, type CurriculumGraph, type CurriculumNode } from "./contracts";

export interface CurriculumIssue { code: "duplicate-node" | "missing-prerequisite" | "cycle"; nodeId: string; detail: string }

export function validateCurriculumGraph(input: unknown): { graph: CurriculumGraph | null; issues: CurriculumIssue[] } {
  const parsed = CurriculumGraphSchema.safeParse(input);
  if (!parsed.success) return { graph: null, issues: [{ code: "missing-prerequisite", nodeId: "graph", detail: "The curriculum graph does not match its schema." }] };
  const graph = parsed.data;
  const issues: CurriculumIssue[] = [];
  const ids = new Set<string>();
  for (const node of graph.nodes) {
    if (ids.has(node.id)) issues.push({ code: "duplicate-node", nodeId: node.id, detail: "Node ids must be unique." });
    ids.add(node.id);
  }
  for (const node of graph.nodes) {
    for (const prerequisiteId of node.prerequisiteIds) if (!ids.has(prerequisiteId)) issues.push({ code: "missing-prerequisite", nodeId: node.id, detail: `Unknown prerequisite: ${prerequisiteId}` });
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const visit = (node: CurriculumNode): boolean => {
    if (visiting.has(node.id)) return true;
    if (visited.has(node.id)) return false;
    visiting.add(node.id);
    const cyclic = node.prerequisiteIds.some((id) => byId.has(id) && visit(byId.get(id)!));
    visiting.delete(node.id);
    visited.add(node.id);
    return cyclic;
  };
  for (const node of graph.nodes) if (visit(node)) issues.push({ code: "cycle", nodeId: node.id, detail: "Prerequisites must form an acyclic graph." });
  return { graph, issues };
}

export function recommendCurriculumNodes(graph: CurriculumGraph, completedNodeIds: ReadonlySet<string>): CurriculumNode[] {
  return graph.nodes.filter((node) => !completedNodeIds.has(node.id) && node.prerequisiteIds.every((id) => completedNodeIds.has(id)));
}
