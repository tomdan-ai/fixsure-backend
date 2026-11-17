import { ApiProperty } from '@nestjs/swagger';

export class CreatePropertyDto {
  @ApiProperty({ example: 'Sample Office Complex' })
  name!: string;

  @ApiProperty({ example: '12 Marina Street' })
  address!: string;

  @ApiProperty({ example: 'Lagos' })
  city!: string;
}
