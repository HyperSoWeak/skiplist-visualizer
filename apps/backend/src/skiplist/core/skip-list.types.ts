export type NodeKind = 'start' | 'end' | 'value';
export type SearchAction = 'move_right' | 'move_down' | 'stop' | 'found';

export interface SearchTransition {
  currentId: string;
  nextId: string;
  level: number;
  action: SearchAction;
  reason: string;
}

export interface SearchTrace {
  foundNodeId: string | null;
  predecessors: string[];
  transitions: SearchTransition[];
}

export interface InsertedNodePlacement {
  nodeId: string;
  level: number;
  leftId: string;
  rightId: string;
  downId: string | null;
}

export interface PromotionLink {
  fromNodeId: string;
  toNodeId: string;
  level: number;
}

export interface RemovedNodePlacement {
  nodeId: string;
  level: number;
  leftId: string;
  rightId: string;
}

export interface LayerChange {
  level: number;
  headId: string;
  tailId: string;
}

export interface SkipListStateSnapshot {
  height: number;
  nodeCount: number;
  values: number[];
  configuredSeed: number | null;
  rngState: number | null;
  levels: {
    level: number;
    headId: string;
    tailId: string;
    nodeIds: string[];
    nodes: {
      id: string;
      label: string;
      numericValue: number | null;
      kind: NodeKind;
      level: number;
      nextId: string | null;
      prevId: string | null;
      upId: string | null;
      downId: string | null;
    }[];
  }[];
}

export interface FindDomainResult {
  found: boolean;
  trace: SearchTrace;
  foundNodeId: string | null;
  state: SkipListStateSnapshot;
}

export interface InsertDomainResult {
  inserted: boolean;
  reason: 'inserted' | 'duplicate';
  trace: SearchTrace;
  insertedNodes: InsertedNodePlacement[];
  promotions: PromotionLink[];
  addedLevels: LayerChange[];
  coinFlips: boolean[];
  state: SkipListStateSnapshot;
}

export interface DeleteDomainResult {
  deleted: boolean;
  reason: 'deleted' | 'missing';
  trace: SearchTrace;
  removedNodes: RemovedNodePlacement[];
  removedLevels: LayerChange[];
  state: SkipListStateSnapshot;
}
