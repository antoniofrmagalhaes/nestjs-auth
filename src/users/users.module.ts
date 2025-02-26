import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './entities/user.entity';
import { UsersController } from './controllers/users.controller';
import { CreateUserService } from './services/create-user.service';
import { UpdateUserService } from './services/update-user.service';
import { DisableUserService } from './services/disable-user.service';
import { EnableUserService } from './services/enable-user.service';

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
