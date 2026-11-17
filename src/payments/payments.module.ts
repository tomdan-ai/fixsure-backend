import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../entities/Payment';
import { MaintenanceRequest } from '../entities/MaintenanceRequest';
import { Quote } from '../entities/Quote';
import { User } from '../entities/User';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, MaintenanceRequest, Quote, User])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
