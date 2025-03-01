import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
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

    if (!name && !email) {
      throw new BadRequestException('At least one field must be updated');
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

    try {
      return await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException('Error saving user to database');
    }
  }
}
