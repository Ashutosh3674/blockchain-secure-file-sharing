const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { isConnectedToMongo } = require('../config/db');

// Mongoose User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    walletAddress: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  { timestamps: true }
);

const MongooseUser = mongoose.models.User || mongoose.model('User', userSchema);

// Local JSON File DB Fallback Implementation
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

const ensureDataFile = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf-8');
  }
};

const readUsersFromFile = () => {
  ensureDataFile();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading fallback JSON db:', err);
    return [];
  }
};

const writeUsersToFile = (users) => {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf-8');
};

// Unified User model wrapper with dual-persistence (MongoDB + users.json mirror)
const User = {
  async syncToFile() {
    try {
      ensureDataFile();
      if (isConnectedToMongo()) {
        const mongoUsers = await MongooseUser.find({}).sort({ createdAt: -1 }).lean();
        const formatted = mongoUsers.map((u) => ({
          _id: u._id.toString(),
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          walletAddress: u.walletAddress || null,
          role: u.role || 'user',
          status: 'active',
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : new Date().toISOString(),
        }));
        writeUsersToFile(formatted);
      }
    } catch (err) {
      console.warn('⚠️ [User.syncToFile] Non-critical sync warning:', err.message);
    }
  },

  async find(query = {}) {
    if (isConnectedToMongo()) {
      return await MongooseUser.find(query).select('-password').sort({ createdAt: -1 });
    }
    const users = readUsersFromFile();
    return users.map(({ password, ...safeUser }) => safeUser);
  },

  async countDocuments(query = {}) {
    if (isConnectedToMongo()) {
      return await MongooseUser.countDocuments(query);
    }
    return readUsersFromFile().length;
  },

  async findOne(query) {
    if (isConnectedToMongo()) {
      return await MongooseUser.findOne(query);
    }
    const users = readUsersFromFile();
    const matchCondition = (u, q) => {
      if (q.$or && Array.isArray(q.$or)) {
        return q.$or.some((subQ) => matchCondition(u, subQ));
      }
      for (const [key, val] of Object.entries(q)) {
        if (val instanceof RegExp) {
          if (!val.test(u[key] || '')) return false;
        } else if (key === 'email') {
          if ((u.email || '').toLowerCase() !== String(val).toLowerCase()) return false;
        } else {
          if (u[key] !== val) return false;
        }
      }
      return true;
    };

    const found = users.find((u) => matchCondition(u, query));
    return found ? { ...found } : null;
  },

  async findById(id) {
    if (isConnectedToMongo()) {
      return await MongooseUser.findById(id).select('-password');
    }
    const users = readUsersFromFile();
    const found = users.find((u) => u._id === id || u.id === id);
    if (!found) return null;
    const { password, ...safeUser } = found;
    return safeUser;
  },

  async create(data) {
    if (isConnectedToMongo()) {
      const created = await MongooseUser.create(data);
      // Auto-mirror to server/data/users.json so user can immediately view registered accounts
      await User.syncToFile();
      return created;
    }
    const users = readUsersFromFile();
    // Check unique email
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      const err = new Error('Email already registered');
      err.code = 11000;
      throw err;
    }

    const newUser = {
      _id: 'usr_' + crypto.randomBytes(8).toString('hex'),
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      password: data.password, // already hashed by controller
      walletAddress: data.walletAddress ? data.walletAddress.toLowerCase().trim() : null,
      role: data.role || 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsersToFile(users);
    return newUser;
  },

  async findByIdAndUpdate(id, updateData, options = {}) {
    if (isConnectedToMongo()) {
      const updated = await MongooseUser.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        ...options,
      }).select('-password');
      await User.syncToFile();
      return updated;
    }

    const users = readUsersFromFile();
    const index = users.findIndex((u) => u._id === id || u.id === id);
    if (index === -1) return null;

    users[index] = {
      ...users[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    writeUsersToFile(users);
    const { password, ...safeUser } = users[index];
    return safeUser;
  },
};

module.exports = User;
