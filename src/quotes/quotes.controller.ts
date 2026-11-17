import { Controller, Post, Get, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CurrentToken } from '../common/auth.decorator';
import { CreateQuoteDto } from './dto/quotes.dto';

@ApiTags('Quotes')
@ApiBearerAuth()
@Controller('api')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post('requests/:id/quotes')
  @ApiOperation({ summary: 'Technician submits a quote for an open request' })
  @ApiResponse({ status: 201, description: 'Quote submitted' })
  async createQuote(
    @CurrentToken() token: string,
    @Param('id', ParseIntPipe) requestId: number,
    @Body() dto: CreateQuoteDto,
  ) {
    return this.quotesService.createQuote(token, requestId, dto);
  }

  @Get('requests/:id/quotes')
  @ApiOperation({ summary: 'Get all quotes submitted for a request (includes technician trust badges)' })
  @ApiResponse({ status: 200, description: 'List of quotes with badges' })
  async getQuotes(@Param('id', ParseIntPipe) requestId: number) {
    return this.quotesService.getQuotesForRequest(requestId);
  }

  @Post('quotes/:id/approve')
  @ApiOperation({ summary: 'Manager approves quote in a single transaction (moves request to AWAITING_PAYMENT)' })
  @ApiResponse({ status: 200, description: 'Quote approved' })
  async approveQuote(
    @CurrentToken() token: string,
    @Param('id', ParseIntPipe) quoteId: number,
  ) {
    return this.quotesService.approveQuote(token, quoteId);
  }
}
