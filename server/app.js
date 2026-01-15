const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./src/config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware (disabled for static files)
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for inline scripts in HTML
  crossOriginEmbedderPolicy: false
}));

// Logging Middleware (disabled - uncomment for debugging)
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

// Body Parser Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static frontend files from SDG-Shram folder
// __dirname = server/src, go up to SDG-Shram--main, then into SDG-Shram
const frontendPath = path.resolve(__dirname, '..', '..', 'SDG-Shram');
console.log('Frontend path:', frontendPath); // Debug log
app.use(express.static(frontendPath));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const campaignRoutes = require('./src/routes/campaign.routes');
const userRoutes = require('./src/routes/user.routes');
const communityRoutes = require('./src/routes/community.routes');
const serviceRoutes = require('./src/routes/service.routes');

app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/users', userRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/services', serviceRoutes);

// Serve frontend pages (catch-all for HTML pages)
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'dashboard.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(frontendPath, 'signup.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(frontendPath, 'dashboard.html'));
});

app.get('/feed', (req, res) => {
  res.sendFile(path.join(frontendPath, 'feed.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(frontendPath, 'profile.html'));
});

// Error handling middleware
const errorHandler = require('./src/middleware/errorHandler');
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📂 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
});

module.exports = app;

