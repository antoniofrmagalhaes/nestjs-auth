import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { User } from '../entities/user.entity';
import { DisableUserService } from './disable-user.service';

describe('DisableUserService', () => {
  let service: DisableUserService;
  let repository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisableUserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<DisableUserService>(DisableUserService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should set active to false instead of deleting', async () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@email.com',
      active: true,
    } as User;

    jest.spyOn(repository, 'findOne').mockResolvedValue(user);
    jest
      .spyOn(repository, 'save')
      .mockResolvedValue({ ...user, active: false });

    const result = await service.execute(1);

    expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(repository.save).toHaveBeenCalledWith({ ...user, active: false });
    expect(result.active).toBe(false);
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
      active: true,
    } as User;

    jest.spyOn(repository, 'findOne').mockResolvedValue(user);
    jest
      .spyOn(repository, 'save')
      .mockResolvedValue({ ...user, active: false });

    const result = await service.execute(1);

    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      active: false,
    });
  });

  it('should throw InternalServerErrorException if database save fails', async () => {
    const user = {
      id: 1,
      name: 'John Doe',
      email: 'john@email.com',
      active: true,
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
