import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import * as bcrypt from 'bcryptjs';

import { User } from '../entities/user.entity';
import { CreateUserService } from './create-user.service';

describe('CreateUserService', () => {
  let service: CreateUserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          } as Partial<Repository<User>>,
        },
      ],
    }).compile();

    service = module.get<CreateUserService>(CreateUserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user and not return password', async () => {
    const userDto = {
      name: 'John Doe',
      email: 'john@email.com',
      password: '123456',
    };

    const hashedPassword: string = 'hashed-password';
    jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation(() => Promise.resolve(hashedPassword));
    jest
      .spyOn(repository, 'create')
      .mockImplementation((user: Partial<User>) => user as User);
    jest.spyOn(repository, 'save').mockResolvedValue({
      id: 1,
      name: userDto.name,
      email: userDto.email,
    } as User);

    const result = await service.execute(userDto);

    expect(repository.create).toHaveBeenCalledWith({
      ...userDto,
      password: hashedPassword,
    });
    expect(repository.save).toHaveBeenCalledWith({
      ...userDto,
      password: hashedPassword,
    });
    expect(result).toEqual({
      id: 1,
      name: userDto.name,
      email: userDto.email,
    });
    expect(result).not.toHaveProperty('password');
  });

  it('should hash password before saving user', async () => {
    const userDto = {
      name: 'John Doe',
      email: 'john@email.com',
      password: '123456',
    };

    const hashedPassword: string = 'hashed-password';
    const hashSpy = jest
      .spyOn(bcrypt, 'hash')
      .mockImplementation(() => Promise.resolve(hashedPassword));
    jest
      .spyOn(repository, 'create')
      .mockImplementation((user: Partial<User>) => user as User);
    jest.spyOn(repository, 'save').mockResolvedValue({
      id: 1,
      name: userDto.name,
      email: userDto.email,
    } as User);

    const result = await service.execute(userDto);

    expect(hashSpy).toHaveBeenCalledWith('123456', 10);
    expect(result).toEqual({
      id: 1,
      name: userDto.name,
      email: userDto.email,
    });
    expect(result).not.toHaveProperty('password');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
