## Test Users and Roles

Use these ready-to-create accounts to exercise auth, profile, and role-based access. Change the emails if they already exist in your DB. Password for all below: `StrongPass123!`

### Roles and Permissions (frontend RBAC)
- **Renter**: can book, message, view booking history. Cannot create listings or access admin.
- **Owner**: can create/edit/delete listings, set pricing/availability, view earnings/reviews. Cannot book or access admin.
- **Dual Role**: can both rent and host; can switch active role in the header.
- **Moderator**: can message, handle reports/disputes (where exposed). No admin panel.
- **Admin**: full access, including admin panel.

### Create test accounts (run from `backend`)
```bash
# Renter (primary)
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Renter Test","email":"renter@test.com","mobile":"03001230001","password":"StrongPass123!","confirmPassword":"StrongPass123!","role":"renter"}'

# Renter (paid, for reviews / ad-free tests)
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Renter Paid","email":"renter.paid@test.com","mobile":"03001230006","password":"StrongPass123!","confirmPassword":"StrongPass123!","role":"renter","accountType":"paid"}'

# Owner
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Owner Test","email":"owner@test.com","mobile":"03001230002","password":"StrongPass123!","confirmPassword":"StrongPass123!","role":"owner"}'

# Dual Role
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Dual Test","email":"dual@test.com","mobile":"03001230003","password":"StrongPass123!","confirmPassword":"StrongPass123!","role":"dual_role"}'

# Moderator (platform-managed)
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Moderator Test","email":"moderator@test.com","mobile":"03001230004","password":"StrongPass123!","confirmPassword":"StrongPass123!","role":"moderator"}'

# Admin (platform-managed)
curl -X POST http://localhost:4001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin Test","email":"admin@test.com","mobile":"03001230005","password":"StrongPass123!","confirmPassword":"StrongPass123!","role":"admin"}'
```

### Login and profile check
```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"renter@test.com","password":"StrongPass123!"}'
# Repeat for each account; use returned token below.

curl http://localhost:4001/api/auth/me \
  -H "Authorization: Bearer <TOKEN_FROM_LOGIN>"
```

Expected per role:
- Renter: sees My Bookings; cannot access create-listing or admin.
- Owner: sees Create Listing/Host; My Bookings hidden; no admin.
- Dual: can switch role; both create-listing and bookings visible depending on active role.
- Moderator: admin panel hidden; can see messaging/report actions where exposed.
- Admin: admin panel visible; all features allowed.

If a request fails with “exists”, change the email/mobile and retry. If a page shows the wrong menus for a given role, log out, clear `localStorage` (mr-user, mr-token, mr-session), log in with the intended test user, and retry.

Email: review.test@myrental.test
Password: TestPass123!
Role: Renter
What was created:
Test renter account (review.test@myrental.test)
Test owner account (review.owner@myrental.test)
Test listing: "Review Test Listing - Cozy Apartment"
Completed booking: MRTEST0013
Check-in: December 7, 2025
Check-out: December 10, 2025
Status: completed (ready for review)
How to test the review flow\\\



Email: owner@example.com
Password: owner123
Role: owner
Account Type: paid (premium)
Verified: Yes



i200821@nu.edu.pk 
Z@!@!n5858

 Demo Mode: Use these test emails (any password):
admin@example.com → Admin
owner@example.com → Owner
renter@example.com → Renter
dual@example.com → Dual-Role
moderator@example.com → Moderator

Important owner functionalities still missing / partial
These are the realistic next steps to make Owner flow more “production-like”:
Richer Listing Editing
Currently: Owner can edit only basic fields (title, description, price, pricing model, instantBooking).
Missing:
Editing images (add/remove/update)
Editing location (city/address)
Editing amenities, category-specific fields (bedrooms, area, etc.)
Improvement: Extend PUT /api/listings/:id form/modal to allow editing these extra fields.
Availability / Calendar Management
Currently: Only basic availability flags (instantBooking, min/max duration) are set on create; no real calendar UI.
Missing:
Per-date unavailability, blackout dates
Owner blocking dates manually from an availability calendar
Improvement: Simple UI for “Block dates” which updates availability.unavailableDates.
Booking-level Details for Owners
Owner sees bookings list, but:
No deep booking detail drawer/page with:
Guest contact info (email/phone from booking)
Special requests / notes
Payment summary (rate, service fee, deposit, etc.)
Improvement: Add “View details” button (modal or detail page) for each booking.
Owner Earnings View
Backend ownerController.getStats calculates totals, but:
No earnings history / transactions list for the owner.
Improvement:
“Earnings” section: table of completed bookings with dates and amounts.
Messaging Integration (Owner side)
Owner can click Message from bookings, but:
Messaging page (messages.html) probably still renter-oriented and not showing which listing/booking the conversation is about.
Improvement:
Ensure messages.html reads listingId/bookingId query params and shows context (listing title, booking number).
Validation / UX polish on Owner Dashboard
Some areas rely on:
window.currentUserId
localStorage mr-user structure
Risk: If user storage changes shape, owner reviews/booking lists can break.
Improvement:
Centralize user ID/role reading in auth.js and use that helper everywhere.
Optional “Nice-to-have” (if you want to go further)
Owner profile settings (display name, avatar) editable from Owner Dashboard.
Filters/sorting in Owner “Bookings on my Listings” (by status, newest first, etc.).
Pagination for listings/bookings when data grows.
Notification badges (e.g., show count of pending bookings on Owner tab).
Recommended immediate next steps (concrete)
If you want to keep things focused and high value, I’d suggest:
Enhance listing editing
In my-listings.html / js/my-listings.js, expand the edit modal to support:
Location (city, address)
Basic amenities toggle
Wire to PUT /api/listings/:id (fields already partially handled).
Add booking “View details” modal for owners
In js/profile.js (Owner bookings section), add:
“View details” button → modal showing full booking info (dates, guests, price breakdown, special requests, contact).
If you tell me which of these you want first (e.g. “improve listing editing” or “add booking detail view”), I’ll implement it end-to-end next.