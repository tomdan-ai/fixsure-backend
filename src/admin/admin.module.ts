import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/User';
import { Dispute } from '../entities/Dispute';
import { MaintenanceRequest } from '../entities/MaintenanceRequest';
import { Payment } from '../entities/Payment';
import { AuditLog } from '../entities/AuditLog';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Dispute,
      MaintenanceRequest,
      Payment,
      AuditLog,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
