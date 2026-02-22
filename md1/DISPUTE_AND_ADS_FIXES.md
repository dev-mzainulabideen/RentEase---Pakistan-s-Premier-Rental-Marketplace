# Dispute and Ads System Fixes

## Issue 1: Booking ID Error Fixed ✅

### Problem
- Error: "Cast to ObjectId failed for value 'MR17676224861820039'"
- Users were entering booking numbers (like "MR17676224861820039") but backend was trying to use them as MongoDB ObjectIds

### Solution
- Updated `backend/controllers/disputesController.js` to:
  - Check if input is a valid MongoDB ObjectId
  - If not, search by `bookingNumber` field instead
  - Automatically convert booking number to booking ID for storage
  - Provide helpful error messages with test booking numbers

### Test Booking Numbers
You can use these test booking numbers when filing disputes:
- `MR17676224861820039`
- `MR17676224861820040`
- `MR17676224861820041`
- `MR17676224861820042`
- `MR17676224861820043`

**Note:** These are example booking numbers. Use actual booking numbers from your bookings, or create test bookings via the API.

## Issue 2: Ads System Improvements ✅

### Problems Fixed
1. **Free users not seeing ads** - Fixed logic that was preventing ad display
2. **Ad display timing** - Improved 2-minute rotation rule handling
3. **Ad placement** - Better positioning of banner ads on homepage
4. **Ad fallback** - Added fallback logic to show ads even if timing check fails

### Changes Made

#### Backend (`backend/services/adDisplayService.js`)
- ✅ Removed incorrect 48-hour account age check that was blocking ads
- ✅ Free users now always see ads (subject to 2-minute rotation rule)
- ✅ Improved ad query to prioritize ads targeting free users
- ✅ Added fallback to show any active ads if targeted ads not found
- ✅ Better error handling for AdDisplayLog model (optional)

#### Backend (`backend/controllers/adDisplayController.js`)
- ✅ Improved guest user ad display
- ✅ Added fallback ad fetching for free users
- ✅ Better date range filtering for ads

#### Frontend (`js/adComponent.js`)
- ✅ Improved ad initialization with better error handling
- ✅ Added debug logging for ad display checks
- ✅ Fallback ad display for free users even on errors
- ✅ Better banner ad placement (after hero section)

#### Frontend (`css/ads.css`)
- ✅ Improved banner container styling with flex layout
- ✅ Better spacing and gap between multiple ads

### How Ads Work Now

1. **Free Users:**
   - See ads every 2 minutes (rotation interval)
   - Ads displayed based on targeting rules
   - Banner ads on homepage
   - Sidebar ads on listing detail pages
   - Inline ads on search pages
   - Popup ads on confirmation pages

2. **Paid Users:**
   - No ads displayed (ad-free experience)

3. **Guest Users:**
   - See ads immediately
   - No rotation restrictions

### Ad Display Rules
- **Rotation Interval:** 2 minutes (120 seconds)
- **Max Ads Per Display:** 2 ads at once
- **Ad Priority:** Based on `displayRules.priority` field
- **Targeting:** Ads can target specific account types, categories, or all users

### Testing Ads

To test the ads system:

1. **Create Test Ads** (run seed script):
   ```bash
   node backend/scripts/seed-ads.js
   ```

2. **Check Ad Display:**
   - Login as a free user
   - Visit homepage - should see banner ads
   - Wait 2 minutes - ads should rotate
   - Check browser console for ad display logs

3. **Verify No Ads for Paid Users:**
   - Login as paid user
   - No ads should be displayed

### API Endpoints

- `GET /api/ad-display/ads?page=home` - Get ads for page
- `GET /api/ad-display/status` - Check ad display status (requires auth)

## Files Modified

1. `backend/controllers/disputesController.js` - Booking ID lookup fix
2. `backend/services/adDisplayService.js` - Ad display logic improvements
3. `backend/controllers/adDisplayController.js` - Ad fetching improvements
4. `js/adComponent.js` - Frontend ad display improvements
5. `css/ads.css` - Banner ad styling improvements
6. `disputes.html` - Added test booking number hints
7. `js/disputes.js` - Form field access fix (already done)
8. `backend/scripts/seed-ads.js` - New script to seed test ads

## Next Steps

1. **Run ad seed script** to create test ads:
   ```bash
   cd backend
   node scripts/seed-ads.js
   ```

2. **Test dispute creation** with booking numbers:
   - Use test booking numbers provided above
   - Or create actual bookings and use their booking numbers

3. **Verify ads display** for free users:
   - Login as free user
   - Check homepage for banner ads
   - Verify ads rotate every 2 minutes

