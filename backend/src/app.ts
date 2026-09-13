import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config';
import { logger } from './utils/logger';
import { apiRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler } from './middlewares/errorHandler.middleware';

// Routes imports
import authRoutes from './modules/auth/auth.routes';
import sellersRoutes from './modules/sellers/sellers.routes';
import ordersRoutes from './modules/orders/orders.routes';
import webhooksRoutes from './modules/orders/webhooks.routes';
import callcenterRoutes from './modules/callcenter/callcenter.routes';
import couriersRoutes from './modules/couriers/couriers.routes';
import whatsappRoutes from './modules/whatsapp/whatsapp.routes';
import reconciliationRoutes from './modules/reconciliation/reconciliation.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import adminRoutes from './modules/admin/admin.routes';
import productsRoutes from './modules/products/products.routes';
import messagesRoutes from './modules/messages/messages.routes';

export function createApp(): Express {
  const app = express();

  // Security Middlewares
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(cors({ origin: config.cors.origin, credentials: true }));

  // JSON & URL-encoded parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP Request structured logging
  app.use((req: Request, res: Response, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        duration,
      });
    });
    next();
  });

  // Global Rate Limiting for general endpoints
  app.use('/api/', apiRateLimiter);

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'COD Flow Operations Platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      databaseType: config.database.type,
      wahaMockMode: config.waha.mockMode,
    });
  });

  // Favicon handler to eliminate 404 console noise
  app.get('/favicon.ico', (req: Request, res: Response) => {
    res.status(204).end();
  });

  // Root Developer / API Status Landing Page
  app.get('/', (req: Request, res: Response) => {
    const isHtml = req.accepts('html');
    if (isHtml) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>COD Flow API Server</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
              background-color: #0b1120;
              color: #f8fafc;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
            }
            .card {
              max-width: 640px;
              width: 100%;
              background: #1a2438;
              border: 1px solid rgba(71, 85, 105, 0.5);
              border-radius: 20px;
              padding: 36px;
              box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6);
            }
            .badge {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: rgba(16, 185, 129, 0.15);
              border: 1px solid rgba(16, 185, 129, 0.35);
              color: #34d399;
              font-size: 13px;
              font-weight: 700;
              padding: 6px 14px;
              border-radius: 9999px;
              margin-bottom: 20px;
            }
            .pulse {
              width: 8px;
              height: 8px;
              background: #10b981;
              border-radius: 50%;
              box-shadow: 0 0 10px #10b981;
            }
            h1 { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 8px; }
            p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 28px; }
            .stat {
              background: #0f172a;
              border: 1px solid rgba(51, 65, 85, 0.6);
              border-radius: 12px;
              padding: 14px;
            }
            .stat-label { font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; }
            .stat-value { font-size: 15px; font-weight: 700; color: #f1f5f9; margin-top: 4px; }
            .btn-group { display: flex; flex-direction: column; gap: 10px; }
            .btn-primary {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              background: #10b981;
              color: #022c22;
              text-decoration: none;
              font-weight: 700;
              font-size: 14px;
              padding: 14px;
              border-radius: 12px;
              transition: all 0.2s;
            }
            .btn-primary:hover { background: #34d399; transform: translateY(-1px); }
            .btn-secondary {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              background: #334155;
              color: #f8fafc;
              text-decoration: none;
              font-weight: 600;
              font-size: 13px;
              padding: 12px;
              border-radius: 12px;
              transition: all 0.2s;
            }
            .btn-secondary:hover { background: #475569; }
            .endpoints-list { margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(51, 65, 85, 0.6); }
            .endpoints-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px; }
            .endpoint-tag {
              display: inline-block;
              font-family: monospace;
              font-size: 12px;
              background: #0f172a;
              color: #38bdf8;
              padding: 4px 8px;
              border-radius: 6px;
              margin: 3px;
              text-decoration: none;
              border: 1px solid rgba(56, 189, 248, 0.2);
            }
            .endpoint-tag:hover { border-color: #38bdf8; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">
              <span class="pulse"></span>
              Backend API Active & Healthy
            </div>
            <h1>COD Flow Backend API</h1>
            <p>Enterprise Operations Platform for Cash-on-Delivery (COD) e-commerce sellers in Morocco & MENA.</p>

            <div class="grid">
              <div class="stat">
                <div class="stat-label">API Port</div>
                <div class="stat-value">4000</div>
              </div>
              <div class="stat">
                <div class="stat-label">Database</div>
                <div class="stat-value">${config.database.type.toUpperCase()} (Synchronized)</div>
              </div>
              <div class="stat">
                <div class="stat-label">WhatsApp Engine</div>
                <div class="stat-value">${config.waha.mockMode ? 'WAHA Mock Active' : 'WAHA Live'}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Environment</div>
                <div class="stat-value">${config.env}</div>
              </div>
            </div>

            <div class="btn-group">
              <a href="http://localhost:3000" class="btn-primary" target="_blank">
                🚀 Open COD Flow Web App (http://localhost:3000)
              </a>
              <a href="/api/health" class="btn-secondary" target="_blank">
                🔍 Check Health Status (/api/health)
              </a>
            </div>

            <div class="endpoints-list">
              <div class="endpoints-title">Quick API Endpoints</div>
              <a class="endpoint-tag" href="/api/health" target="_blank">GET /api/health</a>
              <a class="endpoint-tag" href="/api/auth/me" target="_blank">GET /api/auth/me</a>
              <a class="endpoint-tag" href="/api/sellers" target="_blank">GET /api/sellers</a>
              <a class="endpoint-tag" href="/api/whatsapp/status/test" target="_blank">GET /api/whatsapp/status</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    res.json({
      name: 'COD Flow Backend API',
      status: 'healthy',
      version: '1.0.0',
      frontendUrl: 'http://localhost:3000',
      healthUrl: 'http://localhost:4000/api/health',
      database: config.database.type,
      environment: config.env,
      wahaMockMode: config.waha.mockMode,
      documentation: 'See endpoints.md in repository root',
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/sellers', sellersRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/webhooks', webhooksRoutes);
  app.use('/api/call-center', callcenterRoutes);
  app.use('/api/couriers', couriersRoutes);
  app.use('/api/whatsapp', whatsappRoutes);
  app.use('/api/reconciliation', reconciliationRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/messages', messagesRoutes);

  // 404 Route handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}
