// Seed owner test data for QA testing
// Run: npm run seed:owner
// or: node scripts/seed-owner-data.js

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/database');

const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');

// Test owner credentials
const TEST_OWNER_EMAIL = 'owner.test@myrental.test';
const TEST_OWNER_PASSWORD = 'OwnerPass123!';

// Test renter (to create bookings)
const TEST_RENTER_EMAIL = 'renter.for.owner.test@myrental.test';
const TEST_RENTER_PASSWORD = 'RenterPass123!';

async function main() {
    try {
        await connectDB();
        console.log('🔗 Connected to MongoDB\n');

        const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

        // --- Create or get test owner ---
        console.log('👤 Creating test owner...');
        let owner = await User.findOne({ email: TEST_OWNER_EMAIL });
        if (!owner) {
            owner = await User.create({
                name: 'Test Property Owner',
                email: TEST_OWNER_EMAIL,
                phone: '+923001112233',
                password: TEST_OWNER_PASSWORD,
                role: 'owner',
                activeRole: 'owner',
                accountType: 'paid',
                bio: 'Professional property manager with multiple listings across Pakistan.',
                verified: true,
                verificationStatus: {
                    email: true,
                    phone: true,
                    id: true,
                    biometric: false,
                    face: true,
                },
                location: {
                    city: 'Lahore',
                    province: 'Punjab',
                },
                subscription: {
                    status: 'active',
                    plan: 'monthly_pkr',
                    startDate: new Date('2025-01-01'),
                    endDate: new Date('2025-12-31'),
                    autoRenew: true,
                },
            });
            console.log(`✅ Created owner: ${owner.email}`);
        } else {
            console.log(`✅ Owner already exists: ${owner.email}`);
        }

        // --- Create or get test renter ---
        console.log('\n👤 Creating test renter (for bookings)...');
        let renter = await User.findOne({ email: TEST_RENTER_EMAIL });
        if (!renter) {
            renter = await User.create({
                name: 'Test Renter for Owner',
                email: TEST_RENTER_EMAIL,
                phone: '+923002223344',
                password: TEST_RENTER_PASSWORD,
                role: 'renter',
                activeRole: 'renter',
                accountType: 'free',
                verified: true,
                verificationStatus: {
                    email: true,
                    phone: true,
                    id: false,
                    biometric: false,
                    face: false,
                },
            });
            console.log(`✅ Created renter: ${renter.email}`);
        } else {
            console.log(`✅ Renter already exists: ${renter.email}`);
        }

        // --- Create listings for the owner ---
        console.log('\n🏠 Creating listings for owner...');
        
        const listingDefs = [
            {
                title: 'Modern Apartment in DHA Lahore',
                description: 'A beautiful modern apartment in the heart of DHA Phase 5. Features include fully furnished rooms, high-speed WiFi, 24/7 security, and covered parking. Perfect for business travelers and families.',
                category: 'property',
                subCategory: 'apartments',
                city: 'Lahore',
                province: 'Punjab',
                address: 'Block A, DHA Phase 5',
                lat: 31.4697,
                lng: 74.4073,
                price: 25000,
                deposit: 50000,
                instantBooking: true,
                status: 'active',
            },
            {
                title: 'Spacious Family Villa in Islamabad',
                description: 'A spacious 4-bedroom villa with private garden and parking. Located in the serene F-7 sector. Ideal for families seeking a comfortable stay with all modern amenities.',
                category: 'property',
                subCategory: 'houses-villas',
                city: 'Islamabad',
                province: 'Islamabad Capital Territory',
                address: 'Street 12, F-7',
                lat: 33.7290,
                lng: 73.0650,
                price: 50000,
                deposit: 100000,
                instantBooking: false,
                status: 'active',
            },
            {
                title: 'Cozy Studio Apartment in Gulberg',
                description: 'A cozy studio apartment perfect for solo travelers or couples. Centrally located in Gulberg with easy access to restaurants and shopping centers.',
                category: 'property',
                subCategory: 'apartments',
                city: 'Lahore',
                province: 'Punjab',
                address: 'Gulberg III',
                lat: 31.5100,
                lng: 74.3500,
                price: 15000,
                deposit: 30000,
                instantBooking: true,
                status: 'draft',
            },
        ];

        const listings = [];
        for (const def of listingDefs) {
            let listing = await Listing.findOne({ owner: owner._id, title: def.title });
            if (!listing) {
                listing = await Listing.create({
                    owner: owner._id,
                    title: def.title,
                    description: def.description,
                    category: def.category,
                    subCategory: def.subCategory,
                    location: {
                        address: def.address,
                        city: def.city,
                        province: def.province,
                        coordinates: { lat: def.lat, lng: def.lng },
                    },
                    pricing: {
                        model: 'daily',
                        amount: def.price,
                        currency: 'PKR',
                        deposit: def.deposit,
                        negotiable: false,
                    },
                    availability: {
                        instantBooking: def.instantBooking,
                        advanceNotice: 24,
                        minDuration: 1,
                        maxDuration: 30,
                    },
                    images: [
                        { url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', caption: 'Living area' },
                    ],
                    status: def.status,
                    verified: def.status === 'active',
                });
                console.log(`✅ Created listing: ${listing.title}`);
            } else {
                console.log(`✅ Listing already exists: ${listing.title}`);
            }
            listings.push(listing);
        }

        // --- Create bookings for the owner's listings ---
        console.log('\n📅 Creating bookings...');

        const bookingDefs = [
            {
                listing: listings[0], // DHA Apartment
                status: 'pending',
                checkIn: daysFromNow(7),
                checkOut: daysFromNow(10),
                guests: 2,
            },
            {
                listing: listings[0],
                status: 'confirmed',
                checkIn: daysFromNow(20),
                checkOut: daysFromNow(25),
                guests: 3,
            },
            {
                listing: listings[1], // Islamabad Villa
                status: 'pending',
                checkIn: daysFromNow(14),
                checkOut: daysFromNow(18),
                guests: 4,
            },
            {
                listing: listings[0],
                status: 'completed',
                checkIn: daysAgo(20),
                checkOut: daysAgo(17),
                guests: 2,
            },
            {
                listing: listings[1],
                status: 'completed',
                checkIn: daysAgo(35),
                checkOut: daysAgo(30),
                guests: 3,
            },
        ];

        let bookingCounter = await Booking.countDocuments();
        let paymentCounter = await Payment.countDocuments();

        for (const def of bookingDefs) {
            // Check if similar booking exists
            const existingBooking = await Booking.findOne({
                renter: renter._id,
                listing: def.listing._id,
                checkIn: def.checkIn,
            });

            if (existingBooking) {
                console.log(`✅ Booking already exists for ${def.listing.title}`);
                continue;
            }

            const nights = Math.ceil((def.checkOut - def.checkIn) / (1000 * 60 * 60 * 24));
            const rate = def.listing.pricing.amount;
            const subtotal = rate * nights;
            const serviceFee = Math.round(subtotal * 0.05);
            const deposit = def.listing.pricing.deposit || 0;
            const total = subtotal + serviceFee + deposit;

            const bookingNumber = `MROWN${String(++bookingCounter).padStart(4, '0')}`;

            const booking = await Booking.create({
                bookingNumber,
                renter: renter._id,
                owner: owner._id,
                listing: def.listing._id,
                checkIn: def.checkIn,
                checkOut: def.checkOut,
                duration: nights,
                durationUnit: 'days',
                guests: def.guests,
                pricing: {
                    model: 'days',
                    rate,
                    subtotal,
                    serviceFee,
                    deposit,
                    total,
                    currency: 'PKR',
                },
                status: def.status,
                bookingType: def.listing.availability.instantBooking ? 'instant' : 'request',
                payment: {
                    status: ['confirmed', 'completed'].includes(def.status) ? 'paid' : 'pending',
                    method: 'jazzcash',
                    paidAt: ['confirmed', 'completed'].includes(def.status) ? def.checkIn : null,
                    paidAmount: ['confirmed', 'completed'].includes(def.status) ? total - deposit : 0,
                },
                contactInfo: {
                    phone: renter.phone,
                    email: renter.email,
                },
                confirmedAt: ['confirmed', 'completed'].includes(def.status) ? def.checkIn : null,
                completedAt: def.status === 'completed' ? def.checkOut : null,
            });

            console.log(`✅ Created ${def.status} booking: ${bookingNumber} for ${def.listing.title}`);

            // Create payment for confirmed/completed bookings
            if (['confirmed', 'completed'].includes(def.status)) {
                const paymentId = `PAOWN${String(++paymentCounter).padStart(6, '0')}`;
                await Payment.create({
                    paymentId,
                    user: renter._id,
                    booking: booking._id,
                    type: 'booking',
                    amount: total - deposit,
                    currency: 'PKR',
                    method: 'jazzcash',
                    paymentDetails: {
                        transactionId: `TXN-${bookingNumber}`,
                    },
                    status: 'completed',
                    completedAt: def.checkIn,
                });
            }

            // Create review for completed bookings
            if (def.status === 'completed') {
                const existingReview = await Review.findOne({ booking: booking._id });
                if (!existingReview) {
                    await Review.create({
                        reviewer: renter._id,
                        reviewee: owner._id,
                        listing: def.listing._id,
                        booking: booking._id,
                        reviewType: 'renter_to_owner',
                        rating: 5,
                        category: 'property',
                        comment: 'Excellent host! The property was exactly as described and very clean. Would definitely book again.',
                        status: 'approved',
                    });
                    console.log(`   ✅ Created review for booking ${bookingNumber}`);
                }
            }
        }

        // --- Summary ---
        console.log('\n' + '='.repeat(60));
        console.log('✅ Owner Test Data Setup Complete!');
        console.log('='.repeat(60));
        console.log('\n📋 Test Owner Account:');
        console.log(`   Email: ${TEST_OWNER_EMAIL}`);
        console.log(`   Password: ${TEST_OWNER_PASSWORD}`);
        console.log(`   Role: Owner`);
        console.log('\n📋 Test Renter Account (for bookings):');
        console.log(`   Email: ${TEST_RENTER_EMAIL}`);
        console.log(`   Password: ${TEST_RENTER_PASSWORD}`);
        console.log('\n🧪 How to test Owner functionality:');
        console.log('   1. Log in with the test owner account');
        console.log('   2. Go to My Listings to see and manage listings');
        console.log('   3. Go to My Bookings → switch to "As Host" tab');
        console.log('   4. Accept or decline pending booking requests');
        console.log('   5. Check Profile for owner statistics');
        console.log('\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
}

main();



