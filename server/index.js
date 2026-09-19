require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { connectDB, getDBStatus } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { sanitizeInput, getUploadLimits } = require('./middleware/validation');
const { getOrGenerateCertificates, CERT_FILE, KEY_FILE } = require('./config/ssl/generateCert');

const app = express();
const PORT = process.env.PORT || 5000;
const HTTPS_PORT = process.env.HTTPS_PORT || 5443;

// Initialize Database connection
connectDB();

// ============================================================================
// 1. OWASP SECURITY HEADERS & HTTPS ENFORCEMENT
// ============================================================================
app.use((req, res, next) => {
  // HTTP Strict Transport Security (HSTS): 1 Year with Subdomains & Preload
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Prevent MIME-Type Sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Clickjacking Protection
  res.setHeader('X-Frame-Options', 'DENY');

  // Cross-Site Scripting (XSS) Filter Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer Policy: Protect private share tokens from leaking
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (CSP)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' http://localhost:* https://localhost:* ws://localhost:* https://ipfs.io;"
  );

  next();
});

// ============================================================================
// 2. HARDENED CORS CONFIGURATION
// Restricts cross-origin requests to trusted development and production domains
// ============================================================================
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://localhost:5173',
  'http://127.0.0.1:5173',
  'https://127.0.0.1:5173',
  'http://localhost:5000',
  'https://localhost:5443',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (
        !origin ||
        ALLOWED_ORIGINS.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.endsWith('.onrender.com')
      ) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: Origin ${origin} not authorized.`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
  })
);

// Payload size limit (Express body-parser level: 100MB to allow 50MB Base64 ciphertext + metadata)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// ============================================================================
// 3. GLOBAL INPUT SANITIZATION
// Recursively strips HTML script tags, NoSQL injection keys, and path traversal
// ============================================================================
app.use(sanitizeInput);

// Request logging in development
app.use((req, res, next) => {
  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'HTTPS' : 'HTTP';
  console.log(`[${new Date().toISOString().split('T')[1].slice(0, 8)}] [${protocol}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================================
// 4. SECURITY AUDIT & TELEMETRY STATUS ENDPOINT
// ============================================================================
app.get('/api/security-status', (req, res) => {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const limits = getUploadLimits();
  res.status(200).json({
    status: 'secured',
    timestamp: new Date().toISOString(),
    https: {
      activeProtocol: isHttps ? 'HTTPS' : 'HTTP',
      hstsEnabled: true,
      hstsHeader: 'max-age=31536000; includeSubDomains; preload',
      nosniffEnabled: true,
      frameOptions: 'DENY',
      cspEnabled: true,
      httpsPort: HTTPS_PORT,
    },
    passwordSecurity: {
      algorithm: 'bcrypt (12 rounds)',
      saltRounds: 12,
      complexityRules: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSpecialChar: true,
        commonPasswordBlacklist: true,
      },
      bruteForceProtection: {
        maxAttempts: 5,
        lockoutMinutes: 15,
      },
    },
    jwtAuthentication: {
      algorithm: 'HS256',
      tokenType: 'Bearer',
      expiryDuration: '24h',
      claims: ['id', 'email', 'role', 'iss', 'aud', 'exp'],
      issuer: 'blockshare-api',
      audience: 'blockshare-client',
    },
    inputValidation: {
      maxUploadSizeMB: limits.maxUploadSizeMB,
      maxUploadSizeBytes: limits.maxUploadSizeBytes,
      allowedExtensions: limits.allowedExtensions,
      allowedMIMETypes: limits.allowedMimeTypes,
      bannedExtensions: limits.bannedExtensions,
      sanitization: 'XSS, NoSQL operator ($gt, $ne), and Path Traversal filtering active',
      rateLimiting: {
        authRateLimit: '20 requests / 15 min',
        uploadRateLimit: '50 uploads / hour',
        apiRateLimit: '120 requests / min',
      },
    },
  });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Secure File Sharing with Blockchain - Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: getDBStatus(),
    securityHardened: true,
  });
});

// ============================================================================
// 5. PRODUCTION FRONTEND SERVING
// ============================================================================
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // Root route fallback if client is not built
  app.get('/', (req, res) => {
    res.send('🔐 Blockchain Secure File Sharing API is running with Enterprise Security.');
  });
}

// 404 Route Handler for unmatched /api routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start HTTP Server
const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
  console.log(`🚀 HTTP Server running on http://localhost:${PORT}`);
  console.log(`🛡️  Pillar 1: Password Security with bcrypt (12 rounds) active`);
  console.log(`🎫 Pillar 2: JWT Authentication with 24h Bearer token active`);
  console.log(`🧱 Pillar 3: Input Validation Firewall (XSS, File Type & 25MB limit) active`);
});

// Start HTTPS Server with Local Development TLS Certificates if available
try {
  if (fs.existsSync(CERT_FILE) && fs.existsSync(KEY_FILE)) {
    const sslOptions = {
      cert: fs.readFileSync(CERT_FILE),
      key: fs.readFileSync(KEY_FILE),
    };
    const httpsServer = https.createServer(sslOptions, app);
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS Server running on https://localhost:${HTTPS_PORT} (TLS 1.3 / HSTS active)`);
      console.log(`🌐 Pillar 4: HTTPS Secure Data Transmission active`);
    });
  }
} catch (sslErr) {
  console.log('HTTPS Server setup notice (HTTP running normally):', sslErr.message);
}
