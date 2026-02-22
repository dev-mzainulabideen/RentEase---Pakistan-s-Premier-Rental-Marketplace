const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Get connection string from environment variable
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

        // One-time migration: drop legacy non-sparse phone index if it exists.
        // This index (`phone_1`) was created without `sparse: true` and caused
        // `E11000 duplicate key error ... phone: null` when phone was optional.
        try {
            const User = require('../models/User');
            await User.collection.dropIndex('phone_1');
            console.log('🧹 Dropped legacy phone_1 index on users collection');
        } catch (idxErr) {
            // Ignore "index not found" errors; log others for visibility.
            if (!idxErr || (idxErr.codeName !== 'IndexNotFound' && idxErr.code !== 27)) {
                console.warn('⚠️ Could not drop legacy phone_1 index (may already be removed):', idxErr.message);
            }
        }
        
        return conn;
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        // Exit process if database connection fails
        process.exit(1);
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose disconnected');
});

// Handle app termination
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('MongoDB connection closed due to app termination');
    process.exit(0);
});

module.exports = connectDB;

