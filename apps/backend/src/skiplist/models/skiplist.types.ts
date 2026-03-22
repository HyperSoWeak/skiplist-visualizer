export const ACTION_TYPES = [
  'find',
  'insert',
  'delete',
  'reset',
  'validation',
] as const;
export const NODE_VISUAL_STATES = [
  'default',
  'visited',
  'next',
  'found',
] as const;
export const STEP_TYPES = [
  'visit',
  'inspect_next',
  'move_right',
  'move_down',
  'found',
  'not_found',
  'insert_node',
  'delete_node',
  'split_arrow',
  'merge_arrow',
  'promote_node',
  'add_level',
  'remove_level',
  'error',
  'complete',
  'reset',
] as const;
export const STRUCTURE_CHANGE_TYPES = [
  'insert_node',
  'delete_node',
  'split_arrow',
  'merge_arrow',
  'promote_node',
  'add_level',
  'remove_level',
] as const;
export const STEP_DIRECTIONS = ['right', 'down'] as const;
export const PLAYBACK_HINTS = [
  'highlight',
  'move',
  'structure',
  'alert',
  'complete',
] as const;
export const NODE_KINDS = ['start', 'end', 'value'] as const;

export type ActionType = (typeof ACTION_TYPES)[number];
export type NodeVisualState = (typeof NODE_VISUAL_STATES)[number];
export type StepType = (typeof STEP_TYPES)[number];
export type StructureChangeType = (typeof STRUCTURE_CHANGE_TYPES)[number];
export type StepDirection = (typeof STEP_DIRECTIONS)[number];
export type PlaybackHint = (typeof PLAYBACK_HINTS)[number];
export type NodeKind = (typeof NODE_KINDS)[number];

export interface NodeStateChange {
  nodeId: string;
  state: NodeVisualState;
}

export interface StructureChange {
  type: StructureChangeType;
  level: number;
  nodeId?: string;
  fromNodeId?: string;
  throughNodeId?: string;
  toNodeId?: string;
}

export interface OperationStep {
  index: number;
  type: StepType;
  message: string;
  nodeIds: string[];
  stateChanges: NodeStateChange[];
  focusNodeId: string | null;
  nextNodeId: string | null;
  direction: StepDirection | null;
  structureChange: StructureChange | null;
  playbackHint: PlaybackHint;
}

export interface SerializedNode {
  id: string;
  label: string;
  numericValue: number | null;
  kind: NodeKind;
  level: number;
  nextId: string | null;
  prevId: string | null;
  upId: string | null;
  downId: string | null;
}

export interface SerializedLevel {
  level: number;
  headId: string;
  tailId: string;
  nodeIds: string[];
  nodes: SerializedNode[];
}

export interface SkipListState {
  height: number;
  nodeCount: number;
  values: number[];
  configuredSeed: number | null;
  rngState: number | null;
  levels: SerializedLevel[];
}

export interface OperationResult {
  success: boolean;
  message: string;
  actionType: ActionType;
  targetValue: number | null;
  steps: OperationStep[];
  finalState: SkipListState | null;
  coinFlips: boolean[];
  showAlert: boolean;
}
