import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/properties.dto';
import { CurrentToken } from '../common/auth.decorator';

@ApiTags('Properties')
@ApiBearerAuth()
@Controller('api/properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new managed property (Manager only)' })
  @ApiResponse({ status: 201, description: 'Property created' })
  async create(@CurrentToken() token: string, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.createProperty(token, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all properties managed by current user' })
  @ApiResponse({ status: 200, description: 'List of properties' })
  async getAll(@CurrentToken() token: string) {
    return this.propertiesService.getProperties(token);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property details by ID' })
  @ApiResponse({ status: 200, description: 'Property details' })
  async getOne(@Param('id') id: string) {
    return this.propertiesService.getPropertyById(id);
  }
}
