import { Controller, Get, Render, Req } from '@nestjs/common';
import { Request } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Render('index')
  root() {
    return {
      message: 'Hello Serverless',
    };
  }

  @Get('/event')
  event(@Req() request: Request) {
    // @ts-ignore
    const event = request.__SLS_EVENT__;
    return {
      event: event || {}
    };
  }
}
