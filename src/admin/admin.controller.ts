import { Controller, Post, Get, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CurrentToken } from '../common/auth.decorator';
import { DecideDisputeDto, VerifyUserDto } from './dto/admin.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('disputes')
  @ApiOperation({ summary: 'Admin queue of open disputes with evidence from both sides' })
  @ApiResponse({ status: 200, description: 'List of open disputes' })
  async getDisputes(@CurrentToken() token: string) {
    return this.adminService.getOpenDisputes(token);
  }

  @Post('disputes/:id/decide')
  @ApiOperation({ summary: 'Admin records decision on dispute (PAYOUT or REFUND) and triggers payout/refund' })
  @ApiResponse({ status: 200, description: 'Dispute decision recorded' })
  async decideDispute(
    @CurrentToken() token: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DecideDisputeDto,
  ) {
    return this.adminService.decideDispute(token, id, dto);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all registered users with technician profiles and verification statuses' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsers(@CurrentToken() token: string) {
    return this.adminService.getUsers(token);
  }

  @Post('users/:id/verify')
  @ApiOperation({ summary: 'Admin verifies or suspends a technician / user' })
  @ApiResponse({ status: 200, description: 'User verification updated' })
  async verifyUser(
    @CurrentToken() token: string,
    @Param('id') targetId: string,
    @Body() dto: VerifyUserDto,
  ) {
    return this.adminService.verifyUser(token, targetId, dto);
  }

  @Get('requests')
  @ApiOperation({ summary: 'Admin overview of all requests, quotes and payments' })
  @ApiResponse({ status: 200, description: 'Overview of requests' })
  async getRequests(@CurrentToken() token: string) {
    return this.adminService.getAllRequests(token);
  }

  @Get('audit')
  @ApiOperation({ summary: 'Admin audit log (recent 100 system events)' })
  @ApiResponse({ status: 200, description: 'Audit log entries' })
  async getAudit(@CurrentToken() token: string) {
    return this.adminService.getAuditLogs(token);
  }
}
