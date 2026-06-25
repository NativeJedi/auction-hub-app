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
      // Port 465 speaks TLS immediately (implicit TLS) and needs secure: true.
      // 587/2525 start plaintext and upgrade via STARTTLS (secure: false).
      // Deriving it from the port lets the same code work with any provider.
      port: EMAIL_PORT,
      secure: EMAIL_PORT === 465,
      requireTLS: true, // L-2: refuse connections that don't offer STARTTLS/TLS
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    });
  }

  async sendAlreadyRegisteredEmail(to: string): Promise<void> {
    const loginUrl = `${this.appConfig.urls.CLIENT_URL}/login`;
    await this.sendEmail(
      to,
      'Registration attempt — Auction Hub',
      `Someone tried to register using your email address.\n\nIf this was you, sign in instead:\n\n${loginUrl}\n\nIf this wasn't you, you can safely ignore this message.`,
    );
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
      from: this.appConfig.emailSettings.EMAIL_FROM,
      to,
      subject,
      text,
    })) as { messageId: string };

    console.log('Message sent: %s', info.messageId);
  }
}
