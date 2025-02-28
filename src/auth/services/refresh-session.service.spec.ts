import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Cache } from 'cache-manager';

import { User } from '../../users/entities/user.entity';
import { RefreshSessionService } from './refresh-session.service';

describe('RefreshSessionService', () => {
  let service: RefreshSessionService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshSessionService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mocked-jwt-token'),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RefreshSessionService>(RefreshSessionService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate a new session if refresh token is valid', async () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@email.com',
      active: true,
    } as User;

    const oldRefreshToken = 'old-refresh-token';

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
    jest.spyOn(cacheManager, 'get').mockResolvedValue(oldRefreshToken);
    jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);
    jest.spyOn(jwtService, 'sign').mockReturnValue('mocked-jwt-token');

    const result = await service.execute({ userId: user.id }, oldRefreshToken);

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { id: user.id, active: true },
    });
    expect(cacheManager.get).toHaveBeenCalledWith(`refreshToken:${user.email}`);
    expect(cacheManager.set).toHaveBeenCalledWith(
      `session:${user.email}`,
      expect.any(Object),
      21600,
    );
    expect(cacheManager.set).toHaveBeenCalledWith(
      `refreshToken:${user.email}`,
      expect.any(String),
      604800,
    );
    expect(result).toEqual({
      name: user.name,
      email: user.email,
      token: 'mocked-jwt-token',
      refreshToken: expect.any(String),
    });
  });

  it('should throw UnauthorizedException if refresh token does not match', async () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@email.com',
      active: true,
    } as User;

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
    jest.spyOn(cacheManager, 'get').mockResolvedValue('valid-refresh-token');

    await expect(
      service.execute({ userId: user.id }, 'invalid-refresh-token'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if refresh token is missing', async () => {
    await expect(service.execute({ userId: 1 }, '')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if user does not exist', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

    await expect(
      service.execute({ userId: 999 }, 'valid-refresh-token'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user is not active', async () => {
    const inactiveUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@email.com',
      active: false,
    } as User;

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(inactiveUser);

    await expect(
      service.execute({ userId: inactiveUser.id }, 'valid-refresh-token'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if refresh token is not found in Redis', async () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@email.com',
      active: true,
    } as User;

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
    jest.spyOn(cacheManager, 'get').mockResolvedValue(null);

    await expect(
      service.execute({ userId: user.id }, 'valid-refresh-token'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
