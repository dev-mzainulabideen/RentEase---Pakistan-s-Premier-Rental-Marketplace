const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestAccounts() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/myrental';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Free test accounts
    const freeAccounts = [
      {
        email: 'free1@test.com',
        name: 'Free User 1',
        password: await bcrypt.hash('password123', 10),
        accountType: 'free',
        role: 'renter',
        accountCreatedAt: new Date(),
        adDisplaySettings: {
          adsEnabled: true,
          adsExpiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
        },
        verification: {
          status: 'not_verified'
        },
        subscription: {
          status: 'none'
        }
      },
      {
        email: 'free2@test.com',
        name: 'Free User 2',
        password: await bcrypt.hash('password123', 10),
        accountType: 'free',
        role: 'owner',
        accountCreatedAt: new Date(),
        adDisplaySettings: {
          adsEnabled: true,
          adsExpiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000)
        },
        verification: {
          status: 'not_verified'
        },
        subscription: {
          status: 'none'
        }
      },
      {
        email: 'free3@test.com',
        name: 'Free User 3',
        password: await bcrypt.hash('password123', 10),
        accountType: 'free',
        role: 'dual_role',
        activeRole: 'renter',
        accountCreatedAt: new Date(),
        adDisplaySettings: {
          adsEnabled: true,
          adsExpiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000)
        },
        verification: {
          status: 'not_verified'
        },
        subscription: {
          status: 'none'
        }
      }
    ];

    // Paid test accounts
    const paidAccounts = [
      {
        email: 'paid1@test.com',
        name: 'Paid User 1',
        password: await bcrypt.hash('password123', 10),
        accountType: 'paid',
        role: 'renter',
        subscription: {
          status: 'active',
          plan: 'monthly_pkr',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        adDisplaySettings: {
          adsEnabled: false
        },
        verification: {
          status: 'verified',
          verifiedAt: new Date()
        },
        verified: true
      },
      {
        email: 'paid2@test.com',
        name: 'Paid User 2',
        password: await bcrypt.hash('password123', 10),
        accountType: 'paid',
        role: 'owner',
        subscription: {
          status: 'active',
          plan: 'monthly_usd',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        adDisplaySettings: {
          adsEnabled: false
        },
        verification: {
          status: 'verified',
          verifiedAt: new Date()
        },
        verified: true
      },
      {
        email: 'paid3@test.com',
        name: 'Paid User 3',
        password: await bcrypt.hash('password123', 10),
        accountType: 'paid',
        role: 'dual_role',
        activeRole: 'renter',
        subscription: {
          status: 'active',
          plan: 'monthly_pkr',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        adDisplaySettings: {
          adsEnabled: false
        },
        verification: {
          status: 'verified',
          verifiedAt: new Date()
        },
        verified: true
      }
    ];

    // Create free accounts
    console.log('\n📝 Creating free test accounts...');
    for (const account of freeAccounts) {
      try {
        const existing = await User.findOne({ email: account.email });
        if (!existing) {
          const user = await User.create(account);
          console.log(`✅ Created free account: ${account.email} (ID: ${user._id})`);
        } else {
          // Update existing account to match free account structure
          await User.findOneAndUpdate(
            { email: account.email },
            {
              accountType: 'free',
              'adDisplaySettings.adsEnabled': true,
              'adDisplaySettings.adsExpiryDate': new Date(Date.now() + 48 * 60 * 60 * 1000),
              'verification.status': 'not_verified',
              'subscription.status': 'none'
            }
          );
          console.log(`⚠️  Updated existing account to free: ${account.email}`);
        }
      } catch (error) {
        console.error(`❌ Error creating free account ${account.email}:`, error.message);
      }
    }

    // Create paid accounts
    console.log('\n📝 Creating paid test accounts...');
    for (const account of paidAccounts) {
      try {
        const existing = await User.findOne({ email: account.email });
        if (!existing) {
          const user = await User.create(account);
          console.log(`✅ Created paid account: ${account.email} (ID: ${user._id})`);
        } else {
          // Update existing account to match paid account structure
          await User.findOneAndUpdate(
            { email: account.email },
            {
              accountType: 'paid',
              subscription: account.subscription,
              'adDisplaySettings.adsEnabled': false,
              'verification.status': 'verified',
              verified: true
            }
          );
          console.log(`⚠️  Updated existing account to paid: ${account.email}`);
        }
      } catch (error) {
        console.error(`❌ Error creating paid account ${account.email}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test accounts setup completed!');
    console.log('='.repeat(60));
    console.log('\n📋 Free Test Accounts:');
    freeAccounts.forEach((acc, index) => {
      console.log(`   ${index + 1}. Email: ${acc.email}`);
      console.log(`      Password: password123`);
      console.log(`      Role: ${acc.role}`);
      console.log(`      Status: Not Verified`);
      console.log(`      Ads: Enabled (48 hours)`);
      console.log('');
    });

    console.log('\n📋 Paid Test Accounts:');
    paidAccounts.forEach((acc, index) => {
      console.log(`   ${index + 1}. Email: ${acc.email}`);
      console.log(`      Password: password123`);
      console.log(`      Role: ${acc.role}`);
      console.log(`      Plan: ${acc.subscription.plan}`);
      console.log(`      Status: Verified Customer`);
      console.log(`      Ads: Disabled`);
      console.log('');
    });

    console.log('💡 Use these accounts to test the advertisement system!');
    console.log('='.repeat(60) + '\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error creating test accounts:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  createTestAccounts()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestAccounts };

