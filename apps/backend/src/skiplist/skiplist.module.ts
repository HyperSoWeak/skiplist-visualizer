import { Module } from '@nestjs/common';

import { SkipListController } from './skiplist.controller';
import { SkipListService } from './skiplist.service';

@Module({
  controllers: [SkipListController],
  providers: [SkipListService],
})
export class SkipListModule {}
