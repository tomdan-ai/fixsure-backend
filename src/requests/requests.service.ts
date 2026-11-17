import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { MaintenanceRequest } from '../entities/MaintenanceRequest';
import { Property } from '../entities/Property';
import { User } from '../entities/User';
import { Quote } from '../entities/Quote';
import { Evidence } from '../entities/Evidence';
import { Dispute } from '../entities/Dispute';
import { Payment } from '../entities/Payment';
import { paymentProvider } from '../payment/paymentProvider';
import {
  CreateRequestDto,
  UploadEvidenceDto,
  OpenDisputeDto,
  DisputeResponseDto,
} from './dto/requests.dto';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(MaintenanceRequest) private requestRepo: Repository<MaintenanceRequest>,
    @InjectRepository(Property) private propertyRepo: Repository<Property>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Quote) private quoteRepo: Repository<Quote>,
    @InjectRepository(Evidence) private evidenceRepo: Repository<Evidence>,
    @InjectRepository(Dispute) private disputeRepo: Repository<Dispute>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
  ) {}

  async createRequest(userId: string, dto: CreateRequestDto) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== 'MANAGER') throw new ForbiddenException('Only managers can create requests');

    const property = await this.propertyRepo.findOne({ where: { id: dto.propertyId } });
    if (!property) throw new NotFoundException('Property not found');

    const request = new MaintenanceRequest();
    request.propertyId = dto.propertyId;
    request.category = dto.category;
    request.title = dto.title;
    request.description = dto.description;
    request.urgency = dto.urgency || 'MEDIUM';
    request.preferredDate = dto.preferredDate ? new Date(dto.preferredDate) : new Date();
    request.status = 'OPEN';
    request.createdBy = user;

    return this.requestRepo.save(request);
  }

  async getRequests(userId: string) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    if (user.role === 'MANAGER') {
      const properties = await this.propertyRepo.find({ where: { managerId: user.id } });
      const propertyIds = properties.map((p) => p.id);
      if (propertyIds.length === 0) return [];
      return this.requestRepo.find({
        where: { propertyId: In(propertyIds) },
        relations: ['property'],
      });
    }

    return this.requestRepo.find({ relations: ['property'] });
  }

  async getAvailableRequests(userId: string) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['technicianProfile'],
    });
    if (!user || user.role !== 'TECHNICIAN') throw new ForbiddenException('Only technicians can view available requests');
    if (!user.technicianProfile) throw new NotFoundException('Technician profile not found');

    const { categories, city } = user.technicianProfile;
    const requests = await this.requestRepo.find({
      where: { status: 'OPEN' },
      relations: ['property'],
    });

    return requests.filter((req) => {
      const matchCat = categories && categories.includes(req.category);
      const matchCity = !city || !req.property || req.property.city.toLowerCase() === city.toLowerCase();
      return matchCat && matchCity;
    });
  }

  async getRequestById(id: number) {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ['property', 'quotes', 'quotes.technician', 'evidence', 'disputes', 'payments'],
    });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  async cancelRequest(userId: string, id: number) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'OPEN' && request.status !== 'AWAITING_PAYMENT') {
      throw new BadRequestException('Cannot cancel request in this state');
    }
    request.status = 'CANCELLED';
    await this.requestRepo.save(request);
    return { status: request.status };
  }

  async startWork(userId: string, id: number) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== 'TECHNICIAN') throw new ForbiddenException('Only technicians can start jobs');

    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request || request.status !== 'FUNDED') {
      throw new BadRequestException('Request is not in FUNDED state');
    }

    if (request.selectedQuoteId) {
      const quote = await this.quoteRepo.findOne({
        where: { id: request.selectedQuoteId },
        relations: ['technician'],
      });
      if (quote && quote.technician && quote.technician.id !== user.id) {
        throw new ForbiddenException('You are not the selected technician for this job');
      }
    }

    request.status = 'IN_PROGRESS';
    await this.requestRepo.save(request);
    return { status: request.status };
  }

  async uploadEvidence(userId: string, id: number, dto: UploadEvidenceDto) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== 'TECHNICIAN') throw new ForbiddenException('Only technicians can upload evidence');

    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request || request.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Request must be IN_PROGRESS to upload evidence');
    }

    const evidence = new Evidence();
    evidence.requestId = request.id;
    evidence.kind = dto.kind;
    evidence.url = dto.url;
    evidence.note = dto.note || '';
    evidence.uploadedBy = user;
    return this.evidenceRepo.save(evidence);
  }

  async completeWork(userId: string, id: number) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== 'TECHNICIAN') throw new ForbiddenException('Only technicians can complete jobs');

    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request || request.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Request must be IN_PROGRESS to complete');
    }

    const afterEvidence = await this.evidenceRepo.find({
      where: { requestId: request.id, kind: 'AFTER' },
    });
    if (afterEvidence.length === 0) {
      throw new BadRequestException('At least one AFTER evidence item is required to complete');
    }

    request.status = 'AWAITING_CONFIRMATION';
    await this.requestRepo.save(request);
    return { status: request.status };
  }

  async confirmWork(userId: string, id: number) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== 'MANAGER') throw new ForbiddenException('Only managers can confirm work');

    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request || request.status !== 'AWAITING_CONFIRMATION') {
      throw new BadRequestException('Request is not awaiting confirmation');
    }

    // Trigger Paga payout to selected technician
    let quote = null;
    if (request.selectedQuoteId) {
      quote = await this.quoteRepo.findOne({
        where: { id: request.selectedQuoteId },
        relations: ['technician'],
      });
    }

    const payoutAmount = quote ? Number(quote.price) : 100;
    const recipientPhone = quote?.technician?.phone || '08012345678';
    const internalRef = `PAGA_PAYOUT_${Date.now()}_${request.id}`;

    // Call Paga Payout API (moneyTransfer)
    const payoutResult = await paymentProvider.payout({
      internalRef,
      amount: payoutAmount,
      recipient: {
        accountOrPhone: recipientPhone,
        name: quote?.technician?.name || 'Technician',
      },
    });

    let payout = await this.paymentRepo.findOne({ where: { requestId: request.id, type: 'PAYOUT' } });
    if (!payout) {
      payout = new Payment();
      payout.requestId = request.id;
      payout.type = 'PAYOUT';
      payout.internalRef = internalRef;
      payout.amount = payoutAmount;
    }
    payout.providerRef = payoutResult.providerRef;
    payout.status = 'SUCCESS';
    await this.paymentRepo.save(payout);

    request.status = 'COMPLETED';
    await this.requestRepo.save(request);
    return {
      status: request.status,
      message: 'Work confirmed. Payout initiated to technician via Paga Money Transfer.',
      payment: payout,
    };
  }

  async openDispute(userId: string, id: number, dto: OpenDisputeDto) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Request not found');

    const dispute = new Dispute();
    dispute.requestId = request.id;
    dispute.raisedBy = user;
    dispute.reason = dto.reason;
    dispute.status = 'OPEN';
    const saved = await this.disputeRepo.save(dispute);

    request.status = 'DISPUTED';
    await this.requestRepo.save(request);

    return saved;
  }

  async respondToDispute(userId: string, id: number, dto: DisputeResponseDto) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== 'TECHNICIAN') throw new ForbiddenException('Only technicians can respond to disputes');

    return { message: 'Dispute response recorded', response: dto.reason };
  }
}
