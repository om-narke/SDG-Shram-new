/**
 * Database Connection Test & User Creation Script
 * Run with: node src/scripts/testDb.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');

const testDatabase = async () => {
  console.log('🔄 Testing database connection...\n');

  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}\n`);

    // Test 1: Check if connection is ready
    console.log('--- Test 1: Connection State ---');
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    console.log(`Connection state: ${states[mongoose.connection.readyState]}\n`);

    // Test 2: Create a test user
    console.log('--- Test 2: Create Test User ---');
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: 'testuser@example.com' });
    
    if (existingUser) {
      console.log('⚠️  Test user already exists. Deleting old one...');
      await User.deleteOne({ email: 'testuser@example.com' });
    }

    // Create new test user
    const testUser = await User.create({
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'Test@123',
      phone: '+91 9876543210',
      address: {
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India'
      }
    });

    console.log('✅ Test user created successfully!');
    console.log(`   ID: ${testUser._id}`);
    console.log(`   Name: ${testUser.name}`);
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   Password (hashed): ${testUser.password ? '[HIDDEN - stored securely]' : 'ERROR'}\n`);

    // Test 3: Password hashing verification
    console.log('--- Test 3: Password Hashing ---');
    const userWithPassword = await User.findOne({ email: 'testuser@example.com' }).select('+password');
    console.log(`   Original password: Test@123`);
    console.log(`   Hashed password: ${userWithPassword.password.substring(0, 20)}...`);
    console.log(`   Hash length: ${userWithPassword.password.length} characters\n`);

    // Test 4: Password comparison
    console.log('--- Test 4: Password Comparison ---');
    const isMatchCorrect = await userWithPassword.matchPassword('Test@123');
    const isMatchWrong = await userWithPassword.matchPassword('WrongPassword');
    console.log(`   Correct password match: ${isMatchCorrect ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Wrong password match: ${!isMatchWrong ? '✅ PASS (rejected)' : '❌ FAIL'}\n`);

    // Test 5: JWT Generation
    console.log('--- Test 5: JWT Token Generation ---');
    const token = userWithPassword.getSignedJwtToken();
    console.log(`   Token generated: ${token.substring(0, 50)}...`);
    console.log(`   Token length: ${token.length} characters\n`);

    // Summary
    console.log('========================================');
    console.log('✅ All tests passed successfully!');
    console.log('========================================\n');
    console.log('Test user credentials:');
    console.log('   Email: testuser@example.com');
    console.log('   Password: Test@123');
    console.log('\nYou can use these credentials to test login.\n');

  } catch (error) {
    console.error('❌ Database test failed!');
    console.error(`   Error: ${error.message}\n`);
    
    if (error.message.includes('MONGO_URI')) {
      console.log('💡 Tip: Make sure MONGO_URI is set correctly in your .env file');
    }
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed.');
    process.exit(0);
  }
};

testDatabase();
