/**
 * Fix User Password Script
 * Checks and resets password for a user
 * 
 * Usage: node backend/scripts/fix-user-password.js <email> <newPassword>
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function fixUserPassword() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/myrental_marketplace';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // Get email and password from command line arguments
        const email = process.argv[2];
        const newPassword = process.argv[3];

        if (!email) {
            console.error('❌ Error: Email is required');
            console.log('Usage: node backend/scripts/fix-user-password.js <email> [newPassword]');
            process.exit(1);
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        
        if (!user) {
            console.error(`❌ User not found: ${email}`);
            process.exit(1);
        }

        console.log(`✅ User found: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Has password: ${!!user.password}`);
        console.log(`   Password length: ${user.password ? user.password.length : 0}`);
        console.log(`   Password starts with $2: ${user.password ? user.password.startsWith('$2') : false}\n`);

        // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
        const isHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$'));
        
        if (isHashed) {
            console.log('✅ Password is already hashed');
            
            // Test the provided password
            if (newPassword) {
                const testMatch = await bcrypt.compare(newPassword, user.password);
                console.log(`   Testing password "${newPassword}": ${testMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
                
                if (!testMatch) {
                    console.log('\n⚠️  Password does not match. Resetting password...');
                    user.password = newPassword; // Will be hashed by pre-save hook
                    await user.save();
                    console.log('✅ Password reset successfully!');
                } else {
                    console.log('\n✅ Password is correct and matches!');
                }
            } else {
                console.log('\n💡 To test a password, provide it as second argument:');
                console.log(`   node backend/scripts/fix-user-password.js ${email} "your-password"`);
            }
        } else {
            console.log('⚠️  Password is NOT hashed (stored as plain text)');
            
            if (newPassword) {
                console.log(`\n🔄 Resetting password to: ${newPassword}`);
                user.password = newPassword; // Will be hashed by pre-save hook
                await user.save();
                console.log('✅ Password hashed and saved successfully!');
            } else {
                console.log('\n❌ Password needs to be reset. Please provide new password:');
                console.log(`   node backend/scripts/fix-user-password.js ${email} "your-password"`);
            }
        }

        // Verify the password after reset
        if (newPassword) {
            const updatedUser = await User.findOne({ email: email.toLowerCase() }).select('+password');
            const verifyMatch = await bcrypt.compare(newPassword, updatedUser.password);
            console.log(`\n🔍 Verification: Password "${newPassword}" matches: ${verifyMatch ? '✅ YES' : '❌ NO'}`);
        }

        await mongoose.disconnect();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        await mongoose.disconnect().catch(() => {});
        process.exit(1);
    }
}

fixUserPassword();


