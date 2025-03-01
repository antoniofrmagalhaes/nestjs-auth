import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';

@Injectable()
export class EnableUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = { ...user, active: true };

    try {
      return await this.userRepository.save(updatedUser);
    } catch (error) {
      throw new InternalServerErrorException('Error saving user to database');
    }
  }
}
