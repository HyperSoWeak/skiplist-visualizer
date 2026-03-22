import { Injectable } from '@nestjs/common';

import { InsertRequestDto } from './dto/insert-request.dto';
import { ResetRequestDto } from './dto/reset-request.dto';
import { ValueRequestDto } from './dto/value-request.dto';
import { SkipList } from './core/skip-list';
import { OperationResult, SkipListState } from './models/skiplist.types';
import { SkipListOperationRecorder } from './skiplist-operation-recorder';

@Injectable()
export class SkipListService {
  private readonly recorder = new SkipListOperationRecorder();
  private skipList = new SkipList();

  getState(): SkipListState {
    return this.skipList.getState();
  }

  find(input: ValueRequestDto): OperationResult {
    return this.recorder.createFindResult(
      input.value,
      this.skipList.find(input.value),
    );
  }

  insert(input: InsertRequestDto): OperationResult {
    return this.recorder.createInsertResult(
      input.value,
      this.skipList.insert(input.value, { flipSequence: input.flipSequence }),
    );
  }

  delete(input: ValueRequestDto): OperationResult {
    return this.recorder.createDeleteResult(
      input.value,
      this.skipList.delete(input.value),
    );
  }

  reset(input: ResetRequestDto): OperationResult {
    this.skipList = new SkipList({ seed: input.seed });

    for (const value of input.values ?? []) {
      this.skipList.insert(value);
    }

    return this.recorder.createResetResult(this.skipList.getState());
  }
}
