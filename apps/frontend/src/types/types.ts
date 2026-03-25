export type NodeVisualState = 'default' | 'visited' | 'next' | 'found';
export type StepType = 'visit' | 'inspect_next' | 'move_right' | 'move_down' | 'found' | 'not_found' | 'insert_node' | 'delete_node' | 'split_arrow' | 'merge_arrow' | 'promote_node' | 'add_level' | 'remove_level' | 'error' | 'complete' | 'reset';

export interface OperationStep {
  index: number;
  type: StepType;
  message: string;
  nodeIds: string[];
  stateChanges: { nodeId: string; state: NodeVisualState }[];
  structureChange?: any; // Simplified for frontend usage
}

export interface SerializedNode {
  id: string;
  label: string;
  numericValue: number | null;
  kind: 'start' | 'end' | 'value';
  level: number;
  nextId: string | null;
}

export interface SerializedLevel {
  level: number;
  nodes: SerializedNode[];
}

export interface SkipListState {
  height: number;
  values: number[];
  levels: SerializedLevel[];
}

export interface OperationResult {
  success: boolean;
  message: string;
  steps: OperationStep[];
  finalState: SkipListState | null;
}