import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional } from 'class-validator';

import { ValueRequestDto } from './value-request.dto';

export class InsertRequestDto extends ValueRequestDto {
  @ApiPropertyOptional({
    description:
      'Optional deterministic coin flip results for this insert. Each true promotes one more level.',
    type: [Boolean],
    example: [true, false],
  })
  @IsOptional()
  @IsArray()
  @IsBoolean({ each: true })
  flipSequence?: boolean[];
}
