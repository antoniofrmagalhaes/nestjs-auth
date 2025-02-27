import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import * as bcrypt from 'bcryptjs';

import { User } from '../../users/entities/user.entity';
import { CreateSessionService } from './create-session.service';

describe('CreateSessionService', () => {
  let service: CreateSessionService;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

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
      ],
    }).compile();

    service = module.get<CreateSessionService>(CreateSessionService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a token when credentials are valid', async () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@email.com',
      password: await bcrypt.hash('123456', 10),
      active: true,
    } as User;

    jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

    const result = await service.execute({
      email: user.email,
      password: '123456',
    });

    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { email: user.email, active: true },
    });
    expect(bcrypt.compare).toHaveBeenCalledWith('123456', user.password);
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: user.id });
    expect(result).toEqual({
      name: user.name,
      email: user.email,
      token: 'mocked-jwt-token',
    });
  });

  it('should throw UnauthorizedException if user does not exist', async () => {
    jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

    await expect(
      service.execute({ email: 'invalid@email.com', password: '123456' }),
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
