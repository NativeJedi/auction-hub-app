import { GenericContainer, Wait } from 'testcontainers';

const POSTGRES_USER = 'postgres';
const POSTGRES_PASSWORD = 'postgres';
const POSTGRES_DB = 'auction-hub-db-test';

export const createPostgresContainer = async () => {
  const container = await new GenericContainer('postgres:16')
    .withExposedPorts(5432)
    .withEnvironment({
      POSTGRES_USER,
      POSTGRES_PASSWORD,
      POSTGRES_DB,
    })
    .withWaitStrategy(
      Wait.forLogMessage('database system is ready to accept connections'),
    )
    .start();

  const POSTGRES_PORT = container.getMappedPort(5432);
  const POSTGRES_HOST = container.getHost();

  const DATABASE_URL = `postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}`;

  return {
    container,
    DATABASE_URL,
  };
};

export const createRedisContainer = async () => {
  const container = await new GenericContainer('redis/redis-stack:latest')
    .withExposedPorts(6379)
    .start();

  const redisPort = container.getMappedPort(6379);
  const redisHost = container.getHost();

  const REDIS_URL = `redis://${redisHost}:${redisPort}`;

  return {
    container,
    REDIS_URL,
  };
};
