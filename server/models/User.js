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

// Unified User model wrapper
const User = {
  async findOne(query) {
    if (isConnectedToMongo()) {
      return await MongooseUser.findOne(query);
    }
    const users = readUsersFromFile();
    const found = users.find((u) => {
      for (const [key, val] of Object.entries(query)) {
        if (key === 'email' && u.email.toLowerCase() === String(val).toLowerCase()) return true;
        if (u[key] === val) return true;
      }
      return false;
    });
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
      return await MongooseUser.create(data);
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsersToFile(users);
    return newUser;
  },

  async findByIdAndUpdate(id, updateData, options = {}) {
    if (isConnectedToMongo()) {
      return await MongooseUser.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
        ...options,
      }).select('-password');
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
