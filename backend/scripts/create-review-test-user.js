// Create a test user with a completed booking for review testing
// Run: node scripts/create-review-test-user.js
//
// This script creates:
// - A test renter user (review.test@myrental.test)
// - An owner and listing
// - A completed booking (so reviews can be given)

require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/database');

const User = require('../models/User');
const Listing = require('../models/Listing');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

const TEST_RENTER_EMAIL = 'review.test@myrental.test';
const TEST_OWNER_EMAIL = 'review.owner@myrental.test';
const TEST_PASSWORD = 'TestPass123!';

async function main() {
    try {
        await connectDB();
        console.log('🔗 Connected to MongoDB\n');

        // Helper functions for dates
        const daysAgo = (days) => {
            const d = new Date();
            d.setDate(d.getDate() - days);
            return d;
        };

        // --- Create or get test renter ---
        console.log('👤 Creating test renter...');
        let renter = await User.findOne({ email: TEST_RENTER_EMAIL });
        if (!renter) {
            // Find a unique phone number
            let phone = '+923009998877';
            let phoneExists = await User.findOne({ phone });
            let counter = 1;
            while (phoneExists) {
                phone = `+9230099988${String(counter).padStart(2, '0')}`;
                phoneExists = await User.findOne({ phone });
                counter++;
                if (counter > 99) {
                    phone = null; // Skip phone if too many conflicts
                    break;
                }
            }

            renter = await User.create({
                name: 'Review Test Renter',
                email: TEST_RENTER_EMAIL,
                phone: phone || undefined,
                password: TEST_PASSWORD,
                role: 'renter',
                activeRole: 'renter',
                accountType: 'free',
                verified: true,
                verificationStatus: {
                    email: true,
                    phone: !!phone,
                    id: false,
                    biometric: false,
                    face: false,
                },
            });
            console.log(`✅ Created renter: ${renter.email}`);
        } else {
            console.log(`✅ Renter already exists: ${renter.email}`);
        }

        // --- Create or get test owner ---
        console.log('\n👤 Creating test owner...');
        let owner = await User.findOne({ email: TEST_OWNER_EMAIL });
        if (!owner) {
            // Find a unique phone number
            let phone = '+923008887766';
            let phoneExists = await User.findOne({ phone });
            let counter = 1;
            while (phoneExists) {
                phone = `+9230088877${String(counter).padStart(2, '0')}`;
                phoneExists = await User.findOne({ phone });
                counter++;
                if (counter > 99) {
                    phone = null; // Skip phone if too many conflicts
                    break;
                }
            }

            owner = await User.create({
                name: 'Review Test Owner',
                email: TEST_OWNER_EMAIL,
                phone: phone || undefined,
                password: TEST_PASSWORD,
                role: 'owner',
                activeRole: 'owner',
                accountType: 'free',
                verified: true,
                verificationStatus: {
                    email: true,
                    phone: !!phone,
                    id: true,
                    biometric: false,
                    face: false,
                },
            });
            console.log(`✅ Created owner: ${owner.email}`);
        } else {
            console.log(`✅ Owner already exists: ${owner.email}`);
        }

        // --- Create or get test listing ---
        console.log('\n🏠 Creating test listing...');
        let listing = await Listing.findOne({ owner: owner._id, title: { $regex: /Review Test/i } });
        if (!listing) {
            listing = await Listing.create({
                owner: owner._id,
                title: 'Review Test Listing - Cozy Apartment',
                description: 'A beautiful apartment perfect for testing the review system. Fully furnished with all amenities.',
                category: 'property',
                subCategory: 'apartments',
                location: {
                    address: 'Test Street 123',
                    city: 'Lahore',
                    province: 'Punjab',
                    postalCode: '54000',
                    coordinates: { lat: 31.5204, lng: 74.3587 },
                    area: 'Gulberg',
                    landmark: 'Near Test Mall',
                },
                pricing: {
                    model: 'daily',
                    amount: 15000,
                    currency: 'PKR',
                    deposit: 30000,
                    negotiable: false,
                },
                availability: {
                    instantBooking: true,
                    advanceNotice: 12,
                    minDuration: 1,
                    maxDuration: 30,
                },
                images: [
                    {
                        url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
                        caption: 'Living room',
                    },
                ],
                status: 'active',
                verified: true,
                featured: false,
            });
            console.log(`✅ Created listing: ${listing.title} (ID: ${listing._id})`);
        } else {
            console.log(`✅ Listing already exists: ${listing.title} (ID: ${listing._id})`);
        }

        // --- Create completed booking (if not exists) ---
        console.log('\n📅 Creating completed booking...');
        let booking = await Booking.findOne({
            renter: renter._id,
            listing: listing._id,
            status: 'completed',
        });

        if (!booking) {
            // Calculate dates (booking completed 5 days ago)
            const checkIn = daysAgo(10);
            const checkOut = daysAgo(7);
            const nights = 3;
            const baseRate = 15000;
            const serviceFee = 2250;
            const deposit = 30000;
            const subtotal = baseRate * nights;
            const total = subtotal + serviceFee + deposit;

            // Get next booking number
            const bookingCount = await Booking.countDocuments();
            const bookingNumber = `MRTEST${String(bookingCount + 1).padStart(4, '0')}`;

            booking = await Booking.create({
                bookingNumber,
                renter: renter._id,
                owner: owner._id,
                listing: listing._id,
                checkIn,
                checkOut,
                duration: nights,
                durationUnit: 'days',
                guests: 2,
                pricing: {
                    model: 'daily',
                    rate: baseRate,
                    subtotal,
                    serviceFee,
                    deposit,
                    total,
                    currency: 'PKR',
                },
                status: 'completed',
                bookingType: 'instant',
                payment: {
                    status: 'paid',
                    method: 'jazzcash',
                    paidAt: checkIn,
                    paidAmount: total - deposit,
                },
                contactInfo: {
                    phone: renter.phone,
                    email: renter.email,
                },
                confirmedAt: checkIn,
                completedAt: checkOut,
            });
            console.log(`✅ Created completed booking: ${booking.bookingNumber}`);
            console.log(`   Check-in: ${checkIn.toISOString().split('T')[0]}`);
            console.log(`   Check-out: ${checkOut.toISOString().split('T')[0]}`);

            // Create payment record
            const paymentCount = await Payment.countDocuments();
            const paymentId = `PAYTEST${String(paymentCount + 1).padStart(6, '0')}`;

            await Payment.create({
                paymentId,
                user: renter._id,
                booking: booking._id,
                type: 'booking',
                amount: total - deposit,
                currency: 'PKR',
                method: 'jazzcash',
                paymentDetails: {
                    accountNumber: '****-****-****',
                    transactionId: `TXN-${booking.bookingNumber}`,
                    referenceNumber: `REF-${booking.bookingNumber}`,
                },
                status: 'completed',
                gatewayResponse: {
                    success: true,
                    message: 'Payment processed (test data)',
                    transactionId: `GW-${booking.bookingNumber}`,
                },
                completedAt: checkIn,
            });
            console.log(`✅ Created payment record: ${paymentId}`);
        } else {
            console.log(`✅ Completed booking already exists: ${booking.bookingNumber}`);
        }

        // --- Summary ---
        console.log('\n' + '='.repeat(60));
        console.log('✅ Review Test User Setup Complete!');
        console.log('='.repeat(60));
        console.log('\n📋 Test Account Credentials:');
        console.log(`   Email: ${TEST_RENTER_EMAIL}`);
        console.log(`   Password: ${TEST_PASSWORD}`);
        console.log(`   Role: Renter`);
        console.log('\n📦 What was created:');
        console.log(`   ✅ Renter: ${renter.email}`);
        console.log(`   ✅ Owner: ${owner.email}`);
        console.log(`   ✅ Listing: ${listing.title}`);
        console.log(`   ✅ Completed Booking: ${booking.bookingNumber}`);
        console.log('\n🧪 How to test:');
        console.log('   1. Log in with the test renter account');
        console.log('   2. Go to Profile → Bookings & Reviews');
        console.log('   3. Find the completed booking');
        console.log('   4. Click "Give Review" to test the review flow');
        console.log('   5. Or go to My Bookings page and test from there');
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

