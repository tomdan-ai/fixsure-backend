import { ApiProperty } from '@nestjs/swagger';

export class CreateQuoteDto {
  @ApiProperty({ example: 45000 })
  price!: number;

  @ApiProperty({ example: 'Supply and replace main 100A Schneider three-phase circuit breaker and test line balancing.' })
  scope!: string;

  @ApiProperty({ example: 2 })
  durationDays!: number;
}
