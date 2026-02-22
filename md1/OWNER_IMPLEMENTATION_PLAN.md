# Owner / Lender (Host) – Implementation Plan

> This document describes the complete plan for implementing **Owner / Lender (Host)** functionality across the existing renter-focused marketplace.  
> It is parallel to `RENTER_IMPLEMENTATION_PLAN.md` and should be read together with it.

---

## 1. Role Overview


- **Role Name**: `owner` (a.k.a. Host / Lender)
- **Primary Goal**: Allow users to **list assets**, **manage availability & pricing**, **approve bookings**, **get paid**, and **build trust** with renters.
- **Shared Systems**:
  - Auth (`auth.js`, `backend/controllers/authController.js`, `backend/models/User.js`)
  - RBAC (`js/rbac.js`)
  - Payments (`payments` collection and payment gateway integration)
  - Messaging (`messages.html`, conversations/messages collections)
  - Reviews & Ratings
  - Trust, Safety, Localization (Urdu/EN)

---

## 2. High-Level Flows

1. **Onboarding as Host**
   - User logs in as renter → clicks **“Become a Host”** in header/hero.
   - System:
     - Checks current role (`guest` / `renter` / `owner` / `dual_role`).
     - If not yet owner, updates role (e.g. to `dual_role`) and redirects to host onboarding / `create-listing.html`.
   - User completes **host profile** & **first listing**.

2. **Listing Management**
   - Create → Edit → Publish / Pause / Delete listings.
   - Manage pricing, availability, safety notes, and rules per listing.

3. **Booking Management (Host Side)**
   - Receive booking requests for own listings.
   - Accept / decline / cancel; see calendar of upcoming stays.

4. **Messaging**
   - Respond to pre-booking questions.
   - Coordinate with renters for confirmed bookings.

5. **Earnings & Payouts**
   - View earnings per listing and per time period.
   - Configure payout methods (JazzCash/Easypaisa/bank).

6. **Reviews & Reputation**
   - See reviews renters leave about listings/host.
   - Display ratings and verification badges on profile and listings.

---

## 3. Pages & UI Changes

### 3.1 Global Header & Navigation

**Files**:  
- `components/header.html`  
- `css/header.css`, `css/responsive.css`  
- `js/header.js`, `js/rbac.js`, `js/auth.js`

**Requirements**

- **Desktop Header**:
  - Left: Logo + main nav (`Home`, `Categories`, `Become a Host`).
  - Right: Language toggle, profile avatar, **Log out** button.
  - “Become a Host”:
    - Visible to users with permission `createListing` (or always visible and enforced by redirect).
    - On click:
      - If not logged in → redirect to `login.html` with return URL.
      - If logged in but not host → trigger host onboarding (see §4.1).
      - If already host → go to `my-listings.html`.

- **User Dropdown (Avatar)**:
  - Sections:
    - **Account**: `Profile`, `Verification`, `Settings`.
    - **Host Actions** (if `hasPermission('createListing')`):
      - `My Listings`, `My Bookings (Host)`, `Earnings` (future).
    - **Renter Actions**:
      - `My Bookings (Renter)`, `Messages`.
    - **Admin** (if permitted): `Admin Panel`.
    - **Support**: `Help & Support`.
    - **Log out**.

- **Mobile Header / Hamburger Menu**:
  - Ensure `#mobile-menu` shows full navigation:
    - `Home`, `Search`, `Categories`, `Become a Host`
    - `My Profile`, `My Listings`, `My Bookings`, `Messages`
    - `Log in`, `Sign up` (conditionally).
  - Controlled via `toggleMobileMenu()` in `js/header.js`.

**RBAC Integration**

- Use `data-require` attributes on host-only links:
  - `data-require="createListing"` for `Become a Host`, `My Listings`, host booking views.
- Ensure `updateNavigationForAuth()` in `js/header.js` and logic in `js/rbac.js`:
  - Shows/hides host links based on `hasPermission('createListing')`.

---

### 3.2 Host Onboarding & Profile

**Files**:  
- `profile.html` (extend)  
- `js/profile.js`  
- `backend/models/User.js`  
- `backend/controllers/profileController.js`

**User Stories**

- As a user, after I click **“Become a Host”**, I should:
  - Provide my phone, address, and identity info (optional KYC).
  - Set default city, language, and timezone for my listings.
  - Provide payout information (later phase).

**UI / Sections in `profile.html`**

- **Host Settings Tab**:
  - Host status: `Not a host yet` / `Active Host`.
  - Basic host details:
    - Display name (public).
    - Default city / region.
    - Short host bio.
  - Host preferences:
    - Default cancellation policy.
    - Minimum notice for bookings.
    - Auto-accept (instant book) toggle.
  - Payout setup (phase 4): JazzCash/Easypaisa/bank details.

**Backend**

- Extend `User` schema:
  - `hostProfile`:
    - `isHost` (boolean)
    - `displayName`
    - `defaultCity`
    - `bio`
    - `payoutMethod` (enum)
    - `payoutDetails` (nested fields)
    - `hostStats` (see §3.7)
- Endpoints (protected by `auth` middleware):
  - `GET /api/profile/host` – return host-specific profile.
  - `PUT /api/profile/host` – update host profile & preferences.

---

### 3.3 Listing Management

**Files**:  
- `create-listing.html`  
- `my-listings.html` (NEW page)  
- `listing-detail.html` (already exists; ensure owner data is attached)  
- `js/create-listing.js`, `js/my-listings.js` (NEW)  
- `backend/models/Listing.js`  
- `backend/controllers/listingController.js`  
- `backend/routes/listings.js`

**Data Model (`Listing`)**

- Fields to ensure:
  - `ownerId` (ObjectId → `User`)
  - `title`, `description`, `category`, `subCategory`
  - `photos[]` (URLs)
  - `location` (city, address, coordinates optional)
  - `pricing`:
    - `basePrice`
    - `currency`
    - `cleaningFee` (optional)
    - `securityDeposit` (optional)
    - `discounts` (weekly/monthly)
  - `availability`:
    - `calendar` (dates blocked/available) **or** simple rules (always available).
  - `safetyNotes`, `houseRules`
  - `status`: `draft | pending | active | paused | rejected`

**API Endpoints**

- `GET /api/listings?ownerId=me` – list host’s own listings.
- `POST /api/listings` – create listing.
- `GET /api/listings/:id` – fetch for editing.
- `PUT /api/listings/:id` – update listing.
- `PATCH /api/listings/:id/status` – update status (publish/pause/archive).
- `DELETE /api/listings/:id` – soft delete.

**UI – `create-listing.html`**

- Multi-step wizard:
  1. **Basics**: category, title, description.
  2. **Location**: city, address, map (later).
  3. **Photos**: upload & preview.
  4. **Pricing**: nightly/daily rate, discounts, fees.
  5. **Availability & Safety**: availability, house rules, safety notes.
  6. **Review & Publish**: summary + “Save as Draft” / “Publish”.
- Client-side validation:
  - Required fields per step.
  - Simple price validations (positive numbers).

**UI – `my-listings.html`**

- Table or cards:
  - Thumbnail, title, city.
  - Status badge (Draft, Active, Paused, Pending).
  - Price per night / day.
  - Rating & reviews count.
- Actions per listing:
  - Edit.
  - View on site (opens `listing-detail.html`).
  - Toggle Active/Paused.
  - Duplicate (optional).
  - Delete.

---

### 3.4 Booking Management (Host View)

**Files**:  
- `my-bookings.html` (extend existing renter view)  
- `js/my-bookings.js`  
- `backend/models/Booking.js`  
- `backend/controllers/bookingController.js`

**User Stories**

- As a host, I want to:
  - See all booking requests for my listings.
  - Approve or decline `pending` requests.
  - See upcoming confirmed stays and past stays.

**API**

- `GET /api/bookings?ownerId=me` – bookings where listing belongs to current user.
- `PATCH /api/bookings/:id/status` – host updates status to:
  - `confirmed`, `declined`, `cancelled_by_owner`.

**UI – `my-bookings.html`**

- Tabs or toggle:
  - **As Renter** (existing).
  - **As Host** (NEW).
- Host tab:
  - Filters: `status`, `listing`, `dateRange`.
  - Booking cards:
    - Renter name.
    - Listing title & image.
    - Dates, guests.
    - Price summary.
  - Buttons:
    - `Accept`, `Decline` for `pending`.
    - `View conversation`.
    - `View details` (opens booking drawer/modal).

---

### 3.5 Messaging (Host–Renter)

**Files**:  
- `messages.html`  
- `js/messages.js`  
- `backend/models/Conversation.js`, `backend/models/Message.js`  
- `backend/controllers/messageController.js`

**User Stories**

- Hosts can:
  - Receive and reply to messages initiated from:
    - `listing-detail.html` (“Contact Host”).
    - `my-bookings.html` (host or renter side).

**API**

- `GET /api/conversations?ownerId=me`
- `GET /api/messages?conversationId=...`
- `POST /api/messages` – send new message.

**UI – `messages.html`**

- Sidebar:
  - Conversations grouped by listing.
  - Badge for unread messages.
  - Role indicator (Host / Renter).
- Message thread:
  - Bubble layout.
  - Show who (you vs them), timestamp.
  - Input box with send button.

---

### 3.6 Earnings & Payouts (Phase 2–3)

**Files** (planned):  
- `host-earnings.html` (NEW)  
- `profile.html` – “Payout Settings” section  
- `backend/models/Payment.js`, `backend/controllers/paymentController.js`

**Data Model (`Payment`)**

- Fields:
  - `bookingId`
  - `renterId`
  - `ownerId`
  - `amountTotal`
  - `ownerShare`
  - `platformFee`
  - `status` (`pending`, `captured`, `refunded`, etc.)
  - `method` (`jazzcash`, `easypaisa`, `card`)

**API**

- `GET /api/earnings?ownerId=me` – total & per-listing aggregates.
- `GET /api/payouts?ownerId=me` – upcoming/completed payouts.
- `PUT /api/profile/payouts` – set payout destination.

**UI – `host-earnings.html`**

- Overview:
  - Total earned.
  - Upcoming payout amount + date.
  - Filters by listing and month.
- Table:
  - Date, listing, booking ID, amount, status.

---

### 3.7 Reviews & Reputation

**Files**:  
- `listing-detail.html`  
- `my-listings.html`  
- `profile.html`  
- `backend/models/Review.js`, `backend/controllers/reviewController.js`

**User Stories**

- As a host, I want:
  - My listings to show ratings & reviews from renters.
  - A summary of my host rating on my profile and in the header dropdown.

**API**

- `GET /api/reviews?listingId=...`
- `GET /api/reviews?ownerId=...`
- `POST /api/reviews` – one per completed booking from renter.

**Host Stats**

- Extend `User.hostStats`:
  - `avgRating`, `reviewCount`
  - `responseRate`
  - `responseTime`
  - `cancellationRate`
- Display in:
  - `profile.html` – host summary section.
  - `listing-detail.html` – “Hosted by …” card.

---

### 3.8 Trust, Safety & Verification

**Files**:  
- `verification.html`  
- `listing-detail.html`  
- `booking.html`  
- `backend/controllers/verificationController.js` (planned)

**Features**

- Show **safety guidelines** per category on `listing-detail.html` and `booking.html`.
- Host verification:
  - ID verification (manual or placeholder for now).
  - Verified phone and email.
- Badges:
  - `Verified Host`, `Super Host` (rules based on stats).

---

## 4. RBAC & Roles

**Files**:  
- `js/auth.js`, `js/rbac.js`  
- `backend/models/User.js`

**Roles**

- `guest` – not logged in.
- `renter` – renter-only.
- `owner` – host-only.
- `dual_role` – both renter and host.
- `admin`, `moderator` – platform roles.

**Key Permissions for Host**

- `createListing`
- `manageOwnListings`
- `manageOwnBookingsAsOwner`
- `viewBookingHistory`
- `viewEarnings`

**Client-Side Enforcement**

- `data-require="createListing"` on:
  - `create-listing.html` button, “My Listings”, host tabs in bookings.
- `js/rbac.js` functions:
  - `restrictElement`, `showIfPermitted`, etc., to hide host-only UI.

---

## 5. Implementation Phases & Checklists

### Phase 1 – RBAC & Header

- [ ] Verify `ROLES` and `PERMISSIONS` include host-specific permissions.
- [ ] Ensure header + mobile menu are consistent across **all pages**.
- [ ] Wire “Become a Host” CTA:
  - [ ] If not logged in → `login.html?next=create-listing.html`.
  - [ ] If logged in → ensure role includes host permission; redirect to host onboarding or `create-listing.html`.

### Phase 2 – Listing CRUD

- [ ] Implement backend `Listing` model & controller.
- [ ] Build `create-listing.html` wizard with API integration.
- [ ] Create `my-listings.html` with actions & host filters.
- [ ] Integrate RBAC checks for create/edit/publish.

### Phase 3 – Host Bookings & Messaging

- [ ] Extend bookings API with `ownerId` filtering and status changes.
- [ ] Add “As Host” tab to `my-bookings.html`.
- [ ] Ensure `messages.html` lists conversations where user is owner.
- [ ] Add entry points: from listing detail & bookings.

### Phase 4 – Earnings & Payouts

- [ ] Extend `Payment` model for owner share and payout status.
- [ ] Implement `host-earnings.html` with basic charts/tables.
- [ ] Add payout settings to `profile.html`.

### Phase 5 – Reviews, Trust & Safety

- [ ] Integrate reviews on `listing-detail.html` and `profile.html`.
- [ ] Compute host stats and expose via `/api/auth/me` / profile.
- [ ] Show verification and safety guidelines on host UI.

---

## 6. Testing Scenarios

1. **Host Onboarding**
   - New user registers as renter → clicks “Become a Host” → guided to create first listing.
2. **Create & Publish Listing**
   - Host fills all steps in `create-listing.html` → listing appears in `my-listings.html` as Active.
3. **Renter Booking → Host Accept**
   - Renter books listing.
   - Host sees `pending` booking in “As Host” tab, accepts it.
4. **Messaging**
   - Renter sends message from listing detail.
   - Host replies from `messages.html`.
5. **Payment & Review (happy path)**
   - After stay completed, payment recorded and renter leaves review.
   - Review visible on `listing-detail.html` and contributes to host rating.

This plan should be kept in sync with `RENTER_IMPLEMENTATION_PLAN.md` as you build out both sides of the marketplace.  
Use it as a checklist when implementing Owner / Lender features end-to-end.


