# Admin Review Control Guide

## ✅ Implementation Complete

Reviews on `index.html` are now controlled by admin. Reviews must be approved before they appear on the homepage.

---

## 🔄 How It Works

### 1. Review Creation
- When a user submits a review, it's created with `status: 'pending'`
- **Previously**: Reviews were auto-approved (`status: 'approved'`)
- **Now**: Reviews require admin approval

### 2. Admin Approval Process
- Admin can view all reviews (pending, approved, rejected)
- Admin can approve or reject reviews
- Only **approved** reviews appear on `index.html`

### 3. Frontend Display
- `index.html` only fetches reviews with `status: 'approved'`
- API: `GET /api/reviews?status=approved&limit=100&sort=newest`
- All approved reviews are displayed (no limit)

---

## 🔧 Admin Endpoints

### Get All Reviews
```
GET /api/admin/reviews
Query Parameters:
  - status: 'pending' | 'approved' | 'rejected' | 'hidden' (optional)
  - limit: number (default: 50)
  - page: number (default: 1)
  - sort: sort order (default: '-createdAt')
```

**Response:**
```json
{
  "status": "success",
  "reviews": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 50,
    "pages": 2
  }
}
```

### Approve/Reject Review
```
PATCH /api/admin/reviews/:id/status
Headers: Authorization: Bearer <admin_token>
Body:
{
  "status": "approved" | "rejected" | "hidden" | "pending",
  "moderationNotes": "Optional notes" (optional)
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Review approved successfully",
  "review": { ... }
}
```

---

## 📋 Review Statuses

- **pending**: New review, awaiting admin approval
- **approved**: Approved by admin, visible on homepage
- **rejected**: Rejected by admin, not visible
- **hidden**: Hidden by admin, not visible

---

## 🎯 How to Approve Reviews

### Method 1: Via API (Programmatic)
```javascript
const token = localStorage.getItem('mr-token'); // Admin token
const reviewId = 'review_id_here';

fetch(`http://localhost:4001/api/admin/reviews/${reviewId}/status`, {
    method: 'PATCH',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        status: 'approved',
        moderationNotes: 'Looks good!'
    })
})
.then(res => res.json())
.then(data => console.log('Review approved:', data));
```

### Method 2: Via Admin Panel (Recommended)
1. Login as admin (`admin@example.com` / `admin123`)
2. Go to Admin Panel
3. Navigate to "Reviews Management" (if page exists)
4. View pending reviews
5. Click "Approve" or "Reject"

**Note**: Admin reviews page can be created at `admin/reviews.html` (optional)

---

## 🔍 Public API Changes

### Before
- `GET /api/reviews` returned all reviews (no status filter)

### After
- `GET /api/reviews` returns only **approved** reviews by default
- To get all reviews (admin only), use: `GET /api/admin/reviews`

---

## 📊 Statistics

- Only **approved** reviews count toward listing statistics
- Listing `stats.totalReviews` and `stats.averageRating` only include approved reviews
- When a review is approved, listing stats are automatically updated

---

## 🛡️ Security

- Only admins can approve/reject reviews
- Public API only shows approved reviews
- Admin endpoints require `requireAdmin` middleware

---

## 📝 Files Modified

1. **`backend/controllers/reviewsController.js`**
   - Changed review creation: `status: 'pending'` (was `'approved'`)
   - Updated `list()` to filter by `status: 'approved'` by default
   - Updated `updateListingStats()` to only count approved reviews

2. **`backend/controllers/adminController.js`**
   - Added `getReviews()` - Get all reviews with filters
   - Added `updateReviewStatus()` - Approve/reject reviews

3. **`backend/routes/admin.js`**
   - Added `GET /api/admin/reviews`
   - Added `PATCH /api/admin/reviews/:id/status`

4. **`js/home.js`**
   - Already filters by `status: 'approved'` ✅

5. **`css/index-sections-improvements.css`**
   - Fixed container overflow for "How It Works" section ✅

---

## ✅ Testing

### Test Review Approval Flow

1. **Create a review** (as regular user)
   ```bash
   POST /api/reviews
   Body: { "bookingId": "...", "rating": 5, "comment": "Great!" }
   ```
   - Review will have `status: 'pending'`
   - Will NOT appear on `index.html`

2. **Approve review** (as admin)
   ```bash
   PATCH /api/admin/reviews/:id/status
   Body: { "status": "approved" }
   ```
   - Review will have `status: 'approved'`
   - Will NOW appear on `index.html`

3. **Verify on homepage**
   - Go to `index.html`
   - Check "What Our Users Say" section
   - Approved review should be visible

---

## 🎯 Quick Summary

- ✅ Reviews default to `pending` status
- ✅ Only `approved` reviews show on `index.html`
- ✅ Admin can approve/reject reviews via API
- ✅ Listing stats only count approved reviews
- ✅ Public API only returns approved reviews

**Status**: ✅ Fully Implemented

