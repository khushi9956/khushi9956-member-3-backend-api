const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/saas_collab_db';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 1500,
    });
    isConnected = true;
    global.useMemoryDb = false;
    console.log(`[Member-4 Database] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.warn(`[Member-4 Database] Local MongoDB not reachable at ${mongoURI} (${error.message})`);
    console.log(`[Member-4 Database] Switching to In-Memory DB Mode for instant zero-dependency execution...`);
    global.useMemoryDb = true;
    const { initMemoryStore } = require('./memoryDb');
    await initMemoryStore();
    isConnected = true;
    console.log(`[Member-4 Database] In-Memory Database successfully initialized with Week 1 & 2 demo seed data!`);
  }
};

module.exports = connectDB;
