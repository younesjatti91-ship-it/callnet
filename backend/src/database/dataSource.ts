import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from '../config';
import * as entities from './entities';
import { logger } from '../utils/logger';

const entityList = Object.values(entities).filter((val) => typeof val === 'function');

function buildDataSourceOptions(): DataSourceOptions {
  if (config.database.type === 'postgres' || config.database.url) {
    logger.info('Configuring PostgreSQL / Supabase connection');
    if (config.database.url) {
      return {
        type: 'postgres',
        url: config.database.url,
        synchronize: config.env !== 'production',
        logging: false,
        entities: entityList,
        ssl: config.env === 'production' ? { rejectUnauthorized: false } : false,
      };
    }
    return {
      type: 'postgres',
      host: config.database.host,
      port: config.database.port,
      username: config.database.username,
      password: config.database.password,
      database: config.database.name,
      synchronize: config.env !== 'production',
      logging: false,
      entities: entityList,
    };
  }

  // SQLite fallback for frictionless local execution & fast tests
  logger.info(`Configuring SQLite connection: ${config.database.sqlitePath}`);
  return {
    type: 'sqlite',
    database: config.database.sqlitePath,
    synchronize: true,
    logging: false,
    entities: entityList,
  };
}

export const AppDataSource = new DataSource(buildDataSourceOptions());

export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      logger.info('Database connected and schema synchronized successfully');
    } catch (error) {
      logger.error('Failed to initialize database connection', error);
      throw error;
    }
  }
  return AppDataSource;
}
