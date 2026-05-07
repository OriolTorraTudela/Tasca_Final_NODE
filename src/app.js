require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// --- Seguretat HTTP ---
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- Logging i parsing ---
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false }));

// --- Rutes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/roles', require('./routes/roleRoutes'));
app.use('/api/permissions', require('./routes/permissionRoutes'));
app.use('/api/delegations', require('./routes/delegationRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/audit', require('./routes/auditRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '9.0.0' });
});

// --- Gestió d'errors ---
app.use(notFoundHandler);
app.use(errorHandler);

// --- Arrencada ---
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor T9 arrencant al port ${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
    });
  });
}

module.exports = app;
