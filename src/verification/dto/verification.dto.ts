import { ApiProperty } from '@nestjs/swagger';

export class IdentityVerificationDto {
  @ApiProperty({ example: '12345678901' })
  nin!: string;

  @ApiProperty({ example: 'ref_id_prov_123' })
  providerRef!: string;
}

export class TechnicianProfileDto {
  @ApiProperty({ example: ['ELECTRICAL', 'PLUMBING'] })
  categories!: string[];

  @ApiProperty({ example: 'Lagos' })
  city!: string;

  @ApiProperty({ example: 'Experienced certified electrician and plumber with 10+ years practice.' })
  bio!: string;
}
