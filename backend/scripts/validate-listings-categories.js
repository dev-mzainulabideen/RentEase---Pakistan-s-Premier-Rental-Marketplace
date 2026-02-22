/**
 * Script to validate and report listings with mismatched category-subcategory pairs
 * Run with: node backend/scripts/validate-listings-categories.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const { validateCategorySubcategory, getValidSubcategories } = require('../utils/categoryValidator');

async function validateListings() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentalmarketplace';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Fetch all active listings
        const listings = await Listing.find({ status: { $ne: 'deleted' } });
        console.log(`\n📋 Found ${listings.length} listings to validate\n`);

        const issues = [];
        const valid = [];

        for (const listing of listings) {
            const category = listing.category;
            const subCategory = listing.subCategory;

            const validation = validateCategorySubcategory(category, subCategory);

            if (!validation.valid) {
                issues.push({
                    id: listing._id,
                    title: listing.title,
                    category,
                    subCategory,
                    error: validation.error,
                    owner: listing.owner,
                    status: listing.status,
                });
            } else {
                valid.push({
                    id: listing._id,
                    title: listing.title,
                    category,
                    subCategory,
                });
            }
        }

        // Report results
        console.log('='.repeat(80));
        console.log('VALIDATION RESULTS');
        console.log('='.repeat(80));
        console.log(`✅ Valid listings: ${valid.length}`);
        console.log(`❌ Invalid listings: ${issues.length}\n`);

        if (issues.length > 0) {
            console.log('ISSUES FOUND:');
            console.log('-'.repeat(80));
            issues.forEach((issue, index) => {
                console.log(`\n${index + 1}. Listing ID: ${issue.id}`);
                console.log(`   Title: ${issue.title}`);
                console.log(`   Category: ${issue.category}`);
                console.log(`   Subcategory: ${issue.subCategory}`);
                console.log(`   Error: ${issue.error}`);
                console.log(`   Status: ${issue.status}`);
                console.log(`   Owner: ${issue.owner}`);
            });

            console.log('\n' + '='.repeat(80));
            console.log('RECOMMENDATIONS:');
            console.log('='.repeat(80));
            console.log('1. Review the invalid listings above');
            console.log('2. Update listings manually via the admin panel or API');
            console.log('3. Or create a migration script to fix common issues');
            console.log('\nTo fix a listing, update it with a valid subcategory for its category:');
            
            // Group by category
            const issuesByCategory = {};
            issues.forEach(issue => {
                if (!issuesByCategory[issue.category]) {
                    issuesByCategory[issue.category] = [];
                }
                issuesByCategory[issue.category].push(issue);
            });

            Object.keys(issuesByCategory).forEach(category => {
                const validSubs = getValidSubcategories(category);
                console.log(`\nCategory "${category}" valid subcategories:`);
                validSubs.forEach(sub => console.log(`  - ${sub}`));
            });
        } else {
            console.log('🎉 All listings have valid category-subcategory pairs!');
        }

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
        process.exit(issues.length > 0 ? 1 : 0);
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run validation
validateListings();


