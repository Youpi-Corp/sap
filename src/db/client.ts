import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
  console.error("DATABASE_URL environment variable is not set for MongoDB");
  process.exit(1);
}

let isConnected = false;

export async function connectToDB() {
  if (isConnected) {
    console.log('MongoDB is already connected.');
    return;
  }
  try {
    await mongoose.connect(connectionString);
    isConnected = true;
    console.log('MongoDB connected successfully.');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected.');
      isConnected = false;
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
}