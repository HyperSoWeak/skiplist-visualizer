import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  ACTION_TYPES,
  NODE_KINDS,
  NODE_VISUAL_STATES,
  PLAYBACK_HINTS,
  STEP_DIRECTIONS,
  STEP_TYPES,
  STRUCTURE_CHANGE_TYPES,
} from './skiplist.types';

export class NodeStateChangeModel {
  @ApiProperty()
  nodeId!: string;

  @ApiProperty({ enum: NODE_VISUAL_STATES })
  state!: string;
}

export class StructureChangeModel {
  @ApiProperty({ enum: STRUCTURE_CHANGE_TYPES })
  type!: string;

  @ApiProperty()
  level!: number;

  @ApiPropertyOptional()
  nodeId?: string;

  @ApiPropertyOptional()
  fromNodeId?: string;

  @ApiPropertyOptional()
  throughNodeId?: string;

  @ApiPropertyOptional()
  toNodeId?: string;
}

export class OperationStepModel {
  @ApiProperty()
  index!: number;

  @ApiProperty({ enum: STEP_TYPES })
  type!: string;

  @ApiProperty()
  message!: string;

  @ApiProperty({ type: [String] })
  nodeIds!: string[];

  @ApiProperty({ type: [NodeStateChangeModel] })
  stateChanges!: NodeStateChangeModel[];

  @ApiPropertyOptional({ nullable: true })
  focusNodeId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  nextNodeId!: string | null;

  @ApiPropertyOptional({ enum: STEP_DIRECTIONS, nullable: true })
  direction!: string | null;

  @ApiPropertyOptional({ type: StructureChangeModel, nullable: true })
  structureChange!: StructureChangeModel | null;

  @ApiProperty({ enum: PLAYBACK_HINTS })
  playbackHint!: string;
}

export class SerializedNodeModel {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  label!: string;

  @ApiPropertyOptional({ nullable: true })
  numericValue!: number | null;

  @ApiProperty({ enum: NODE_KINDS })
  kind!: string;

  @ApiProperty()
  level!: number;

  @ApiPropertyOptional({ nullable: true })
  nextId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  prevId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  upId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  downId!: string | null;
}

export class SerializedLevelModel {
  @ApiProperty()
  level!: number;

  @ApiProperty()
  headId!: string;

  @ApiProperty()
  tailId!: string;

  @ApiProperty({ type: [String] })
  nodeIds!: string[];

  @ApiProperty({ type: [SerializedNodeModel] })
  nodes!: SerializedNodeModel[];
}

export class SkipListStateModel {
  @ApiProperty()
  height!: number;

  @ApiProperty()
  nodeCount!: number;

  @ApiProperty({ type: [Number] })
  values!: number[];

  @ApiPropertyOptional({ nullable: true })
  configuredSeed!: number | null;

  @ApiPropertyOptional({ nullable: true })
  rngState!: number | null;

  @ApiProperty({ type: [SerializedLevelModel] })
  levels!: SerializedLevelModel[];
}

export class OperationResultModel {
  @ApiProperty()
  success!: boolean;

  @ApiProperty()
  message!: string;

  @ApiProperty({ enum: ACTION_TYPES })
  actionType!: string;

  @ApiPropertyOptional({ nullable: true })
  targetValue!: number | null;

  @ApiProperty({ type: [OperationStepModel] })
  steps!: OperationStepModel[];

  @ApiPropertyOptional({ type: SkipListStateModel, nullable: true })
  finalState!: SkipListStateModel | null;

  @ApiProperty({ type: [Boolean] })
  coinFlips!: boolean[];

  @ApiProperty()
  showAlert!: boolean;
}
