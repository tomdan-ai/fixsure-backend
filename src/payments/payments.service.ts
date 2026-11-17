import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/Payment';
import { MaintenanceRequest } from '../entities/MaintenanceRequest';
import { Quote } from '../entities/Quote';
import { User } from '../entities/User';
import { paymentProvider, pagaEngineProvider } from '../payment/paymentProvider';
import { PagaWebhookDto } from './dto/payments.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(MaintenanceRequest) private requestRepo: Repository<MaintenanceRequest>,
    @InjectRepository(Quote) private quoteRepo: Repository<Quote>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  /**
   * Manager initiates payment for the selected quote via Paga Collect API.
   * If Paga credentials are in .env, sends real request to Paga beta-collect.paga.com.
   * Generates a checkoutUrl / paymentUrl for the manager to complete the transaction.
   */
  async payRequest(userId: string, requestId: number) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== 'MANAGER') throw new ForbiddenException('Only managers can pay for requests');

    const request = await this.requestRepo.findOne({ where: { id: requestId } });
    if (!request || request.status !== 'AWAITING_PAYMENT') {
      throw new BadRequestException('Request is not awaiting payment');
    }

    if (!request.selectedQuoteId) {
      throw new BadRequestException('No quote selected for this request');
    }

    const quote = await this.quoteRepo.findOne({ where: { id: request.selectedQuoteId } });
    const amount = quote ? Number(quote.price) : 50000;
    const internalRef = `PAGA_COLLECT_${Date.now()}_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const payment = new Payment();
    payment.requestId = request.id;
    payment.type = 'COLLECTION';
    payment.internalRef = internalRef;
    payment.amount = amount;
    payment.status = 'PENDING';
    payment.requester = user;
    await this.paymentRepo.save(payment);

    // Call Paga Collect API (paymentRequest)
    const result = await paymentProvider.collect({
      internalRef,
      amount,
      payer: {
        name: user.name,
        email: user.email,
        phone: user.phone || '08000000000',
      },
      callbackUrl: process.env.PAGA_CALLBACK_URL || 'http://localhost:3000/api/webhooks/paga',
    });

    payment.providerRef = result.providerRef;
    
    // In simulated mode without Paga sandbox keys, immediately mark SUCCESS & FUNDED.
    // In live/sandbox mode with Paga keys, status is updated upon webhook/redirection.
    if (!pagaEngineProvider.isConfigured()) {
      payment.status = 'SUCCESS';
      request.status = 'FUNDED';
      await this.requestRepo.save(request);
    }
    await this.paymentRepo.save(payment);

    return {
      message: pagaEngineProvider.isConfigured()
        ? 'Paga payment request initiated. Please complete payment using the checkoutUrl.'
        : 'Paga Collect API simulated (Add Paga API keys to .env to connect to live sandbox). Request is FUNDED.',
      paymentUrl: result.paymentUrl,
      payment,
      requestStatus: request.status,
    };
  }

  async getPaymentByRequest(userId: string, requestId: number) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const payment = await this.paymentRepo.findOne({ where: { requestId } });
    if (!payment) throw new NotFoundException('No payment record found for this request');
    return payment;
  }

  /**
   * Handles incoming Paga webhook callbacks.
   * Updates payment record to SUCCESS and transitions request to FUNDED.
   */
  async handleWebhook(dto: PagaWebhookDto) {
    const isValid = paymentProvider.verifyWebhook(dto, dto.signature);
    if (!isValid) {
      return { received: false, error: 'Invalid Paga webhook signature' };
    }

    const payment = await this.paymentRepo.findOne({ where: { providerRef: dto.providerRef } });
    if (!payment) {
      return { received: true, note: 'Payment record not found for providerRef' };
    }

    if (dto.status === 'SUCCESS' && payment.status !== 'SUCCESS') {
      payment.status = 'SUCCESS';
      await this.paymentRepo.save(payment);
      await this.requestRepo.update(payment.requestId, { status: 'FUNDED' });
    }

    return { received: true, status: payment.status };
  }
}
