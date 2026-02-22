/**
 * Category and Subcategory Validation Utility
 * Ensures strict enforcement of category-subcategory relationships
 */

// Valid subcategories for each main category
const VALID_SUBCATEGORIES = {
    property: [
        'apartments',
        'houses_villas',
        'houses-villas',
        'commercial_spaces',
        'commercial-spaces',
        'event_spaces',
        'event-spaces',
        'farmhouses',
        'rooms_hostels',
        'rooms-hostels',
    ],
    vehicles: [
        'cars',
        'motorcycles',
        'bicycles',
        'trucks_loaders',
        'trucks-loaders',
        'rickshaws',
        'trailers',
        'heavy_machinery',
        'heavy-machinery',
    ],
    clothes: [
        'wedding_formal',
        'wedding-formal',
        'designer_outfits',
        'designer-outfits',
        'seasonal_clothing',
        'seasonal-clothing',
        'costumes',
        'accessories',
        'maternity_kids',
        'maternity-kids',
    ],
    equipment: [
        'farming_equipment',
        'farming-equipment',
        'electronics',
        'medical_equipment',
        'medical-equipment',
        'kitchen_catering',
        'kitchen-catering',
        'sports_fitness',
        'sports-fitness',
        'gaming_items',
        'gaming-items',
    ],
    service_providers: [
        'skilled_workers',
        'skilled-workers',
        'technical_staff',
        'technical-staff',
        'event_staff',
        'event-staff',
        'agricultural_labor',
        'agricultural-labor',
        'domestic_help',
        'domestic-help',
        'drivers',
        'medical_services',
        'medical-services',
        'pilot_services',
        'pilot-services',
    ],
    animals: [
        'pets_breeding',
        'pets-breeding',
        'working_animals',
        'working-animals',
        'veterinary_services',
        'veterinary-services',
    ],
    boat: [
        'fishing_boats',
        'fishing-boats',
        'passenger_ferries',
        'passenger-ferries',
        'recreational_boats',
        'recreational-boats',
        'yachts_speedboats',
        'yachts-speedboats',
        'cargo_vessels',
        'cargo-vessels',
        'boat_equipment',
        'boat-equipment',
    ],
    air_transport: [
        'charter_planes',
        'charter-planes',
        'helicopter_services',
        'helicopter-services',
        'air_ambulance',
        'air-ambulance',
        'cargo_aircraft',
        'cargo-aircraft',
        'pilot_services',
        'pilot-services',
    ],
};

/**
 * Normalize subcategory string (handles both hyphenated and underscored formats)
 */
function normalizeSubcategory(subcategory) {
    if (!subcategory) return '';
    return String(subcategory).toLowerCase().trim();
}

/**
 * Check if a subcategory is valid for a given category
 * @param {string} category - The main category
 * @param {string} subcategory - The subcategory to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidSubcategory(category, subcategory) {
    if (!category || !subcategory) return false;
    
    const normalizedCategory = String(category).toLowerCase().replace(/-/g, '_');
    const normalizedSubcategory = normalizeSubcategory(subcategory);
    
    const validSubs = VALID_SUBCATEGORIES[normalizedCategory];
    if (!validSubs) return false;
    
    // Check both hyphenated and underscored versions
    return validSubs.some(validSub => {
        const normalizedValid = normalizeSubcategory(validSub);
        return normalizedValid === normalizedSubcategory || 
               normalizedValid.replace(/-/g, '_') === normalizedSubcategory.replace(/-/g, '_');
    });
}

/**
 * Get all valid subcategories for a category
 * @param {string} category - The main category
 * @returns {string[]} - Array of valid subcategory IDs
 */
function getValidSubcategories(category) {
    if (!category) return [];
    const normalizedCategory = String(category).toLowerCase().replace(/-/g, '_');
    return VALID_SUBCATEGORIES[normalizedCategory] || [];
}

/**
 * Validate category-subcategory relationship
 * @param {string} category - The main category
 * @param {string} subcategory - The subcategory
 * @returns {Object} - { valid: boolean, error: string|null }
 */
function validateCategorySubcategory(category, subcategory) {
    if (!category) {
        return { valid: false, error: 'Category is required' };
    }
    
    if (!subcategory) {
        return { valid: false, error: 'Subcategory is required' };
    }
    
    const normalizedCategory = String(category).toLowerCase().replace(/-/g, '_');
    
    // Check if category is valid
    if (!VALID_SUBCATEGORIES[normalizedCategory]) {
        return { 
            valid: false, 
            error: `Invalid category: ${category}. Valid categories are: ${Object.keys(VALID_SUBCATEGORIES).join(', ')}` 
        };
    }
    
    // Check if subcategory belongs to category
    if (!isValidSubcategory(category, subcategory)) {
        const validSubs = getValidSubcategories(category);
        return { 
            valid: false, 
            error: `Invalid subcategory "${subcategory}" for category "${category}". Valid subcategories are: ${validSubs.join(', ')}` 
        };
    }
    
    return { valid: true, error: null };
}

module.exports = {
    isValidSubcategory,
    getValidSubcategories,
    validateCategorySubcategory,
    VALID_SUBCATEGORIES,
};


