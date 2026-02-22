# Admin Role – Implementation Plan

> This plan describes the **platform Admin** role: managing users, listings, bookings,
> payments, and overall trust/safety. It assumes an Express + MongoDB backend and
> the existing front-end pages (`admin/dashboard.html`, etc.).

---

## 1. Role Overview

- **Role name**: `admin`
- **Purpose**:
  - Monitor and moderate marketplace activity.
  - Resolve disputes between renters and owners.
  - Manage categories, system settings, and featured content.
  - View analytics and operational metrics.

---

## 2. Data Model & RBAC

**Files**:
- `backend/models/User.js`
- `backend/controllers/authController.js`
- `js/auth.js`, `js/rbac.js`

### 2.1 User Schema

- Ensure `role` allows value `'admin'`.
- Optionally, support:
  ```js
  roles: [{ type: String }]; // for multi-role (admin + moderator)
  ```
  but for now a single `role` field is enough.

### 2.2 Permissions

Define admin permissions in `js/rbac.js` and backend middleware:

- `adminAccess` – can open admin dashboard and APIs.
- `manageUsers` – block/unblock users, change roles.
- `manageListings` – approve/reject listings, feature/unfeature.
- `manageBookings` – override booking states.
- `managePayments` – adjust/refund payments (if implemented).
- `viewReports` – see dashboards and analytics.

### 2.3 Backend Middleware

- Create `requireRole('admin')` or `requirePermission('adminAccess')`:
  ```js
  function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  }
  ```
- Apply on admin routes.

---

## 3. Admin Dashboard & Navigation

**Files**:
- `admin/dashboard.html`
- `admin/users.html`
- (optional) `admin/listings.html`, `admin/bookings.html`, `admin/reports.html`
- `css/admin.css`, `js/admin-dashboard.js`

### 3.1 Access

- Add **Admin Panel** link to user dropdown in global header:
  - `data-require="adminAccess"`.
  - Visible only for admins (handled by `rbac.js`).

### 3.2 Dashboard Overview (`admin/dashboard.html`)

Widgets:

- **KPI cards**:
  - Total users.
  - Active listings.
  - Bookings (last 30 days).
  - Revenue (if payment data is available).
- **Charts** (optional):
  - Bookings by day.
  - Listings by category.
- **Tables**:
  - Latest users.
  - Latest listings/booking requests.

Backend:

- `GET /api/admin/stats` – return aggregated metrics.

---

## 4. User Management

**Files**:
- `admin/users.html`
- `js/admin-users.js`
- `backend/controllers/adminUserController.js`

### 4.1 Features

- Search & filter users:
  - By role (renter, owner, dual, admin, moderator).
  - By status (active, blocked).
  - By verification status.
- User actions:
  - View full profile (read-only).
  - Change role (e.g. promote to moderator).
  - Block / unblock user.

### 4.2 API

- `GET /api/admin/users?query=&role=&status=`
- `GET /api/admin/users/:id`
- `PATCH /api/admin/users/:id/role`
- `PATCH /api/admin/users/:id/status` – block/unblock.

Security:

- All routes protected with `requireAdmin`.

---

## 5. Listing Management

**Files**:
- `admin/listings.html` (NEW)
- `js/admin-listings.js`
- `backend/controllers/adminListingController.js`

### 5.1 Features

- View all listings with filters:
  - Category, status (draft, active, paused, rejected, reported).
  - Owner.
  - Date created.
- Actions:
  - Approve / reject new listings.
  - Pause or deactivate problematic listings.
  - Mark as **Featured** (for homepage).
  - Open listing detail page.

### 5.2 API

- `GET /api/admin/listings?status=&category=&owner=`
- `PATCH /api/admin/listings/:id/status`
- `PATCH /api/admin/listings/:id/feature` – toggle featured flag.

---

## 6. Booking & Dispute Management

**Files**:
- `admin/bookings.html` (NEW)
- `js/admin-bookings.js`
- `backend/controllers/adminBookingController.js`

### 6.1 Booking Oversight

- View all bookings:
  - Filters: status, listing, renter, owner, date range.
  - Quick view of price, payment status.

### 6.2 Dispute Handling

- Admin can:
  - Override booking status in exceptional cases.
  - Mark booking as **under review**.
  - Add internal notes.

### 6.3 API

- `GET /api/admin/bookings?status=&from=&to=`
- `PATCH /api/admin/bookings/:id/status`
- `PATCH /api/admin/bookings/:id/notes`

---

## 7. Reports & Analytics

**Files**:
- `admin/reports.html` (optional)
- `js/admin-reports.js`
- `backend/controllers/adminReportController.js`

### 7.1 Metrics

- Bookings per day/week/month.
- Revenue trends.
- Top categories / top listings.
- New users per period.

### 7.2 API

- `GET /api/admin/reports/overview?from=&to=`
- `GET /api/admin/reports/by-category`

---

## 8. Trust, Safety & Moderation Tools

**Files**:
- `backend/models/Report.js`
- `backend/controllers/adminModerationController.js`
- `admin/moderation.html` (optional)

### 8.1 Reports

- Allow renters and owners to **report**:
  - Listings.
  - Users.
  - Messages/bookings.

Backend:

- `POST /api/reports` – create report.
- `GET /api/admin/reports` – list for admins.

Admin actions:

- Mark report as **resolved** / **dismissed**.
- Link to listing/user/booking.

### 8.2 Sanctions

- Block user.
- Pause listing.
- Add internal notes for future audits.

---

## 9. Security & Audit

- Every admin action that changes data should:
  - Log `adminId`, `action`, `targetType`, `targetId`, `timestamp`, `oldValue`, `newValue`.
  - (Optional) store in `adminLogs` collection.

API example:

- `POST /api/admin/logs` (server-side only, called by controllers).

---

## 10. Testing Scenarios

1. **Admin Login**
   - Admin logs in, sees Admin Panel link, opens dashboard.

2. **User Promotion**
   - Admin views a renter user and promotes them to `owner` or `moderator`.
   - Changes reflected in UI and permissions.

3. **Listing Approval**
   - Owner creates new listing (status: pending).
   - Admin approves listing; it becomes visible in search.

4. **Booking Dispute**
   - Booking flagged and reported.
   - Admin reviews, updates status, adds internal notes.

5. **Security**
   - Non-admin user attempts to access `/api/admin/...` → receives `403`.

This plan should guide the build-out of all admin-facing capabilities on top of the existing renter/owner flows.


