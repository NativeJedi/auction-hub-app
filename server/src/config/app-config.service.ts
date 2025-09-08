import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigInterface } from '../config/app.config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<AppConfigInterface>) {}

  get jwt() {
    const JWT_ACCESS_TTL = this.config.get<string>('JWT_ACCESS_TTL')!;
    const JWT_REFRESH_TTL = this.config.get<number>('JWT_REFRESH_TTL')!;
    const JWT_ACCESS_SECRET = this.config.get<string>('JWT_ACCESS_SECRET')!;
    const JWT_REFRESH_SECRET = this.config.get<string>('JWT_REFRESH_SECRET')!;

    return {
      JWT_ACCESS_TTL,
      JWT_REFRESH_TTL,
      JWT_ACCESS_SECRET,
      JWT_REFRESH_SECRET,
    };
  }

  get urls() {
    const DATABASE_URL = this.config.get<string>('DATABASE_URL')!;
    const REDIS_URL = this.config.get<string>('REDIS_URL')!;

    return {
      DATABASE_URL,
      REDIS_URL,
    };
  }
}
