import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersController } from './controllers/users.controller';
import { User } from './entities/user.entity';
import { CreateUserService } from './services/create-user.service';
import { DisableUserService } from './services/disable-user.service';
import { EnableUserService } from './services/enable-user.service';
import { UpdateUserService } from './services/update-user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [
    CreateUserService,
    UpdateUserService,
    DisableUserService,
    EnableUserService,
  ],
  exports: [
    CreateUserService,
    UpdateUserService,
    DisableUserService,
    EnableUserService,
  ],
})
export class UsersModule {}
