import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../entities/Property';
import { User } from '../entities/User';
import { CreatePropertyDto } from './dto/properties.dto';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectRepository(Property) private propertyRepo: Repository<Property>,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  async createProperty(userId: string, dto: CreatePropertyDto) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== 'MANAGER') throw new ForbiddenException('Only managers can create properties');

    const property = new Property();
    property.name = dto.name;
    property.address = dto.address;
    property.city = dto.city;
    property.managerId = user.id;
    property.manager = user;
    return this.propertyRepo.save(property);
  }

  async getProperties(userId: string) {
    if (!userId) throw new UnauthorizedException('Unauthorized');
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return this.propertyRepo.find({ where: { managerId: user.id } });
  }

  async getPropertyById(id: string) {
    const property = await this.propertyRepo.findOne({ where: { id }, relations: ['manager', 'requests'] });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }
}
