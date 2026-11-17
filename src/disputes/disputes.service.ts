import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispute } from '../entities/Dispute';

@Injectable()
export class DisputesService {
  constructor(@InjectRepository(Dispute) private disputeRepo: Repository<Dispute>) {}

  async getAllDisputes() {
    return this.disputeRepo.find({
      relations: ['raisedBy', 'request', 'request.property'],
    });
  }

  async getDisputeById(id: number) {
    const dispute = await this.disputeRepo.findOne({
      where: { id },
      relations: ['raisedBy', 'request', 'request.property', 'request.evidence'],
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    return dispute;
  }
}
