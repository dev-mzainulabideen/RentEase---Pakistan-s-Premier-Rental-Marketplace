# Renter Role – Full Implementation Plan

This plan covers frontend, backend (Express), MongoDB, and integrations to make the Renter experience complete and role-aware.

## 1) Signup (Renter-specific)
- **Form (frontend)**: fields `name`, `email`, `mobile`, `password`, `confirmPassword`, hidden `role="renter"`. Disable submit while posting; show inline errors.
- **Frontend validation**:
  - Email regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
  - PK phone: `^(\+92|0)?[0-9]{10}$`
  - Password: min 8, confirm match
  - Show specific error messages; block submit on errors.
- **Request (frontend → backend)**: POST `/api/auth/register`
  ```json
  {
    "name": "Renter Name",
    "email": "renter@example.com",
    "mobile": "03001234567",
    "password": "StrongPass123!",
    "confirmPassword": "StrongPass123!",
    "role": "renter"
  }
  ```
- **Backend validation (controller)**:
  - Require `name, email, password, confirmPassword`; `mobile` optional but if present must match PK regex.
  - Password length ≥ 8; passwords must match.
  - Email regex as above.
- **Uniqueness check (Mongo)**: `findOne({ $or: [ { email }, { phone: mobileCleaned } ] })`; if exists → 400 “User with this email or mobile already exists”.
- **Persist**:
  - Normalize: `email.toLowerCase()`, `phone` cleaned, `role='renter'`, `accountType='free'`.
  - Hash password (bcrypt pre-save).
  - Save `verified.email=false`, `verified.phone=false` initially.
- **Verification flows**:
  - Email: generate token (e.g., JWT with purpose=verify_email, exp 24h); store token hash or reuse JWT secret; send mail with link `/api/auth/verify-email/:token`. Endpoint sets `verified.email=true`.
  - Mobile: generate 6-digit OTP, store hashed with TTL (e.g., in `Verification` collection or Redis), send SMS via JazzCash/Easypaisa gateway or Twilio; verify at `/api/auth/verify-otp` (fields: mobile, otp); on success set `verified.phone=true`.
- **Response (success)**:
  ```json
  {
    "status": "success",
    "token": "<jwt>",
    "user": { ...safeUser, role: "renter", accountType: "free", verified: false }
  }
  ```
- **Frontend on success**:
  - Store JWT `mr-token`, user `mr-user`, session expiry `mr-session`.
  - Redirect to renter home/dashboard (or `redirectAfterLogin` if set).
  - Show “verify your email/phone” prompt if not verified.

## 2) Login
- **Inputs**: email or mobile + password.
- **API**: POST `/api/auth/login` → returns JWT + user object.
- **Session**: store JWT in `localStorage['mr-token']`, user in `mr-user`, session expiry in `mr-session`.
- **Redirect**: renter dashboard/home. If `redirectAfterLogin` is set, honor it.
- **Errors**: show invalid credentials, inactive/unverified messages.
- **Guard**: `auth.js` keeps session and exposes `isLoggedIn`, `getCurrentRole`.

## 3) Profile
- **Fetch**: GET `/api/auth/me` with Bearer JWT; no hardcoded values.
- **Display**: name, email, mobile, verification badges, accountType (free/paid), createdAt, profile completion %.
- **Update**: PUT `/api/profile` (renter) to update name, phone, bio, location, prefs; backend validates and saves.
- **Account type**: show paid/free badge; hide ads if paid.

## 4) Dashboard & Core Flows
- **Discovery/Search**:
  - GET `/api/listings?query=&category=&priceMin=&priceMax=&city=&availableFrom=...`
  - Filters: category, price, location, availability, keywords.
- **Booking**:
  - POST `/api/bookings` with listingId, dates, guests/qty; support instant vs request.
  - Booking states: pending → confirmed/declined/cancelled.
  - Show confirmations, reminders, cancellations on renter dashboard.
- **Payments**:
  - Integrate JazzCash/Easypaisa/cards (via gateway SDK); store payment intent/transaction in `payments` collection.
- **Reviews**:
  - POST `/api/reviews` after completed booking; rating + comment; one per booking per renter.
- **Messaging**:
  - Conversations/messages collections; renter can message listing owner from listing detail or bookings.
- **Ads**:
  - If `accountType=free`, display ads; hide for paid.

## 5) Database & Linking
- Collections already present: `users` (role=renter), `listings`, `bookings`, `reviews`, `payments`, `messages`, `conversations`.
- Ensure bookings link renter -> owner -> listing; reviews link renter -> owner/listing -> booking; payments link booking -> user.
- CRUD: renter can read listings, create bookings, create reviews, create messages; cannot create listings.

## 6) Trust, Safety, Language
- Show safety guidelines per category on listing detail and booking flow.
- Add emergency contact banner on renter dashboard/booking pages.
- Urdu support: ensure i18n keys exist for renter-facing strings; toggle language persists.

## 7) Error Handling & Validation
- No placeholders; render API data.
- Frontend handles API errors (validation, 400/401/403/500) with user-friendly messages.
- Backend: validate payloads, return structured errors; log server errors.

## 8) Role-Based Access (Renter)
- Navigation: show My Bookings, hide Create Listing/Host, hide Admin.
- Guards:
  - `my-bookings.html`: require `viewBookingHistory`.
  - Booking actions: require `book`.
  - Messaging: require `message`.
  - Admin pages: require `adminAccess` (denied for renter).
  - Create listing: require `createListing` (denied for renter).
- Listing detail: booking restricted to renters; messaging allowed if permission; reviews allowed post-booking.

## 9) Implementation Steps (priority)
1) Backend
   - Add email/OTP verification endpoints.
   - Add renter profile update endpoint (`PUT /api/profile`).
   - Add bookings controller/routes with status flow; payments integration stub.
   - Add reviews controller/routes with booking-check guard.
   - Add messaging controller/routes.
2) Frontend
   - Signup/login forms already wired: enforce `role: renter` on signup.
   - Profile page: consume `/api/auth/me`; implement save via `/api/profile`.
   - My bookings page: fetch `/api/bookings?role=renter`; show statuses, cancel/confirm actions.
   - Listing detail: book flow → POST `/api/bookings`; message flow → conversations.
   - Header/nav: keep renter-only visibility; ensure guards on restricted pages.
   - Ads toggle based on `accountType`.
3) QA
   - Use test users from `TEST_USERS_AND_ROLES.md` (renter account).
   - Verify access blocks: create-listing, admin pages, host links.
   - Verify profile shows real renter data; no placeholders.
   - Verify bookings/reviews/messaging flows with sample data.

