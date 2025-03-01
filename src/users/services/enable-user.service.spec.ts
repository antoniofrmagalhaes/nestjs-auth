import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';
import { EnableUserService } from './enable-user.service';

describe('EnableUserService', () => {
  let service: EnableUserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EnableUserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<EnableUserService>(EnableUserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should set active to true when enabling a user', async () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@email.com',
      active: false,
    } as User;

    jest.spyOn(repository, 'findOne').mockResolvedValue(user);
    jest.spyOn(repository, 'save').mockResolvedValue({ ...user, active: true });

    const result = await service.execute(1);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(repository.save).toHaveBeenCalledWith({ ...user, active: true });
    expect(result.active).toBe(true);
  });

  it('should throw NotFoundException if user does not exist', async () => {
    jest.spyOn(repository, 'findOne').mockResolvedValue(null);

    await expect(service.execute(1)).rejects.toThrow(NotFoundException);
  });

  it('should only modify the active field and keep other properties unchanged', async () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@email.com',
      active: false,
    } as User;

    jest.spyOn(repository, 'findOne').mockResolvedValue(user);
    jest.spyOn(repository, 'save').mockResolvedValue({ ...user, active: true });

    const result = await service.execute(1);

    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      active: true,
    });
  });

  it('should throw InternalServerErrorException if database save fails', async () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@email.com',
      active: false,
    } as User;

    jest.spyOn(repository, 'findOne').mockResolvedValue(user);
    jest.spyOn(repository, 'save').mockImplementation(() => {
      throw new Error('Database error');
    });

    await expect(service.execute(1)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
