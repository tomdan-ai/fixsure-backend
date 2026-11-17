import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispute } from '../entities/Dispute';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Dispute])],
  controllers: [DisputesController],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}
