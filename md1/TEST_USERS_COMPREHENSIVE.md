# Comprehensive Test Users Guide

**Password for all test accounts:** `TestPass123!`

---

## 📋 Test User Matrix

### Free Accounts (6 users)

#### Free Renters (2)
- **free.renter1@test.com** | Phone: 03001234001
  - Role: Renter
  - Account Type: Free
  - Features: Can book items, see ads (48h), "Not Verified" badge, reviews hidden

- **free.renter2@test.com** | Phone: 03001234002
  - Role: Renter
  - Account Type: Free
  - Features: Can book items, see ads (48h), "Not Verified" badge, reviews hidden

#### Free Owners (2)
- **free.owner1@test.com** | Phone: 03001234003
  - Role: Owner
  - Account Type: Free
  - Features: Can create listings, see ads (48h), "Not Verified" badge, reviews hidden

- **free.owner2@test.com** | Phone: 03001234004
  - Role: Owner
  - Account Type: Free
  - Features: Can create listings, see ads (48h), "Not Verified" badge, reviews hidden

#### Free Dual Role (2)
- **free.dual1@test.com** | Phone: 03001234005
  - Role: Dual Role
  - Active Role: Renter
  - Account Type: Free
  - Features: Can rent and host, see ads (48h), "Not Verified" badge, reviews hidden

- **free.dual2@test.com** | Phone: 03001234006
  - Role: Dual Role
  - Active Role: Owner
  - Account Type: Free
  - Features: Can rent and host, see ads (48h), "Not Verified" badge, reviews hidden

---

### Paid Accounts (6 users)

#### Paid Renters (2)
- **paid.renter1@test.com** | Phone: 03001234007
  - Role: Renter
  - Account Type: Paid
  - Plan: monthly_pkr (Rs. 500/month)
  - Features: Can book items, NO ads, "Verified Customer" badge, reviews visible

- **paid.renter2@test.com** | Phone: 03001234008
  - Role: Renter
  - Account Type: Paid
  - Plan: monthly_usd ($7.99/month)
  - Features: Can book items, NO ads, "Verified Customer" badge, reviews visible

#### Paid Owners (2)
- **paid.owner1@test.com** | Phone: 03001234009
  - Role: Owner
  - Account Type: Paid
  - Plan: monthly_pkr (Rs. 500/month)
  - Features: Can create listings, NO ads, "Verified Customer" badge, listing promotion (30 days)

- **paid.owner2@test.com** | Phone: 03001234010
  - Role: Owner
  - Account Type: Paid
  - Plan: monthly_usd ($7.99/month)
  - Features: Can create listings, NO ads, "Verified Customer" badge, listing promotion (30 days)

#### Paid Dual Role (2)
- **paid.dual1@test.com** | Phone: 03001234011
  - Role: Dual Role
  - Active Role: Renter
  - Account Type: Paid
  - Plan: monthly_pkr (Rs. 500/month)
  - Features: Full features, NO ads, "Verified Customer" badge, reviews visible

- **paid.dual2@test.com** | Phone: 03001234012
  - Role: Dual Role
  - Active Role: Owner
  - Account Type: Paid
  - Plan: monthly_usd ($7.99/month)
  - Features: Full features, NO ads, "Verified Customer" badge, reviews visible

---

## 🚀 Creating Test Users

### Run the Script

```bash
cd backend
node scripts/create-comprehensive-test-users.js
```

The script will:
- ✅ Create all 12 test users (6 free + 6 paid)
- ✅ Update existing users if they already exist
- ✅ Set up proper subscriptions for paid accounts
- ✅ Configure ad settings for free accounts
- ✅ Set verification status correctly
- ✅ Display a comprehensive summary

---

## 🧪 Testing Scenarios

### 1. Account Type Features

#### Free Account Testing
1. Login with any free account (e.g., `free.renter1@test.com`)
2. Verify:
   - ✅ Ads are displayed (for 48 hours)
   - ✅ "Not Verified" badge shows
   - ✅ Reviews are hidden
   - ✅ Standard features available

#### Paid Account Testing
1. Login with any paid account (e.g., `paid.renter1@test.com`)
2. Verify:
   - ✅ NO ads displayed anywhere
   - ✅ "Verified Customer" badge shows
   - ✅ Reviews are visible
   - ✅ Premium features available

### 2. Role-Based Features

#### Renter Testing
1. Login with renter account (free or paid)
2. Verify:
   - ✅ Can view listings
   - ✅ Can make bookings
   - ✅ Can view booking history
   - ✅ Can message owners
   - ❌ Cannot create listings
   - ❌ Cannot access owner dashboard

#### Owner Testing
1. Login with owner account (free or paid)
2. Verify:
   - ✅ Can create listings
   - ✅ Can manage listings
   - ✅ Can view bookings on listings
   - ✅ Can view earnings (paid owners)
   - ❌ Cannot make bookings
   - ❌ Cannot access renter booking page

#### Dual Role Testing
1. Login with dual role account
2. Verify:
   - ✅ Can switch between renter/owner modes
   - ✅ Features change based on active role
   - ✅ Can both book and create listings

### 3. Subscription Testing

#### Paid Account Subscription
1. Login with paid account
2. Check subscription status:
   - ✅ Subscription active
   - ✅ End date is 30 days from creation
   - ✅ Auto-renewal enabled
   - ✅ Account type is 'paid'

#### Subscription Expiry (Simulation)
1. Manually expire a subscription in database
2. Verify:
   - ✅ Account downgrades to free
   - ✅ Ads start showing
   - ✅ Verification badge changes
   - ✅ Reviews become hidden

### 4. Ad Display Testing

#### Free Account Ads
1. Login with free account
2. Navigate through pages:
   - ✅ Home page: Banner ads
   - ✅ Listing detail: Sidebar ads
   - ✅ Search page: Inline ads
   - ✅ Last page: Popup ads
3. Verify ads rotate every 2 minutes
4. Verify ads stop after 48 hours

#### Paid Account Ads
1. Login with paid account
2. Navigate through all pages:
   - ✅ NO ads displayed anywhere
   - ✅ Clean interface

### 5. Verification Badge Testing

#### Free Account Badge
1. Login with free account
2. Check profile:
   - ✅ "Not Verified" badge
   - ✅ Gray/neutral styling

#### Paid Account Badge
1. Login with paid account
2. Check profile:
   - ✅ "Verified Customer" badge
   - ✅ Green/verified styling

### 6. Review System Testing

#### Free Account Reviews
1. Login with free account
2. Navigate to listing detail:
   - ✅ Reviews section hidden
   - ✅ Upgrade message shown (if applicable)

#### Paid Account Reviews
1. Login with paid account
2. Navigate to listing detail:
   - ✅ Reviews section visible
   - ✅ Can view reviews
   - ✅ Can leave reviews

---

## 📊 Test Coverage Matrix

| Account Type | Role | Ads | Verification | Reviews | Listing Promotion |
|-------------|------|-----|--------------|---------|-------------------|
| Free | Renter | ✅ (48h) | Not Verified | ❌ Hidden | ❌ No |
| Free | Owner | ✅ (48h) | Not Verified | ❌ Hidden | ❌ No |
| Free | Dual | ✅ (48h) | Not Verified | ❌ Hidden | ❌ No |
| Paid | Renter | ❌ No | Verified | ✅ Visible | N/A |
| Paid | Owner | ❌ No | Verified | ✅ Visible | ✅ 30 days |
| Paid | Dual | ❌ No | Verified | ✅ Visible | ✅ 30 days |

---

## 🔧 Manual Testing Commands

### Check User Account Type
```bash
# Login and get token
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"free.renter1@test.com","password":"TestPass123!"}'

# Check account info
curl http://localhost:4001/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

### Check Subscription Status
```bash
curl http://localhost:4001/api/subscriptions/status \
  -H "Authorization: Bearer <TOKEN>"
```

### Check Ad Display Status
```bash
curl "http://localhost:4001/api/ad-display/ads?page=home" \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 📝 Notes

- All test users use the same password: `TestPass123!`
- Free accounts have ads enabled for 48 hours from creation
- Paid accounts have 30-day subscriptions
- All accounts are properly configured with correct roles and account types
- The script can be run multiple times (updates existing users)

---

**Last Updated:** Current  
**Total Test Users:** 12 (6 Free + 6 Paid)  
**Script:** `backend/scripts/create-comprehensive-test-users.js`

