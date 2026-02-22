# Featured Listings - Quick Guide

## 🎯 How to Feature a Listing on Index.html

### Step-by-Step Instructions

1. **Login as Admin**
   ```
   Email: admin@example.com
   Password: admin123
   ```

2. **Go to Admin Panel**
   - Navigate to: `admin/listings.html`
   - Or click "Admin Panel" → "Listings Management"

3. **Find the Listing**
   - Use search bar to find the listing
   - Or browse through the table

4. **Click the Star Icon (⭐)**
   - In the "Actions" column
   - Click the star button
   - Confirmation: "Featured status updated"

5. **Verify on Homepage**
   - Go to `index.html`
   - Check "Featured Listings" section
   - Your listing should appear there

---

## ✅ Requirements

For a listing to appear in Featured Listings:

- ✅ `status: 'active'` (must be active)
- ✅ `featured: true` (must be featured)
- ✅ Has images (recommended)
- ✅ Verified (recommended)

---

## 🔄 How It Works

1. **Backend**: Listing has `featured: true` field
2. **API**: `GET /api/listings?featured=true` returns featured listings
3. **Frontend**: `index.html` calls `loadFeaturedListings()` on page load
4. **Display**: Shows up to 8 featured listings with images, prices, ratings

---

## 📝 API Endpoint

```
GET /api/admin/listings/:id/feature
Method: PATCH
Headers: Authorization: Bearer <admin_token>
```

This toggles the `featured` status of a listing.

---

**Quick Tip**: Only feature high-quality listings with good images and ratings for best results!

