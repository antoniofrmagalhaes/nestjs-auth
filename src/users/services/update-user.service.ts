import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';

interface UpdateUserDto {
  name?: string;
  email?: string;
}

@Injectable()
export class UpdateUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute(id: number, { name, email }: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (name) user.name = name;
    if (email) user.email = email;

    return this.userRepository.save(user);
  }
}
