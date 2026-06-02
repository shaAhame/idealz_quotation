// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes       = require('./routes/auth');
const quotationRoutes  = require('./routes/quotations');
const publicRoutes     = require('./routes/public');

const app  = express();
const PORT = process.env.PORT || 3001;
const PROD = process.env.NODE_ENV === 'production';

// Trust Railway's proxy
app.set('trust proxy', 1);

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || (PROD ? false : 'http://localhost:5173'),
  credentials: true,
}));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true }));
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }));

app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api/auth',        authRoutes);
app.use('/api/quotations',  quotationRoutes);
app.use('/download',        publicRoutes);

// Serve React build in production
if (PROD) {
  const staticPath = path.join(__dirname, '../client/dist');
  app.use(express.static(staticPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/download')) {
      res.sendFile(path.join(staticPath, 'index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`iDealz Quotation System running on port ${PORT} [${PROD ? 'production' : 'development'}]`);
});
