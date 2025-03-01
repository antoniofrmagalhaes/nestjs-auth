import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import * as bcrypt from 'bcryptjs';

import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class CreateUserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async execute({
    name,
    email,
    password,
  }: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    let hashedPassword: string;

    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (error) {
      throw new InternalServerErrorException('Error hashing password');
    }

    const user = this.userRepository.create({
      name,
      email,
      password: hashedPassword,
    });

    let savedUser: User;

    try {
      savedUser = await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException('Error saving user to database');
    }

    delete savedUser.password;

    return savedUser;
  }
}
