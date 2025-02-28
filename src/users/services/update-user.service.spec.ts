import { NotFoundException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository, FindOptionsWhere } from 'typeorm';

import { User } from '../entities/user.entity';
import { UpdateUserService } from './update-user.service';

describe('UpdateUserService', () => {
  let service: UpdateUserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UpdateUserService>(UpdateUserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should update a user', async () => {
    const user = { id: 1, name: 'John Doe', email: 'john@email.com' } as User;
    const updatedData = { name: 'Jane Doe', email: 'jane@email.com' };

    jest
      .spyOn(repository, 'findOne')
      .mockImplementation(
        async (options?: { where: FindOptionsWhere<User> }) => {
          if (
            options?.where &&
            'id' in options.where &&
            options.where.id === 1
          ) {
            return user;
          }
          return null;
        },
      );

    jest
      .spyOn(repository, 'save')
      .mockResolvedValue({ ...user, ...updatedData });

    const result = await service.execute(1, updatedData);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(repository.save).toHaveBeenCalledWith({ ...user, ...updatedData });
    expect(result.name).toBe('Jane Doe');
    expect(result.email).toBe('jane@email.com');
  });

  it('should throw NotFoundException if user does not exist', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    await expect(service.execute(1, { name: 'Jane Doe' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw ConflictException if email is already in use', async () => {
    const user = { id: 1, name: 'John Doe', email: 'john@email.com' } as User;
    const existingUser = {
      id: 2,
      name: 'Jane Doe',
      email: 'jane@email.com',
    } as User;
    const updatedData = { email: 'jane@email.com' };

    jest
      .spyOn(repository, 'findOne')
      .mockImplementation(
        async (options?: { where: FindOptionsWhere<User> }) => {
          if (
            options?.where &&
            'id' in options.where &&
            options.where.id === 1
          ) {
            return user;
          }
          if (
            options?.where &&
            'email' in options.where &&
            options.where.email === 'jane@email.com'
          ) {
            return existingUser;
          }
          return null;
        },
      );

    await expect(service.execute(1, updatedData)).rejects.toThrow(
      ConflictException,
    );
  });
});
