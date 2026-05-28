import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { AppConfigService } from '../../config/app-config.service';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private readonly appConfig: AppConfigService) {
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } =
      this.appConfig.emailSettings;

    this.transporter = nodemailer.createTransport({
      host: EMAIL_HOST,
      port: EMAIL_PORT,
      secure: false,
      requireTLS: true, // L-2: refuse connections that don't offer STARTTLS/TLS
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });
  }

  async sendConfirmationEmail(to: string, code: string): Promise<void> {
    const url = `${this.appConfig.urls.CLIENT_URL}/confirm-email?code=${code}`;
    await this.sendEmail(
      to,
      'Confirm your email — Auction Hub',
      `Click the link to confirm your email:\n\n${url}\n\nThe link expires in 24 hours.`,
    );
  }

  async sendEmail(to: string, subject: string, text: string) {
    const info = (await this.transporter.sendMail({
      from: '"Auction hub" <no-reply@auction-hub.com>',
      to,
      subject,
      text,
    })) as { messageId: string };

    console.log('Message sent: %s', info.messageId);
  }
}
