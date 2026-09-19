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
  // Sync MongoDB and users.json bidirectionally
  async syncToFile() {
    try {
      ensureDataFile();
      if (isConnectedToMongo()) {
        const mongoUsers = await MongooseUser.find({}).sort({ createdAt: -1 }).lean();
        const existingFileUsers = readUsersFromFile();

        // 1. Migrate any users registered in offline JSON file into MongoDB
        for (const fileUser of existingFileUsers) {
          const inMongo = mongoUsers.some(
            (m) => (m.email || '').toLowerCase() === (fileUser.email || '').toLowerCase()
          );
          if (!inMongo && fileUser.email && fileUser.password) {
            try {
              await MongooseUser.create({
                name: fileUser.name,
                email: fileUser.email.toLowerCase().trim(),
                password: fileUser.password,
                walletAddress: fileUser.walletAddress || null,
                role: fileUser.role || 'user',
              });
              console.log(`📥 [DB Sync] Migrated offline registered user "${fileUser.email}" into MongoDB`);
            } catch (migErr) {
              // Ignore duplicate errors during concurrent syncs
            }
          }
        }

        // 2. Mirror all MongoDB users to server/data/users.json WITH password hash for offline fallback
        const refreshedMongoUsers = await MongooseUser.find({}).sort({ createdAt: -1 }).lean();
        const formatted = refreshedMongoUsers.map((u) => ({
          _id: u._id.toString(),
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          password: u.password, // Cryptographic bcrypt hash preserved for fallback authentication
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

  // Seed default test personas (Ashutosh, Rahul, Priya, Amit) if missing
  async seedDefaultAccounts() {
    const bcrypt = require('bcryptjs');
    const defaultAccounts = [
      {
        name: 'Ashutosh',
        email: 'ashutosh@gmail.com',
        passwordPlain: 'Password123!',
        walletAddress: '0x71c67ed3e80435a55611f476c66337051b7b292a',
        role: 'admin',
      },
      {
        name: 'Rahul',
        email: 'rahul@gmail.com',
        passwordPlain: 'Password123!',
        walletAddress: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
        role: 'user',
      },
      {
        name: 'Priya',
        email: 'priya@gmail.com',
        passwordPlain: 'Password123!',
        walletAddress: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
        role: 'user',
      },
      {
        name: 'Amit',
        email: 'amit@gmail.com',
        passwordPlain: 'Password123!',
        walletAddress: '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
        role: 'user',
      },
    ];

    try {
      const defaultHash = await bcrypt.hash('Password123!', 12);

      if (isConnectedToMongo()) {
        for (const acc of defaultAccounts) {
          const existing = await MongooseUser.findOne({ email: acc.email.toLowerCase() });
          if (!existing) {
            await MongooseUser.create({
              name: acc.name,
              email: acc.email.toLowerCase(),
              password: defaultHash,
              walletAddress: acc.walletAddress,
              role: acc.role,
            });
            console.log(`🌱 [Seed] Created default account: ${acc.email}`);
          }
        }
      }

      // Also ensure file DB has password for default accounts
      const fileUsers = readUsersFromFile();
      let fileUpdated = false;

      for (const acc of defaultAccounts) {
        const found = fileUsers.find((u) => (u.email || '').toLowerCase() === acc.email.toLowerCase());
        if (!found) {
          fileUsers.push({
            _id: 'usr_' + crypto.randomBytes(8).toString('hex'),
            id: 'usr_' + crypto.randomBytes(8).toString('hex'),
            name: acc.name,
            email: acc.email.toLowerCase(),
            password: defaultHash,
            walletAddress: acc.walletAddress,
            role: acc.role,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          fileUpdated = true;
        } else if (!found.password) {
          found.password = defaultHash;
          fileUpdated = true;
        }
      }

      if (fileUpdated) {
        writeUsersToFile(fileUsers);
      }
    } catch (seedErr) {
      console.warn('⚠️ [seedDefaultAccounts] Seed warning:', seedErr.message);
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
      try {
        const mongoUser = await MongooseUser.findOne(query);
        if (mongoUser) return mongoUser;
      } catch (err) {
        // Fall through to file DB if mongo query fails
      }
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
        } else if (key === 'name') {
          if ((u.name || '').toLowerCase() !== String(val).toLowerCase()) return false;
        } else if (key === 'walletAddress') {
          if ((u.walletAddress || '').toLowerCase() !== String(val).toLowerCase()) return false;
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
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const mongoUser = await MongooseUser.findById(id).select('-password');
          if (mongoUser) return mongoUser;
        }
      } catch (err) {
        // Fallback below
      }
    }

    const users = readUsersFromFile();
    const found = users.find((u) => u._id === id || u.id === id);
    if (!found) return null;
    const { password, ...safeUser } = found;
    return safeUser;
  },

  async create(data) {
    const cleanEmail = data.email.toLowerCase().trim();

    if (isConnectedToMongo()) {
      const created = await MongooseUser.create({
        name: data.name.trim(),
        email: cleanEmail,
        password: data.password,
        walletAddress: data.walletAddress || null,
        role: data.role || 'user',
      });
      // Auto-mirror to server/data/users.json with hashed password for fallback
      await User.syncToFile();
      return created;
    }

    const users = readUsersFromFile();
    // Check unique email
    if (users.some((u) => (u.email || '').toLowerCase() === cleanEmail)) {
      const err = new Error('Email already registered');
      err.code = 11000;
      throw err;
    }

    const newUser = {
      _id: 'usr_' + crypto.randomBytes(8).toString('hex'),
      id: 'usr_' + crypto.randomBytes(8).toString('hex'),
      name: data.name.trim(),
      email: cleanEmail,
      password: data.password, // bcrypt hash preserved
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
      try {
        if (mongoose.Types.ObjectId.isValid(id)) {
          const updated = await MongooseUser.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
            ...options,
          }).select('-password');
          if (updated) {
            await User.syncToFile();
            return updated;
          }
        }
      } catch (err) {
        // Fall through to file DB
      }
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
