import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceRequest } from '../entities/MaintenanceRequest';
import { Property } from '../entities/Property';
import { User } from '../entities/User';
import { Quote } from '../entities/Quote';
import { Evidence } from '../entities/Evidence';
import { Dispute } from '../entities/Dispute';
import { Payment } from '../entities/Payment';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MaintenanceRequest,
      Property,
      User,
      Quote,
      Evidence,
      Dispute,
      Payment,
    ]),
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
