import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

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

  it('should create a user', async () => {
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
      ...userDto,
      password: hashedPassword,
    } as User);

    const result = await service.execute(userDto);
    expect(result).toEqual({ ...userDto, password: hashedPassword });
    expect(repository.create).toHaveBeenCalledWith({
      ...userDto,
      password: hashedPassword,
    });
    expect(repository.save).toHaveBeenCalledWith({
      ...userDto,
      password: hashedPassword,
    });
    expect(bcrypt.hash).toHaveBeenCalledWith('123456', 10);
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
      ...userDto,
      password: hashedPassword,
    } as User);

    const result = await service.execute(userDto);
    expect(hashSpy).toHaveBeenCalledWith('123456', 10);
    expect(result.password).toBe(hashedPassword);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
