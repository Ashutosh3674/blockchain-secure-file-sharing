const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  linkWallet,
  lookupUser,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authRateLimiter, apiRateLimiter } = require('../middleware/validation');

// Public routes protected with brute-force / auth rate limiting
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.get('/lookup', apiRateLimiter, lookupUser);

// Protected routes (strictly requiring JWT Bearer token)
router.get('/me', protect, getMe);
router.put('/wallet', protect, linkWallet);

module.exports = router;
