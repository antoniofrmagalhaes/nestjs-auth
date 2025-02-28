import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import * as bcrypt from 'bcryptjs';
import { Cache } from 'cache-manager';

import { User } from '../../users/entities/user.entity';
import { CreateSessionService } from './create-session.service';

describe('CreateSessionService', () => {
  let service: CreateSessionService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSessionService,
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

    service = module.get<CreateSessionService>(CreateSessionService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a token when credentials are valid and session does not exist', async () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@email.com',
      password: await bcrypt.hash('123456', 10),
      active: true,
    } as User;

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);
    jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
    jest.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

    const result = await service.execute({
      email: user.email,
      password: '123456',
    });

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { email: user.email, active: true },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('123456', user.password);
    expect(jwtService.sign).toHaveBeenCalledWith(
      { sub: user.id },
      { expiresIn: '6h' },
    );
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

  it('should return an existing session if found in Redis', async () => {
    const cachedSession = {
      name: 'John Doe',
      email: 'john@email.com',
      token: 'mocked-jwt-token',
      refreshToken: 'mocked-refresh-token',
    };

    jest.spyOn(cacheManager, 'get').mockResolvedValue(cachedSession);

    const result = await service.execute({
      email: cachedSession.email,
      password: '123456',
    });

    expect(cacheManager.get).toHaveBeenCalledWith(
      `session:${cachedSession.email}`,
    );
    expect(result).toEqual(cachedSession);
  });

  it('should throw UnauthorizedException if user does not exist', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

    await expect(
      service.execute({ email: 'invalid@email.com', password: '123456' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user is not active', async () => {
    const inactiveUser = {
      id: 1,
      name: 'John Doe',
      email: 'john@email.com',
      password: await bcrypt.hash('123456', 10),
      active: false,
    } as User;

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(inactiveUser);

    await expect(
      service.execute({ email: inactiveUser.email, password: '123456' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if password is incorrect', async () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@email.com',
      password: await bcrypt.hash('123456', 10),
      active: true,
    } as User;

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

    await expect(
      service.execute({ email: user.email, password: 'wrongpassword' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
