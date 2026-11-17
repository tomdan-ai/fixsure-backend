import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DisputesService } from './disputes.service';

@ApiTags('Disputes')
@ApiBearerAuth()
@Controller('api/disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Get()
  @ApiOperation({ summary: 'List all disputes' })
  @ApiResponse({ status: 200, description: 'List of disputes' })
  async getAll() {
    return this.disputesService.getAllDisputes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispute details by ID with evidence' })
  @ApiResponse({ status: 200, description: 'Dispute details' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.disputesService.getDisputeById(id);
  }
}
