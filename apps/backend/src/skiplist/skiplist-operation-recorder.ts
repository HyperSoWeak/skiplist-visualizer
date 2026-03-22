import {
  DeleteDomainResult,
  FindDomainResult,
  InsertDomainResult,
  SearchTransition,
  SkipListStateSnapshot,
} from './core/skip-list.types';
import {
  OperationResult,
  OperationStep,
  SkipListState,
} from './models/skiplist.types';

export class SkipListOperationRecorder {
  createFindResult(
    targetValue: number,
    domainResult: FindDomainResult,
  ): OperationResult {
    const steps = this.recordTrace(domainResult.trace.transitions);

    if (domainResult.found && domainResult.foundNodeId) {
      steps.push(
        this.createStep({
          type: 'found',
          message: `Found value ${targetValue}.`,
          nodeIds: [domainResult.foundNodeId],
          stateChanges: [{ nodeId: domainResult.foundNodeId, state: 'found' }],
          focusNodeId: domainResult.foundNodeId,
          playbackHint: 'highlight',
        }),
      );
    } else {
      steps.push(
        this.createStep({
          type: 'not_found',
          message: `Value ${targetValue} is not present in the skip list.`,
          playbackHint: 'alert',
        }),
      );
    }

    steps.push(
      this.createStep({
        type: 'complete',
        message: `Find animation for ${targetValue} is complete.`,
        playbackHint: 'complete',
      }),
    );

    return {
      success: domainResult.found,
      message: domainResult.found
        ? `Found value ${targetValue}.`
        : `Value ${targetValue} was not found.`,
      actionType: 'find',
      targetValue,
      steps: this.withIndexes(steps),
      finalState: this.mapState(domainResult.state),
      coinFlips: [],
      showAlert: !domainResult.found,
    };
  }

  createInsertResult(
    targetValue: number,
    domainResult: InsertDomainResult,
  ): OperationResult {
    const steps = this.recordTrace(domainResult.trace.transitions);

    if (!domainResult.inserted) {
      steps.push(
        this.createStep({
          type: 'error',
          message: `Value ${targetValue} already exists and cannot be inserted again.`,
          playbackHint: 'alert',
        }),
      );
      steps.push(
        this.createStep({
          type: 'complete',
          message: `Insert animation for ${targetValue} is complete.`,
          playbackHint: 'complete',
        }),
      );

      return {
        success: false,
        message: `Value ${targetValue} already exists.`,
        actionType: 'insert',
        targetValue,
        steps: this.withIndexes(steps),
        finalState: this.mapState(domainResult.state),
        coinFlips: [],
        showAlert: true,
      };
    }

    for (const addedLevel of domainResult.addedLevels) {
      steps.push(
        this.createStep({
          type: 'add_level',
          message: `Added a new top level ${addedLevel.level}.`,
          nodeIds: [addedLevel.headId, addedLevel.tailId],
          structureChange: {
            type: 'add_level',
            level: addedLevel.level,
            fromNodeId: addedLevel.headId,
            toNodeId: addedLevel.tailId,
          },
          playbackHint: 'structure',
        }),
      );
    }

    for (const insertedNode of domainResult.insertedNodes) {
      steps.push(
        this.createStep({
          type: 'split_arrow',
          message: `Split the link on level ${insertedNode.level} to make room for ${targetValue}.`,
          nodeIds: [
            insertedNode.leftId,
            insertedNode.nodeId,
            insertedNode.rightId,
          ],
          structureChange: {
            type: 'split_arrow',
            level: insertedNode.level,
            fromNodeId: insertedNode.leftId,
            throughNodeId: insertedNode.nodeId,
            toNodeId: insertedNode.rightId,
          },
          playbackHint: 'structure',
        }),
      );
      steps.push(
        this.createStep({
          type: 'insert_node',
          message: `Inserted value ${targetValue} on level ${insertedNode.level}.`,
          nodeIds: [insertedNode.nodeId],
          stateChanges: [{ nodeId: insertedNode.nodeId, state: 'found' }],
          focusNodeId: insertedNode.nodeId,
          structureChange: {
            type: 'insert_node',
            level: insertedNode.level,
            nodeId: insertedNode.nodeId,
            fromNodeId: insertedNode.leftId,
            toNodeId: insertedNode.rightId,
          },
          playbackHint: 'structure',
        }),
      );
    }

    for (const promotion of domainResult.promotions) {
      steps.push(
        this.createStep({
          type: 'promote_node',
          message: `Promoted value ${targetValue} to level ${promotion.level}.`,
          nodeIds: [promotion.fromNodeId, promotion.toNodeId],
          focusNodeId: promotion.toNodeId,
          structureChange: {
            type: 'promote_node',
            level: promotion.level,
            fromNodeId: promotion.fromNodeId,
            toNodeId: promotion.toNodeId,
          },
          playbackHint: 'structure',
        }),
      );
    }

    steps.push(
      this.createStep({
        type: 'complete',
        message: `Insert animation for ${targetValue} is complete.`,
        playbackHint: 'complete',
      }),
    );

    return {
      success: true,
      message: `Inserted value ${targetValue}.`,
      actionType: 'insert',
      targetValue,
      steps: this.withIndexes(steps),
      finalState: this.mapState(domainResult.state),
      coinFlips: domainResult.coinFlips,
      showAlert: false,
    };
  }

  createDeleteResult(
    targetValue: number,
    domainResult: DeleteDomainResult,
  ): OperationResult {
    const steps = this.recordTrace(domainResult.trace.transitions);

    if (!domainResult.deleted) {
      steps.push(
        this.createStep({
          type: 'error',
          message: `Value ${targetValue} does not exist and cannot be deleted.`,
          playbackHint: 'alert',
        }),
      );
      steps.push(
        this.createStep({
          type: 'complete',
          message: `Delete animation for ${targetValue} is complete.`,
          playbackHint: 'complete',
        }),
      );

      return {
        success: false,
        message: `Value ${targetValue} does not exist.`,
        actionType: 'delete',
        targetValue,
        steps: this.withIndexes(steps),
        finalState: this.mapState(domainResult.state),
        coinFlips: [],
        showAlert: true,
      };
    }

    for (const removedNode of domainResult.removedNodes) {
      steps.push(
        this.createStep({
          type: 'delete_node',
          message: `Removed value ${targetValue} from level ${removedNode.level}.`,
          nodeIds: [removedNode.nodeId],
          structureChange: {
            type: 'delete_node',
            level: removedNode.level,
            nodeId: removedNode.nodeId,
            fromNodeId: removedNode.leftId,
            toNodeId: removedNode.rightId,
          },
          playbackHint: 'structure',
        }),
      );
      steps.push(
        this.createStep({
          type: 'merge_arrow',
          message: `Merged the neighbors around the removed node on level ${removedNode.level}.`,
          nodeIds: [removedNode.leftId, removedNode.rightId],
          structureChange: {
            type: 'merge_arrow',
            level: removedNode.level,
            fromNodeId: removedNode.leftId,
            toNodeId: removedNode.rightId,
          },
          playbackHint: 'structure',
        }),
      );
    }

    for (const removedLevel of domainResult.removedLevels) {
      steps.push(
        this.createStep({
          type: 'remove_level',
          message: `Removed empty top level ${removedLevel.level}.`,
          nodeIds: [removedLevel.headId, removedLevel.tailId],
          structureChange: {
            type: 'remove_level',
            level: removedLevel.level,
            fromNodeId: removedLevel.headId,
            toNodeId: removedLevel.tailId,
          },
          playbackHint: 'structure',
        }),
      );
    }

    steps.push(
      this.createStep({
        type: 'complete',
        message: `Delete animation for ${targetValue} is complete.`,
        playbackHint: 'complete',
      }),
    );

    return {
      success: true,
      message: `Deleted value ${targetValue}.`,
      actionType: 'delete',
      targetValue,
      steps: this.withIndexes(steps),
      finalState: this.mapState(domainResult.state),
      coinFlips: [],
      showAlert: false,
    };
  }

  createResetResult(state: SkipListStateSnapshot): OperationResult {
    const steps = this.withIndexes([
      this.createStep({
        type: 'reset',
        message: 'Reset the skip list state.',
        playbackHint: 'structure',
      }),
      this.createStep({
        type: 'complete',
        message: 'Reset animation is complete.',
        playbackHint: 'complete',
      }),
    ]);

    return {
      success: true,
      message: 'Skip list reset complete.',
      actionType: 'reset',
      targetValue: null,
      steps,
      finalState: this.mapState(state),
      coinFlips: [],
      showAlert: false,
    };
  }

  private recordTrace(transitions: SearchTransition[]): OperationStep[] {
    const steps: OperationStep[] = [];

    for (const transition of transitions) {
      steps.push(
        this.createStep({
          type: 'visit',
          message: `Visit node ${transition.currentId} on level ${transition.level}.`,
          nodeIds: [transition.currentId],
          stateChanges: [{ nodeId: transition.currentId, state: 'visited' }],
          focusNodeId: transition.currentId,
          playbackHint: 'highlight',
        }),
      );
      steps.push(
        this.createStep({
          type: 'inspect_next',
          message: `Inspect next node ${transition.nextId} from ${transition.currentId}.`,
          nodeIds: [transition.currentId, transition.nextId],
          stateChanges: [{ nodeId: transition.nextId, state: 'next' }],
          focusNodeId: transition.currentId,
          nextNodeId: transition.nextId,
          playbackHint: 'highlight',
        }),
      );

      if (transition.action === 'move_right') {
        steps.push(
          this.createStep({
            type: 'move_right',
            message: `Move right from ${transition.currentId} to ${transition.nextId}.`,
            nodeIds: [transition.currentId, transition.nextId],
            focusNodeId: transition.currentId,
            nextNodeId: transition.nextId,
            direction: 'right',
            playbackHint: 'move',
          }),
        );
      }

      if (transition.action === 'move_down') {
        steps.push(
          this.createStep({
            type: 'move_down',
            message: `Move down from ${transition.currentId} to the next lower level.`,
            nodeIds: [transition.currentId],
            focusNodeId: transition.currentId,
            nextNodeId: transition.nextId,
            direction: 'down',
            playbackHint: 'move',
          }),
        );
      }
    }

    return steps;
  }

  private mapState(state: SkipListStateSnapshot): SkipListState {
    return {
      height: state.height,
      nodeCount: state.nodeCount,
      values: state.values,
      configuredSeed: state.configuredSeed,
      rngState: state.rngState,
      levels: state.levels,
    };
  }

  private withIndexes(steps: OperationStep[]): OperationStep[] {
    return steps.map((step, index) => ({
      ...step,
      index,
    }));
  }

  private createStep(input: {
    type: OperationStep['type'];
    message: string;
    nodeIds?: string[];
    stateChanges?: OperationStep['stateChanges'];
    focusNodeId?: string | null;
    nextNodeId?: string | null;
    direction?: OperationStep['direction'];
    structureChange?: OperationStep['structureChange'];
    playbackHint: OperationStep['playbackHint'];
  }): OperationStep {
    return {
      index: -1,
      type: input.type,
      message: input.message,
      nodeIds: input.nodeIds ?? [],
      stateChanges: input.stateChanges ?? [],
      focusNodeId: input.focusNodeId ?? null,
      nextNodeId: input.nextNodeId ?? null,
      direction: input.direction ?? null,
      structureChange: input.structureChange ?? null,
      playbackHint: input.playbackHint,
    };
  }
}
