# Featured Listings Guide

## 🎯 How Featured Listings Work

Featured listings are special listings that appear prominently on the homepage (`index.html`) in the "Featured Listings" section. These listings get priority visibility and help showcase the best or most important listings on the platform.

---

## 📍 Where Featured Listings Appear

**Homepage Section**: `index.html` → "Featured Listings" section

The featured listings section automatically displays listings that have `featured: true` in the database.

---

## 🔧 How to Feature a Listing

### Method 1: Through Admin Panel (Recommended)

1. **Login as Admin**
   - Go to `admin/dashboard.html`
   - Login with admin credentials (`admin@example.com` / `admin123`)

2. **Navigate to Listings Management**
   - Click on "Listings Management" in the sidebar
   - Or go directly to `admin/listings.html`

3. **Find the Listing**
   - Use search/filter to find the listing you want to feature
   - Or browse through the listings table

4. **Toggle Featured Status**
   - Click the **star icon** (⭐) button in the Actions column
   - This toggles the `featured` status of the listing
   - A confirmation message will appear

5. **Verify**
   - The listing will now appear in the "Featured Listings" section on `index.html`
   - Featured listings have a "Featured" badge

### Method 2: Direct Database Update

You can also update the listing directly in MongoDB:

```javascript
// In MongoDB shell or using Mongoose
db.listings.updateOne(
  { _id: ObjectId("listing_id_here") },
  { $set: { featured: true } }
);
```

### Method 3: Through API (Programmatic)

```javascript
// Toggle featured status via API
const token = localStorage.getItem('mr-token'); // Admin token
const listingId = 'your_listing_id';

fetch(`http://localhost:4001/api/admin/listings/${listingId}/feature`, {
    method: 'PATCH',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
.then(res => res.json())
.then(data => {
    console.log('Featured status updated:', data);
});
```

---

## 🔍 How It Works Technically

### Backend Flow

1. **Listing Model** (`backend/models/Listing.js`)
   - Each listing has a `featured` field (Boolean, default: false)

2. **Admin Endpoint** (`backend/routes/admin.js`)
   - `PATCH /api/admin/listings/:id/feature` - Toggles featured status
   - Protected by `requireAdmin` middleware

3. **Listings API** (`backend/controllers/listingsController.js`)
   - Supports `featured=true` query parameter
   - Filters listings where `featured: true`

### Frontend Flow

1. **Homepage** (`index.html`)
   - Contains a "Featured Listings" section
   - Section ID: `featured-listings-section`

2. **JavaScript** (`js/home.js`)
   - `loadFeaturedListings()` function fetches featured listings
   - API call: `GET /api/listings?featured=true&status=active&limit=8&sort=newest`
   - Dynamically renders listing cards

3. **Display**
   - Shows up to 8 featured listings
   - Displays listing image, title, location, price, rating
   - Shows "Featured" badge on featured listings

---

## 📋 Requirements for Featured Listings

For a listing to appear in the featured section:

1. ✅ **Must be active**: `status: 'active'`
2. ✅ **Must be featured**: `featured: true`
3. ✅ **Should have images**: Better display with images
4. ✅ **Should be verified**: Recommended for trust

---

## 🎨 Visual Indicators

Featured listings have special visual indicators:

- **"Featured" Badge**: Pink badge with star icon
- **Priority Placement**: Appears in dedicated section on homepage
- **Better Visibility**: More prominent than regular listings

---

## 💡 Best Practices

1. **Feature Quality Listings**
   - Only feature listings with good images
   - Feature verified listings when possible
   - Feature listings with good ratings

2. **Limit Featured Listings**
   - Don't feature too many (recommended: 4-8)
   - Rotate featured listings periodically
   - Feature new or popular listings

3. **Regular Updates**
   - Update featured listings weekly/monthly
   - Remove featured status from inactive listings
   - Feature seasonal or trending listings

---

## 🔄 Current Implementation

### API Endpoint
```
GET /api/listings?featured=true&status=active&limit=8&sort=newest
```

### Admin Endpoint
```
PATCH /api/admin/listings/:id/feature
Headers: Authorization: Bearer <admin_token>
```

### Frontend Function
```javascript
// In js/home.js
loadFeaturedListings() // Automatically called on page load
```

---

## 📝 Example: Feature a Listing

1. **Admin Panel** → Listings Management
2. Find listing: "Luxury Apartment in Lahore"
3. Click star icon (⭐) in Actions column
4. Confirmation: "Featured status updated"
5. **Result**: Listing now appears in Featured Listings on homepage

---

## 🐛 Troubleshooting

### Featured listings not showing?

1. **Check listing status**
   - Must be `active` (not draft, paused, etc.)

2. **Check featured flag**
   - Verify `featured: true` in database

3. **Check API response**
   - Open browser console
   - Check Network tab for `/api/listings?featured=true`
   - Verify response contains listings

4. **Check frontend**
   - Ensure `js/home.js` is loaded
   - Check for JavaScript errors in console

### How to unfeature a listing?

- Same process: Click star icon again in admin panel
- Or set `featured: false` in database

---

## 📊 Featured Listings Statistics

You can check featured listings count:

```javascript
// In MongoDB
db.listings.countDocuments({ featured: true, status: 'active' });
```

---

**Last Updated**: 2024  
**Status**: ✅ Fully Implemented

