import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty } from 'class-validator';

export class ValueRequestDto {
  @ApiProperty({
    description: 'Target integer value for the skip list operation.',
    example: 42,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsInt({ message: 'value must be a valid integer' })
  value!: number;
}
