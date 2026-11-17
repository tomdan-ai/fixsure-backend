import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { TechnicianProfile } from '../entities/TechnicianProfile';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(TechnicianProfile) private techRepo: Repository<TechnicianProfile>,
  ) {}

  async register(name: string, email: string, phone: string, password: string, role: 'MANAGER' | 'TECHNICIAN' | 'ADMIN') {
    const user = new User();
    user.name = name;
    user.email = email;
    user.phone = phone;
    user.role = role;
    user.status = 'ACTIVE';
    user.contactVerified = false;
    user.identityStatus = 'NOT_STARTED';
    user.passwordHash = password;
    const saved = await this.userRepo.save(user);
    return { id: saved.id, name: saved.name, role: saved.role };
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'role', 'passwordHash'],
    });
    if (!user || user.passwordHash !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return { id: user.id, name: user.name, email: user.email, role: user.role, token: user.id };
  }

  async getMe(userId: string) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      contactVerified: user.contactVerified,
      identityStatus: user.identityStatus,
      badges: user.getBadges ? user.getBadges() : [],
    };
  }

  async updateProfile(userId: string, data: Partial<User>) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    await this.userRepo.update(userId, data);
    return this.userRepo.findOne({ where: { id: userId } });
  }

  async getUserById(id: string) {
    return this.userRepo.findOne({ where: { id } });
  }
}
