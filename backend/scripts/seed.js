// Seed Initial Data for My Rental Marketplace
// Run: npm run seed

require('dotenv').config();
const connectDB = require('../config/database');
const User = require('../models/User');
const Category = require('../models/Category');

// Emails used only for seed/admin/test users so we can safely upsert them
const SEED_USER_EMAILS = [
    'admin@example.com',
    'owner@example.com',
    'renter@example.com',
    'dual@example.com',
    'moderator@example.com',
];

/**
 * Create or update a user by email without touching non‑seed users.
 * - Never deletes users
 * - Never overwrites an existing password hash unless explicitly requested
 * - Always goes through Mongoose `save()` so `pre('save')` (bcrypt hashing) runs
 */
async function upsertUser(userData, options = {}) {
    const { resetPassword = false } = options;

    const existing = await User.findOne({ email: userData.email });
    if (existing) {
        // Update profile/meta fields but keep existing password unless resetPassword=true
        existing.name = userData.name || existing.name;
        existing.phone = userData.phone || existing.phone;
        existing.role = userData.role || existing.role;
        existing.activeRole = userData.activeRole || existing.activeRole;
        existing.accountType = userData.accountType || existing.accountType;
        existing.verified =
            typeof userData.verified === 'boolean' ? userData.verified : existing.verified;
        if (userData.verificationStatus) {
            existing.verificationStatus = {
                ...(existing.verificationStatus || {}),
                ...userData.verificationStatus,
            };
        }

        // Only reset password if we explicitly want to
        if (resetPassword && userData.password) {
            existing.password = userData.password; // will be hashed by pre('save')
        }

        await existing.save();
        return existing;
    }

    // New user – password will be hashed by pre('save') middleware
    const created = await User.create(userData);
    return created;
}

async function seedData() {
    try {
        // Connect to database
        await connectDB();

        console.log('🌱 Starting database seeding...\n');

        // IMPORTANT: we do NOT delete users here anymore so real accounts survive.
        // We only refresh seed-specific data (categories and seed users).

        console.log('🗂  Resetting categories (safe – does not affect users)...');
        await Category.deleteMany({});
        console.log('✅ Categories cleared\n');

        // Seed Categories
        console.log('📁 Seeding categories...');
        const categories = [
            {
                name: 'Property',
                slug: 'property',
                icon: 'bi-house-door',
                description: 'Rent apartments, houses, commercial spaces, and more',
                subCategories: [
                    { name: 'Apartments', slug: 'apartments', description: 'Furnished and unfurnished apartments' },
                    { name: 'Houses/Villas', slug: 'houses-villas', description: 'Complete houses and villas' },
                    { name: 'Commercial Spaces', slug: 'commercial-spaces', description: 'Offices, shops, warehouses' },
                    { name: 'Event Spaces', slug: 'event-spaces', description: 'Wedding halls, party lawns' },
                    { name: 'Farmhouses', slug: 'farmhouses', description: 'Farmhouses and vacation homes' },
                    { name: 'Rooms & Hostels', slug: 'rooms-hostels', description: 'Single rooms and hostel accommodations' }
                ],
                active: true,
                order: 1
            },
            {
                name: 'Vehicles',
                slug: 'vehicles',
                icon: 'bi-car-front',
                description: 'Rent cars, motorcycles, trucks, and more',
                subCategories: [
                    { name: 'Cars', slug: 'cars', description: 'Sedans, SUVs, luxury cars' },
                    { name: 'Motorcycles', slug: 'motorcycles', description: 'Motorcycles and scooters' },
                    { name: 'Bicycles', slug: 'bicycles', description: 'Bicycles for rent' },
                    { name: 'Trucks', slug: 'trucks', description: 'Trucks and loaders' },
                    { name: 'Rickshaws', slug: 'rickshaws', description: 'Rickshaws and Qingqis' },
                    { name: 'Trailers', slug: 'trailers', description: 'Trailers and commercial vehicles' },
                    { name: 'Heavy Machinery', slug: 'heavy-machinery', description: 'Construction and industrial machinery' }
                ],
                active: true,
                order: 2
            },
            {
                name: 'Clothes',
                slug: 'clothes',
                icon: 'bi-bag',
                description: 'Rent wedding wear, designer outfits, and more',
                subCategories: [
                    { name: 'Wedding Wear', slug: 'wedding-wear', description: 'Wedding and formal wear' },
                    { name: 'Designer Outfits', slug: 'designer-outfits', description: 'Designer clothing' },
                    { name: 'Seasonal Clothing', slug: 'seasonal-clothing', description: 'Winter and summer clothing' },
                    { name: 'Costumes', slug: 'costumes', description: 'Theme wear and costumes' },
                    { name: 'Accessories', slug: 'accessories', description: 'Jewelry, bags, shoes' },
                    { name: 'Maternity & Kids', slug: 'maternity-kids', description: 'Maternity and kids clothing' }
                ],
                active: true,
                order: 3
            },
            {
                name: 'Equipment',
                slug: 'equipment',
                icon: 'bi-tools',
                description: 'Rent farming equipment, electronics, and more',
                subCategories: [
                    { name: 'Farming Equipment', slug: 'farming-equipment', description: 'Agricultural tools and machinery' },
                    { name: 'Electronics', slug: 'electronics', description: 'Cameras, laptops, audio equipment' },
                    { name: 'Medical Equipment', slug: 'medical-equipment', description: 'Medical devices and tools' },
                    { name: 'Kitchen & Catering', slug: 'kitchen-catering', description: 'Kitchen and catering gear' },
                    { name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Sports and fitness equipment' },
                    { name: 'Gaming Items', slug: 'gaming-items', description: 'Gaming consoles and accessories' }
                ],
                active: true,
                order: 4
            },
            {
                name: 'Service Providers',
                slug: 'service_providers',
                icon: 'bi-people',
                description: 'Hire skilled workers, technicians, and service providers',
                subCategories: [
                    { name: 'Skilled Workers', slug: 'skilled-workers', description: 'Electricians, plumbers, carpenters' },
                    { name: 'Technical Staff', slug: 'technical-staff', description: 'IT support, technicians' },
                    { name: 'Event Staff', slug: 'event-staff', description: 'Caterers, decorators, photographers' },
                    { name: 'Agricultural Labor', slug: 'agricultural-labor', description: 'Farm workers' },
                    { name: 'Domestic Help', slug: 'domestic-help', description: 'Household help' },
                    { name: 'Drivers', slug: 'drivers', description: 'Drivers and transportation staff' },
                    { name: 'Medical Services', slug: 'medical-services', description: 'Nurses, hospital staff' },
                    { name: 'Pilot Services', slug: 'pilot-services', description: 'Pilot services' }
                ],
                active: true,
                order: 5
            },
            {
                name: 'Animals',
                slug: 'animals',
                icon: 'bi-heart',
                description: 'Rent pets, working animals, and veterinary services',
                subCategories: [
                    { name: 'Pets', slug: 'pets', description: 'Pets for breeding and shows' },
                    { name: 'Working Animals', slug: 'working-animals', description: 'Horses, camels, donkeys, carts' },
                    { name: 'Veterinary Services', slug: 'veterinary-services', description: 'Veterinary care services' }
                ],
                active: true,
                order: 6
            },
            {
                name: 'Boat',
                slug: 'boat',
                icon: 'bi-water',
                description: 'Rent fishing boats, ferries, yachts, and more',
                subCategories: [
                    { name: 'Fishing Boats', slug: 'fishing-boats', description: 'Fishing boats' },
                    { name: 'Passenger Ferries', slug: 'passenger-ferries', description: 'Passenger ferries' },
                    { name: 'Recreational Boats', slug: 'recreational-boats', description: 'Recreational boats' },
                    { name: 'Yachts & Speedboats', slug: 'yachts-speedboats', description: 'Yachts and speedboats' },
                    { name: 'Cargo Vessels', slug: 'cargo-vessels', description: 'Cargo vessels' },
                    { name: 'Boat Equipment', slug: 'boat-equipment', description: 'Boat equipment and safety gear' }
                ],
                active: true,
                order: 7
            },
            {
                name: 'Air Transport',
                slug: 'air_transport',
                icon: 'bi-airplane',
                description: 'Rent charter planes, helicopters, and air services',
                subCategories: [
                    { name: 'Charter Planes', slug: 'charter-planes', description: 'Charter plane services' },
                    { name: 'Helicopter Services', slug: 'helicopter-services', description: 'Helicopter rentals' },
                    { name: 'Air Ambulance', slug: 'air-ambulance', description: 'Air ambulance services' },
                    { name: 'Cargo Aircraft', slug: 'cargo-aircraft', description: 'Cargo aircraft' },
                    { name: 'Pilot Services', slug: 'pilot-services', description: 'Pilot services' }
                ],
                active: true,
                order: 8
            }
        ];

        const createdCategories = await Category.insertMany(categories);
        console.log(`✅ Created ${createdCategories.length} categories\n`);

        // Seed Admin User (upsert by email, do not touch existing non-seed users)
        console.log('👤 Seeding admin user...');
        const adminUser = await upsertUser({
            name: 'Admin User',
            email: 'admin@example.com',
            phone: '+923001234567',
            password: 'admin123',
            role: 'admin',
            accountType: 'paid',
            verified: true,
            verificationStatus: {
                email: true,
                phone: true,
                id: true,
                biometric: true,
                face: true,
            },
        });
        console.log(`✅ Admin user ready: ${adminUser.email}\n`);

        // Seed / upsert Test Users
        console.log('👥 Seeding test users (upsert, no deletes)...');
        const testUsers = [
            {
                name: 'Test Owner',
                email: 'owner@example.com',
                phone: '+923001234568',
                password: 'owner123',
                role: 'owner',
                accountType: 'paid',
                verified: true,
                verificationStatus: {
                    email: true,
                    phone: true,
                    id: true
                }
            },
            {
                name: 'Test Renter',
                email: 'renter@example.com',
                phone: '+923001234569',
                password: 'renter123',
                role: 'renter',
                accountType: 'free',
                verified: false
            },
            {
                name: 'Dual Role User',
                email: 'dual@example.com',
                phone: '+923001234570',
                password: 'dual123',
                role: 'dual_role',
                activeRole: 'renter',
                accountType: 'paid',
                verified: true
            },
            {
                name: 'Moderator User',
                email: 'moderator@example.com',
                phone: '+923001234571',
                password: 'moderator123',
                role: 'moderator',
                accountType: 'paid',
                verified: true,
            },
        ];

        const createdOrUpdatedUsers = [];
        for (const userData of testUsers) {
            // For test users, it's okay to reset the password each seed run
            const user = await upsertUser(userData, { resetPassword: true });
            createdOrUpdatedUsers.push(user);
        }
        console.log(`✅ Test users ready: ${createdOrUpdatedUsers.length} (admin + ${createdOrUpdatedUsers.length} test users total)\n`);

        console.log('✅ Seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Categories: ${createdCategories.length}`);
        console.log(`   - Seed / test users touched: ${createdOrUpdatedUsers.length + 1} (including admin)`);
        console.log('   - Existing real users were NOT deleted or modified.');
        console.log('\n🎉 Database is ready to use!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedData();

