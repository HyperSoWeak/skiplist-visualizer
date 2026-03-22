import { Module } from '@nestjs/common';
import { SkipListModule } from './skiplist/skiplist.module';

@Module({
  imports: [SkipListModule],
})
export class AppModule {}
