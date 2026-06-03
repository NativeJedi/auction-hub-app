import { Test } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';
import { AppConfigService } from '../../config/app-config.service';

const mockAppConfig = {
  emailSettings: {
    EMAIL_HOST: 'smtp.test',
    EMAIL_PORT: 587,
    EMAIL_USER: 'user',
    EMAIL_PASSWORD: 'pass',
  },
  urls: {
    CLIENT_URL: 'https://app.example.com',
  },
};

describe('EmailService', () => {
  let service: EmailService;
  let sendMailMock: jest.Mock;

  beforeEach(async () => {
    sendMailMock = jest.fn().mockResolvedValue({ messageId: 'msg-1' });

    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: sendMailMock,
    } as any);

    const module = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: AppConfigService, useValue: mockAppConfig },
      ],
    }).compile();

    service = module.get(EmailService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendAlreadyRegisteredEmail', () => {
    it('sends to the recipient with the registration-attempt subject', async () => {
      await service.sendAlreadyRegisteredEmail('user@example.com');

      expect(sendMailMock).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Registration attempt — Auction Hub',
        }),
      );
    });

    it('includes the login URL and a sign-in nudge in the body', async () => {
      await service.sendAlreadyRegisteredEmail('user@example.com');

      const [[mailOptions]] = sendMailMock.mock.calls as [[{ text: string }]];

      expect(mailOptions.text).toContain('https://app.example.com/login');
      expect(mailOptions.text).toContain('sign in instead');
    });

    it('reassures the recipient they can ignore the email if it was not them', async () => {
      await service.sendAlreadyRegisteredEmail('user@example.com');

      const [[mailOptions]] = sendMailMock.mock.calls as [[{ text: string }]];

      expect(mailOptions.text).toContain('safely ignore');
    });
  });
});
