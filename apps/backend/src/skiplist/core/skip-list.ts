import {
  DeleteDomainResult,
  FindDomainResult,
  InsertDomainResult,
  InsertedNodePlacement,
  LayerChange,
  PromotionLink,
  RemovedNodePlacement,
  SearchTrace,
  SearchTransition,
  SkipListStateSnapshot,
} from './skip-list.types';
import { SkipListNode } from './skip-list-node';

interface SkipListLevel {
  level: number;
  head: SkipListNode;
  tail: SkipListNode;
}

export interface ResetOptions {
  seed?: number;
}

export interface InsertOptions {
  flipSequence?: boolean[];
}

export class SkipList {
  private levels: SkipListLevel[] = [];
  private idCounter = 0;
  private configuredSeed: number | null = null;
  private rngState: number | null = null;

  constructor(options?: ResetOptions) {
    this.reset(options);
  }

  reset(options?: ResetOptions): SkipListStateSnapshot {
    this.levels = [];
    this.idCounter = 0;
    this.configuredSeed = options?.seed ?? null;
    this.rngState = options?.seed ?? null;
    this.levels.push(this.createLevel(0));
    return this.serialize();
  }

  getState(): SkipListStateSnapshot {
    return this.serialize();
  }

  find(value: number): FindDomainResult {
    const trace = this.trace(value);
    return {
      found: trace.foundNodeId !== null,
      trace,
      foundNodeId: trace.foundNodeId,
      state: this.serialize(),
    };
  }

  insert(value: number, options?: InsertOptions): InsertDomainResult {
    const trace = this.trace(value);

    if (trace.foundNodeId) {
      return {
        inserted: false,
        reason: 'duplicate',
        trace,
        insertedNodes: [],
        promotions: [],
        addedLevels: [],
        coinFlips: [],
        state: this.serialize(),
      };
    }

    const predecessors = trace.predecessors
      .map((nodeId) => this.getNode(nodeId))
      .filter((node): node is SkipListNode => node !== null)
      .reverse();

    const insertedNodes: InsertedNodePlacement[] = [];
    const promotions: PromotionLink[] = [];
    const addedLevels: LayerChange[] = [];

    let lowerNode: SkipListNode | null = null;
    let predecessorIndex = 0;
    let predecessor = predecessors[predecessorIndex];

    if (!predecessor) {
      throw new Error('Expected at least one predecessor for insertion');
    }

    const newNode = this.createValueNode(value, predecessor.level);
    this.insertAfter(predecessor, newNode);
    insertedNodes.push(this.describeInsertedNode(newNode));
    lowerNode = newNode;

    const coinFlips: boolean[] = [];
    let flipIndex = 0;

    while (true) {
      const promote = this.nextPromotionResult(
        options?.flipSequence,
        flipIndex,
      );
      coinFlips.push(promote);
      flipIndex += 1;

      if (!promote) {
        break;
      }

      predecessorIndex += 1;

      if (predecessorIndex >= predecessors.length) {
        const newLevel = this.addTopLevel();
        addedLevels.push(newLevel);
        predecessors.push(this.levels[this.levels.length - 1].head);
      }

      predecessor = predecessors[predecessorIndex];

      if (!predecessor) {
        throw new Error('Expected predecessor when promoting node');
      }

      const promotedNode = this.createValueNode(value, predecessor.level);
      this.insertAfter(predecessor, promotedNode);
      promotedNode.down = lowerNode;
      lowerNode.up = promotedNode;
      promotions.push({
        fromNodeId: lowerNode.id,
        toNodeId: promotedNode.id,
        level: promotedNode.level,
      });
      insertedNodes.push(this.describeInsertedNode(promotedNode));
      lowerNode = promotedNode;
    }

    return {
      inserted: true,
      reason: 'inserted',
      trace,
      insertedNodes,
      promotions,
      addedLevels,
      coinFlips,
      state: this.serialize(),
    };
  }

  delete(value: number): DeleteDomainResult {
    const trace = this.trace(value);

    if (!trace.foundNodeId) {
      return {
        deleted: false,
        reason: 'missing',
        trace,
        removedNodes: [],
        removedLevels: [],
        state: this.serialize(),
      };
    }

    const removedNodes: RemovedNodePlacement[] = [];
    const removedLevels: LayerChange[] = [];

    let node = this.getNode(trace.foundNodeId);

    while (node) {
      removedNodes.push({
        nodeId: node.id,
        level: node.level,
        leftId: node.prev?.id ?? '',
        rightId: node.next?.id ?? '',
      });

      const nextNode = node.down;
      this.removeNode(node);
      node = nextNode;
    }

    while (this.levels.length > 1) {
      const topLevel = this.levels[this.levels.length - 1];

      if (topLevel.head.next !== topLevel.tail) {
        break;
      }

      removedLevels.push({
        level: topLevel.level,
        headId: topLevel.head.id,
        tailId: topLevel.tail.id,
      });
      this.levels.pop();
    }

    return {
      deleted: true,
      reason: 'deleted',
      trace,
      removedNodes,
      removedLevels,
      state: this.serialize(),
    };
  }

  private trace(value: number): SearchTrace {
    const transitions: SearchTransition[] = [];
    const predecessors: string[] = [];
    let current = this.levels[this.levels.length - 1].head;

    while (true) {
      const next = current.next;

      if (!next) {
        throw new Error(`Missing next node at level ${current.level}`);
      }

      const nextValue = next.numericValue;
      const nextIsValue = next.kind === 'value' && nextValue !== null;

      if (nextIsValue && nextValue <= value) {
        if (nextValue === value) {
          transitions.push({
            currentId: current.id,
            nextId: next.id,
            level: current.level,
            action: 'found',
            reason: 'exact_match',
          });
          return {
            foundNodeId: next.id,
            predecessors,
            transitions,
          };
        }

        transitions.push({
          currentId: current.id,
          nextId: next.id,
          level: current.level,
          action: 'move_right',
          reason: 'next_less_than_target',
        });
        current = next;
        continue;
      }

      if (current.down) {
        predecessors.push(current.id);
        transitions.push({
          currentId: current.id,
          nextId: next.id,
          level: current.level,
          action: 'move_down',
          reason:
            next.kind === 'end'
              ? 'reached_end_on_level'
              : 'next_greater_than_target',
        });
        current = current.down;
        continue;
      }

      predecessors.push(current.id);
      transitions.push({
        currentId: current.id,
        nextId: next.id,
        level: current.level,
        action: 'stop',
        reason:
          next.kind === 'end'
            ? 'reached_end_on_bottom'
            : 'insert_position_found',
      });
      return {
        foundNodeId: null,
        predecessors,
        transitions,
      };
    }
  }

  private nextPromotionResult(
    flipSequence: boolean[] | undefined,
    flipIndex: number,
  ): boolean {
    if (flipSequence) {
      return flipSequence[flipIndex] ?? false;
    }

    if (this.rngState !== null) {
      this.rngState = (1664525 * this.rngState + 1013904223) >>> 0;
      return this.rngState / 0x1_0000_0000 < 0.5;
    }

    return Math.random() < 0.5;
  }

  private describeInsertedNode(node: SkipListNode): InsertedNodePlacement {
    return {
      nodeId: node.id,
      level: node.level,
      leftId: node.prev?.id ?? '',
      rightId: node.next?.id ?? '',
      downId: node.down?.id ?? null,
    };
  }

  private addTopLevel(): LayerChange {
    const nextLevelNumber = this.levels[this.levels.length - 1].level + 1;
    const level = this.createLevel(nextLevelNumber);
    const previousTop = this.levels[this.levels.length - 1];
    level.head.down = previousTop.head;
    level.tail.down = previousTop.tail;
    previousTop.head.up = level.head;
    previousTop.tail.up = level.tail;
    this.levels.push(level);
    return {
      level: level.level,
      headId: level.head.id,
      tailId: level.tail.id,
    };
  }

  private createLevel(level: number): SkipListLevel {
    const head = this.createNode('start', level, null);
    const tail = this.createNode('end', level, null);
    head.next = tail;
    tail.prev = head;
    return {
      level,
      head,
      tail,
    };
  }

  private createValueNode(value: number, level: number): SkipListNode {
    return this.createNode('value', level, value);
  }

  private createNode(
    kind: 'start' | 'end' | 'value',
    level: number,
    value: number | null,
  ): SkipListNode {
    this.idCounter += 1;
    return new SkipListNode(`node-${this.idCounter}`, kind, level, value);
  }

  private insertAfter(leftNode: SkipListNode, newNode: SkipListNode): void {
    const rightNode = leftNode.next;

    if (!rightNode) {
      throw new Error(
        `Cannot insert after node ${leftNode.id} without a right neighbor`,
      );
    }

    newNode.prev = leftNode;
    newNode.next = rightNode;
    leftNode.next = newNode;
    rightNode.prev = newNode;
  }

  private removeNode(node: SkipListNode): void {
    const leftNode = node.prev;
    const rightNode = node.next;

    if (!leftNode || !rightNode) {
      throw new Error(`Cannot remove detached node ${node.id}`);
    }

    leftNode.next = rightNode;
    rightNode.prev = leftNode;

    if (node.up) {
      node.up.down = null;
    }

    if (node.down) {
      node.down.up = null;
    }

    node.prev = null;
    node.next = null;
    node.up = null;
    node.down = null;
  }

  private getNode(id: string): SkipListNode | null {
    for (const level of this.levels) {
      let current: SkipListNode | null = level.head;
      while (current) {
        if (current.id === id) {
          return current;
        }
        current = current.next;
      }
    }

    return null;
  }

  private serialize(): SkipListStateSnapshot {
    const levelSnapshots = [...this.levels].reverse().map((level) => {
      const nodes: SkipListStateSnapshot['levels'][number]['nodes'] = [];
      let current: SkipListNode | null = level.head;

      while (current) {
        nodes.push({
          id: current.id,
          label: current.label,
          numericValue: current.numericValue,
          kind: current.kind,
          level: current.level,
          nextId: current.next?.id ?? null,
          prevId: current.prev?.id ?? null,
          upId: current.up?.id ?? null,
          downId: current.down?.id ?? null,
        });
        current = current.next;
      }

      return {
        level: level.level,
        headId: level.head.id,
        tailId: level.tail.id,
        nodeIds: nodes.map((node) => node.id),
        nodes,
      };
    });

    const values = this.collectBottomValues();

    return {
      height: this.levels.length,
      nodeCount: values.length,
      values,
      configuredSeed: this.configuredSeed,
      rngState: this.rngState,
      levels: levelSnapshots,
    };
  }

  private collectBottomValues(): number[] {
    const bottom = this.levels[0];
    const values: number[] = [];
    let current = bottom.head.next;

    while (current && current.kind !== 'end') {
      if (current.numericValue !== null) {
        values.push(current.numericValue);
      }
      current = current.next;
    }

    return values;
  }
}
