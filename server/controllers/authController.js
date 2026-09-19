const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Security Constants
const BCRYPT_SALT_ROUNDS = 12; // High-security 12 salt rounds
const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_blockchain_file_sharing_jwt_secret_2026_xyz987';
const JWT_EXPIRY = '24h'; // Standard 24h session
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minute temporary lockout

// In-memory failed login tracking: email -> { count, lockedUntil }
const loginAttemptTracker = new Map();

// Helper: NIST SP 800-63B Password Complexity Validator
const validatePasswordSecurity = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long (NIST SP 800-63B standard)' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter (A-Z)' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter (a-z)' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number (0-9)' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
  }
  const commonWeak = ['password', 'password123', '12345678', 'admin123', 'qwerty123', 'letmein123', 'welcome123'];
  if (commonWeak.includes(password.toLowerCase())) {
    return { valid: false, message: 'Password is too common or easily guessable. Please choose a more complex passphrase.' };
  }
  return { valid: true };
};

// Helper: Generate Secure JWT Token with Standard Claims
const generateToken = (id, email, role = 'user') => {
  return jwt.sign(
    {
      id,
      email,
      role,
      iss: 'blockshare-api',
      aud: 'blockshare-client',
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRY,
      algorithm: 'HS256',
    }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, walletAddress } = req.body;

    // 1. Basic Fields Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    // 2. Strict Password Complexity Enforcement (NIST SP 800-63B)
    const passwordCheck = validatePasswordSecurity(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        securityError: true,
        code: 'WEAK_PASSWORD',
        message: passwordCheck.message,
      });
    }

    // 3. Check if user already exists
    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // 4. Hash Password using bcrypt with 12 salt rounds (Argon2 / bcrypt standard)
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Validate wallet address if provided, or auto-derive deterministic Web3 address
    let cleanWallet = null;
    if (walletAddress && typeof walletAddress === 'string' && walletAddress.trim()) {
      const trimmed = walletAddress.trim();
      if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Ethereum/Web3 wallet address format (must start with 0x followed by 40 hex characters)',
        });
      }
      cleanWallet = trimmed.toLowerCase();
    } else {
      // Deterministic EVM wallet derived from email for instant smart contract interoperability
      const hash = crypto.createHash('sha256').update(cleanEmail).digest('hex');
      cleanWallet = '0x' + hash.slice(0, 40);
    }

    // 6. Create user (Ashutosh automatically gets admin role for dashboard access)
    const isAdmin = name.trim().toLowerCase() === 'ashutosh' || cleanEmail.includes('ashutosh');
    const userRole = isAdmin ? 'admin' : 'user';

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      walletAddress: cleanWallet,
      role: userRole,
    });

    // 7. Generate Token with standard claims & Respond
    const token = generateToken(user._id || user.id, user.email, user.role || userRole);

    const safeUser = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role || userRole,
      createdAt: user.createdAt,
    };

    console.log(`🛡️ [Auth] User "${user.email}" registered successfully (role: ${user.role || userRole}, wallet: ${user.walletAddress})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully with high-security hashed credentials (bcrypt 12 rounds)',
      token,
      user: safeUser,
      securityMeta: {
        algorithm: `bcrypt (${BCRYPT_SALT_ROUNDS} rounds)`,
        jwtExpiry: JWT_EXPIRY,
        saltRounds: BCRYPT_SALT_ROUNDS,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Authenticate user & login with Brute-Force Protection
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1. Check Brute Force Lockout
    const attemptRecord = loginAttemptTracker.get(cleanEmail);
    const now = Date.now();
    if (attemptRecord && attemptRecord.lockedUntil && attemptRecord.lockedUntil > now) {
      const remainingSeconds = Math.ceil((attemptRecord.lockedUntil - now) / 1000);
      return res.status(429).json({
        success: false,
        locked: true,
        message: `Account temporarily locked due to excessive failed attempts. Please retry in ${remainingSeconds} seconds.`,
      });
    }

    // 2. Query user
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      recordFailedAttempt(cleanEmail);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 3. Compare password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      recordFailedAttempt(cleanEmail);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Clear failed attempts counter on successful authentication
    loginAttemptTracker.delete(cleanEmail);

    // 4. Issue JWT Token
    const token = generateToken(user._id || user.id, user.email, user.role || 'user');

    const safeUser = {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      walletAddress: user.walletAddress,
      role: user.role || 'user',
      createdAt: user.createdAt,
    };

    console.log(`🔑 [Auth] User "${user.email}" authenticated successfully`);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// Record failed login attempt for brute-force lockouts
const recordFailedAttempt = (email) => {
  const now = Date.now();
  const record = loginAttemptTracker.get(email) || { count: 0, lockedUntil: null };
  record.count += 1;

  if (record.count >= MAX_FAILED_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    console.warn(`🚨 [Auth] Brute-force protection triggered: ${email} locked for 15 minutes.`);
  }

  loginAttemptTracker.set(email, record);
};

// @desc    Get currently authenticated user profile
// @route   GET /api/auth/me
// @access  Private (JWT Required)
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role || 'user',
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('GetMe Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
      error: error.message,
    });
  }
};

// @desc    Link Web3 Wallet Address to existing account
// @route   PUT /api/auth/wallet
// @access  Private (JWT Required)
const linkWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a wallet address to link',
      });
    }

    // Validate EVM address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ethereum/Web3 wallet address format (must start with 0x followed by 40 hex characters)',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id || req.user.id,
      { walletAddress: walletAddress.toLowerCase() },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Web3 Wallet linked to account successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Wallet link error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while linking wallet',
      error: error.message,
    });
  }
};

// @desc    Lookup user by email, name, or wallet address to resolve EVM recipient wallet
// @route   GET /api/auth/lookup?query=...
// @access  Public
const lookupUser = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || !String(query).trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a search query (email, name, or wallet)' });
    }

    const cleanQuery = String(query).toLowerCase().trim();

    // Helper: Ensure valid EVM wallet is always available
    const getOrAssignWallet = (u) => {
      if (u.walletAddress && /^0x[a-fA-F0-9]{40}$/.test(u.walletAddress)) {
        return u.walletAddress.toLowerCase();
      }
      const hash = crypto.createHash('sha256').update((u.email || u.name || 'user').toLowerCase()).digest('hex');
      return '0x' + hash.slice(0, 40);
    };

    // 1. Search Live Database Users (exact or partial matching)
    const allUsers = await User.find();
    let matchedUser = allUsers.find((u) => (u.email || '').toLowerCase() === cleanQuery);
    if (!matchedUser) {
      matchedUser = allUsers.find((u) => (u.name || '').toLowerCase() === cleanQuery);
    }
    if (!matchedUser && cleanQuery.startsWith('0x')) {
      matchedUser = allUsers.find((u) => (u.walletAddress || '').toLowerCase() === cleanQuery);
    }
    if (!matchedUser) {
      matchedUser = allUsers.find((u) => (u.email || '').toLowerCase().includes(cleanQuery));
    }
    if (!matchedUser) {
      matchedUser = allUsers.find((u) => (u.name || '').toLowerCase().includes(cleanQuery));
    }

    if (matchedUser) {
      const resolvedWallet = getOrAssignWallet(matchedUser);
      return res.status(200).json({
        success: true,
        user: {
          name: matchedUser.name,
          email: matchedUser.email,
          walletAddress: resolvedWallet,
          isLiveDbUser: true,
        },
      });
    }

    // 2. Predefined Demo Personas Fallback (for instant testing with Rahul, Priya, Amit, etc.)
    const DEMO_PERSONAS = [
      { name: 'Ashutosh', email: 'ashutosh@gmail.com', walletAddress: '0x71c67ed3e80435a55611f476c66337051b7b292a' },
      { name: 'Rahul (Authorized Recipient)', email: 'rahul@gmail.com', walletAddress: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc' },
      { name: 'Rahul (Authorized Recipient)', email: 'rahul@blockshare.eth', walletAddress: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc' },
      { name: 'Priya (Collaborator)', email: 'priya@gmail.com', walletAddress: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65' },
      { name: 'Priya (Collaborator)', email: 'priya.sharma@enterprise.org', walletAddress: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65' },
      { name: 'Amit / Stranger (Intruder)', email: 'amit@gmail.com', walletAddress: '0x90f79bf6eb2c4f870365e785982e1f101e93b906' },
      { name: 'Amit / Stranger (Intruder)', email: 'amit.intruder@tempmail.xyz', walletAddress: '0x90f79bf6eb2c4f870365e785982e1f101e93b906' },
    ];

    let demoMatch = DEMO_PERSONAS.find((p) => p.email.toLowerCase() === cleanQuery);
    if (!demoMatch) {
      demoMatch = DEMO_PERSONAS.find((p) => p.name.toLowerCase() === cleanQuery);
    }
    if (!demoMatch && cleanQuery.startsWith('0x')) {
      demoMatch = DEMO_PERSONAS.find((p) => p.walletAddress.toLowerCase() === cleanQuery);
    }
    if (!demoMatch) {
      demoMatch = DEMO_PERSONAS.find((p) => p.email.toLowerCase().includes(cleanQuery) || p.name.toLowerCase().includes(cleanQuery));
    }

    if (demoMatch) {
      return res.status(200).json({
        success: true,
        user: {
          name: demoMatch.name,
          email: demoMatch.email,
          walletAddress: demoMatch.walletAddress,
          isDemoPersona: true,
        },
      });
    }

    // 3. Direct EVM address resolution fallback (if user pastes 0x address into search)
    if (/^0x[a-fA-F0-9]{40}$/.test(cleanQuery)) {
      return res.status(200).json({
        success: true,
        user: {
          name: 'Direct EVM Wallet',
          email: `${cleanQuery.slice(0, 6)}...${cleanQuery.slice(-4)}`,
          walletAddress: cleanQuery,
          isDirectAddress: true,
        },
      });
    }

    return res.status(404).json({
      success: false,
      message: `No registered user found matching "${query}". You can paste any 0x EVM wallet address.`,
    });
  } catch (error) {
    console.error('Lookup error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching user',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  linkWallet,
  lookupUser,
};
