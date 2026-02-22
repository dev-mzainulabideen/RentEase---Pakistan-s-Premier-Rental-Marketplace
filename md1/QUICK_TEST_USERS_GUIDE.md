# Quick Test Users Guide

## 🚀 Quick Start

### Create All Test Users

```bash
cd backend
node scripts/create-comprehensive-test-users.js
```

**Password for all accounts:** `TestPass123!`

---

## 📋 Quick Reference

### Free Accounts (6 users)

| Email | Role | Phone |
|-------|------|-------|
| free.renter1@test.com | Renter | 03001234001 |
| free.renter2@test.com | Renter | 03001234002 |
| free.owner1@test.com | Owner | 03001234003 |
| free.owner2@test.com | Owner | 03001234004 |
| free.dual1@test.com | Dual Role | 03001234005 |
| free.dual2@test.com | Dual Role | 03001234006 |

**Features:** Ads (48h), Not Verified, Reviews Hidden

---

### Paid Accounts (6 users)

| Email | Role | Plan | Phone |
|-------|------|------|-------|
| paid.renter1@test.com | Renter | PKR | 03001234007 |
| paid.renter2@test.com | Renter | USD | 03001234008 |
| paid.owner1@test.com | Owner | PKR | 03001234009 |
| paid.owner2@test.com | Owner | USD | 03001234010 |
| paid.dual1@test.com | Dual Role | PKR | 03001234011 |
| paid.dual2@test.com | Dual Role | USD | 03001234012 |

**Features:** No Ads, Verified Customer, Reviews Visible, Listing Promotion

---

## ✅ What to Test

### Free vs Paid
- [ ] Ads display for free accounts only
- [ ] Verification badges differ
- [ ] Reviews visible for paid only
- [ ] Listing promotion for paid owners

### Roles
- [ ] Renters can book but not create listings
- [ ] Owners can create listings but not book
- [ ] Dual role can switch modes

### Subscriptions
- [ ] Paid accounts have active subscriptions
- [ ] Subscription expiry downgrades to free
- [ ] Account type changes correctly

---

**Full Guide:** See `TEST_USERS_COMPREHENSIVE.md`

