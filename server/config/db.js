const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isConnectedToMongo = false;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blockchain_fileshare';
  try {
    // Attempt connecting with a short timeout so we don't hang if no local mongod
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    isConnectedToMongo = true;
    console.log(`✅ MongoDB Connected successfully: ${mongoose.connection.host}`);
    try {
      const User = require('../models/User');
      await User.seedDefaultAccounts();
      await User.syncToFile();
      console.log(`📁 Database users synchronized with local file (server/data/users.json).`);
    } catch (syncErr) {
      console.warn('Sync notice:', syncErr.message);
    }
  } catch (error) {
    console.warn(`⚠️ Local MongoDB not detected (${error.message}).`);
    console.log(`📁 Auto-switching to persistent Local JSON Database engine (server/data/users.json).`);
    console.log(`💡 To use MongoDB Atlas, simply set MONGO_URI in server/.env`);
    isConnectedToMongo = false;
    try {
      const User = require('../models/User');
      await User.seedDefaultAccounts();
    } catch (fallbackErr) {
      console.warn('Fallback seed notice:', fallbackErr.message);
    }
  }
};

const getDBStatus = () => {
  return {
    type: isConnectedToMongo ? 'MongoDB' : 'Local File DB (Fallback)',
    connected: true,
    mongoHost: isConnectedToMongo ? mongoose.connection.host : null
  };
};

module.exports = { connectDB, isConnectedToMongo: () => isConnectedToMongo, getDBStatus };
