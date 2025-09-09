import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { AppConfigService } from '../../config/app-config.service';

@Module({
  providers: [AppConfigService, EmailService],
  exports: [AppConfigService, EmailService],
})
export class EmailModule {}
