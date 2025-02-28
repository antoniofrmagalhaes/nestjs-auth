import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import * as bcrypt from 'bcryptjs';
import { Cache } from 'cache-manager';
import { v4 as uuid } from 'uuid';

import { User } from '../../users/entities/user.entity';
import { CreateSessionDto } from '../dto/create-session.dto';

@Injectable()
export class CreateSessionService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async execute({ email, password }: CreateSessionDto): Promise<{
    name: string;
    email: string;
    token: string;
    refreshToken: string;
  }> {
    const user = await this.userRepository.findOne({
      where: { email, active: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sessionKey = `session:${email}`;
    const refreshKey = `refreshToken:${email}`;

    const existingSession = await this.cacheManager.get(sessionKey);

    if (existingSession) {
      return existingSession as {
        name: string;
        email: string;
        token: string;
        refreshToken: string;
      };
    }

    const token = this.jwtService.sign({ sub: user.id }, { expiresIn: '6h' });
    const refreshToken = uuid();

    const sessionData = {
      name: user.name,
      email: user.email,
      token,
      refreshToken,
    };

    await this.cacheManager.set(sessionKey, sessionData, 21600);
    await this.cacheManager.set(refreshKey, refreshToken, 604800);

    return sessionData;
  }
}
