import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';

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

    if (email) {
      const emailExists = await this.userRepository.findOne({
        where: { email },
      });

      if (emailExists && emailExists.id !== id) {
        throw new ConflictException('Email already in use');
      }

      user.email = email;
    }

    if (name) user.name = name;

    return this.userRepository.save(user);
  }
}
