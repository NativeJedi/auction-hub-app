import { AppConfigInterface } from '../src/config/app.config';
import { TypeOrmConfig } from '../src/config/typeorm.config';

const loadTestConfig = ({
  DATABASE_URL,
  REDIS_URL,
}: {
  DATABASE_URL: string;
  REDIS_URL: string;
}) => {
  const TestAppConfig: AppConfigInterface = {
    DATABASE_URL,
    REDIS_URL,
    PORT: 3000,
    ENV: 'test',
    JWT_ACCESS_TTL: 60 * 15,
    JWT_REFRESH_TTL: 60 * 60 * 24 * 2, // 2 days in seconds
    JWT_ACCESS_SECRET: 'test-access',
    JWT_REFRESH_SECRET: 'test-refresh',
    JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET: 'test-room-member-invite',
    JWT_ROOM_MEMBER_INVITE_TOKEN_TTL: 60 * 30,
    JWT_ROOM_MEMBER_TOKEN_SECRET: 'test-room-member',
    JWT_ROOM_TTL: 60 * 60 * 24 * 1,
    EMAIL_HOST: '',
    EMAIL_PORT: 0,
    EMAIL_USER: '',
    EMAIL_PASSWORD: '',
    CLIENT_URL: 'http://localhost:3001',
  };

  return TestAppConfig;
};

const loadTypeOrmTestConfig = ({ DATABASE_URL }: { DATABASE_URL: string }) => ({
  ...TypeOrmConfig,
  synchronize: true,
  url: DATABASE_URL,
  dropSchema: true,
});

export { loadTestConfig, loadTypeOrmTestConfig };
