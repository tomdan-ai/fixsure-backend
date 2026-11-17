import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  name!: string;

  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @ApiProperty({ example: '+2348012345678' })
  phone!: string;

  @ApiProperty({ example: 'password123' })
  password!: string;

  @ApiProperty({ enum: ['MANAGER', 'TECHNICIAN', 'ADMIN'], example: 'MANAGER' })
  role!: 'MANAGER' | 'TECHNICIAN' | 'ADMIN';
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @ApiProperty({ example: 'password123' })
  password!: string;
}

export class UpdateProfileDto {
  @ApiProperty({ required: false, example: 'John Doe' })
  name?: string;

  @ApiProperty({ required: false, example: '+2348012345678' })
  phone?: string;
}
