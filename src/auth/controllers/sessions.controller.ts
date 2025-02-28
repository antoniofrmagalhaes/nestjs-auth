import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';

import { CreateSessionDto } from '../dto/create-session.dto';
import { RefreshSessionDto } from '../dto/refresh-session.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CreateSessionService } from '../services/create-session.service';
import { RefreshSessionService } from '../services/refresh-session.service';

@Controller('session')
export class SessionsController {
  constructor(
    private readonly createSessionService: CreateSessionService,
    private readonly refreshSessionService: RefreshSessionService,
  ) {}

  @Post('create')
  async createSession(@Body() createSessionDto: CreateSessionDto) {
    return this.createSessionService.execute(createSessionDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refreshAccessToken(
    @Request() req,
    @Body() { refreshToken }: RefreshSessionDto,
  ) {
    return this.refreshSessionService.execute(req.user, refreshToken);
  }
}
