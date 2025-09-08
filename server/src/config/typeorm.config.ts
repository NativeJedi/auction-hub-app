import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { AppConfig } from './app.config';
import { User } from '../modules/users/entities/user.entity';
import { Auction } from '../modules/auctions/entities/auction.entity';
import { Lot } from '../modules/lots/entities/lots.entity';

const ProductionConfig: DataSourceOptions = {
  type: 'postgres',
  url: AppConfig.DATABASE_URL,
  entities: [User, Auction, Lot],
  synchronize: false,
  migrations: ['dist/migrations/*.js'],
};

const DevelopmentConfig: DataSourceOptions = {
  ...ProductionConfig,
  synchronize: true,
};

const envConfigMap: Record<string, DataSourceOptions> = {
  test: DevelopmentConfig,
  development: DevelopmentConfig,
  production: ProductionConfig,
};

const TypeOrmConfig = envConfigMap[AppConfig.ENV] || envConfigMap.production;

const AppDataSource = new DataSource(TypeOrmConfig);

export { AppDataSource, TypeOrmConfig };
