import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { TechnicianProfile } from '../entities/TechnicianProfile';
import { TechnicianProfileDto } from './dto/verification.dto';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(TechnicianProfile) private techRepo: Repository<TechnicianProfile>,
  ) {}

  async verifyContact(userId: string) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    user.contactVerified = true;
    await this.userRepo.save(user);
    return { contactVerified: user.contactVerified };
  }

  async verifyIdentity(userId: string, nin: string, providerRef: string) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    user.identityStatus = 'VERIFIED';
    await this.userRepo.save(user);
    return { identityStatus: user.identityStatus, providerRef };
  }

  async updateTechnicianProfile(userId: string, dto: TechnicianProfileDto) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['technicianProfile'] });
    if (!user) throw new UnauthorizedException('User not found');

    let profile = user.technicianProfile;
    if (!profile) {
      profile = new TechnicianProfile();
      profile.userId = user.id;
    }
    profile.categories = dto.categories;
    profile.city = dto.city;
    profile.bio = dto.bio;
    profile.professionalStatus = 'VERIFIED';
    await this.techRepo.save(profile);

    user.professionalStatus = 'VERIFIED';
    await this.userRepo.save(user);

    return {
      categories: profile.categories,
      city: profile.city,
      bio: profile.bio,
      professionalStatus: profile.professionalStatus,
    };
  }
}
