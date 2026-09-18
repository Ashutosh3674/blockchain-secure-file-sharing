const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_blockchain_file_sharing_jwt_secret_2026_xyz987';

/**
 * 🛡️ Protect Middleware: Enforces JWT Authentication on Protected API Endpoints
 * Prevents unauthorized API requests by strictly verifying bearer tokens and pinned algorithms.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      securityBlocked: true,
      code: 'TOKEN_MISSING',
      message: 'Access Denied: Authentication required. No Bearer JWT token provided.',
    });
  }

  try {
    // Verify token with explicit algorithm pinning (prevent algorithm confusion attacks)
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });

    let user = await User.findById(decoded.id);

    // Fallback for demo persona accounts if DB user not found
    if (!user) {
      user = {
        _id: decoded.id,
        id: decoded.id,
        email: decoded.email || 'authenticated_user@blockshare.eth',
        name: 'Authenticated Web3 User',
        role: decoded.role || 'user',
      };
    }

    req.user = user;
    req.jwtPayload = decoded;
    next();
  } catch (err) {
    console.warn(`🛡️ [Auth Middleware] JWT verification failed: ${err.message}`);
    const isExpired = err.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      securityBlocked: true,
      code: isExpired ? 'TOKEN_EXPIRED' : 'TOKEN_INVALID',
      message: isExpired
        ? 'Session expired: Your JWT token has expired. Please log in again.'
        : 'Invalid authentication token: Signature or payload verification failed.',
      error: err.message,
    });
  }
};

/**
 * Optional Auth: Attaches user if token is provided, otherwise continues
 */
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const user = await User.findById(decoded.id);
    req.user = user || { id: decoded.id, email: decoded.email };
  } catch (err) {
    req.user = null;
  }
  next();
};

/**
 * Require Admin: Ensures caller has role 'admin'
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      securityBlocked: true,
      code: 'ADMIN_ACCESS_DENIED',
      message: 'Access Denied: Enterprise Admin privileges required for this endpoint.',
    });
  }
  next();
};

module.exports = { protect, optionalAuth, requireAdmin };


