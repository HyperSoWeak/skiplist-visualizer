import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class ResetRequestDto {
  @ApiPropertyOptional({
    description: 'Optional unsigned 32-bit seed for deterministic coin flips.',
    example: 20260322,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'seed must be an integer when provided' })
  @Min(0)
  @Max(4294967295)
  seed?: number;

  @ApiPropertyOptional({
    description:
      'Optional list of integers to insert immediately after reset using the configured seed.',
    type: [Number],
    example: [10, 20, 30],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Type(() => Number)
  @IsInt({ each: true, message: 'values must contain valid integers only' })
  values?: number[];
}
