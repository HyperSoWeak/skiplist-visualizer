import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { InsertRequestDto } from './dto/insert-request.dto';
import { ResetRequestDto } from './dto/reset-request.dto';
import { ValueRequestDto } from './dto/value-request.dto';
import {
  SkipListStateModel,
  OperationResultModel,
} from './models/swagger.models';
import type { OperationResult, SkipListState } from './models/skiplist.types';
import { SkipListService } from './skiplist.service';

@ApiTags('skiplist')
@Controller()
export class SkipListController {
  constructor(private readonly skipListService: SkipListService) {}

  @Get('state')
  @ApiOperation({ summary: 'Get the full skip list state snapshot.' })
  @ApiOkResponse({ type: SkipListStateModel })
  getState(): SkipListState {
    return this.skipListService.getState();
  }

  @Post('find')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Trace a find operation and return animation steps.',
  })
  @ApiOkResponse({ type: OperationResultModel })
  @ApiBadRequestResponse({ type: OperationResultModel })
  find(@Body() input: ValueRequestDto): OperationResult {
    return this.skipListService.find(input);
  }

  @Post('insert')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Insert a value, including search trace and coin flips.',
  })
  @ApiOkResponse({ type: OperationResultModel })
  @ApiBadRequestResponse({ type: OperationResultModel })
  insert(@Body() input: InsertRequestDto): OperationResult {
    return this.skipListService.insert(input);
  }

  @Post('delete')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Delete a value tower, including merge and level cleanup steps.',
  })
  @ApiOkResponse({ type: OperationResultModel })
  @ApiBadRequestResponse({ type: OperationResultModel })
  delete(@Body() input: ValueRequestDto): OperationResult {
    return this.skipListService.delete(input);
  }

  @Post('reset')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Reset the skip list and optionally preload values with a deterministic seed.',
  })
  @ApiOkResponse({ type: OperationResultModel })
  @ApiBadRequestResponse({ type: OperationResultModel })
  reset(@Body() input: ResetRequestDto): OperationResult {
    return this.skipListService.reset(input);
  }
}
