import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import leaveRoutes from './routes/leave.routes';
import managerRoutes from './routes/manager.routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();

// Security middlewares
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        imgSrc: ["'self'", "data:", "https://unpkg.com"],
      },
    },
  })
);

// CORS setup
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Parse cookie & JSON bodies
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    data: null,
    errors: null,
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Limit login/token refresh to 30 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes',
    data: null,
    errors: null,
  },
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);

// Serve raw swagger JSON statically
app.use('/docs', express.static(path.join(__dirname, '../../docs')));

// Swagger UI CDN Page Route
app.get('/api-docs', (_req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Employee Leave Management System API Documentation</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js" charset="UTF-8"></script>
        <script>
          window.onload = function() {
            window.ui = SwaggerUIBundle({
              url: '/docs/swagger.json',
              dom_id: '#swagger-ui',
              deepLinking: true,
              presets: [
                SwaggerUIBundle.presets.apis
              ],
              layout: "BaseLayout"
            });
          };
        </script>
      </body>
    </html>
  `);
});

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/manager', managerRoutes);

// Base route
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Employee Leave Management System API',
    data: {
      version: '1.0.0',
      docs: '/api-docs',
    },
    errors: null,
  });
});

// Fallback route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    data: null,
    errors: null,
  });
});

// Centralized error handling middleware
app.use(errorMiddleware);

export default app;
