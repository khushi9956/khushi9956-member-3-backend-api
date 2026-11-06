const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const { usingDevSecret } = require('./utils/token');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const workspaceRoutes = require('./routes/workspaceRoutes');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: global.useMemoryDb ? 'memory (demo, data is lost on restart)' : 'mongodb',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/workspaces', workspaceRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    if (usingDevSecret()) {
      console.warn('[auth] JWT_SECRET is not set, using a development-only secret. Set it in .env.');
    }
    return app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` Member 3: Backend & REST API Service Running       `);
      console.log(` Local Server: http://localhost:${PORT}             `);
      console.log(` Health Check: http://localhost:${PORT}/api/health   `);
      console.log(` Projects API: http://localhost:${PORT}/api/projects `);
      console.log(` Tasks API:    http://localhost:${PORT}/api/tasks    `);
      console.log(` Workspaces:   http://localhost:${PORT}/api/workspaces`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
