// Simple i18n utility for English/Urdu with RTL support
// Usage: call setLanguage('ur' | 'en') or applyTranslations() to load saved preference.

const I18N_STORAGE_KEY = 'mr-lang';
const DEFAULT_LANG = 'en';
const DEFAULT_TRANSLATE_ENDPOINT = 'https://libretranslate.de/translate';
const DYNAMIC_TRANSLATIONS_KEY = 'mr-dynamic-translations';
const DYNAMIC_CACHE_LIMIT = 500;

const dynamicTranslationCache = loadDynamicTranslationCache();
const translationPromises = {};

function loadDynamicTranslationCache() {
    try {
        const raw = localStorage.getItem(DYNAMIC_TRANSLATIONS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (err) {
        console.warn('Unable to parse dynamic translation cache', err);
        return {};
    }
}

function ensureRtlStyles(isUrdu) {
    const rtlLinkId = 'rtl-stylesheet';
    let rtlLink = document.getElementById(rtlLinkId);
    if (isUrdu && !rtlLink) {
        rtlLink = document.createElement('link');
        rtlLink.id = rtlLinkId;
        rtlLink.rel = 'stylesheet';
        rtlLink.href = 'css/rtl.css';
        document.head.appendChild(rtlLink);
    }
    if (!isUrdu && rtlLink) {
        rtlLink.remove();
    }

    const fontLinkId = 'urdu-font';
    let fontLink = document.getElementById(fontLinkId);
    if (isUrdu && !fontLink) {
        fontLink = document.createElement('link');
        fontLink.id = fontLinkId;
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap';
        document.head.appendChild(fontLink);
    }
}

// Selector-based translations for precise UI elements
const translations = {
    ur: {
        '.logo-text': 'مائی رینٹل',
        '.host-link-text': 'ہوسٹ بنیں',
        '.user-name': 'مہمان صارف',
        '.user-email': 'guest@example.com',
        '.btn-login span': 'لاگ ان',
        '.btn-signup span': 'سائن اپ',
        '.mobile-menu-item:nth-child(1) span': 'ہوم',
        '.mobile-menu-item:nth-child(2) span': 'تلاش',
        '.mobile-menu-item:nth-child(3) span': 'زمرہ جات',
        '.mobile-menu-item:nth-child(4) span': 'ہوسٹ بنیں',
        '.mobile-menu-item:nth-child(6) span': 'لاگ ان',
        '.mobile-menu-item:nth-child(7) span': 'سائن اپ',

        // Search hero
        '.search-hero-title': 'اپنی بہترین کرائے کی جگہ تلاش کریں',
        '.search-hero-subtitle': 'پاکستان میں ہزاروں تصدیق شدہ لسٹنگز تلاش کریں',
        '.search-hero-tags .pill.success': 'تصدیق شدہ میزبان',
        '.search-hero-tags .pill:not(.success):nth-child(2)': 'فوری بکنگ',
        '.search-hero-tags .pill.neutral': '۲۴/۷ معاونت',
        '.search-label:nth-of-type(1)': 'کہاں',
        '.search-label:nth-of-type(2)': 'چیک ان',
        '.search-label:nth-of-type(3)': 'چیک آؤٹ',
        '.search-label:nth-of-type(4)': 'مہمان',
        '#search-location-input': { placeholder: 'مطلوبہ مقام تلاش کریں' },
        '#search-guests-input': { placeholder: 'مہمان شامل کریں' },

        // Filters
        '.filter-header h3': 'فلٹرز',
        '.clear-filters span': 'تمام صاف کریں',
        '.filter-section:nth-of-type(1) .filter-label': 'قیمت کی حد',
        '.filter-section:nth-of-type(2) .filter-label': 'زمرہ',
        '.filter-section:nth-of-type(3) .filter-label': 'مقام',
        '.filter-section:nth-of-type(4) .filter-label': 'کم از کم ریٹنگ',
        '.filter-section:nth-of-type(5) .filter-label': 'جلدی اختیارات',
        '#location-filter': { placeholder: 'مقام درج کریں' },
        '.checkbox-label:nth-of-type(1)': 'صرف فوری بکنگ',
        '.checkbox-label:nth-of-type(2)': 'صرف تصدیق شدہ لسٹنگز',

        // Toolbar
        '.results-text': 'نتائج ملے',
        '.sort-label span': 'ترتیب:',
        '#sort-select option[value="relevance"]': 'اہمیت',
        '#sort-select option[value="price-low"]': 'قیمت: کم سے زیادہ',
        '#sort-select option[value="price-high"]': 'قیمت: زیادہ سے کم',
        '#sort-select option[value="rating"]': 'اعلی درجہ',
        '#sort-select option[value="newest"]': 'جدید ترین',

        // Quick filters
        '.quick-filters .filter-chip:nth-child(1)': 'ٹرینڈنگ',
        '.quick-filters .filter-chip:nth-child(2)': 'کام کے لئے تیار',
        '.quick-filters .filter-chip:nth-child(3)': 'پول رسائی',
        '.quick-filters .filter-chip:nth-child(4)': 'بیرونی جگہ',
        '.quick-filters .filter-chip:nth-child(5)': 'طویل قیام',
        '.quick-filters .filter-chip:nth-child(6)': 'سپر ہوسٹ',
        '.quick-filters .filter-chip:nth-child(7)': 'سیلف چیک ان',
        '.quick-filters .filter-chip:nth-child(8)': 'میٹرو کے قریب',

        // Insights / featured
        '.insight-card:nth-child(1) .insight-label': 'آج رات کی بہترین قیمت',
        '.insight-card:nth-child(1) .text-muted': 'ملتے جلتے قریبی لسٹنگز کی بنیاد پر',
        '.insight-card:nth-child(2) .insight-label': 'آسان منسوخی',
        '.insight-card:nth-child(2) .text-muted': 'صرف “فری کینسلیشن” فلٹر استعمال کریں',
        '.insight-card:nth-child(3) .insight-label': 'فوری بکنگ',
        '.insight-card:nth-child(3) .text-muted': 'میزبان منظوری درکار نہیں',
        '.insight-card:nth-child(4) .insight-label': 'مقامی سیفٹی اسکور',
        '.insight-card:nth-child(4) .text-muted': 'تصدیق شدہ محلوں اور میزبان',
        '.featured-badge': 'آپ کے لیے منتخب',
        '.featured-banner h3': 'شہر کے پسندیدہ گھروں میں رہیں',
        '.featured-banner p': 'پریمیم سپورٹ، لچکدار پالیسیز اور تصدیق شدہ میزبان کے ساتھ منتخب کردہ لسٹنگز۔',
        '.featured-actions a:nth-child(1)': 'منتخب فہرست دیکھیں',
        '.featured-actions a:nth-child(2)': 'ہمارے ساتھ ہوسٹ کریں',
        '.trust-item:nth-child(1)': 'تصدیق شدہ میزبان اور شناخت',
        '.trust-item:nth-child(2)': 'محفوظ ادائیگیاں اور ہولڈز',
        '.trust-item:nth-child(3)': 'سیفٹی فرسٹ پالیسیاں',
        '.trust-item:nth-child(4)': '۲۴/۷ انسانی معاونت',

        // Empty state
        '#empty-state h3': 'کوئی لسٹنگ نہیں ملی',
        '#empty-state p': 'اپنے فلٹرز یا تلاش کی شرائط بدل کر دیکھیں',
        '.btn-clear-filters': 'تمام فلٹرز صاف کریں',

        // Footer
        '.footer-brand-name': 'مائی رینٹل',
        '.footer-brand-tagline': 'پاکستان میں آپ کا قابل اعتماد کرایہ مارکیٹ پلیس',
        '.footer-description': 'کسی بھی چیز کو کہیں بھی کرائے پر لیں۔ 8 زمروں میں ہزاروں قابل اعتماد لسٹنگز دریافت کریں۔',
        '.newsletter-title': 'ہمارا نیوز لیٹر حاصل کریں',
        '.newsletter-input': { placeholder: 'اپنا ای میل درج کریں' },
        '.footer-column:nth-of-type(2) .footer-column-title': 'متعلقہ',
        '.footer-column:nth-of-type(3) .footer-column-title': 'کمیونٹی',
        '.footer-column:nth-of-type(4) .footer-column-title': 'ہوسٹ',
        '.footer-column:nth-of-type(5) .footer-column-title': 'سپورٹ',
        '.footer-links li:nth-child(1) a': 'کیسے کام کرتا ہے',
        '.footer-links li:nth-child(2) a': 'نیوز روم',
        '.footer-links li:nth-child(3) a': 'سرمایہ کار',
        '.footer-links li:nth-child(4) a': 'ملازمتیں',
        '.footer-links li:nth-child(5) a': 'بلاگ',
        '.footer-links li:nth-child(6) a': 'تنوع اور شمولیت',
        '.footer-links li:nth-child(7) a': 'رسائی',
        '.footer-links li:nth-child(8) a': 'مدد',
        '.footer-links li:nth-child(9) a': 'آفتی امداد',
        '.footer-links li:nth-child(10) a': 'ایونٹس',
        '.footer-links li:nth-child(11) a': 'اپنا گھر ہوسٹ کریں',
        '.footer-links li:nth-child(12) a': 'آن لائن تجربہ',
        '.footer-links li:nth-child(13) a': 'وسائل',
        '.footer-links li:nth-child(14) a': 'کمیونٹی فورم',
        '.footer-links li:nth-child(15) a': 'ہوسٹنگ ٹپس',
        '.footer-links li:nth-child(16) a': 'ہیلپ سینٹر',
        '.footer-links li:nth-child(17) a': 'حفاظت',
        '.footer-links li:nth-child(18) a': 'منسوخی',
        '.footer-links li:nth-child(19) a': 'محلے',
        '.footer-links li:nth-child(20) a': 'ہم سے رابطہ کریں',
        '.contact-item:nth-child(1) span': '+92 300 1234567',
        '.contact-item:nth-child(2) span': 'support@myrental.pk',
        '.footer-bottom .legal-link:nth-child(1)': 'رازداری پالیسی',
        '.footer-bottom .legal-link:nth-child(2)': 'سروس کی شرائط',
        '.footer-bottom .legal-link:nth-child(3)': 'سائٹ میپ',
        '.social-label': 'ہمیں فالو کریں:',
        '.payments-label': 'ہم قبول کرتے ہیں:'
    },
    en: {} // English keeps existing strings
};

// Text-level translations: matches exact trimmed English text nodes and replaces with Urdu.
const textTranslations = {
    // Navigation / layout
    'Home': 'ہوم',
    'Search': 'تلاش',
    'Categories': 'زمرہ جات',
    'Become a Host': 'ہوسٹ بنیں',
    'Log in': 'لاگ ان',
    'Sign up': 'سائن اپ',
    'Dashboard': 'ڈیش بورڈ',
    'My Listings': 'میری فہرستیں',
    'My Bookings': 'میری بکنگز',
    'Messages': 'پیغامات',
    'Profile': 'پروفائل',
    'Settings': 'ترتیبات',
    'Help & Support': 'مدد اور تعاون',
    'Log out': 'لاگ آؤٹ',

    // Search / filters
    'Filters': 'فلٹرز',
    'Clear all': 'تمام صاف کریں',
    'Price Range': 'قیمت کی حد',
    'Category': 'زمرہ',
    'Location': 'مقام',
    'Minimum Rating': 'کم از کم ریٹنگ',
    'Quick Options': 'جلدی اختیارات',
    'Instant booking only': 'صرف فوری بکنگ',
    'Verified listings only': 'صرف تصدیق شدہ لسٹنگز',
    'results found': 'نتائج ملے',
    'Sort by:': 'ترتیب:',
    'Relevance': 'اہمیت',
    'Price: Low to High': 'قیمت: کم سے زیادہ',
    'Price: High to Low': 'قیمت: زیادہ سے کم',
    'Highest Rated': 'اعلی درجہ',
    'Newest First': 'جدید ترین',
    'Trending': 'ٹرینڈنگ',
    'Work-ready': 'کام کے لئے تیار',
    'Pool access': 'پول رسائی',
    'Outdoor space': 'بیرونی جگہ',
    'Long stays': 'طویل قیام',
    'Superhost': 'سپر ہوسٹ',
    'Self check-in': 'سیلف چیک ان',
    'Near metro': 'میٹرو کے قریب',

    // Map / empty
    'Map View': 'نقشہ منظر',
    'Interactive map will be displayed here': 'انٹرایکٹو نقشہ یہاں دکھایا جائے گا',
    'Map integration ready for Google Maps or Mapbox': 'گوگل میپس یا میپ باکس کے لیے انضمام تیار ہے',
    'No listings found': 'کوئی لسٹنگ نہیں ملی',
    'Try adjusting your filters or search terms': 'اپنے فلٹرز یا تلاش کی شرائط بدل کر دیکھیں',
    'Clear All Filters': 'تمام فلٹرز صاف کریں',

    // Hero
    'Find Your Perfect Rental': 'اپنی بہترین کرائے کی جگہ تلاش کریں',
    'Search across thousands of verified listings in Pakistan': 'پاکستان میں ہزاروں تصدیق شدہ لسٹنگز تلاش کریں',
    'Verified hosts': 'تصدیق شدہ میزبان',
    'Instant booking': 'فوری بکنگ',
    '24/7 support': '۲۴/۷ معاونت',

    // Common controls
    'Where': 'کہاں',
    'Check in': 'چیک ان',
    'Check out': 'چیک آؤٹ',
    'Guests': 'مہمان',
    'Add guests': 'مہمان شامل کریں',

    // Category names
    'Property': 'جائداد',
    'Vehicles': 'گاڑیاں',
    'Clothes': 'کپڑے',
    'Equipment': 'آلات',
    'Service Providers': 'سروس فراہم کنندگان',
    'Animals': 'جانور',
    'Boat': 'کشتی',
    'Air Transport': 'فضائی نقل و حمل',

    // Sub-categories (common labels)
    'Apartments': 'فلیٹس',
    'Houses/Villas': 'مکانات/ولاز',
    'Commercial Spaces': 'تجارتی جگہیں',
    'Apartments, Houses, Commercial Spaces': 'فلیٹس، مکان، تجارتی جگہیں',
    'Apartments, Houses,': 'فلیٹس، مکان،',
    'commerical spaces': 'تجارتی جگہیں',
    'Event Spaces': 'ایونٹ اسپیسز',
    'Farmhouses & Vacation Homes': 'فارم ہاؤسز اور تعطیلی گھر',
    'Rooms & Hostels': 'کمرے اور ہوسٹلز',
    'Cars': 'کاریں',
    'Motorcycles & Scooters': 'موٹر سائیکل اور اسکوٹرز',
    'Cars, Motorcycles, Trucks': 'کاریں، موٹر سائیکلیں، ٹرک',
    'Bicycles': 'سائیکلیں',
    'Trucks & Loaders': 'ٹرک اور لوڈرز',
    'Rickshaws & Qingqis': 'رکشہ اور چنگچی',
    'Trailers & Commercial Vehicles': 'ٹریلرز اور کمرشل گاڑیاں',
    'Heavy Machinery': 'بھاری مشینری',
    'Wedding & Formal Wear': 'شادی اور رسمی لباس',
    'Wedding Wear, Designer outifits': 'شادی کا لباس، ڈیزائنر ملبوسات',
    'Designer outifits': 'ڈیزائنر ملبوسات',
    'Designer Outfits': 'ڈیزائنر ملبوسات',
    'Seasonal Clothing': 'موسمی لباس',
    'Costumes & Theme Wear': 'کاسٹیوم اور تھیم لباس',
    'Accessories': 'ایکسسریز',
    'Maternity & Kids Clothing': 'میٹرنٹی اور بچوں کے کپڑے',
    'Farming Equipment': 'زرعی آلات',
    'Electronics': 'الیکٹرانکس',
    'Medical Equipment': 'طبی آلات',
    'Farming, Electronics, Medical': 'زرعی، الیکٹرانکس، طبی',
    'Farming, Electronics, Medica': 'زرعی، الیکٹرانکس، طبی',
    'Kitchen & Catering Gear': 'کچن اور کیٹرنگ سامان',
    'Sports & Fitness Equipment': 'کھیل اور فٹنس آلات',
    'Gaming Items': 'گیمنگ اشیاء',
    'Skilled Workers': 'ماہر کارکن',
    'Technical Staff': 'ٹیکنیکل عملہ',
    'Skilled Workers, Technical Staff': 'ماہر کارکن، ٹیکنیکل عملہ',
    'Event Staff': 'ایونٹ عملہ',
    'Agricultural Labor': 'زرعی مزدور',
    'Domestic Help': 'گھریلو مدد',
    'Drivers & Transportation Staff': 'ڈرائیور اور ٹرانسپورٹ عملہ',
    'Medical Services': 'طبی خدمات',
    'Pilot Services': 'پائلٹ خدمات',
    'Pets for Breeding/Shows': 'بریڈنگ/شوز کیلئے پالتو',
    'Working Animals': 'کام کرنے والے جانور',
    'Pets, Working Animals': 'پالتو، کام کرنے والے جانور',
    'Veterinary Services': 'ویٹرنری خدمات',
    'Fishing Boats': 'ماہی گیری کشتیاں',
    'Fishing Boats, Ferries, Yachts': 'ماہی گیری کشتیاں، فیریز، یاٹس',
    'Passenger Ferries': 'مسافر فیریز',
    'Recreational Boats': 'تفریحی کشتیاں',
    'Yachts & Speedboats': 'یاٹس اور اسپیڈ بوٹس',
    'Cargo Vessels': 'کارگو جہاز',
    'Boat Equipment & Safety Gear': 'کشتی کا سامان اور حفاظتی گیئر',
    'Charter Planes': 'چارٹر طیارے',
    'Helicopter Services': 'ہیلی کاپٹر خدمات',
    'Charter Planes, Helicopters': 'چارٹر طیارے، ہیلی کاپٹرز',
    'Air Ambulance Services': 'ایئر ایمبولینس خدمات',
    'Cargo Aircraft': 'کارگو طیارے',

    // Buttons / CTAs
    'View curated list': 'منتخب فہرست دیکھیں',
    'Host with us': 'ہمارے ساتھ ہوسٹ کریں',

    // Footer
    'About': 'متعلقہ',
    'Community': 'کمیونٹی',
    'Host': 'ہوسٹ',
    'Support': 'سپورٹ',
    'How it works': 'کیسے کام کرتا ہے',
    'Newsroom': 'نیوز روم',
    'Investors': 'سرمایہ کار',
    'Careers': 'ملازمتیں',
    'Blog': 'بلاگ',
    'Diversity & Belonging': 'تنوع اور شمولیت',
    'Accessibility': 'رسائی',
    'Support': 'مدد',
    'Disaster Relief': 'آفتی امداد',
    'Events': 'ایونٹس',
    'Host your home': 'اپنا گھر ہوسٹ کریں',
    'Online Experience': 'آن لائن تجربہ',
    'Resources': 'وسائل',
    'Community Forum': 'کمیونٹی فورم',
    'Hosting Tips': 'ہوسٹنگ ٹپس',
    'Help Center': 'ہیلپ سینٹر',
    'Safety': 'حفاظت',
    'Cancellation': 'منسوخی',
    'Neighborhood': 'محلے',
    'Contact Us': 'ہم سے رابطہ کریں',
    'Follow us:': 'ہمیں فالو کریں:',
    'We accept:': 'ہم قبول کرتے ہیں:',
    'Privacy Policy': 'رازداری پالیسی',
    'Terms of Service': 'سروس کی شرائط',
    'Sitemap': 'سائٹ میپ',

    // Additional sections and copy
    '8 Major Categories': '8 اہم زمرہ جات',
    'From property and vehicles to equipment and services - find everything you need in one place.':
        'جائیداد اور گاڑیوں سے لے کر آلات اور خدمات تک — ہر ضرورت ایک ہی جگہ پوری کریں۔',
    'Rating System': 'درجہ بندی نظام',
    'JazzCash, Easypaisa, and Card payments with full encryption and secure transaction processing.':
        'جاز کیش، ایزی پیسہ اور کارڈ ادائیگیاں مکمل انکرپشن اور محفوظ ٹرانزیکشن پروسیسنگ کے ساتھ۔',
    'Paid accounts get ID, Email, Mobile, Fingerprint & Face verification for maximum security and trust.':
        'پریمیم اکاؤنٹس کو شناختی کارڈ، ای میل، موبائل، فنگرپرنٹ اور چہرہ تصدیق ملتی ہے تاکہ زیادہ سے زیادہ سیکیورٹی اور اعتماد ہو۔',
    'Upload and verify your government-issued ID': 'اپنی سرکاری شناختی دستاویز اپ لوڈ کریں اور تصدیق کریں',
    'Verify your email address and mobile number': 'اپنا ای میل پتہ اور موبائل نمبر تصدیق کریں',
    'Credit/Debit Card': 'کریڈٹ/ڈیبٹ کارڈ',
    'Credit/Debit Cards': 'کریڈٹ/ڈیبٹ کارڈز',
    'Free': 'مفت',
    'Rs': 'روپے',
    '/day': '/دن',
    'All listings go through verification. Paid accounts get full ID, biometric, and face verification for maximum trust.':
        'تمام لسٹنگز کی تصدیق ہوتی ہے۔ پریمیم اکاؤنٹس کو مکمل شناختی، بائیومیٹرک اور چہرہ تصدیق ملتی ہے تاکہ زیادہ سے زیادہ اعتماد ہو۔',
    'Honda Civic 2023': 'ہونڈا سوک ۲۰۲۳',
    'Honda Civic ۲۰۲۳': 'ہونڈا سوک ۲۰۲۳',
    'Wedding Hall - Grand Venue': 'ویڈنگ ہال - گرینڈ وینیو',
    'Professional Camera Equipment': 'پروفیشنل کیمرا آلات',
    'Professional Camera Equipmen': 'پروفیشنل کیمرا آلات',
    'Lahore': 'لاہور',
    'Lahore, Punjab': 'لاہور، پنجاب',
    'Karachi, Sindh': 'کراچی، سندھ',
    'Islamabad': 'اسلام آباد',
    'JazzCash': 'جاز کیش',
    'Easypaisa': 'ایزی پیسہ',

    // Global CTAs / buttons
    'Submit': 'جمع کریں',
    'Continue': 'جاری رکھیں',
    'Next': 'اگلا',
    'Back': 'پیچھے',
    'Save': 'محفوظ کریں',
    'Cancel': 'منسوخ کریں',
    'Apply': 'لاگو کریں',
    'Reset': 'ری سیٹ',
    'Edit': 'ترمیم کریں',
    'Delete': 'حذف کریں',
    'View': 'دیکھیں',
    'Close': 'بند کریں',
    'Confirm': 'تصدیق کریں',
    'Yes': 'ہاں',
    'No': 'نہیں',
    'Upload': 'اپ لوڈ',
    'Browse': 'براؤز کریں',
    'Choose file': 'فائل منتخب کریں',
    'Send': 'بھیجیں',
    'Book Now': 'اب بک کریں',
    'Pay Now': 'ابھی ادائیگی کریں',
    'Proceed to Pay': 'ادائیگی کے لیے آگے بڑھیں',
    'Continue to Payment': 'ادائیگی کی طرف بڑھیں',
    'Back to Home': 'ہوم پر واپس',
    'Back to Listings': 'فہرستوں پر واپس',
    'View Details': 'تفصیلات دیکھیں',
    'View All': 'سب دیکھیں',

    // Form fields
    'Name': 'نام',
    'Full Name': 'مکمل نام',
    'First Name': 'پہلا نام',
    'Last Name': 'آخری نام',
    'Email': 'ای میل',
    'Email Address': 'ای میل ایڈریس',
    'Phone': 'فون',
    'Phone Number': 'فون نمبر',
    'Mobile Number': 'موبائل نمبر',
    'Password': 'پاس ورڈ',
    'Confirm Password': 'پاس ورڈ کی تصدیق',
    'New Password': 'نیا پاس ورڈ',
    'Current Password': 'موجودہ پاس ورڈ',
    'Address': 'پتہ',
    'City': 'شہر',
    'Country': 'ملک',
    'Postal Code': 'پوسٹل کوڈ',
    'Date of Birth': 'تاریخ پیدائش',
    'Gender': 'جنس',
    'Male': 'مرد',
    'Female': 'عورت',
    'Other': 'دیگر',

    // Auth / account
    'Login': 'لاگ ان',
    'Register': 'رجسٹر کریں',
    'Forgot Password?': 'پاس ورڈ بھول گئے؟',
    'Remember me': 'مجھے یاد رکھیں',
    'Create Account': 'اکاؤنٹ بنائیں',
    'Already have an account?': 'پہلے سے اکاؤنٹ ہے؟',
    'Don’t have an account?': 'اکاؤنٹ نہیں ہے؟',
    'Sign in': 'سائن ان',
    'Sign out': 'سائن آؤٹ',

    // Booking / payment
    'Booking Details': 'بکنگ کی تفصیلات',
    'Payment Details': 'ادائیگی کی تفصیلات',
    'Payment Method': 'ادائیگی کا طریقہ',
    'Card Number': 'کارڈ نمبر',
    'Expiry Date': 'میعاد ختم ہونے کی تاریخ',
    'CVV': 'سی وی وی',
    'Card Holder Name': 'کارڈ ہولڈر کا نام',
    'Total': 'کل',
    'Subtotal': 'ذیلی کل',
    'Taxes & Fees': 'ٹیکس اور فیس',
    'Discount': 'رعایت',
    'Apply Coupon': 'کوپن لگائیں',
    'Coupon Code': 'کوپن کوڈ',
    'Grand Total': 'مجموعی کل',
    'Booking Summary': 'بکنگ خلاصہ',
    'Guest Details': 'مہمان کی تفصیلات',
    'Contact Details': 'رابطہ کی تفصیلات',
    'Special Requests': 'خصوصی درخواستیں',
    'Payment': 'ادائیگی',
    'Confirm Booking': 'بکنگ کی تصدیق کریں',
    'Your booking is confirmed': 'آپ کی بکنگ کی تصدیق ہو گئی ہے',
    'Booking Reference': 'بکنگ حوالہ',
    'Download Receipt': 'رسید ڈاؤن لوڈ کریں',

    // Verification
    'Verification': 'تصدیق',
    'Verify': 'تصدیق کریں',
    'Send Code': 'کوڈ بھیجیں',
    'Resend Code': 'کوڈ دوبارہ بھیجیں',
    'Enter Code': 'کوڈ درج کریں',
    'One-Time Password': 'ون ٹائم پاس ورڈ',
    'Identity Verification': 'شناخت کی تصدیق',
    'Email Verification': 'ای میل تصدیق',
    'Phone Verification': 'فون تصدیق',
    'Face Verification': 'چہرہ تصدیق',
    'Fingerprint Verification': 'فنگرپرنٹ تصدیق',
    'Upload ID': 'شناختی دستاویز اپ لوڈ کریں',
    'Front Side': 'سامنے کی جانب',
    'Back Side': 'پیچھے کی جانب',

    // Listings / search results
    'Verified': 'تصدیق شدہ',
    'Premium': 'پریمیم',
    'Free Account': 'فری اکاؤنٹ',
    'Instant': 'فوری',
    'Reviews': 'جائزے',
    'per day': 'فی دن',
    'per night': 'فی رات',
    'per hour': 'فی گھنٹہ',
    'per week': 'فی ہفتہ',
    'per month': 'فی مہینہ',
    'Similar Items': 'ملتے جلتے آئٹمز',
    'Featured': 'نمایاں',
    'Why choose us': 'ہمیں کیوں منتخب کریں',
    'Trusted hosts': 'بااعتماد میزبان',
    'Verified listings': 'تصدیق شدہ لسٹنگز',
    'Best value': 'بہترین قدر',
    'Safe payments': 'محفوظ ادائیگیاں',

    // Profile / dashboard
    'Edit Profile': 'پروفائل ترمیم کریں',
    'My Messages': 'میرے پیغامات',
    'Notifications': 'اطلاعات',
    'Language': 'زبان',
    'Security': 'سیکورٹی',
    'Billing': 'بلنگ',
    'Subscription': 'سبسکرپشن',
    'Upgrade': 'اپ گریڈ کریں',
    'Downgrade': 'ڈاؤن گریڈ کریں',
    'Change Password': 'پاس ورڈ تبدیل کریں',

    // Forms / states
    'Loading...': 'لوڈ ہو رہا ہے...',
    'Please wait...': 'براہ کرم انتظار کریں...',
    'No data found': 'کوئی ڈیٹا نہیں ملا',
    'No results': 'کوئی نتیجہ نہیں',
    'Something went wrong': 'کچھ غلط ہو گیا',
    'Try again': 'دوبارہ کوشش کریں',
    'Success': 'کامیابی',
    'Error': 'خرابی',
    'Warning': 'انتباہ',
    'Info': 'معلومات',
    'Required': 'لازمی',
    'Optional': 'اختیاری',

    // Homepage / hero, stats, sections
    'Rent Anything,': 'کچھ بھی کرائے پر لیں،',
    'Anywhere in Pakistan': 'پاکستان میں کہیں بھی',
    'Discover thousands of verified rental options across 8 categories. From properties to vehicles, equipment to services - find exactly what you need.':
        'آٹھ زمروں میں ہزاروں تصدیق شدہ کرایہ آپشنز دریافت کریں۔ جائیداد سے گاڑیاں، آلات سے خدمات تک—جو چاہیے وہی پائیں۔',
    'Discover thousands of verified rental options across ۸ categories. From properties to vehicles, equipment to services - find exactly what you need.':
        '۸ زمروں میں ہزاروں تصدیق شدہ کرائے کی آپشنز دریافت کریں۔ جائیداد سے گاڑیوں تک، آلات سے خدمات تک — جو چاہیے وہی پائیں۔',
    'Trusted Rental Marketplace': 'بااعتماد کرایہ مارکیٹ پلیس',
    'My Profile': 'میرا پروفائل',
    'Log In': 'لاگ ان',
    'Sign Up': 'سائن اپ',
    'Active Listings': 'فعال لسٹنگز',
    'Happy Users': 'خوش صارفین',
    'Average Rating': 'اوسط درجہ بندی',
    'Average Ratin': 'اوسط درجہ بندی',
    'Explore Categories': 'زمرہ جات دیکھیں',
    'Scroll to explore': 'دیکھنے کے لئے اسکرول کریں',
    'Explore by Category': 'زمرہ کے مطابق دیکھیں',
    'Find exactly what you need': 'جو درکار ہے اسے بالکل پائیں',
    'Featured Listings': 'نمایاں لسٹنگز',
    'See all': 'سب دیکھیں',
    'How it Works': 'یہ کیسے کام کرتا ہے',
    'how its works': 'یہ کیسے کام کرتا ہے',
    'Get started in three simple steps': 'تین آسان مراحل میں آغاز کریں',
    'Why Choose MyRental?': 'مائی رینٹل کیوں؟',
    'The most trusted rental marketplace in Pakistan': 'پاکستان کی سب سے معتبر کرایہ مارکیٹ پلیس',
    'Choose Your Account Type': 'اپنا اکاؤنٹ منتخب کریں',
    'Free or Paid - We have options for everyone': 'فری یا پریمیم — ہر ایک کے لیے آپشنز',
    'Free Account': 'فری اکاؤنٹ',
    'Perfect for getting started': 'آغاز کے لیے موزوں',
    'Paid Account': 'پریمیم اکاؤنٹ',
    'Unlock full potential': 'مکمل امکانات کھولیں',
    'Start Verification': 'تصدیق شروع کریں',
    'Accepted Payment Methods': 'قبول شدہ ادائیگی کے طریقے',
    'Secure and convenient payment options': 'محفوظ اور سہل ادائیگی کے طریقے',
    'What Our Users Say': 'ہمارے صارفین کیا کہتے ہیں',
    'Real experiences from our community': 'ہماری کمیونٹی کے حقیقی تجربات',
    'Ready to Get Started?': 'شروع کرنے کے لیے تیار؟',
    'Join thousands of users who are already renting and earning on MyRental Marketplace':
        'ہزاروں صارفین میں شامل ہوں جو مائی رینٹل مارکیٹ پلیس پر کرائے پر لے اور کما رہے ہیں',
    'Sign Up Free': 'مفت سائن اپ',
    'Upgrade to Premium': 'پریمیم میں اپ گریڈ کریں',
    'Host with us': 'ہمارے ساتھ ہوسٹ کریں',
    'Luxury Apartment in Lahore': 'لگژری اپارٹمنٹ لاہور',

    // Category cards and counts
    'Includes:': 'شامل ہیں:',
    '1,250+ listings': '1,250+ لسٹنگز',
    '890+ listings': '890+ لسٹنگز',
    '650+ listings': '650+ لسٹنگز',
    '420+ listings': '420+ لسٹنگز',
    '1,100+ listings': '1,100+ لسٹنگز',
    '180 listings': '180 لسٹنگز',
    '95 listings': '95 لسٹنگز',
    '45 listings': '45 لسٹنگز',

    // How it works steps
    'Browse through thousands of verified listings across 8 categories. Filter by location, price, and availability.':
        'آٹھ زمروں میں ہزاروں تصدیق شدہ لسٹنگز براؤز کریں۔ مقام، قیمت اور دستیابی کے مطابق فلٹر کریں۔',
    'Choose your dates and complete secure payment through JazzCash, Easypaisa, or card. Get instant confirmation.':
        'اپنی تاریخیں منتخب کریں اور جاز کیش، ایزی پیسہ یا کارڈ کے ذریعے محفوظ ادائیگی کریں۔ فوری تصدیق حاصل کریں۔',
    'Rent and enjoy your item or service. Leave a review to help others make better decisions.':
        'آئٹم یا خدمت کرائے پر لیں اور لطف اٹھائیں۔ دوسروں کی مدد کے لیے ریویو دیں تاکہ بہتر فیصلے کر سکیں۔',

    // Trust & safety / value props
    'Trusted hosts': 'بااعتماد میزبان',
    'Verified listings': 'تصدیق شدہ لسٹنگز',
    'Instant Booking': 'فوری بکنگ',
    'Flexible Pricing': 'لچکدار قیمتیں',
    'Direct Messaging': 'براہ راست پیغام رسانی',
    'Category-Specific Ratings': 'زمرہ مخصوص درجہ بندیاں',
    'Safe payments': 'محفوظ ادائیگیاں',

    // Account cards details
    'Basic profile creation': 'بنیادی پروفائل تخلیق',
    'List items for 48 hours': 'آئٹمز 48 گھنٹے کے لیے لسٹ کریں',
    'Browse and book listings': 'لسٹنگز براؤز اور بک کریں',
    'Basic email verification': 'بنیادی ای میل تصدیق',
    'Ads displayed (every 2 minutes)': 'اشتہارات دکھائے جائیں گے (ہر 2 منٹ بعد)',
    'No verification badge': 'کوئی تصدیقی بیج نہیں',
    'Full verification (ID, Biometric, Face)': 'مکمل تصدیق (شناختی کارڈ، بائیو میٹرک، چہرہ)',
    'List items for 1 month': 'آئٹمز 1 ماہ کے لیے لسٹ کریں',
    'Verified badge on profile': 'پروفائل پر تصدیقی بیج',
    'No ads - ad-free experience': 'کوئی اشتہار نہیں - اشتہار فری تجربہ',
    'Priority support': 'ترجیحی معاونت',
    'Enhanced listing visibility': 'بہتر لسٹنگ نمایاںگی',

    // Stats / counters
    'Active Users': 'فعال صارفین',
    'Listings': 'لسٹنگز',
    'Rating': 'درجہ بندی'

    ,
    // Trust & Safety (remaining)
    'Trust & Safety': 'اعتماد اور حفاظت',
    'Your security is our priority': 'آپ کی حفاظت ہماری ترجیح ہے',
    '24/7 Support': '۲۴/۷ معاونت',
    'Round-the-clock support center for dispute resolution and assistance with any issues.':
        'جھگڑوں کے حل اور کسی بھی مسئلے میں مدد کے لیے چوبیس گھنٹے سپورٹ سینٹر۔',
    'Rating system': 'درجہ بندی نظام',
    'Category-specific ratings and reviews for every transaction, helping build trust in our community.':
        'ہر لین دین کے لیے زمرہ مخصوص درجہ بندیاں اور جائزے، جو ہماری کمیونٹی میں اعتماد بڑھاتے ہیں۔',
    'Secure Payments': 'محفوظ ادائیگیاں',
    'JazzCash, Easypaisa, and Card payments with full encryption and secure transaction':
        'جاز کیش، ایزی پیسہ اور کارڈ ادائیگیاں مکمل انکرپشن اور محفوظ ٹرانزیکشن کے ساتھ',
    'Multi-Layer Verification': 'کثیر سطحی تصدیق',
    'Paid accounts get ID, Email, Mobile, Fingerprint & Face verification for maximum security and trus':
        'پریمیم اکاؤنٹس کو شناختی کارڈ، ای میل، موبائل، فنگرپرنٹ اور چہرہ تصدیق ملتی ہے تاکہ زیادہ سے زیادہ سیکیورٹی ہو۔',
    'Complete Verification Process': 'مکمل تصدیقی عمل',
    'For paid accounts, we verify your identity through multiple layers':
        'پریمیم اکاؤنٹس کے لیے ہم آپ کی شناخت کو متعدد مراحل میں پرکھتے ہیں',
    'Email & Phone Verification': 'ای میل اور فون تصدیق',
    'Verify your email address and mobile numb': 'اپنا ای میل پتہ اور موبائل نمبر تصدیق کریں',
    'ID Verification': 'شناختی دستاویز کی تصدیق',
    'd and verify your government-issued ID': 'اور اپنی سرکاری شناختی دستاویز کی تصدیق کریں',
    'Biometric Verification': 'بائیو میٹرک تصدیق',
    'Fingerprint scanning for added security': 'زیادہ تحفظ کے لیے فنگرپرنٹ اسکیننگ',
    'Facial recognition to complete verification': 'تصدیق مکمل کرنے کے لیے چہرہ شناسائی',
    'Bank Transfer': 'بینک ٹرانسفر',

    // Feedback / testimonials
    'Real experiences from our community': 'ہماری کمیونٹی کے حقیقی تجربات',

    // Counters & badges (ensure Urdu)
    'Major Categories': 'اہم زمرہ جات',
    'From property and vehicles to equipment and services - find everything you need in one plac':
        'جائیداد اور گاڑیوں سے لے کر آلات اور خدمات تک — جو کچھ بھی چاہیے ایک ہی جگہ پائیں',

    // Value props duplicates
    'Verified Listings': 'تصدیق شدہ لسٹنگز',
    'All listings go through verification. Paid accounts get full ID, biometric, and face verification for maximum tru':
        'تمام لسٹنگز کی تصدیق ہوتی ہے۔ پریمیم اکاؤنٹس کو مکمل شناختی، بائیومیٹرک اور چہرہ تصدیق ملتی ہے تاکہ زیادہ سے زیادہ اعتماد ہو۔',
    'Get detailed ratings and reviews specific to each category, helping you make informed decisions.':
        'ہر زمرے کے لیے تفصیلی درجہ بندیاں اور جائزے حاصل کریں، جو آپ کو باخبر فیصلے کرنے میں مدد دیتے ہیں۔',
    'Communicate directly with owners through our built-in messaging system for quick responses.':
        'فوری جواب کے لیے ہمارے بلٹ اِن میسجنگ سسٹم کے ذریعے براہ راست مالکان سے بات کریں۔',
    'Choose from hourly, daily, weekly, or monthly rental periods. Transparent pricing with no hidden fees.':
        'گھنٹہ وار، روزانہ، ہفتہ وار یا ماہانہ کرائے میں سے انتخاب کریں۔ شفاف قیمتیں، کوئی پوشیدہ فیس نہیں۔',
    'Many listings offer instant booking - reserve and pay immediately without waiting for approval.':
        'بہت سی لسٹنگز فوری بکنگ فراہم کرتی ہیں — بغیر انتظار کے فوراً بک اور ادائیگی کریں۔',

    // Buttons in process flows
    'Enjoy': 'لطف اٹھائیں',
    'Book': 'بک کریں'

    ,
    // Auth / login / register / profile extras
    'Welcome back': 'خوش آمدید',
    'Sign in to continue': 'جاری رکھنے کے لیے سائن ان کریں',
    'Don’t have an account? Sign up': 'اکاؤنٹ نہیں ہے؟ سائن اپ کریں',
    'Already have an account? Login': 'پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں',
    'Create your account': 'اپنا اکاؤنٹ بنائیں',
    'Continue with Google': 'گوگل کے ساتھ جاری رکھیں',
    'Continue with Facebook': 'فیس بک کے ساتھ جاری رکھیں',
    'Or continue with': 'یا جاری رکھیں',
    'Personal Information': 'ذاتی معلومات',
    'Account Information': 'اکاؤنٹ معلومات',
    'Update Profile': 'پروفائل اپ ڈیٹ کریں',
    'Save Changes': 'تبدیلیاں محفوظ کریں',
    'Upload Photo': 'تصویر اپ لوڈ کریں',
    'Change Photo': 'تصویر تبدیل کریں',
    'Bio': 'مختصر تعارف',
    'Role': 'کردار',
    'Owner': 'مالک',
    'Borrower': 'کرایہ دار',
    'Phone number': 'فون نمبر',
    'Gender': 'جنس',
    'City': 'شہر',
    'Country': 'ملک',
    'Address': 'پتہ',
    'Profile Settings': 'پروفائل سیٹنگز',
    'Update Password': 'پاس ورڈ اپ ڈیٹ کریں',
    'New Password': 'نیا پاس ورڈ',
    'Confirm New Password': 'نیا پاس ورڈ تصدیق کریں',
    'Current Password': 'موجودہ پاس ورڈ'
};

// Placeholder/title translations for inputs and controls
const placeholderTranslations = {
    'Search destinations': 'مطلوبہ مقام تلاش کریں',
    'Add guests': 'مہمان شامل کریں',
    'Enter your email': 'اپنا ای میل درج کریں',
    'Enter email': 'ای میل درج کریں',
    'Enter your phone': 'اپنا فون درج کریں',
    'Enter phone number': 'فون نمبر درج کریں',
    'Enter password': 'پاس ورڈ درج کریں',
    'Confirm password': 'پاس ورڈ کی تصدیق کریں',
    'Confirm New Password': 'نیا پاس ورڈ تصدیق کریں',
    'Full name': 'مکمل نام',
    'First name': 'پہلا نام',
    'Last name': 'آخری نام',
    'Enter address': 'پتہ درج کریں',
    'Enter city': 'شہر درج کریں',
    'Enter full address or area name': 'مکمل پتہ یا علاقہ درج کریں',
    'Enter coupon code': 'کوپن کوڈ درج کریں',
    'Card number': 'کارڈ نمبر',
    'MM/YY': 'ایم ایم/وائی وائی',
    'CVV': 'سی وی وی',
    'Search...': 'تلاش کریں...',
    'Write a message': 'پیغام لکھیں',
    'Type your message': 'اپنا پیغام لکھیں',
    'Enter code': 'کوڈ درج کریں',
    'Add dates': 'تاریخیں شامل کریں',
    'Add dat': 'تاریخ شامل کریں',
    'dd/mm/yyyy': 'dd/mm/yyyy'
};

function setDirection(lang) {
    const isUrdu = lang === 'ur';
    document.documentElement.setAttribute('lang', isUrdu ? 'ur' : 'en');
    document.documentElement.setAttribute('dir', isUrdu ? 'rtl' : 'ltr');
    document.body.classList.toggle('rtl', isUrdu);
    ensureRtlStyles(isUrdu);
}

function setLanguage(lang) {
    const targetLang = lang === 'ur' ? 'ur' : 'en';
    localStorage.setItem(I18N_STORAGE_KEY, targetLang);
    setDirection(targetLang);
    applyTranslations(targetLang);
    const langText = document.getElementById('lang-text') || document.querySelector('.lang-text');
    if (langText) {
        langText.textContent = targetLang === 'ur' ? 'EN' : 'اردو';
    }
}

function getSavedLanguage() {
    return localStorage.getItem(I18N_STORAGE_KEY) || DEFAULT_LANG;
}

function translateTextNodes(map) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const updates = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.nodeValue.trim();
        if (!text) continue;
        const translated = map[text];
        if (translated) {
            storeOriginalTextNode(node);
            updates.push({ node, translated });
        }
    }
    updates.forEach(({ node, translated }) => {
        node.nodeValue = translated;
    });
}

function convertDigitsToUrdu(str) {
    const map = { '0': '۰', '1': '۱', '2': '۲', '3': '۳', '4': '۴', '5': '۵', '6': '۶', '7': '۷', '8': '۸', '9': '۹' };
    return str.replace(/[0-9]/g, d => map[d] || d);
}

function convertDigitsToEnglish(str) {
    const map = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
    return str.replace(/[۰-۹]/g, d => map[d] || d);
}

function formatNumbersForLang(lang) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const updates = [];
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.nodeValue;
        if (!text) continue;
        if (lang === 'ur' && /\d/.test(text)) {
            const converted = convertDigitsToUrdu(text);
            if (converted !== text) {
                updates.push({ node, converted });
            }
        } else if (lang !== 'ur' && /[۰-۹]/.test(text)) {
            const converted = convertDigitsToEnglish(text);
            if (converted !== text) {
                updates.push({ node, converted });
            }
        }
    }
    updates.forEach(({ node, converted }) => {
        node.nodeValue = converted;
    });
}

function translateAttributes(map) {
    const nodes = document.querySelectorAll('input, textarea, select, button, [title], [aria-label], [placeholder]');
    nodes.forEach(node => {
        ['placeholder', 'title', 'aria-label'].forEach(attr => {
            const value = node.getAttribute(attr);
            if (value && map[value]) {
                storeOriginalAttribute(node, attr);
                node.setAttribute(attr, map[value]);
            }
        });
    });
}

function saveDynamicTranslation(key, value) {
    dynamicTranslationCache[key] = value;
    const keys = Object.keys(dynamicTranslationCache);
    if (keys.length > DYNAMIC_CACHE_LIMIT) {
        const excess = keys.length - DYNAMIC_CACHE_LIMIT;
        for (let i = 0; i < excess; i++) {
            delete dynamicTranslationCache[keys[i]];
        }
    }
    try {
        localStorage.setItem(DYNAMIC_TRANSLATIONS_KEY, JSON.stringify(dynamicTranslationCache));
    } catch (err) {
        console.warn('Unable to persist translation cache', err);
    }
}

function hasUrduScript(text) {
    return /[\u0600-\u06FF]/.test(text);
}

function needsDynamicTranslation(text) {
    if (!text) return false;
    const trimmed = text.trim();
    if (!trimmed) return false;
    if (trimmed.length > 500) return false;
    if (hasUrduScript(trimmed)) return false;
    return /[A-Za-z]/.test(trimmed);
}

function translateTextDynamic(text, lang = 'ur') {
    if (!needsDynamicTranslation(text)) {
        return Promise.resolve(text);
    }
    if (dynamicTranslationCache[text]) {
        return Promise.resolve(dynamicTranslationCache[text]);
    }
    if (!translationPromises[text]) {
        translationPromises[text] = performRemoteTranslation(text, lang)
            .then(translated => {
                if (translated && translated !== text) {
                    saveDynamicTranslation(text, translated);
                    return translated;
                }
                return text;
            })
            .catch(err => {
                console.warn('Dynamic translation failed', err);
                return text;
            })
            .finally(() => {
                delete translationPromises[text];
            });
    }
    return translationPromises[text];
}

async function performRemoteTranslation(text, lang) {
    const endpoint = window.TRANSLATE_ENDPOINT || DEFAULT_TRANSLATE_ENDPOINT;
    if (!endpoint) return text;

    if (typeof window.dynamicTranslationAdapter === 'function') {
        try {
            const adapted = await window.dynamicTranslationAdapter(text, lang);
            if (adapted) return adapted;
        } catch (err) {
            console.warn('dynamicTranslationAdapter error', err);
        }
    }

    try {
        if (endpoint.includes('libretranslate')) {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    q: text,
                    source: 'en',
                    target: lang,
                    format: 'text'
                })
            });
            const data = await res.json();
            return data?.translatedText || text;
        }

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                texts: [text],
                source: 'en',
                target: lang
            })
        });
        const data = await res.json();
        if (Array.isArray(data?.translations) && data.translations[0]?.translatedText) {
            return data.translations[0].translatedText;
        }
        if (data?.translations && data.translations[text]) {
            return data.translations[text];
        }
    } catch (err) {
        console.warn('Remote translation request failed', err);
    }

    return text;
}

function shouldSkipNode(node) {
    const parent = node.parentElement;
    if (!parent) return false;
    return Boolean(
        parent.closest('style, script, code, pre, textarea, input, [contenteditable="true"], [data-no-translate]')
    );
}

function translateDynamicNodes(lang) {
    if (lang !== 'ur') return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    const nodeMap = new Map();
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (shouldSkipNode(node)) continue;
        const text = node.nodeValue;
        if (!text) continue;
        if (!needsDynamicTranslation(text)) continue;
        const trimmed = text.trim();
        if (!trimmed) continue;
        if (!nodeMap.has(trimmed)) {
            nodeMap.set(trimmed, []);
        }
        nodeMap.get(trimmed).push(node);
    }

    nodeMap.forEach((nodes, sourceText) => {
        translateTextDynamic(sourceText, lang).then(translated => {
            nodes.forEach(node => {
                storeOriginalTextNode(node);
                const original = node.nodeValue || '';
                const leading = original.match(/^\s*/)?.[0] || '';
                const trailing = original.match(/\s*$/)?.[0] || '';
                node.nodeValue = `${leading}${translated}${trailing}`;
            });
        });
    });
}

function translateDynamicAttributes(lang) {
    if (lang !== 'ur') return;
    const nodes = document.querySelectorAll('[placeholder], [title], [aria-label]');
    nodes.forEach(node => {
        ['placeholder', 'title', 'aria-label'].forEach(attr => {
            const value = node.getAttribute(attr);
            if (!value || !needsDynamicTranslation(value)) return;
            translateTextDynamic(value, lang).then(translated => {
                storeOriginalAttribute(node, attr);
                node.setAttribute(attr, translated);
            });
        });
    });
}

function storeOriginalTextNode(node) {
    if (node && node.__i18nOriginal === undefined) {
        node.__i18nOriginal = node.nodeValue;
    }
}

function storeOriginalElementText(node) {
    if (!node || !node.dataset) return;
    if (node.dataset.i18nOriginalText === undefined) {
        node.dataset.i18nOriginalText = node.textContent;
    }
}

const ATTRIBUTE_DATA_KEYS = {
    placeholder: 'i18nOriginalPlaceholder',
    title: 'i18nOriginalTitle',
    'aria-label': 'i18nOriginalAriaLabel'
};

function storeOriginalAttribute(node, attr) {
    if (!node || !node.dataset) return;
    const key = ATTRIBUTE_DATA_KEYS[attr];
    if (!key) return;
    if (node.dataset[key] === undefined) {
        node.dataset[key] = node.getAttribute(attr) || '';
    }
}

function restoreOriginalTexts() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.__i18nOriginal !== undefined) {
            node.nodeValue = node.__i18nOriginal;
        }
    }
}

function restoreElementTexts() {
    document.querySelectorAll('[data-i18n-original-text]').forEach(node => {
        node.textContent = node.dataset.i18nOriginalText;
    });
}

function restoreOriginalAttributes() {
    document.querySelectorAll('[data-i18n-original-placeholder]').forEach(node => {
        node.setAttribute('placeholder', node.dataset.i18nOriginalPlaceholder);
    });
    document.querySelectorAll('[data-i18n-original-title]').forEach(node => {
        node.setAttribute('title', node.dataset.i18nOriginalTitle);
    });
    document.querySelectorAll('[data-i18n-original-aria-label]').forEach(node => {
        node.setAttribute('aria-label', node.dataset.i18nOriginalAriaLabel);
    });
}

function formatDatesForLang(lang) {
    const datePattern = /\b\d{4}[-/]\d{2}[-/]\d{2}\b/g;
    const formatter = new Intl.DateTimeFormat(lang === 'ur' ? 'ur-PK' : 'en-US', { dateStyle: 'medium' });
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.nodeValue;
        if (!text || !datePattern.test(text)) {
            if (datePattern.lastIndex !== 0) datePattern.lastIndex = 0;
            continue;
        }
        node.nodeValue = text.replace(datePattern, match => {
            const normalized = match.replace(/\//g, '-');
            const date = new Date(normalized);
            if (Number.isNaN(date.getTime())) return match;
            return formatter.format(date);
        });
        datePattern.lastIndex = 0;
    }
}

function applyTranslations(langOverride) {
    const lang = langOverride || getSavedLanguage();
    const dict = translations[lang] || {};
    setDirection(lang);

    // Selector-based replacements
    Object.keys(dict).forEach(selector => {
        const value = dict[selector];
        const nodes = document.querySelectorAll(selector);
        nodes.forEach(node => {
            if (typeof value === 'string') {
                storeOriginalElementText(node);
                node.textContent = value;
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                // Attribute/placeholder map
                if (value.placeholder) {
                    storeOriginalAttribute(node, 'placeholder');
                    node.placeholder = value.placeholder;
                }
                // If it's a map keyed by existing text, translate matches
                if (!value.placeholder) {
                    const current = node.textContent.trim();
                    if (value[current]) {
                        storeOriginalElementText(node);
                        node.textContent = value[current];
                    }
                }
            }
        });
    });

    // Text-level replacements for elements without specific selectors
    if (lang === 'ur') {
        translateTextNodes(textTranslations);
        translateAttributes(placeholderTranslations);
        translateDynamicNodes(lang);
        translateDynamicAttributes(lang);
    } else {
        restoreElementTexts();
        restoreOriginalAttributes();
        restoreOriginalTexts();
    }

    formatNumbersForLang(lang);
    formatDatesForLang(lang);
}

// Initialize once per page
document.addEventListener('DOMContentLoaded', function() {
    const saved = getSavedLanguage();
    setDirection(saved);
    applyTranslations(saved);

    // Re-apply translations on DOM mutations (helps pages that inject content late)
    let mutationTimeout;
    const observer = new MutationObserver(() => {
        clearTimeout(mutationTimeout);
        mutationTimeout = setTimeout(() => applyTranslations(getSavedLanguage()), 120);
    });
    observer.observe(document.body, { childList: true, subtree: true });
});

// Expose globally
window.setLanguage = setLanguage;
window.applyTranslations = applyTranslations;
window.i18nInitialized = true;

