import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/User';
import { TechnicianProfile } from '../entities/TechnicianProfile';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, TechnicianProfile])],
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
