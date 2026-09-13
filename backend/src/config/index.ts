import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  jwtSecret: process.env.JWT_SECRET || 'codflow-super-secret-jwt-key-change-in-prod-2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  encryptionKey: process.env.ENCRYPTION_KEY || 'codflow-32-byte-encryption-secret-key!!', // 32 characters for AES-256
  database: {
    type: (process.env.DB_TYPE || 'sqlite') as 'postgres' | 'sqlite',
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    name: process.env.DB_NAME || 'codflow',
    sqlitePath: process.env.SQLITE_PATH || ':memory:',
  },
  waha: {
    apiUrl: process.env.WAHA_API_URL || 'http://localhost:3000',
    apiKey: process.env.WAHA_API_KEY || '',
    mockMode: process.env.WAHA_MOCK_MODE !== 'false', // Defaults to mock mode for offline dev & test execution
    historyDays: parseInt(process.env.WHATSAPP_MESSAGE_HISTORY_DAYS || '7', 10),
    messageLimit: parseInt(process.env.WHATSAPP_MESSAGE_LIMIT || '100', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};
