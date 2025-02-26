import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Put,
  Patch,
} from '@nestjs/common';

import { User } from '../entities/user.entity';
import { CreateUserService } from '../services/create-user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserService } from '../services/update-user.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { DisableUserService } from '../services/disable-user.service';
import { EnableUserService } from '../services/enable-user.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserService: CreateUserService,
    private readonly updateUserService: UpdateUserService,
    private readonly disableUserService: DisableUserService,
    private readonly enableUserService: EnableUserService,
  ) {}

  @Post('create')
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.createUserService.execute(createUserDto);
  }

  @Put(':id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.updateUserService.execute(id, updateUserDto);
  }

  @Patch(':id/disable')
  async disableUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.disableUserService.execute(id);
  }

  @Patch(':id/enable')
  async enableUser(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.enableUserService.execute(id);
  }
}
