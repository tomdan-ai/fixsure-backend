import { Controller, Post, Get, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import { CurrentToken } from '../common/auth.decorator';
import {
  CreateRequestDto,
  UploadEvidenceDto,
  OpenDisputeDto,
  DisputeResponseDto,
} from './dto/requests.dto';

@ApiTags('Requests')
@ApiBearerAuth()
@Controller('api/requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a maintenance request (Manager only)' })
  @ApiResponse({ status: 201, description: 'Request created with status OPEN' })
  async create(@CurrentToken() token: string, @Body() dto: CreateRequestDto) {
    return this.requestsService.createRequest(token, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all requests (Manager sees own requests)' })
  @ApiResponse({ status: 200, description: 'List of maintenance requests' })
  async getAll(@CurrentToken() token: string) {
    return this.requestsService.getRequests(token);
  }

  @Get('available')
  @ApiOperation({ summary: 'Find available OPEN requests matching technician category and city' })
  @ApiResponse({ status: 200, description: 'List of matching requests' })
  async getAvailable(@CurrentToken() token: string) {
    return this.requestsService.getAvailableRequests(token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get request details with property, quotes, evidence and disputes' })
  @ApiResponse({ status: 200, description: 'Request details' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.requestsService.getRequestById(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel request (if OPEN or AWAITING_PAYMENT)' })
  async cancel(@CurrentToken() token: string, @Param('id', ParseIntPipe) id: number) {
    return this.requestsService.cancelRequest(token, id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Technician starts work (FUNDED -> IN_PROGRESS)' })
  async startWork(@CurrentToken() token: string, @Param('id', ParseIntPipe) id: number) {
    return this.requestsService.startWork(token, id);
  }

  @Post(':id/evidence')
  @ApiOperation({ summary: 'Upload BEFORE or AFTER evidence photos/notes' })
  async uploadEvidence(
    @CurrentToken() token: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UploadEvidenceDto,
  ) {
    return this.requestsService.uploadEvidence(token, id, dto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Technician marks work complete (requires AFTER evidence)' })
  async completeWork(@CurrentToken() token: string, @Param('id', ParseIntPipe) id: number) {
    return this.requestsService.completeWork(token, id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Manager confirms completion and triggers payout' })
  async confirmWork(@CurrentToken() token: string, @Param('id', ParseIntPipe) id: number) {
    return this.requestsService.confirmWork(token, id);
  }

  @Post(':id/dispute')
  @ApiOperation({ summary: 'Manager opens a dispute on the request' })
  async openDispute(
    @CurrentToken() token: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OpenDisputeDto,
  ) {
    return this.requestsService.openDispute(token, id, dto);
  }

  @Post(':id/dispute/response')
  @ApiOperation({ summary: 'Technician submits rebuttal/response to dispute' })
  async respondToDispute(
    @CurrentToken() token: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DisputeResponseDto,
  ) {
    return this.requestsService.respondToDispute(token, id, dto);
  }
}
