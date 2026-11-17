import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestDto {
  @ApiProperty({ example: 'property-uuid-string' })
  propertyId!: string;

  @ApiProperty({ enum: ['ELECTRICAL', 'PLUMBING', 'AC_REFRIGERATION'], example: 'ELECTRICAL' })
  category!: 'ELECTRICAL' | 'PLUMBING' | 'AC_REFRIGERATION';

  @ApiProperty({ example: 'Circuit breaker tripping frequently' })
  title!: string;

  @ApiProperty({ example: 'Main office distribution board keeps tripping when AC units turn on.' })
  description!: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH'], example: 'HIGH' })
  urgency!: 'LOW' | 'MEDIUM' | 'HIGH';

  @ApiProperty({ required: false, example: '2026-11-20T10:00:00Z' })
  preferredDate?: Date;
}

export class UploadEvidenceDto {
  @ApiProperty({ enum: ['BEFORE', 'AFTER'], example: 'BEFORE' })
  kind!: 'BEFORE' | 'AFTER';

  @ApiProperty({ example: 'https://storage.fixsure.io/evidence/before-1.jpg' })
  url!: string;

  @ApiProperty({ example: 'Burned terminals found inside distribution box.' })
  note!: string;
}

export class OpenDisputeDto {
  @ApiProperty({ example: 'Work was incomplete and AC breaker is still tripping.' })
  reason!: string;
}

export class DisputeResponseDto {
  @ApiProperty({ example: 'The circuit breaker was replaced and fully tested under load on site.' })
  reason!: string;
}
