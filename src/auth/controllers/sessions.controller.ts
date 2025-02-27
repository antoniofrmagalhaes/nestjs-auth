import { Controller, Post, Body } from '@nestjs/common';

import { CreateSessionService } from '../services/create-session.service';

interface CreateSessionDto {
  email: string;
  password: string;
}

@Controller('session')
export class SessionsController {
  constructor(private readonly createSessionService: CreateSessionService) {}

  @Post('create')
  async createSession(@Body() createSessionDto: CreateSessionDto) {
    return this.createSessionService.execute(createSessionDto);
  }
}
