import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Cache } from 'cache-manager';
import { v4 as uuid } from 'uuid';

import { User } from '../../users/entities/user.entity';

@Injectable()
export class RefreshSessionService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async execute(
    user: { userId: number },
    refreshToken: string,
  ): Promise<{
    name: string;
    email: string;
    token: string;
    refreshToken: string;
  }> {
    if (!user || !refreshToken) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userData = await this.userRepository.findOne({
      where: { id: user.userId, active: true },
    });

    if (!userData) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const storedRefreshToken = await this.cacheManager.get(
      `refreshToken:${userData.email}`,
    );

    if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newToken = this.jwtService.sign(
      { sub: userData.id },
      { expiresIn: '6h' },
    );
    const newRefreshToken = uuid();

    const sessionData = {
      name: userData.name,
      email: userData.email,
      token: newToken,
      refreshToken: newRefreshToken,
    };

    await this.cacheManager.set(
      `session:${userData.email}`,
      sessionData,
      21600,
    );
    await this.cacheManager.set(
      `refreshToken:${userData.email}`,
      newRefreshToken,
      604800,
    );

    return sessionData;
  }
}
