const mongoose = require('mongoose');
require('dotenv').config();

const Ad = require('../models/Ad');

async function seedAds() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myrental');
        console.log('Connected to MongoDB');

        // Clear existing ads
        await Ad.deleteMany({});
        console.log('Cleared existing ads');

        // Create test ads
        const testAds = [
    {
        title: 'Premium Rental Services',
                content: 'Find the best rental deals in Pakistan. Verified listings, secure payments, and 24/7 support.',
                image: 'https://via.placeholder.com/728x90/FF385C/FFFFFF?text=Premium+Rental+Services',
        adType: 'image',
                link: 'https://example.com',
                advertiser: 'RentEase',
        targetAccountTypes: ['free', 'all'],
                targetCategories: ['all'],
                displayRules: {
                    position: 'inline',
                    priority: 10,
                    rotationInterval: 120
                },
        status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    },
    {
                title: 'Upgrade to Premium',
                content: 'Get verified badge, no ads, and extended listing duration. Upgrade now!',
                image: 'https://via.placeholder.com/728x90/667eea/FFFFFF?text=Upgrade+to+Premium',
        adType: 'image',
                link: 'https://example.com/subscribe',
                advertiser: 'RentEase',
                targetAccountTypes: ['free'],
                targetCategories: ['all'],
                displayRules: {
                    position: 'banner',
                    priority: 5,
                    rotationInterval: 120
                },
        status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    },
    {
                title: 'Special Property Deals',
                content: 'Exclusive property rentals with instant booking. Book now and save!',
                image: 'https://via.placeholder.com/300x250/00b894/FFFFFF?text=Property+Deals',
        adType: 'image',
                link: 'https://example.com/properties',
                advertiser: 'Property Partners',
        targetAccountTypes: ['free', 'all'],
                targetCategories: ['property'],
                displayRules: {
                    position: 'sidebar',
                    priority: 8,
                    rotationInterval: 120
                },
        status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    },
    {
        title: 'Vehicle Rental Special',
                content: 'Rent cars, bikes, and more. Best prices guaranteed!',
                image: 'https://via.placeholder.com/728x90/fdcb6e/000000?text=Vehicle+Rental+Special',
        adType: 'image',
        link: 'https://example.com/vehicles',
                advertiser: 'Auto Rentals',
        targetAccountTypes: ['free', 'all'],
                targetCategories: ['vehicles'],
        displayRules: {
                    position: 'inline',
                    priority: 7,
                    rotationInterval: 120
                },
        status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            }
        ];

        const createdAds = await Ad.insertMany(testAds);
        console.log(`✅ Created ${createdAds.length} test ads:`);
        createdAds.forEach(ad => {
            console.log(`   - ${ad.title} (ID: ${ad._id})`);
        });

        console.log('\n✅ Ads seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding ads:', error);
        process.exit(1);
    }
}

seedAds();
