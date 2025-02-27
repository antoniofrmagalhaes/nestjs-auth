import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import * as bcrypt from 'bcryptjs';

import { User } from '../../users/entities/user.entity';
import { CreateSessionDto } from '../dto/create-session.dto';

@Injectable()
export class CreateSessionService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async execute({ email, password }: CreateSessionDto): Promise<{
    name: string;
    email: string;
    token: string;
  }> {
    const user = await this.userRepository.findOne({
      where: { email, active: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({ sub: user.id });

    return {
      name: user.name,
      email: user.email,
      token,
    };
  }
}
