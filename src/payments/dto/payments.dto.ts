import { ApiProperty } from '@nestjs/swagger';

export class PagaWebhookDto {
  @ApiProperty({ example: 'paga_1700000000_abc123' })
  providerRef!: string;

  @ApiProperty({ example: 'SUCCESS' })
  status!: 'PENDING' | 'SUCCESS' | 'FAILED';

  @ApiProperty({ required: false, example: 'mock_signature_hash' })
  signature?: string;
}
