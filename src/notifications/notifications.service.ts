import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/Notification';
import { User } from '../entities/User';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async getNotifications(userId: string) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number) {
    const notification = await this.notificationRepo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    notification.read = true;
    return this.notificationRepo.save(notification);
  }
}
