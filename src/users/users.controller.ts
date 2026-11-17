import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get user details by ID' })
  @ApiResponse({ status: 200, description: 'User profile with badges' })
  async getUser(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }
}
