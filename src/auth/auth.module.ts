import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import redisStore from 'cache-manager-redis-store';

import { User } from '../users/entities/user.entity';
import { SessionsController } from './controllers/sessions.controller';
import { CreateSessionService } from './services/create-session.service';
import { RefreshSessionService } from './services/refresh-session.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: '1h' },
    }),
    CacheModule.registerAsync<CacheModuleOptions>({
      useFactory: async (): Promise<CacheModuleOptions> => ({
        store: redisStore,
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        },
        username: process.env.REDIS_USERNAME || 'redis',
        password: process.env.REDIS_PASSWORD || 'redis',
        ttl: 604800,
      }),
    }),
  ],
  controllers: [SessionsController],
  providers: [CreateSessionService, RefreshSessionService, JwtStrategy],
})
export class AuthModule {}
