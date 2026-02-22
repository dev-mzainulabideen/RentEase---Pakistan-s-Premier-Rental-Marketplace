// Category Page Functionality
// Dynamic Category Page - Supports Property, Vehicles, and more

// Utility function to generate local placeholder image (SVG data URI)
function getPlaceholderImage(width = 400, height = 300, text = 'No Image') {
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#e9ecef"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6c757d" text-anchor="middle" dominant-baseline="middle">${text}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
}

// Category Data Configuration
const categoryData = {
    property: {
        name: 'Property',
        description: 'Discover thousands of verified property listings across Pakistan. From cozy apartments to luxurious villas, commercial spaces to event venues - find exactly what you need.',
        icon: 'bi-house-door-fill',
        color: '#FF385C',
        stats: {
            listings: '1,250+',
            subcategories: 6,
            rating: '4.8★'
        },
        subcategories: [
            {
                id: 'apartments',
                name: 'Apartments',
                description: 'Furnished and unfurnished apartments for rent',
                icon: 'bi-building',
                image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
                count: 450,
                types: ['Furnished', 'Unfurnished']
            },
            {
                id: 'houses-villas',
                name: 'Houses/Villas',
                description: 'Luxury villas and family houses for rent',
                icon: 'bi-house-heart',
                image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop',
                count: 320,
                types: ['Villas', 'Townhouses', 'Family Homes']
            },
            {
                id: 'commercial-spaces',
                name: 'Commercial Spaces',
                description: 'Offices, shops, warehouses, and business spaces',
                icon: 'bi-briefcase',
                image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
                count: 280,
                types: ['Offices', 'Shops', 'Warehouses']
            },
            {
                id: 'event-spaces',
                name: 'Event Spaces',
                description: 'Wedding halls, party lawns, and event venues',
                icon: 'bi-calendar-event',
                image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=400&fit=crop',
                count: 150,
                types: ['Wedding Halls', 'Party Lawns', 'Event Venues']
            },
            {
                id: 'farmhouses',
                name: 'Farmhouses & Vacation Homes',
                description: 'Countryside retreats and vacation properties',
                icon: 'bi-tree',
                image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
                count: 95,
                types: ['Farmhouses', 'Vacation Homes', 'Countryside']
            },
            {
                id: 'rooms-hostels',
                name: 'Rooms & Hostels',
                description: 'Single rooms, shared spaces, and hostel accommodations',
                icon: 'bi-door-open',
                image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=600&h=400&fit=crop',
                count: 180,
                types: ['Single Rooms', 'Shared Rooms', 'Hostels']
            }
        ],
        featuredListings: [
            {
                id: 1,
                title: 'Luxury 3-Bedroom Apartment in DHA Lahore',
                location: 'DHA Phase 5, Lahore',
                price: 25000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',
                rating: 4.9,
                reviews: 156,
                verified: true,
                instant: true,
                subcategory: 'Apartments',
                bedrooms: 3,
                bathrooms: 2
            },
            {
                id: 2,
                title: 'Modern Villa with Pool in Islamabad',
                location: 'F-7, Islamabad',
                price: 50000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop',
                rating: 4.8,
                reviews: 89,
                verified: true,
                instant: false,
                subcategory: 'Houses/Villas',
                bedrooms: 5,
                bathrooms: 4
            },
            {
                id: 3,
                title: 'Grand Wedding Hall - Capacity 500+',
                location: 'Gulberg, Lahore',
                price: 80000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=400&fit=crop',
                rating: 4.7,
                reviews: 203,
                verified: true,
                instant: true,
                subcategory: 'Event Spaces',
                capacity: 500
            },
            {
                id: 4,
                title: 'Prime Office Space in Business District',
                location: 'Clifton, Karachi',
                price: 35000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
                rating: 4.6,
                reviews: 67,
                verified: true,
                instant: true,
                subcategory: 'Commercial Spaces',
                area: '2000 sq ft'
            }
        ],
        whyChoose: [
            {
                icon: 'bi-shield-check-fill',
                title: 'Verified Listings',
                description: 'All properties are verified for authenticity and quality assurance.'
            },
            {
                icon: 'bi-calendar-check-fill',
                title: 'Flexible Booking',
                description: 'Choose your dates and duration with flexible cancellation policies.'
            },
            {
                icon: 'bi-credit-card-fill',
                title: 'Secure Payments',
                description: 'Multiple payment options including JazzCash, Easypaisa, and cards.'
            },
            {
                icon: 'bi-star-fill',
                title: 'Real Reviews',
                description: 'Read authentic reviews from verified renters to make informed decisions.'
            },
            {
                icon: 'bi-headset',
                title: '24/7 Support',
                description: 'Get help anytime with our dedicated customer support team.'
            },
            {
                icon: 'bi-geo-alt-fill',
                title: 'Nationwide Coverage',
                description: 'Properties available across all major cities in Pakistan.'
            }
        ]
    },
    vehicles: {
        name: 'Vehicles',
        description: 'Rent the perfect vehicle for your needs. From luxury cars to motorcycles, trucks to heavy machinery - find reliable transportation solutions across Pakistan.',
        icon: 'bi-car-front-fill',
        color: '#667eea',
        stats: {
            listings: '890+',
            subcategories: 7,
            rating: '4.9★'
        },
        subcategories: [
            {
                id: 'cars',
                name: 'Cars',
                description: 'Sedans, SUVs, and luxury vehicles for rent',
                icon: 'bi-car-front',
                image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600&h=400&fit=crop',
                count: 350,
                types: ['Sedans', 'SUVs', 'Luxury']
            },
            {
                id: 'motorcycles',
                name: 'Motorcycles & Scooters',
                description: 'Motorcycles, scooters, and two-wheelers',
                icon: 'bi-bicycle',
                image: 'https://images.unsplash.com/photo-1558980663-3685c1d673c8?w=600&h=400&fit=crop',
                count: 180,
                types: ['Motorcycles', 'Scooters', 'Bikes']
            },
            {
                id: 'bicycles',
                name: 'Bicycles',
                description: 'Regular and electric bicycles for rent',
                icon: 'bi-bicycle',
                image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600&h=400&fit=crop',
                count: 95,
                types: ['Regular Bikes', 'Electric Bikes', 'Mountain Bikes']
            },
            {
                id: 'trucks-loaders',
                name: 'Trucks & Loaders',
                description: 'Trucks, loaders, and cargo vehicles',
                icon: 'bi-truck',
                image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
                count: 120,
                types: ['Trucks', 'Loaders', 'Cargo Vehicles']
            },
            {
                id: 'rickshaws',
                name: 'Rickshaws & Qingqis',
                description: 'Auto rickshaws and Qingqi vehicles',
                icon: 'bi-three-dots',
                image: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600&h=400&fit=crop',
                count: 85,
                types: ['Auto Rickshaws', 'Qingqis', 'Three Wheelers']
            },
            {
                id: 'trailers',
                name: 'Trailers & Commercial Vehicles',
                description: 'Trailers and commercial transport vehicles',
                icon: 'bi-truck-flatbed',
                image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop',
                count: 60,
                types: ['Trailers', 'Commercial Vehicles', 'Transport']
            },
            {
                id: 'heavy-machinery',
                name: 'Heavy Machinery',
                description: 'Construction and industrial heavy machinery',
                icon: 'bi-tools',
                image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop',
                count: 45,
                types: ['Excavators', 'Cranes', 'Bulldozers']
            }
        ],
        featuredListings: [
            {
                id: 5,
                title: 'Honda Civic 2023 - Fully Maintained',
                location: 'Karachi, Sindh',
                price: 5000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600&h=400&fit=crop',
                rating: 4.9,
                reviews: 89,
                verified: true,
                instant: true,
                subcategory: 'Cars',
                transmission: 'Automatic',
                seats: 5
            },
            {
                id: 6,
                title: 'Toyota Land Cruiser - Luxury SUV',
                location: 'Lahore, Punjab',
                price: 12000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&h=400&fit=crop',
                rating: 4.8,
                reviews: 124,
                verified: true,
                instant: false,
                subcategory: 'Cars',
                transmission: 'Automatic',
                seats: 7
            },
            {
                id: 7,
                title: 'Yamaha R15 - Sports Motorcycle',
                location: 'Islamabad',
                price: 2000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1558980663-3685c1d673c8?w=600&h=400&fit=crop',
                rating: 4.7,
                reviews: 67,
                verified: true,
                instant: true,
                subcategory: 'Motorcycles',
                engine: '150cc'
            },
            {
                id: 8,
                title: 'Heavy Duty Truck - 10 Ton Capacity',
                location: 'Faisalabad, Punjab',
                price: 15000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
                rating: 4.6,
                reviews: 45,
                verified: true,
                instant: false,
                subcategory: 'Trucks & Loaders',
                capacity: '10 Tons'
            }
        ],
        whyChoose: [
            {
                icon: 'bi-shield-check-fill',
                title: 'Verified Vehicles',
                description: 'All vehicles are verified and regularly maintained for your safety.'
            },
            {
                icon: 'bi-calendar-check-fill',
                title: 'Flexible Rental Periods',
                description: 'Rent for a day, week, or month with flexible booking options.'
            },
            {
                icon: 'bi-credit-card-fill',
                title: 'Secure Payments',
                description: 'Multiple payment options including JazzCash, Easypaisa, and cards.'
            },
            {
                icon: 'bi-star-fill',
                title: 'Real Reviews',
                description: 'Read authentic reviews from verified renters to make informed decisions.'
            },
            {
                icon: 'bi-headset',
                title: '24/7 Support',
                description: 'Get help anytime with our dedicated customer support team.'
            },
            {
                icon: 'bi-geo-alt-fill',
                title: 'Nationwide Coverage',
                description: 'Vehicles available across all major cities in Pakistan.'
            }
        ]
    },
    clothes: {
        name: 'Clothes',
        description: 'Rent designer outfits, wedding wear, and fashionable clothing for any occasion. From formal wear to seasonal clothing, costumes to accessories - look your best without breaking the bank.',
        icon: 'bi-bag-fill',
        color: '#f5576c',
        stats: {
            listings: '650+',
            subcategories: 6,
            rating: '4.7★'
        },
        subcategories: [
            {
                id: 'wedding-formal',
                name: 'Wedding & Formal Wear',
                description: 'Elegant wedding dresses, suits, and formal attire',
                icon: 'bi-heart',
                image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=400&fit=crop',
                count: 180,
                types: ['Wedding Dresses', 'Formal Suits', 'Evening Wear']
            },
            {
                id: 'designer-outfits',
                name: 'Designer Outfits',
                description: 'Premium designer clothing and branded outfits',
                icon: 'bi-star',
                image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=400&fit=crop',
                count: 150,
                types: ['Designer Dresses', 'Branded Clothing', 'Luxury Wear']
            },
            {
                id: 'seasonal-clothing',
                name: 'Seasonal Clothing',
                description: 'Winter and summer clothing for all seasons',
                icon: 'bi-cloud-sun',
                image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
                count: 120,
                types: ['Winter Clothing', 'Summer Clothing', 'Seasonal']
            },
            {
                id: 'costumes',
                name: 'Costumes & Theme Wear',
                description: 'Themed costumes and special occasion outfits',
                icon: 'bi-palette',
                image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&h=400&fit=crop',
                count: 85,
                types: ['Costumes', 'Theme Wear', 'Special Occasions']
            },
            {
                id: 'accessories',
                name: 'Accessories',
                description: 'Jewelry, bags, shoes, and fashion accessories',
                icon: 'bi-gem',
                image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop',
                count: 75,
                types: ['Jewelry', 'Bags', 'Shoes']
            },
            {
                id: 'maternity-kids',
                name: 'Maternity & Kids Clothing',
                description: 'Maternity wear and children\'s clothing',
                icon: 'bi-heart-fill',
                image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&h=400&fit=crop',
                count: 40,
                types: ['Maternity Wear', 'Kids Clothing', 'Baby Clothes']
            }
        ],
        featuredListings: [
            {
                id: 9,
                title: 'Designer Wedding Dress Collection',
                location: 'Lahore, Punjab',
                price: 15000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=400&fit=crop',
                rating: 4.8,
                reviews: 124,
                verified: true,
                instant: true,
                subcategory: 'Wedding & Formal Wear',
                size: 'Multiple Sizes',
                designer: 'Premium Collection'
            },
            {
                id: 10,
                title: 'Luxury Designer Outfit Set',
                location: 'Karachi, Sindh',
                price: 8000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=400&fit=crop',
                rating: 4.7,
                reviews: 89,
                verified: true,
                instant: true,
                subcategory: 'Designer Outfits',
                size: 'S, M, L',
                designer: 'Branded'
            },
            {
                id: 11,
                title: 'Winter Collection - Coats & Jackets',
                location: 'Islamabad',
                price: 3000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
                rating: 4.6,
                reviews: 67,
                verified: true,
                instant: true,
                subcategory: 'Seasonal Clothing',
                size: 'All Sizes',
                season: 'Winter'
            },
            {
                id: 12,
                title: 'Premium Jewelry & Accessories Set',
                location: 'Lahore, Punjab',
                price: 5000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=400&fit=crop',
                rating: 4.9,
                reviews: 156,
                verified: true,
                instant: true,
                subcategory: 'Accessories',
                items: 'Jewelry Set'
            }
        ],
        whyChoose: [
            {
                icon: 'bi-shield-check-fill',
                title: 'Verified Quality',
                description: 'All clothing items are verified for quality and cleanliness.'
            },
            {
                icon: 'bi-calendar-check-fill',
                title: 'Flexible Rental',
                description: 'Rent for special occasions with flexible duration options.'
            },
            {
                icon: 'bi-credit-card-fill',
                title: 'Secure Payments',
                description: 'Multiple payment options including JazzCash, Easypaisa, and cards.'
            },
            {
                icon: 'bi-star-fill',
                title: 'Real Reviews',
                description: 'Read authentic reviews from verified renters to make informed decisions.'
            },
            {
                icon: 'bi-headset',
                title: '24/7 Support',
                description: 'Get help anytime with our dedicated customer support team.'
            },
            {
                icon: 'bi-geo-alt-fill',
                title: 'Nationwide Coverage',
                description: 'Clothing available across all major cities in Pakistan.'
            }
        ]
    },
    equipment: {
        name: 'Equipment',
        description: 'Rent professional equipment for your needs. From farming tools to electronics, medical equipment to kitchen gear - access high-quality equipment without the high cost.',
        icon: 'bi-tools',
        color: '#764ba2',
        stats: {
            listings: '420+',
            subcategories: 6,
            rating: '4.8★'
        },
        subcategories: [
            {
                id: 'farming-equipment',
                name: 'Farming Equipment',
                description: 'Agricultural tools and farming machinery',
                icon: 'bi-tools',
                image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=400&fit=crop',
                count: 95,
                types: ['Tractors', 'Harvesters', 'Farm Tools']
            },
            {
                id: 'electronics',
                name: 'Electronics',
                description: 'Cameras, laptops, audio equipment, and tech devices',
                icon: 'bi-camera',
                image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600&h=400&fit=crop',
                count: 120,
                types: ['Cameras', 'Laptops', 'Audio']
            },
            {
                id: 'medical-equipment',
                name: 'Medical Equipment',
                description: 'Medical devices and healthcare equipment',
                icon: 'bi-heart-pulse',
                image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop',
                count: 65,
                types: ['Medical Devices', 'Healthcare', 'Therapy']
            },
            {
                id: 'kitchen-catering',
                name: 'Kitchen & Catering Gear',
                description: 'Kitchen appliances and catering equipment',
                icon: 'bi-cup',
                image: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=600&h=400&fit=crop',
                count: 80,
                types: ['Kitchen Appliances', 'Catering', 'Event Equipment']
            },
            {
                id: 'sports-fitness',
                name: 'Sports & Fitness Equipment',
                description: 'Sports gear and fitness equipment',
                icon: 'bi-trophy',
                image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
                count: 45,
                types: ['Sports Gear', 'Fitness', 'Gym Equipment']
            },
            {
                id: 'gaming-items',
                name: 'Gaming Items',
                description: 'Gaming consoles, accessories, and equipment',
                icon: 'bi-tv',
                image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=400&fit=crop',
                count: 35,
                types: ['Gaming Consoles', 'Accessories', 'Gaming Gear']
            }
        ],
        featuredListings: [
            {
                id: 13,
                title: 'Professional Camera Equipment Set',
                location: 'Lahore, Punjab',
                price: 3000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=600&h=400&fit=crop',
                rating: 4.8,
                reviews: 124,
                verified: true,
                instant: true,
                subcategory: 'Electronics',
                type: 'Camera Set',
                brand: 'Professional'
            },
            {
                id: 14,
                title: 'High-End Laptop for Work',
                location: 'Karachi, Sindh',
                price: 2500,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=400&fit=crop',
                rating: 4.7,
                reviews: 89,
                verified: true,
                instant: true,
                subcategory: 'Electronics',
                type: 'Laptop',
                specs: 'High Performance'
            },
            {
                id: 15,
                title: 'Complete Kitchen Catering Setup',
                location: 'Islamabad',
                price: 8000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=600&h=400&fit=crop',
                rating: 4.6,
                reviews: 67,
                verified: true,
                instant: false,
                subcategory: 'Kitchen & Catering',
                capacity: '50+ People',
                complete: 'Full Setup'
            },
            {
                id: 16,
                title: 'Farming Tractor - Heavy Duty',
                location: 'Faisalabad, Punjab',
                price: 12000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=400&fit=crop',
                rating: 4.9,
                reviews: 45,
                verified: true,
                instant: false,
                subcategory: 'Farming Equipment',
                type: 'Tractor',
                capacity: 'Heavy Duty'
            }
        ],
        whyChoose: [
            {
                icon: 'bi-shield-check-fill',
                title: 'Verified Equipment',
                description: 'All equipment is verified and regularly maintained for optimal performance.'
            },
            {
                icon: 'bi-calendar-check-fill',
                title: 'Flexible Rental',
                description: 'Rent for short or long term with flexible booking options.'
            },
            {
                icon: 'bi-credit-card-fill',
                title: 'Secure Payments',
                description: 'Multiple payment options including JazzCash, Easypaisa, and cards.'
            },
            {
                icon: 'bi-star-fill',
                title: 'Real Reviews',
                description: 'Read authentic reviews from verified renters to make informed decisions.'
            },
            {
                icon: 'bi-headset',
                title: '24/7 Support',
                description: 'Get help anytime with our dedicated customer support team.'
            },
            {
                icon: 'bi-geo-alt-fill',
                title: 'Nationwide Coverage',
                description: 'Equipment available across all major cities in Pakistan.'
            }
        ]
    },
    serviceProviders: {
        name: 'Service Providers',
        description: 'Hire skilled professionals and service providers for your needs. From technical staff to event services, domestic help to medical services - find reliable professionals across Pakistan.',
        icon: 'bi-person-workspace',
        color: '#00b894',
        stats: {
            listings: '1,100+',
            subcategories: 8,
            rating: '4.9★'
        },
        subcategories: [
            {
                id: 'skilled-workers',
                name: 'Skilled Workers',
                description: 'Electricians, plumbers, carpenters, and skilled tradespeople',
                icon: 'bi-tools',
                image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop',
                count: 280,
                types: ['Electricians', 'Plumbers', 'Carpenters']
            },
            {
                id: 'technical-staff',
                name: 'Technical Staff',
                description: 'IT support, technicians, and technical professionals',
                icon: 'bi-laptop',
                image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop',
                count: 180,
                types: ['IT Support', 'Technicians', 'Technical']
            },
            {
                id: 'event-staff',
                name: 'Event Staff',
                description: 'Caterers, decorators, photographers, and event professionals',
                icon: 'bi-camera',
                image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=400&fit=crop',
                count: 220,
                types: ['Caterers', 'Decorators', 'Photographers']
            },
            {
                id: 'agricultural-labor',
                name: 'Agricultural Labor',
                description: 'Farm workers and agricultural labor services',
                icon: 'bi-tree',
                image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&h=400&fit=crop',
                count: 150,
                types: ['Farm Workers', 'Agricultural', 'Field Labor']
            },
            {
                id: 'domestic-help',
                name: 'Domestic Help',
                description: 'Housekeepers, cooks, and domestic assistance',
                icon: 'bi-house',
                image: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?w=600&h=400&fit=crop',
                count: 120,
                types: ['Housekeepers', 'Cooks', 'Domestic']
            },
            {
                id: 'drivers',
                name: 'Drivers & Transportation Staff',
                description: 'Professional drivers and transportation staff',
                icon: 'bi-car-front',
                image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600&h=400&fit=crop',
                count: 95,
                types: ['Drivers', 'Transportation', 'Chauffeurs']
            },
            {
                id: 'medical-services',
                name: 'Medical Services',
                description: 'Nurses, hospital staff, and medical professionals',
                icon: 'bi-heart-pulse',
                image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=400&fit=crop',
                count: 75,
                types: ['Nurses', 'Hospital Staff', 'Medical']
            },
            {
                id: 'pilot-services',
                name: 'Pilot Services',
                description: 'Licensed pilots and aviation professionals',
                icon: 'bi-airplane',
                image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop',
                count: 25,
                types: ['Pilots', 'Aviation', 'Flight Services']
            }
        ],
        featuredListings: [
            {
                id: 17,
                title: 'Professional Electrician - Licensed & Experienced',
                location: 'Lahore, Punjab',
                price: 2000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&h=400&fit=crop',
                rating: 4.9,
                reviews: 156,
                verified: true,
                instant: true,
                subcategory: 'Skilled Workers',
                experience: '10+ Years',
                license: 'Licensed'
            },
            {
                id: 18,
                title: 'IT Support Specialist - Remote & On-Site',
                location: 'Karachi, Sindh',
                price: 3000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop',
                rating: 4.8,
                reviews: 124,
                verified: true,
                instant: true,
                subcategory: 'Technical Staff',
                expertise: 'IT Support',
                availability: '24/7'
            },
            {
                id: 19,
                title: 'Event Catering & Decoration Services',
                location: 'Islamabad',
                price: 15000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=400&fit=crop',
                rating: 4.7,
                reviews: 203,
                verified: true,
                instant: false,
                subcategory: 'Event Staff',
                capacity: '50-500 People',
                services: 'Full Service'
            },
            {
                id: 20,
                title: 'Professional Driver - Experienced & Reliable',
                location: 'Lahore, Punjab',
                price: 2500,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600&h=400&fit=crop',
                rating: 4.9,
                reviews: 89,
                verified: true,
                instant: true,
                subcategory: 'Drivers',
                experience: '15+ Years',
                license: 'Valid License'
            }
        ],
        whyChoose: [
            {
                icon: 'bi-shield-check-fill',
                title: 'Verified Professionals',
                description: 'All service providers are verified and background checked for your safety.'
            },
            {
                icon: 'bi-calendar-check-fill',
                title: 'Flexible Scheduling',
                description: 'Book services for any duration with flexible scheduling options.'
            },
            {
                icon: 'bi-credit-card-fill',
                title: 'Secure Payments',
                description: 'Multiple payment options including JazzCash, Easypaisa, and cards.'
            },
            {
                icon: 'bi-star-fill',
                title: 'Real Reviews',
                description: 'Read authentic reviews from verified clients to make informed decisions.'
            },
            {
                icon: 'bi-headset',
                title: '24/7 Support',
                description: 'Get help anytime with our dedicated customer support team.'
            },
            {
                icon: 'bi-geo-alt-fill',
                title: 'Nationwide Coverage',
                description: 'Service providers available across all major cities in Pakistan.'
            }
        ]
    },
    animals: {
        name: 'Animals',
        description: 'Rent animals for breeding, shows, or work purposes. From pets to working animals, and access veterinary services - find reliable animal services across Pakistan.',
        icon: 'bi-heart-fill',
        color: '#fdcb6e',
        stats: {
            listings: '180+',
            subcategories: 3,
            rating: '4.8★'
        },
        subcategories: [
            {
                id: 'pets-breeding',
                name: 'Pets for Breeding/Shows',
                description: 'Pets available for breeding and show purposes',
                icon: 'bi-heart',
                image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop',
                count: 85,
                types: ['Dogs', 'Cats', 'Birds']
            },
            {
                id: 'working-animals',
                name: 'Working Animals',
                description: 'Horses, camels, donkeys, and carts for work purposes',
                icon: 'bi-truck',
                image: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=600&h=400&fit=crop',
                count: 65,
                types: ['Horses', 'Camels', 'Donkeys/Carts']
            },
            {
                id: 'veterinary-services',
                name: 'Veterinary Services',
                description: 'Veterinary care and animal health services',
                icon: 'bi-heart-pulse',
                image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&h=400&fit=crop',
                count: 30,
                types: ['Veterinary Care', 'Animal Health', 'Medical Services']
            }
        ],
        featuredListings: [
            {
                id: 21,
                title: 'Purebred German Shepherd - Breeding Quality',
                location: 'Lahore, Punjab',
                price: 5000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop',
                rating: 4.9,
                reviews: 67,
                verified: true,
                instant: true,
                subcategory: 'Pets for Breeding',
                breed: 'German Shepherd',
                age: '2 Years'
            },
            {
                id: 22,
                title: 'Horse with Cart - Working Animal',
                location: 'Multan, Punjab',
                price: 3000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=600&h=400&fit=crop',
                rating: 4.8,
                reviews: 45,
                verified: true,
                instant: false,
                subcategory: 'Working Animals',
                type: 'Horse & Cart',
                capacity: 'Heavy Load'
            },
            {
                id: 23,
                title: 'Camel for Transportation',
                location: 'Quetta, Balochistan',
                price: 2500,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
                rating: 4.7,
                reviews: 34,
                verified: true,
                instant: false,
                subcategory: 'Working Animals',
                type: 'Camel',
                purpose: 'Transportation'
            },
            {
                id: 24,
                title: 'Veterinary Services - Mobile Clinic',
                location: 'Karachi, Sindh',
                price: 4000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&h=400&fit=crop',
                rating: 4.9,
                reviews: 89,
                verified: true,
                instant: true,
                subcategory: 'Veterinary Services',
                service: 'Mobile Clinic',
                availability: '24/7'
            }
        ],
        whyChoose: [
            {
                icon: 'bi-shield-check-fill',
                title: 'Verified Animals',
                description: 'All animals are verified for health and quality assurance.'
            },
            {
                icon: 'bi-calendar-check-fill',
                title: 'Flexible Rental',
                description: 'Rent animals for short or long term with flexible booking options.'
            },
            {
                icon: 'bi-credit-card-fill',
                title: 'Secure Payments',
                description: 'Multiple payment options including JazzCash, Easypaisa, and cards.'
            },
            {
                icon: 'bi-star-fill',
                title: 'Real Reviews',
                description: 'Read authentic reviews from verified renters to make informed decisions.'
            },
            {
                icon: 'bi-headset',
                title: '24/7 Support',
                description: 'Get help anytime with our dedicated customer support team.'
            },
            {
                icon: 'bi-geo-alt-fill',
                title: 'Nationwide Coverage',
                description: 'Animals and services available across all major cities in Pakistan.'
            }
        ]
    },
    boat: {
        name: 'Boat',
        description: 'Rent boats and watercraft for fishing, recreation, or transportation. From fishing boats to luxury yachts, passenger ferries to cargo vessels - find the perfect watercraft for your needs.',
        icon: 'bi-water',
        color: '#0984e3',
        stats: {
            listings: '95+',
            subcategories: 6,
            rating: '4.7★'
        },
        subcategories: [
            {
                id: 'fishing-boats',
                name: 'Fishing Boats',
                description: 'Fishing boats and angling vessels',
                icon: 'bi-water',
                image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
                count: 35,
                types: ['Fishing Boats', 'Angling Vessels', 'Commercial Fishing']
            },
            {
                id: 'passenger-ferries',
                name: 'Passenger Ferries',
                description: 'Passenger ferries and transport boats',
                icon: 'bi-people',
                image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop',
                count: 25,
                types: ['Ferries', 'Passenger Boats', 'Transport']
            },
            {
                id: 'recreational-boats',
                name: 'Recreational Boats',
                description: 'Recreational boats and leisure watercraft',
                icon: 'bi-water',
                image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop',
                count: 20,
                types: ['Recreational', 'Leisure Boats', 'Family Boats']
            },
            {
                id: 'yachts-speedboats',
                name: 'Yachts & Speedboats',
                description: 'Luxury yachts and high-speed boats',
                icon: 'bi-speedometer2',
                image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop',
                count: 10,
                types: ['Yachts', 'Speedboats', 'Luxury']
            },
            {
                id: 'cargo-vessels',
                name: 'Cargo Vessels',
                description: 'Cargo boats and freight vessels',
                icon: 'bi-box',
                image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop',
                count: 8,
                types: ['Cargo Boats', 'Freight Vessels', 'Transport']
            },
            {
                id: 'boat-equipment',
                name: 'Boat Equipment & Safety Gear',
                description: 'Boat equipment, safety gear, and accessories',
                icon: 'bi-shield-check',
                image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
                count: 12,
                types: ['Safety Gear', 'Equipment', 'Accessories']
            }
        ],
        featuredListings: [
            {
                id: 25,
                title: 'Fishing Boat - Fully Equipped',
                location: 'Karachi, Sindh',
                price: 8000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',
                rating: 4.8,
                reviews: 45,
                verified: true,
                instant: true,
                subcategory: 'Fishing Boats',
                capacity: '6 People',
                equipment: 'Fully Equipped'
            },
            {
                id: 26,
                title: 'Luxury Yacht - Premium Experience',
                location: 'Karachi, Sindh',
                price: 50000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop',
                rating: 4.9,
                reviews: 67,
                verified: true,
                instant: false,
                subcategory: 'Yachts & Speedboats',
                capacity: '20 People',
                amenities: 'Luxury'
            },
            {
                id: 27,
                title: 'Passenger Ferry - Group Transport',
                location: 'Gwadar, Balochistan',
                price: 15000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=600&h=400&fit=crop',
                rating: 4.7,
                reviews: 34,
                verified: true,
                instant: false,
                subcategory: 'Passenger Ferries',
                capacity: '50 People',
                type: 'Ferry'
            },
            {
                id: 28,
                title: 'Recreational Boat - Family Fun',
                location: 'Lahore, Punjab',
                price: 5000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop',
                rating: 4.6,
                reviews: 56,
                verified: true,
                instant: true,
                subcategory: 'Recreational Boats',
                capacity: '8 People',
                type: 'Recreational'
            }
        ],
        whyChoose: [
            {
                icon: 'bi-shield-check-fill',
                title: 'Verified Boats',
                description: 'All boats are verified and regularly maintained for safety and performance.'
            },
            {
                icon: 'bi-calendar-check-fill',
                title: 'Flexible Rental',
                description: 'Rent boats for short or long term with flexible booking options.'
            },
            {
                icon: 'bi-credit-card-fill',
                title: 'Secure Payments',
                description: 'Multiple payment options including JazzCash, Easypaisa, and cards.'
            },
            {
                icon: 'bi-star-fill',
                title: 'Real Reviews',
                description: 'Read authentic reviews from verified renters to make informed decisions.'
            },
            {
                icon: 'bi-headset',
                title: '24/7 Support',
                description: 'Get help anytime with our dedicated customer support team.'
            },
            {
                icon: 'bi-geo-alt-fill',
                title: 'Coastal Coverage',
                description: 'Boats available at major ports and coastal cities in Pakistan.'
            }
        ]
    },
    airTransport: {
        name: 'Air Transport',
        description: 'Rent aircraft and aviation services for your travel needs. From charter planes to helicopters, air ambulance to cargo aircraft - access premium air transport services.',
        icon: 'bi-airplane-fill',
        color: '#6c5ce7',
        stats: {
            listings: '45+',
            subcategories: 5,
            rating: '4.9★'
        },
        subcategories: [
            {
                id: 'charter-planes',
                name: 'Charter Planes',
                description: 'Private charter planes and aircraft',
                icon: 'bi-airplane',
                image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop',
                count: 15,
                types: ['Charter Planes', 'Private Aircraft', 'Business Jets']
            },
            {
                id: 'helicopter-services',
                name: 'Helicopter Services',
                description: 'Helicopter rental and services',
                icon: 'bi-airplane',
                image: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=600&h=400&fit=crop',
                count: 12,
                types: ['Helicopters', 'Heli Services', 'Aerial Transport']
            },
            {
                id: 'air-ambulance',
                name: 'Air Ambulance Services',
                description: 'Medical air transport and ambulance services',
                icon: 'bi-heart-pulse',
                image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&h=400&fit=crop',
                count: 8,
                types: ['Air Ambulance', 'Medical Transport', 'Emergency']
            },
            {
                id: 'cargo-aircraft',
                name: 'Cargo Aircraft',
                description: 'Cargo planes and freight aircraft',
                icon: 'bi-box',
                image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop',
                count: 6,
                types: ['Cargo Planes', 'Freight Aircraft', 'Transport']
            },
            {
                id: 'pilot-services',
                name: 'Pilot Services',
                description: 'Licensed pilots and aviation professionals',
                icon: 'bi-person-fill',
                image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop',
                count: 4,
                types: ['Pilots', 'Aviation', 'Flight Services']
            }
        ],
        featuredListings: [
            {
                id: 29,
                title: 'Private Charter Plane - Business Class',
                location: 'Karachi, Sindh',
                price: 150000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop',
                rating: 4.9,
                reviews: 45,
                verified: true,
                instant: false,
                subcategory: 'Charter Planes',
                capacity: '8 Passengers',
                type: 'Business Jet'
            },
            {
                id: 30,
                title: 'Helicopter Service - Aerial Tours',
                location: 'Islamabad',
                price: 80000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1556388158-158ea5ccacbd?w=600&h=400&fit=crop',
                rating: 4.8,
                reviews: 34,
                verified: true,
                instant: true,
                subcategory: 'Helicopter Services',
                capacity: '4 Passengers',
                service: 'Aerial Tours'
            },
            {
                id: 31,
                title: 'Air Ambulance - Medical Emergency',
                location: 'Lahore, Punjab',
                price: 200000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&h=400&fit=crop',
                rating: 5.0,
                reviews: 28,
                verified: true,
                instant: true,
                subcategory: 'Air Ambulance',
                equipment: 'Full Medical',
                availability: '24/7'
            },
            {
                id: 32,
                title: 'Cargo Aircraft - Freight Transport',
                location: 'Karachi, Sindh',
                price: 120000,
                period: 'day',
                image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&h=400&fit=crop',
                rating: 4.7,
                reviews: 23,
                verified: true,
                instant: false,
                subcategory: 'Cargo Aircraft',
                capacity: '10 Tons',
                type: 'Freight'
            }
        ],
        whyChoose: [
            {
                icon: 'bi-shield-check-fill',
                title: 'Verified Aircraft',
                description: 'All aircraft are verified and regularly maintained for safety and compliance.'
            },
            {
                icon: 'bi-calendar-check-fill',
                title: 'Flexible Booking',
                description: 'Book flights for any duration with flexible scheduling options.'
            },
            {
                icon: 'bi-credit-card-fill',
                title: 'Secure Payments',
                description: 'Multiple payment options including JazzCash, Easypaisa, and cards.'
            },
            {
                icon: 'bi-star-fill',
                title: 'Real Reviews',
                description: 'Read authentic reviews from verified clients to make informed decisions.'
            },
            {
                icon: 'bi-headset',
                title: '24/7 Support',
                description: 'Get help anytime with our dedicated customer support team.'
            },
            {
                icon: 'bi-geo-alt-fill',
                title: 'Nationwide Coverage',
                description: 'Air transport services available across all major airports in Pakistan.'
            }
        ]
    }
};

// Get category ID from URL
function getCategoryIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id') || 'property'; // Default to property
}

// Get current category data
function getCurrentCategory() {
    const categoryId = getCategoryIdFromURL();
    return categoryData[categoryId] || categoryData.property;
}

// Update page content based on category
function updatePageForCategory(category) {
    // Update page title
    document.title = `${category.name} Rentals - MyRental Marketplace`;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
        metaDescription.content = `${category.name} Rentals in Pakistan - ${category.description}`;
    }
    
    // Update breadcrumb
    const breadcrumbActive = document.querySelector('.breadcrumb-item.active');
    if (breadcrumbActive) {
        breadcrumbActive.textContent = category.name;
    }
    
    // Update category badge
    const categoryBadge = document.querySelector('.category-badge');
    if (categoryBadge) {
        categoryBadge.innerHTML = `<i class="bi ${category.icon}"></i><span>${category.name} Rentals</span>`;
    }
    
    // Update hero title
    const heroTitle = document.querySelector('.category-hero-title');
    if (heroTitle) {
        heroTitle.textContent = `Find Your Perfect ${category.name}`;
    }
    
    // Update hero subtitle
    const heroSubtitle = document.querySelector('.category-hero-subtitle');
    if (heroSubtitle) {
        heroSubtitle.textContent = category.description;
    }
    
    // Update stats
    const statNumbers = document.querySelectorAll('.category-stat-number');
    if (statNumbers.length >= 3) {
        statNumbers[0].textContent = category.stats.listings;
        statNumbers[1].textContent = category.stats.subcategories;
        statNumbers[2].textContent = category.stats.rating;
    }
    
    // Update search button
    const searchButton = document.getElementById('category-search-button');
    if (searchButton) {
        const categoryId = getCategoryIdFromURL();
        // Normalize category ID for URL
        const categoryUrlMap = {
            'serviceProviders': 'service-providers',
            'service_providers': 'service-providers',
            'airTransport': 'air-transport',
            'air_transport': 'air-transport',
        };
        const urlCategoryId = categoryUrlMap[categoryId] || categoryId;
        searchButton.setAttribute('onclick', `window.location.href='search.html?category=${urlCategoryId}'`);
    }
    
    const searchButtonText = document.getElementById('search-button-text');
    if (searchButtonText) {
        searchButtonText.textContent = `Search ${category.name}`;
    }
    
    // Update breadcrumb
    const breadcrumbCategory = document.getElementById('breadcrumb-category');
    if (breadcrumbCategory) {
        breadcrumbCategory.textContent = category.name;
    }
    
    // Update stats
    const statListings = document.getElementById('stat-listings');
    if (statListings) {
        statListings.textContent = category.stats.listings;
    }
    
    const statSubcategories = document.getElementById('stat-subcategories');
    if (statSubcategories) {
        statSubcategories.textContent = category.stats.subcategories;
    }
    
    const statRating = document.getElementById('stat-rating');
    if (statRating) {
        statRating.textContent = category.stats.rating;
    }
    
    // Update section titles
    const sectionTitle = document.getElementById('subcategories-title');
    if (sectionTitle) {
        sectionTitle.textContent = `${category.name} Types`;
    }
    
    const sectionSubtitle = document.getElementById('subcategories-subtitle');
    if (sectionSubtitle) {
        sectionSubtitle.textContent = `Explore our wide range of ${category.name.toLowerCase()} rental options`;
    }
    
    const featuredTitle = document.getElementById('featured-title');
    if (featuredTitle) {
        featuredTitle.textContent = `Featured ${category.name} Listings`;
    }
    
    const featuredSubtitle = document.getElementById('featured-subtitle');
    if (featuredSubtitle) {
        featuredSubtitle.textContent = `Handpicked ${category.name.toLowerCase()} just for you`;
    }
    
    const seeAllLink = document.getElementById('see-all-link');
    if (seeAllLink) {
        const categoryId = getCategoryIdFromURL();
        // Normalize category ID for URL
        const categoryUrlMap = {
            'serviceProviders': 'service-providers',
            'service_providers': 'service-providers',
            'airTransport': 'air-transport',
            'air_transport': 'air-transport',
        };
        const urlCategoryId = categoryUrlMap[categoryId] || categoryId;
        seeAllLink.setAttribute('href', `search.html?category=${urlCategoryId}`);
    }
    
    const whyChooseTitle = document.getElementById('why-choose-title');
    if (whyChooseTitle) {
        whyChooseTitle.textContent = `Why Rent ${category.name} on MyRental?`;
    }
    
    const whyChooseSubtitle = document.getElementById('why-choose-subtitle');
    if (whyChooseSubtitle) {
        whyChooseSubtitle.textContent = `Experience the best ${category.name.toLowerCase()} rental marketplace in Pakistan`;
    }
}

// Load Subcategories
function loadSubcategories() {
    const subcategoriesGrid = document.getElementById('subcategories-grid');
    if (!subcategoriesGrid) return;
    
    const category = getCurrentCategory();
    const categoryId = getCategoryIdFromURL();
    
    // Normalize category ID for URL (serviceProviders -> service-providers, etc.)
    const categoryUrlMap = {
        'serviceProviders': 'service-providers',
        'service_providers': 'service-providers',
        'airTransport': 'air-transport',
        'air_transport': 'air-transport',
    };
    const urlCategoryId = categoryUrlMap[categoryId] || categoryId;

    subcategoriesGrid.innerHTML = category.subcategories.map(subcategory => `
        <div class="col-lg-4 col-md-6 col-sm-6">
            <a href="search.html?category=${urlCategoryId}&subcategory=${subcategory.id}" class="subcategory-card" data-subcategory="${subcategory.id}">
                <div class="subcategory-image-wrapper">
                    <img src="${subcategory.image}" alt="${subcategory.name}" class="subcategory-image" loading="lazy">
                    <div class="subcategory-icon-overlay">
                        <i class="bi ${subcategory.icon}"></i>
                    </div>
                </div>
                <div class="subcategory-content">
                    <h3 class="subcategory-name">${subcategory.name}</h3>
                    <p class="subcategory-description">${subcategory.description}</p>
                    ${subcategory.types ? `
                    <div class="subcategory-types">
                        <div class="subcategory-tags">
                            ${subcategory.types.map(type => `<span class="subcategory-tag">${type}</span>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                    <div class="subcategory-footer">
                        <span class="subcategory-count">
                            <i class="bi bi-list-ul"></i>
                            ${subcategory.count.toLocaleString()} listings
                        </span>
                        <i class="bi bi-arrow-right subcategory-arrow"></i>
                    </div>
                </div>
            </a>
        </div>
    `).join('');
}

// Load Featured Listings from API
async function loadFeaturedListings() {
    const featuredContainer = document.getElementById('featured-property-listings');
    if (!featuredContainer) return;
    
    const category = getCurrentCategory();
    const categoryId = getCategoryIdFromURL();
    
    // Show loading state
    featuredContainer.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    try {
        // Normalize category ID for API (serviceProviders -> service_providers, etc.)
        const categoryMap = {
            'serviceProviders': 'service_providers',
            'service-providers': 'service_providers',
            'airTransport': 'air_transport',
            'air-transport': 'air_transport',
        };
        const apiCategory = categoryMap[categoryId] || categoryId;
        const normalizedCategory = apiCategory.toLowerCase().replace(/-/g, '_');
        
        const API_BASE = window.API_BASE_URL || 'http://localhost:4001/api';
        const params = new URLSearchParams({
            category: normalizedCategory,
            limit: '12',
            sort: 'newest',
        });
        
        const response = await fetch(`${API_BASE}/listings?${params.toString()}`);
        const data = await response.json();
        
        if (response.ok && data.status === 'success' && data.listings && data.listings.length > 0) {
            const listings = data.listings;
            featuredContainer.innerHTML = listings.map(listing => {
                const locCity = listing.location?.city || '';
                const locProv = listing.location?.province || '';
                const locationText = [locCity, locProv].filter(Boolean).join(', ') || (listing.location?.address || '');
                const stats = listing.stats || {};
                const image = (listing.images && listing.images[0]?.url) || listing.featuredImage || getPlaceholderImage(600, 400, 'No Image');
                
                return `
                    <div class="col-lg-3 col-md-4 col-sm-6">
                        <a href="listing-detail.html?id=${listing._id || listing.id}" class="listing-card" data-listing="${listing._id || listing.id}">
                            <div class="listing-image-wrapper">
                                <img src="${image}" alt="${listing.title}" class="listing-image" loading="lazy" onerror="this.src='${getPlaceholderImage(600, 400, 'No Image')}'">
                                <div class="listing-icon-overlay">
                                    <i class="bi ${category.icon}"></i>
                                </div>
                                ${listing.verified || listing.availability?.instantBooking ? `
                                <div class="listing-badges">
                                    ${listing.verified ? '<span class="badge-verified"><i class="bi bi-shield-check"></i></span>' : ''}
                                    ${listing.availability?.instantBooking ? '<span class="badge-instant"><i class="bi bi-lightning-fill"></i></span>' : ''}
                                </div>
                                ` : ''}
                                <div class="listing-gradient"></div>
                            </div>
                            <div class="listing-content">
                                <h3 class="listing-title">${listing.title}</h3>
                                <p class="listing-location">
                                    <i class="bi bi-geo-alt"></i>
                                    <span>${locationText}</span>
                                </p>
                                <div class="listing-meta">
                                    <div class="listing-rating">
                                        <i class="bi bi-star-fill"></i>
                                        <span>${(stats.averageRating || 0).toFixed(1)}</span>
                                        <span class="listing-reviews">(${stats.totalReviews || 0})</span>
                                    </div>
                                    <div class="listing-price">
                                        <span class="price-amount">Rs ${(listing.pricing?.amount || 0).toLocaleString()}</span>
                                        <span class="price-period">/${listing.pricing?.model || 'day'}</span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                `;
            }).join('');
        } else {
            // Fallback to hardcoded listings if API fails or no results
            featuredContainer.innerHTML = category.featuredListings.map(listing => `
                <div class="col-lg-3 col-md-4 col-sm-6">
                    <a href="listing-detail.html?id=${listing.id}" class="listing-card" data-listing="${listing.id}">
                        <div class="listing-image-wrapper">
                            <img src="${listing.image}" alt="${listing.title}" class="listing-image" loading="lazy" onerror="this.src='${getPlaceholderImage(600, 400, 'No Image')}'">
                            <div class="listing-icon-overlay">
                                <i class="bi ${category.icon}"></i>
                            </div>
                            ${listing.verified || listing.instant ? `
                            <div class="listing-badges">
                                ${listing.verified ? '<span class="badge-verified"><i class="bi bi-shield-check"></i></span>' : ''}
                                ${listing.instant ? '<span class="badge-instant"><i class="bi bi-lightning-fill"></i></span>' : ''}
                            </div>
                            ` : ''}
                            <div class="listing-gradient"></div>
                        </div>
                        <div class="listing-content">
                            <h3 class="listing-title">${listing.title}</h3>
                            <p class="listing-location">
                                <i class="bi bi-geo-alt"></i>
                                <span>${listing.location}</span>
                            </p>
                            <div class="listing-meta">
                                <div class="listing-rating">
                                    <i class="bi bi-star-fill"></i>
                                    <span>${listing.rating}</span>
                                    <span class="listing-reviews">(${listing.reviews})</span>
                                </div>
                                <div class="listing-price">
                                    <span class="price-amount">Rs ${listing.price.toLocaleString()}</span>
                                    <span class="price-period">/${listing.period}</span>
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading featured listings:', error);
        // Show empty state
        featuredContainer.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">No listings available at the moment. Check back later!</p></div>';
    }

    featuredContainer.innerHTML = category.featuredListings.map(listing => `
        <div class="col-lg-3 col-md-4 col-sm-6">
            <a href="listing-detail.html?id=${listing.id}" class="listing-card" data-listing="${listing.id}">
                <div class="listing-image-wrapper">
                    <img src="${listing.image}" alt="${listing.title}" class="listing-image" loading="lazy" onerror="this.src='${getPlaceholderImage(600, 400, 'No Image')}'">
                    <div class="listing-icon-overlay">
                        <i class="bi ${category.icon}"></i>
                    </div>
                    ${listing.verified || listing.instant ? `
                    <div class="listing-badges">
                        ${listing.verified ? '<span class="badge-verified"><i class="bi bi-shield-check"></i></span>' : ''}
                        ${listing.instant ? '<span class="badge-instant"><i class="bi bi-lightning-fill"></i></span>' : ''}
                    </div>
                    ` : ''}
                    <div class="listing-gradient"></div>
                </div>
                <div class="listing-content">
                    <h3 class="listing-title">${listing.title}</h3>
                    <p class="listing-location">
                        <i class="bi bi-geo-alt"></i>
                        <span>${listing.location}</span>
                    </p>
                    ${listing.bedrooms ? `
                    <div class="listing-features">
                        <span class="listing-feature">
                            <i class="bi bi-door-open"></i>
                            ${listing.bedrooms} Bed${listing.bedrooms > 1 ? 's' : ''}
                        </span>
                        ${listing.bathrooms ? `
                        <span class="listing-feature">
                            <i class="bi bi-droplet"></i>
                            ${listing.bathrooms} Bath${listing.bathrooms > 1 ? 's' : ''}
                        </span>
                        ` : ''}
                    </div>
                    ` : ''}
                    ${listing.transmission ? `
                    <div class="listing-features">
                        <span class="listing-feature">
                            <i class="bi bi-gear"></i>
                            ${listing.transmission}
                        </span>
                        ${listing.seats ? `
                        <span class="listing-feature">
                            <i class="bi bi-people"></i>
                            ${listing.seats} Seats
                        </span>
                        ` : ''}
                        ${listing.engine ? `
                        <span class="listing-feature">
                            <i class="bi bi-speedometer2"></i>
                            ${listing.engine}
                        </span>
                        ` : ''}
                        ${listing.capacity ? (typeof listing.capacity === 'string' && (listing.capacity.includes('People') || listing.capacity.includes('Passengers'))) ? `
                        <span class="listing-feature">
                            <i class="bi bi-people"></i>
                            ${listing.capacity}
                        </span>
                        ` : `
                        <span class="listing-feature">
                            <i class="bi bi-box"></i>
                            ${listing.capacity}
                        </span>
                        ` : ''}
                    </div>
                    ` : ''}
                    ${listing.size ? `
                    <div class="listing-features">
                        <span class="listing-feature">
                            <i class="bi bi-rulers"></i>
                            ${listing.size}
                        </span>
                        ${listing.designer ? `
                        <span class="listing-feature">
                            <i class="bi bi-star"></i>
                            ${listing.designer}
                        </span>
                        ` : ''}
                        ${listing.season ? `
                        <span class="listing-feature">
                            <i class="bi bi-cloud-sun"></i>
                            ${listing.season}
                        </span>
                        ` : ''}
                        ${listing.items ? `
                        <span class="listing-feature">
                            <i class="bi bi-bag"></i>
                            ${listing.items}
                        </span>
                        ` : ''}
                    </div>
                    ` : ''}
                    ${listing.type ? `
                    <div class="listing-features">
                        <span class="listing-feature">
                            <i class="bi bi-tag"></i>
                            ${listing.type}
                        </span>
                        ${listing.brand ? `
                        <span class="listing-feature">
                            <i class="bi bi-award"></i>
                            ${listing.brand}
                        </span>
                        ` : ''}
                        ${listing.specs ? `
                        <span class="listing-feature">
                            <i class="bi bi-cpu"></i>
                            ${listing.specs}
                        </span>
                        ` : ''}
                        ${listing.capacity ? (typeof listing.capacity === 'string' && (listing.capacity.includes('People') || listing.capacity.includes('Passengers'))) ? `
                        <span class="listing-feature">
                            <i class="bi bi-people"></i>
                            ${listing.capacity}
                        </span>
                        ` : `
                        <span class="listing-feature">
                            <i class="bi bi-box"></i>
                            ${listing.capacity}
                        </span>
                        ` : ''}
                        ${listing.complete ? `
                        <span class="listing-feature">
                            <i class="bi bi-check-circle"></i>
                            ${listing.complete}
                        </span>
                        ` : ''}
                        ${listing.experience ? `
                        <span class="listing-feature">
                            <i class="bi bi-clock-history"></i>
                            ${listing.experience}
                        </span>
                        ` : ''}
                        ${listing.license ? `
                        <span class="listing-feature">
                            <i class="bi bi-shield-check"></i>
                            ${listing.license}
                        </span>
                        ` : ''}
                        ${listing.expertise ? `
                        <span class="listing-feature">
                            <i class="bi bi-star"></i>
                            ${listing.expertise}
                        </span>
                        ` : ''}
                        ${listing.availability ? `
                        <span class="listing-feature">
                            <i class="bi bi-calendar-check"></i>
                            ${listing.availability}
                        </span>
                        ` : ''}
                        ${listing.services ? `
                        <span class="listing-feature">
                            <i class="bi bi-list-check"></i>
                            ${listing.services}
                        </span>
                        ` : ''}
                        ${listing.breed ? `
                        <span class="listing-feature">
                            <i class="bi bi-heart"></i>
                            ${listing.breed}
                        </span>
                        ` : ''}
                        ${listing.age ? `
                        <span class="listing-feature">
                            <i class="bi bi-calendar"></i>
                            ${listing.age}
                        </span>
                        ` : ''}
                        ${listing.purpose ? `
                        <span class="listing-feature">
                            <i class="bi bi-briefcase"></i>
                            ${listing.purpose}
                        </span>
                        ` : ''}
                        ${listing.service ? `
                        <span class="listing-feature">
                            <i class="bi bi-hospital"></i>
                            ${listing.service}
                        </span>
                        ` : ''}
                        ${listing.equipment ? `
                        <span class="listing-feature">
                            <i class="bi bi-tools"></i>
                            ${listing.equipment}
                        </span>
                        ` : ''}
                        ${listing.amenities ? `
                        <span class="listing-feature">
                            <i class="bi bi-star"></i>
                            ${listing.amenities}
                        </span>
                        ` : ''}
                        ${listing.capacity ? (typeof listing.capacity === 'string' && (listing.capacity.includes('People') || listing.capacity.includes('Passengers'))) ? `
                        <span class="listing-feature">
                            <i class="bi bi-people"></i>
                            ${listing.capacity}
                        </span>
                        ` : `
                        <span class="listing-feature">
                            <i class="bi bi-box"></i>
                            ${listing.capacity}
                        </span>
                        ` : ''}
                    </div>
                    ` : ''}
                    <div class="listing-meta">
                        <div class="listing-rating">
                            <i class="bi bi-star-fill"></i>
                            <span>${listing.rating}</span>
                            <span class="listing-reviews">(${listing.reviews})</span>
                        </div>
                        <div class="listing-price">
                            <span class="price-amount">Rs ${listing.price.toLocaleString()}</span>
                            <span class="price-period">/${listing.period}</span>
                        </div>
                    </div>
                </div>
            </a>
        </div>
    `).join('');
}

// Load Why Choose Section
function loadWhyChoose() {
    const whyChooseGrid = document.querySelector('.why-choose-section .row');
    if (!whyChooseGrid) return;
    
    const category = getCurrentCategory();

    whyChooseGrid.innerHTML = category.whyChoose.map(feature => `
        <div class="col-lg-4 col-md-6">
            <div class="feature-card">
                <div class="feature-icon">
                    <i class="bi ${feature.icon}"></i>
                </div>
                <h4 class="feature-title">${feature.title}</h4>
                <p class="feature-description">${feature.description}</p>
            </div>
        </div>
    `).join('');
}

// Set minimum date for date inputs
function setMinDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const checkinInput = document.getElementById('category-checkin-input');
    const checkoutInput = document.getElementById('category-checkout-input');
    
    if (checkinInput) {
        checkinInput.min = today.toISOString().split('T')[0];
        checkinInput.addEventListener('change', function() {
            if (checkoutInput) {
                const checkinDate = new Date(this.value);
                checkinDate.setDate(checkinDate.getDate() + 1);
                checkoutInput.min = checkinDate.toISOString().split('T')[0];
            }
        });
    }
    
    if (checkoutInput) {
        checkoutInput.min = tomorrow.toISOString().split('T')[0];
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const category = getCurrentCategory();
    updatePageForCategory(category);
    
    loadSubcategories();
    loadFeaturedListings();
    loadWhyChoose();
    setMinDates();
    
    // Add animation classes
    const subcategoryCards = document.querySelectorAll('.subcategory-card');
    subcategoryCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-stagger');
    });
});

