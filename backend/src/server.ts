import { createApp } from './app';
import { config } from './config';
import { initializeDatabase } from './database/dataSource';
import { seedDatabase } from './database/seed';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    // 1. Initialize DB
    await initializeDatabase();

    // 2. Run seed
    await seedDatabase();

    // 3. Create Express App & Listen
    const app = createApp();
    app.listen(config.port, () => {
      logger.info(`=======================================================`);
      logger.info(`🚀 COD Flow Platform Backend running on port ${config.port}`);
      logger.info(`🌍 Environment: ${config.env}`);
      logger.info(`🗄️ Database: ${config.database.type}`);
      logger.info(`💬 WAHA WhatsApp Integration: ${config.waha.mockMode ? 'Mock Mode Enabled' : 'Live at ' + config.waha.apiUrl}`);
      logger.info(`=======================================================`);
    });
  } catch (error) {
    logger.error('Fatal bootstrap error:', error);
    process.exit(1);
  }
}

bootstrap();
