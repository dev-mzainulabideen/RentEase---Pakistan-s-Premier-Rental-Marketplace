const mongoose = require('mongoose');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const bcrypt = require('bcryptjs');
require('dotenv').config();

/**
 * Comprehensive Test User Creation Script
 * Creates users with all combinations of:
 * - Account Types: Free, Paid
 * - Roles: Renter, Owner, Dual Role
 */

const TEST_PASSWORD = 'TestPass123!'; // Consistent password for all test accounts

async function createComprehensiveTestUsers() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/myrental';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        const createdUsers = [];
        const updatedUsers = [];
        const errors = [];

        // ==========================================
        // FREE ACCOUNTS
        // ==========================================
        
        console.log('📝 Creating FREE test accounts...\n');

        // Free Renter Accounts
        const freeRenters = [
            {
                email: 'free.renter1@test.com',
                name: 'Free Renter 1',
                phone: '03001234001',
                role: 'renter',
                description: 'Free account - Renter role - Can book items'
            },
            {
                email: 'free.renter2@test.com',
                name: 'Free Renter 2',
                phone: '03001234002',
                role: 'renter',
                description: 'Free account - Renter role - Can book items'
            }
        ];

        // Free Owner Accounts
        const freeOwners = [
            {
                email: 'free.owner1@test.com',
                name: 'Free Owner 1',
                phone: '03001234003',
                role: 'owner',
                description: 'Free account - Owner role - Can create listings'
            },
            {
                email: 'free.owner2@test.com',
                name: 'Free Owner 2',
                phone: '03001234004',
                role: 'owner',
                description: 'Free account - Owner role - Can create listings'
            }
        ];

        // Free Dual Role Accounts
        const freeDual = [
            {
                email: 'free.dual1@test.com',
                name: 'Free Dual Role 1',
                phone: '03001234005',
                role: 'dual_role',
                activeRole: 'renter',
                description: 'Free account - Dual role - Can rent and host'
            },
            {
                email: 'free.dual2@test.com',
                name: 'Free Dual Role 2',
                phone: '03001234006',
                role: 'dual_role',
                activeRole: 'owner',
                description: 'Free account - Dual role - Can rent and host'
            }
        ];

        // Create all free accounts
        const allFreeAccounts = [...freeRenters, ...freeOwners, ...freeDual];
        
        for (const accountData of allFreeAccounts) {
            try {
                const existing = await User.findOne({ email: accountData.email });
                
                if (existing) {
                    // Update existing account to ensure it's properly configured as free
                    existing.accountType = 'free';
                    existing.role = accountData.role;
                    if (accountData.activeRole) {
                        existing.activeRole = accountData.activeRole;
                    }
                    existing.adDisplaySettings = existing.adDisplaySettings || {};
                    existing.adDisplaySettings.adsEnabled = true;
                    existing.adDisplaySettings.adsExpiryDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
                    existing.verification = existing.verification || {};
                    existing.verification.status = 'not_verified';
                    existing.subscription = existing.subscription || {};
                    existing.subscription.status = 'none';
                    existing.verified = false;
                    
                    // Update password - set plain password, model will hash it on save
                    existing.password = TEST_PASSWORD;
                    
                    await existing.save();
                    updatedUsers.push({ ...accountData, id: existing._id });
                    console.log(`⚠️  Updated existing FREE account: ${accountData.email} (${accountData.role})`);
                } else {
                    // Create new free account
                    // Note: Pass plain password - User model pre-save hook will hash it
                    const userData = {
                        name: accountData.name,
                        email: accountData.email,
                        phone: accountData.phone,
                        password: TEST_PASSWORD, // Plain password - will be hashed by User model
                        role: accountData.role,
                        accountType: 'free',
                        accountCreatedAt: new Date(),
                        adDisplaySettings: {
                            adsEnabled: true,
                            adsExpiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
                            adDisplayCount: 0
                        },
                        verification: {
                            status: 'not_verified'
                        },
                        subscription: {
                            status: 'none'
                        },
                        verified: false
                    };
                    
                    if (accountData.activeRole) {
                        userData.activeRole = accountData.activeRole;
                    }
                    
                    const user = await User.create(userData);
                    createdUsers.push({ ...accountData, id: user._id });
                    console.log(`✅ Created FREE account: ${accountData.email} (${accountData.role}) - ID: ${user._id}`);
                }
            } catch (error) {
                errors.push({ email: accountData.email, error: error.message });
                console.error(`❌ Error with ${accountData.email}:`, error.message);
            }
        }

        // ==========================================
        // PAID ACCOUNTS
        // ==========================================
        
        console.log('\n📝 Creating PAID test accounts...\n');

        // Paid Renter Accounts
        const paidRenters = [
            {
                email: 'paid.renter1@test.com',
                name: 'Paid Renter 1',
                phone: '03001234007',
                role: 'renter',
                plan: 'monthly_pkr',
                description: 'Paid account - Renter role - No ads, verified, can view reviews'
            },
            {
                email: 'paid.renter2@test.com',
                name: 'Paid Renter 2',
                phone: '03001234008',
                role: 'renter',
                plan: 'monthly_usd',
                description: 'Paid account - Renter role - No ads, verified, can view reviews'
            }
        ];

        // Paid Owner Accounts
        const paidOwners = [
            {
                email: 'paid.owner1@test.com',
                name: 'Paid Owner 1',
                phone: '03001234009',
                role: 'owner',
                plan: 'monthly_pkr',
                description: 'Paid account - Owner role - No ads, verified, listing promotion'
            },
            {
                email: 'paid.owner2@test.com',
                name: 'Paid Owner 2',
                phone: '03001234010',
                role: 'owner',
                plan: 'monthly_usd',
                description: 'Paid account - Owner role - No ads, verified, listing promotion'
            }
        ];

        // Paid Dual Role Accounts
        const paidDual = [
            {
                email: 'paid.dual1@test.com',
                name: 'Paid Dual Role 1',
                phone: '03001234011',
                role: 'dual_role',
                activeRole: 'renter',
                plan: 'monthly_pkr',
                description: 'Paid account - Dual role - Full features'
            },
            {
                email: 'paid.dual2@test.com',
                name: 'Paid Dual Role 2',
                phone: '03001234012',
                role: 'dual_role',
                activeRole: 'owner',
                plan: 'monthly_usd',
                description: 'Paid account - Dual role - Full features'
            }
        ];

        // Create all paid accounts
        const allPaidAccounts = [...paidRenters, ...paidOwners, ...paidDual];
        
        for (const accountData of allPaidAccounts) {
            try {
                const existing = await User.findOne({ email: accountData.email });
                
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + 30); // 30 days subscription
                const nextBillingDate = new Date(endDate);
                
                const subscriptionData = {
                    status: 'active',
                    plan: accountData.plan,
                    startDate: startDate,
                    endDate: endDate,
                    nextBillingDate: nextBillingDate,
                    autoRenew: true,
                    lastPaymentDate: new Date()
                };
                
                if (existing) {
                    // Update existing account to paid
                    existing.accountType = 'paid';
                    existing.role = accountData.role;
                    if (accountData.activeRole) {
                        existing.activeRole = accountData.activeRole;
                    }
                    existing.subscription = { ...existing.subscription, ...subscriptionData };
                    existing.adDisplaySettings = existing.adDisplaySettings || {};
                    existing.adDisplaySettings.adsEnabled = false;
                    existing.verification = existing.verification || {};
                    existing.verification.status = 'verified';
                    existing.verification.verifiedAt = new Date();
                    existing.verified = true;
                    
                    // Update password - set plain password, model will hash it on save
                    existing.password = TEST_PASSWORD;
                    
                    await existing.save();
                    
                    // Update or create Subscription document
                    await Subscription.findOneAndUpdate(
                        { user: existing._id },
                        {
                            user: existing._id,
                            plan: accountData.plan,
                            status: 'active',
                            amount: accountData.plan === 'monthly_pkr' ? 500 : 7.99,
                            currency: accountData.plan === 'monthly_pkr' ? 'PKR' : 'USD',
                            startDate: startDate,
                            endDate: endDate,
                            nextBillingDate: nextBillingDate,
                            autoRenew: true
                        },
                        { upsert: true, new: true }
                    );
                    
                    updatedUsers.push({ ...accountData, id: existing._id });
                    console.log(`⚠️  Updated existing PAID account: ${accountData.email} (${accountData.role})`);
                } else {
                    // Create new paid account
                    // Note: Pass plain password - User model pre-save hook will hash it
                    const userData = {
                        name: accountData.name,
                        email: accountData.email,
                        phone: accountData.phone,
                        password: TEST_PASSWORD, // Plain password - will be hashed by User model
                        role: accountData.role,
                        accountType: 'paid',
                        accountCreatedAt: new Date(),
                        subscription: subscriptionData,
                        adDisplaySettings: {
                            adsEnabled: false,
                            adDisplayCount: 0
                        },
                        verification: {
                            status: 'verified',
                            verifiedAt: new Date()
                        },
                        verified: true
                    };
                    
                    if (accountData.activeRole) {
                        userData.activeRole = accountData.activeRole;
                    }
                    
                    const user = await User.create(userData);
                    
                    // Create Subscription document
                    await Subscription.create({
                        user: user._id,
                        plan: accountData.plan,
                        status: 'active',
                        amount: accountData.plan === 'monthly_pkr' ? 500 : 7.99,
                        currency: accountData.plan === 'monthly_pkr' ? 'PKR' : 'USD',
                        startDate: startDate,
                        endDate: endDate,
                        nextBillingDate: nextBillingDate,
                        autoRenew: true
                    });
                    
                    createdUsers.push({ ...accountData, id: user._id });
                    console.log(`✅ Created PAID account: ${accountData.email} (${accountData.role}) - ID: ${user._id}`);
                }
            } catch (error) {
                errors.push({ email: accountData.email, error: error.message });
                console.error(`❌ Error with ${accountData.email}:`, error.message);
            }
        }

        // ==========================================
        // SUMMARY
        // ==========================================
        
        console.log('\n' + '='.repeat(80));
        console.log('✅ TEST USER CREATION COMPLETED!');
        console.log('='.repeat(80));
        
        console.log(`\n📊 Summary:`);
        console.log(`   - Created: ${createdUsers.length} new accounts`);
        console.log(`   - Updated: ${updatedUsers.length} existing accounts`);
        console.log(`   - Errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log(`\n❌ Errors:`);
            errors.forEach(err => {
                console.log(`   - ${err.email}: ${err.error}`);
            });
        }
        
        console.log('\n' + '='.repeat(80));
        console.log('📋 FREE ACCOUNTS (Password: ' + TEST_PASSWORD + ')');
        console.log('='.repeat(80));
        
        console.log('\n🆓 Free Renters:');
        freeRenters.forEach((acc, idx) => {
            const user = [...createdUsers, ...updatedUsers].find(u => u.email === acc.email);
            console.log(`   ${idx + 1}. ${acc.email} | Role: ${acc.role} | ${user ? '✅' : '❌'}`);
        });
        
        console.log('\n🆓 Free Owners:');
        freeOwners.forEach((acc, idx) => {
            const user = [...createdUsers, ...updatedUsers].find(u => u.email === acc.email);
            console.log(`   ${idx + 1}. ${acc.email} | Role: ${acc.role} | ${user ? '✅' : '❌'}`);
        });
        
        console.log('\n🆓 Free Dual Role:');
        freeDual.forEach((acc, idx) => {
            const user = [...createdUsers, ...updatedUsers].find(u => u.email === acc.email);
            console.log(`   ${idx + 1}. ${acc.email} | Role: ${acc.role} | Active: ${acc.activeRole} | ${user ? '✅' : '❌'}`);
        });
        
        console.log('\n' + '='.repeat(80));
        console.log('💎 PAID ACCOUNTS (Password: ' + TEST_PASSWORD + ')');
        console.log('='.repeat(80));
        
        console.log('\n💎 Paid Renters:');
        paidRenters.forEach((acc, idx) => {
            const user = [...createdUsers, ...updatedUsers].find(u => u.email === acc.email);
            console.log(`   ${idx + 1}. ${acc.email} | Role: ${acc.role} | Plan: ${acc.plan} | ${user ? '✅' : '❌'}`);
        });
        
        console.log('\n💎 Paid Owners:');
        paidOwners.forEach((acc, idx) => {
            const user = [...createdUsers, ...updatedUsers].find(u => u.email === acc.email);
            console.log(`   ${idx + 1}. ${acc.email} | Role: ${acc.role} | Plan: ${acc.plan} | ${user ? '✅' : '❌'}`);
        });
        
        console.log('\n💎 Paid Dual Role:');
        paidDual.forEach((acc, idx) => {
            const user = [...createdUsers, ...updatedUsers].find(u => u.email === acc.email);
            console.log(`   ${idx + 1}. ${acc.email} | Role: ${acc.role} | Active: ${acc.activeRole} | Plan: ${acc.plan} | ${user ? '✅' : '❌'}`);
        });
        
        console.log('\n' + '='.repeat(80));
        console.log('💡 TESTING GUIDE');
        console.log('='.repeat(80));
        console.log('\n1. Free Accounts:');
        console.log('   - Should see ads for 48 hours');
        console.log('   - "Not Verified" badge');
        console.log('   - Reviews hidden');
        console.log('   - Standard features');
        
        console.log('\n2. Paid Accounts:');
        console.log('   - No ads displayed');
        console.log('   - "Verified Customer" badge');
        console.log('   - Reviews visible');
        console.log('   - Listing promotion (30 days)');
        console.log('   - Priority support');
        
        console.log('\n3. Role Testing:');
        console.log('   - Renters: Can book, view bookings, message');
        console.log('   - Owners: Can create listings, manage bookings, view earnings');
        console.log('   - Dual Role: Can switch between renter/owner modes');
        
        console.log('\n4. Login:');
        console.log(`   - Use email and password: ${TEST_PASSWORD}`);
        console.log('   - Check account type in profile');
        console.log('   - Verify features based on account type');
        console.log('='.repeat(80) + '\n');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');
        
        return {
            created: createdUsers.length,
            updated: updatedUsers.length,
            errors: errors.length,
            users: [...createdUsers, ...updatedUsers]
        };
    } catch (error) {
        console.error('❌ Error creating test users:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    createComprehensiveTestUsers()
        .then((result) => {
            console.log('\n✅ Script completed successfully');
            console.log(`   Created: ${result.created}, Updated: ${result.updated}, Errors: ${result.errors}`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Script failed:', error);
            process.exit(1);
        });
}

module.exports = { createComprehensiveTestUsers };

