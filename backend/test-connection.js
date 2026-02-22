// Test MongoDB Connection
// Run: node test-connection.js

require('dotenv').config();
const connectDB = require('./config/database');
const mongoose = require('mongoose');

async function testConnection() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        console.log('📍 Connection String:', process.env.MONGODB_URI ? 'Set ✅' : 'Missing ❌');
        
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI not found in .env file');
            console.log('💡 Create .env file and add your MongoDB connection string');
            process.exit(1);
        }
        
        await connectDB();
        console.log('✅ Connection successful!');
        console.log('📊 You can now start creating models and seeding data');
        
        // Close connection after test
        setTimeout(() => {
            mongoose.connection.close();
            console.log('🔌 Connection closed');
            process.exit(0);
        }, 2000);
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('1. Check your .env file has MONGODB_URI');
        console.log('2. Verify your MongoDB connection string is correct');
        console.log('3. Check your internet connection (for Atlas)');
        console.log('4. Verify MongoDB is running (for local)');
        process.exit(1);
    }
}

testConnection();

