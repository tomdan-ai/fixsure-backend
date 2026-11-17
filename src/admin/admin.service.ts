import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { Dispute } from '../entities/Dispute';
import { MaintenanceRequest } from '../entities/MaintenanceRequest';
import { Payment } from '../entities/Payment';
import { AuditLog } from '../entities/AuditLog';
import { DecideDisputeDto, VerifyUserDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Dispute) private disputeRepo: Repository<Dispute>,
    @InjectRepository(MaintenanceRequest) private requestRepo: Repository<MaintenanceRequest>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  private async assertAdmin(userId: string) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const admin = await this.userRepo.findOne({ where: { id: userId } });
    if (!admin || admin.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required');
    }
    return admin;
  }

  async getOpenDisputes(adminId: string) {
    await this.assertAdmin(adminId);
    return this.disputeRepo.find({
      where: { status: 'OPEN' },
      relations: ['request', 'request.property', 'request.evidence', 'raisedBy'],
    });
  }

  async decideDispute(adminId: string, disputeId: number, dto: DecideDisputeDto) {
    const admin = await this.assertAdmin(adminId);

    const dispute = await this.disputeRepo.findOne({ where: { id: disputeId } });
    if (!dispute) throw new NotFoundException('Dispute not found');

    dispute.status = dto.decision === 'PAYOUT' ? 'RESOLVED_PAYOUT' : 'RESOLVED_REFUND';
    dispute.decision = dto.decision;
    dispute.decisionReason = dto.reason;
    dispute.decidedBy = admin.id;
    await this.disputeRepo.save(dispute);

    const request = await this.requestRepo.findOne({ where: { id: dispute.requestId } });
    if (request) {
      if (dto.decision === 'PAYOUT') {
        const payment = new Payment();
        payment.requestId = request.id;
        payment.type = 'PAYOUT';
        payment.internalRef = `payout_${Date.now()}`;
        payment.amount = 100;
        payment.status = 'SUCCESS';
        payment.providerRef = `paga_payout_${Date.now()}`;
        await this.paymentRepo.save(payment);
      }
      request.status = 'COMPLETED';
      await this.requestRepo.save(request);
    }

    // Write audit log
    const audit = new AuditLog();
    audit.actorId = admin.id;
    audit.action = `DISPUTE_DECIDED_${dto.decision}`;
    audit.entity = 'Dispute';
    audit.entityId = dispute.id;
    audit.meta = { decision: dto.decision, reason: dto.reason };
    await this.auditRepo.save(audit);

    return dispute;
  }

  async getUsers(adminId: string) {
    await this.assertAdmin(adminId);
    return this.userRepo.find({ relations: ['technicianProfile'] });
  }

  async verifyUser(adminId: string, targetUserId: string, dto?: VerifyUserDto) {
    const admin = await this.assertAdmin(adminId);

    const targetUser = await this.userRepo.findOne({ where: { id: targetUserId } });
    if (!targetUser) throw new NotFoundException('User not found');

    const status = dto?.status || 'VERIFIED';
    if (status === 'SUSPENDED') {
      targetUser.status = 'SUSPENDED';
    } else {
      targetUser.identityStatus = 'VERIFIED';
      targetUser.professionalStatus = 'VERIFIED';
    }
    await this.userRepo.save(targetUser);

    // Write audit log
    const audit = new AuditLog();
    audit.actorId = admin.id;
    audit.action = `USER_VERIFIED_${status}`;
    audit.entity = 'User';
    audit.entityId = 0;
    audit.meta = { targetUserId, status };
    await this.auditRepo.save(audit);

    return targetUser;
  }

  async getAllRequests(adminId: string) {
    await this.assertAdmin(adminId);
    return this.requestRepo.find({
      relations: ['property', 'quotes', 'quotes.technician', 'payments', 'disputes'],
    });
  }

  async getAuditLogs(adminId: string) {
    await this.assertAdmin(adminId);
    return this.auditRepo.find({
      relations: ['actor'],
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }
}
