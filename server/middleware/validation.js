// server/middleware/validation.js
/**
 * 🛡️ Security Middleware: Input Validation, Sanitization, File Type Whitelist,
 * Oversized Upload Protection, and Rate Limiting
 */

// 1. Allowed MIME Types and File Extensions Whitelist
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'text/plain',
  'application/json',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream', // Generic binary, validated via extension
]);

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.docx',
  '.doc',
  '.pptx',
  '.ppt',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.zip',
  '.txt',
  '.json',
  '.xlsx',
]);

// Dangerous executable & script extensions explicitly banned
const BANNED_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.bash',
  '.vbs',
  '.js',
  '.mjs',
  '.php',
  '.phtml',
  '.py',
  '.pl',
  '.cgi',
  '.jar',
  '.scr',
  '.msi',
  '.dll',
  '.com',
  '.bin', // raw executable
  '.app',
]);

// Maximum File Upload Size: 50 MB (Configurable dynamically)
let MAX_UPLOAD_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '50', 10);
let MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024; // Default 50 MB (52,428,800 bytes)

const getUploadLimits = () => ({
  maxUploadSizeMB: MAX_UPLOAD_SIZE_MB,
  maxUploadSizeBytes: MAX_UPLOAD_SIZE_BYTES,
  allowedExtensions: Array.from(ALLOWED_EXTENSIONS),
  allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
  bannedExtensions: Array.from(BANNED_EXTENSIONS),
});

const setUploadLimitMB = (newLimitMB) => {
  const parsed = parseInt(newLimitMB, 10);
  if (isNaN(parsed) || parsed <= 0 || parsed > 500) {
    throw new Error('Upload limit must be a positive number between 1 and 500 MB.');
  }
  MAX_UPLOAD_SIZE_MB = parsed;
  MAX_UPLOAD_SIZE_BYTES = parsed * 1024 * 1024;
  console.log(`🛡️ [Security Firewall] Upload limit dynamically updated to ${MAX_UPLOAD_SIZE_MB} MB.`);
  return getUploadLimits();
};

// ============================================================================
// 1. MALICIOUS INPUT SANITIZATION
// Prevents XSS, NoSQL query injection ($gt, $ne), and path traversal attacks
// ============================================================================
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  let cleaned = str;

  // 1. Strip null bytes
  cleaned = cleaned.replace(/\0/g, '');

  // 2. Prevent directory path traversal
  cleaned = cleaned.replace(/\.\.[\/\\]/g, '');

  // 3. Strip dangerous script tags and inline javascript event handlers
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/javascript:/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=/gi, '');

  return cleaned.trim();
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // Block NoSQL injection operators (keys starting with $)
    if (key.startsWith('$')) {
      console.warn(`🛡️ [Security Firewall] Blocked NoSQL injection key attempt: "${key}"`);
      continue; // Drop dangerous operator
    }

    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

const sanitizeInput = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    next();
  } catch (err) {
    console.error('Input sanitization error:', err);
    res.status(400).json({
      success: false,
      message: 'Malicious or malformed input payload detected and blocked by security firewall.',
    });
  }
};

// ============================================================================
// 2. FILE TYPE VALIDATION & WHITELIST GUARD
// Prevents upload of malicious executables, web shells, and unsupported files
// ============================================================================
const validateFileType = (req, res, next) => {
  const fileName = req.body.fileName || '';
  const mimeType = (req.body.mimeType || '').toLowerCase().trim();

  if (!fileName) {
    return res.status(400).json({
      success: false,
      message: 'File name is required for upload verification.',
    });
  }

  // Sanitize file name against path traversal
  const safeName = sanitizeString(fileName).replace(/[\/\\]/g, '');
  req.body.fileName = safeName;

  // Extract extension
  const lastDotIndex = safeName.lastIndexOf('.');
  const ext = lastDotIndex !== -1 ? safeName.slice(lastDotIndex).toLowerCase() : '';

  // 1. Check Banned Dangerous Extensions
  if (BANNED_EXTENSIONS.has(ext)) {
    console.warn(`🛡️ [Security Firewall] Blocked dangerous executable/script upload attempt: "${safeName}" (${ext})`);
    return res.status(415).json({
      success: false,
      securityBlocked: true,
      code: 'BANNED_FILE_EXTENSION',
      message: `Access Denied: Executable or script files with extension "${ext}" are strictly banned to prevent server/client malware execution.`,
      allowedTypes: Array.from(ALLOWED_EXTENSIONS),
    });
  }

  // 2. Check Allowed Extensions Whitelist
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    console.warn(`🛡️ [Security Firewall] Blocked unapproved file extension: "${safeName}" (${ext})`);
    return res.status(415).json({
      success: false,
      securityBlocked: true,
      code: 'UNSUPPORTED_FILE_EXTENSION',
      message: `Invalid file type: File extension "${ext || 'none'}" is not supported. Only approved document, image, and archive types are permitted.`,
      allowedExtensions: Array.from(ALLOWED_EXTENSIONS),
    });
  }

  // 3. Check Allowed MIME Type Whitelist
  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
    console.warn(`🛡️ [Security Firewall] Blocked unapproved MIME type: "${mimeType}" for file "${safeName}"`);
    return res.status(415).json({
      success: false,
      securityBlocked: true,
      code: 'UNSUPPORTED_MIME_TYPE',
      message: `Invalid MIME type: "${mimeType}" is not permitted.`,
      allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
    });
  }

  next();
};

// ============================================================================
// 3. OVERSIZED UPLOAD PROTECTION
// Prevents memory exhaustion / DoS from excessively large uploads
// ============================================================================
const validateUploadSize = (req, res, next) => {
  const { ciphertextBase64 } = req.body;

  if (!ciphertextBase64) {
    return res.status(400).json({
      success: false,
      message: 'No ciphertext data provided in request body.',
    });
  }

  // Calculate approximate binary size from Base64 string or simulatedBytes (for test benches)
  let approximateSizeBytes = 0;
  if (req.body.simulatedBytes && Number(req.body.simulatedBytes) > 0) {
    approximateSizeBytes = Number(req.body.simulatedBytes);
  } else {
    const padding = (ciphertextBase64.endsWith('==') ? 2 : ciphertextBase64.endsWith('=') ? 1 : 0);
    approximateSizeBytes = Math.floor((ciphertextBase64.length * 3) / 4) - padding;
  }

  if (approximateSizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    const sizeMB = (approximateSizeBytes / (1024 * 1024)).toFixed(2);
    const maxMB = (MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)).toFixed(0);
    console.warn(`🛡️ [Security Firewall] Blocked oversized upload: ${sizeMB} MB exceeds ${maxMB} MB limit.`);
    return res.status(413).json({
      success: false,
      securityBlocked: true,
      code: 'PAYLOAD_TOO_LARGE',
      message: `File size (${sizeMB} MB) exceeds the maximum allowed limit of ${maxMB} MB per file.`,
      maxAllowedBytes: MAX_UPLOAD_SIZE_BYTES,
    });
  }

  req.fileSizeBytes = approximateSizeBytes;
  next();
};

// ============================================================================
// 4. RATE LIMITING MIDDLEWARE
// Prevents brute-force, scraping, and DoS attacks (sliding window counter)
// ============================================================================
const createRateLimiter = ({ windowMs = 60 * 1000, maxRequests = 100, message = 'Too many requests' }) => {
  const requests = new Map(); // IP -> Array of timestamps

  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const windowStart = now - windowMs;

    let timestamps = requests.get(ip) || [];
    // Filter timestamps within current window
    timestamps = timestamps.filter((t) => t > windowStart);

    if (timestamps.length >= maxRequests) {
      const oldest = timestamps[0];
      const retryAfterSeconds = Math.ceil((oldest + windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      console.warn(`🛡️ [Rate Limiter] Rate limit exceeded for IP ${ip}: ${timestamps.length}/${maxRequests} requests.`);
      return res.status(429).json({
        success: false,
        securityBlocked: true,
        code: 'RATE_LIMIT_EXCEEDED',
        message: `${message}. Please try again in ${retryAfterSeconds} seconds.`,
        retryAfter: retryAfterSeconds,
      });
    }

    timestamps.push(now);
    requests.set(ip, timestamps);
    next();
  };
};

// Pre-configured Rate Limiters
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20, // max 20 login/register attempts per 15 min
  message: 'Too many authentication attempts from this IP address',
});

const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 50, // max 50 uploads per hour
  message: 'Upload quota rate limit reached',
});

const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 120, // 120 requests/minute
  message: 'API rate limit reached',
});

module.exports = {
  sanitizeInput,
  validateFileType,
  validateUploadSize,
  authRateLimiter,
  uploadRateLimiter,
  apiRateLimiter,
  getUploadLimits,
  setUploadLimitMB,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  BANNED_EXTENSIONS,
  MAX_UPLOAD_SIZE_BYTES,
};
