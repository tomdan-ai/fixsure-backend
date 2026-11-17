import { Controller, Post, Get, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CurrentToken } from '../common/auth.decorator';
import { PagaWebhookDto } from './dto/payments.dto';

@ApiTags('Payments')
@Controller('api')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('requests/:id/pay')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate payment for approved quote via Paga Collect API (paymentRequest)' })
  @ApiResponse({ status: 200, description: 'Paga payment initiated / verified, request is FUNDED' })
  async payRequest(
    @CurrentToken() token: string,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    return this.paymentsService.payRequest(token, requestId);
  }

  @Get('requests/:id/payment')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment status for a request' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  async getPayment(
    @CurrentToken() token: string,
    @Param('id', ParseIntPipe) requestId: number,
  ) {
    return this.paymentsService.getPaymentByRequest(token, requestId);
  }

  @Post('webhooks/paga')
  @ApiOperation({ summary: 'Paga webhook callback (idempotent verification by providerRef)' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async webhook(@Body() dto: PagaWebhookDto) {
    return this.paymentsService.handleWebhook(dto);
  }
}
