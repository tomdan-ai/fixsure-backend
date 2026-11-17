import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Quote } from '../entities/Quote';
import { MaintenanceRequest } from '../entities/MaintenanceRequest';
import { User } from '../entities/User';
import { CreateQuoteDto } from './dto/quotes.dto';

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote) private quoteRepo: Repository<Quote>,
    @InjectRepository(MaintenanceRequest) private requestRepo: Repository<MaintenanceRequest>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async createQuote(userId: string, requestId: number, dto: CreateQuoteDto) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['technicianProfile'],
    });
    if (!user || user.role !== 'TECHNICIAN') throw new ForbiddenException('Only technicians can submit quotes');

    const request = await this.requestRepo.findOne({ where: { id: requestId } });
    if (!request || request.status !== 'OPEN') {
      throw new BadRequestException('Request is not open for quoting');
    }

    const quote = new Quote();
    quote.requestId = requestId;
    quote.request = request;
    quote.technician = user;
    quote.price = dto.price;
    quote.scope = dto.scope;
    quote.durationDays = dto.durationDays;
    quote.status = 'SUBMITTED';

    return this.quoteRepo.save(quote);
  }

  async getQuotesForRequest(requestId: number) {
    const request = await this.requestRepo.findOne({
      where: { id: requestId },
      relations: ['quotes', 'quotes.technician'],
    });
    if (!request) throw new NotFoundException('Request not found');

    return (request.quotes || []).map((quote) => ({
      ...quote,
      technicianBadges: quote.technician && quote.technician.getBadges ? quote.technician.getBadges() : [],
    }));
  }

  async approveQuote(userId: string, quoteId: number) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== 'MANAGER') throw new ForbiddenException('Only managers can approve quotes');

    const quote = await this.quoteRepo.findOne({
      where: { id: quoteId },
      relations: ['request'],
    });
    if (!quote) throw new NotFoundException('Quote not found');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Mark other quotes for this request as NOT_SELECTED
      await queryRunner.manager.update(
        Quote,
        { requestId: quote.requestId, status: 'SELECTED' },
        { status: 'NOT_SELECTED' },
      );

      // Select this quote
      await queryRunner.manager.update(Quote, quote.id, { status: 'SELECTED' });

      // Update maintenance request
      await queryRunner.manager.update(
        MaintenanceRequest,
        quote.requestId,
        {
          selectedQuoteId: quote.id,
          status: 'AWAITING_PAYMENT',
        },
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return this.quoteRepo.findOne({
      where: { id: quote.id },
      relations: ['request', 'technician'],
    });
  }
}
