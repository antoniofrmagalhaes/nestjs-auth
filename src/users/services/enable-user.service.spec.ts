import { Test, TestingModule } from '@nestjs/testing';
import { EnableUserService } from './enable-user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';

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
});
