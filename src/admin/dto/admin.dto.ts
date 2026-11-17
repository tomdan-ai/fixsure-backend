import { ApiProperty } from '@nestjs/swagger';

export class DecideDisputeDto {
  @ApiProperty({ enum: ['PAYOUT', 'REFUND'], example: 'PAYOUT' })
  decision!: 'PAYOUT' | 'REFUND';

  @ApiProperty({ example: 'Review of uploaded after-evidence confirmed repair work is compliant.' })
  reason!: string;
}

export class VerifyUserDto {
  @ApiProperty({ enum: ['VERIFIED', 'REJECTED', 'SUSPENDED'], example: 'VERIFIED' })
  status!: 'VERIFIED' | 'REJECTED' | 'SUSPENDED';
}
