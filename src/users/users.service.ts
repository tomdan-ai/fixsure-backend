import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async getUser(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['technicianProfile'],
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      contactVerified: user.contactVerified,
      identityStatus: user.identityStatus,
      badges: user.getBadges ? user.getBadges() : [],
      technicianProfile: user.technicianProfile,
    };
  }
}
