# Admin Login Credentials

## Admin Account Information

### Primary Admin Account (from seed.js)
- **Email:** `admin@example.com`
- **Password:** `admin123`
- **Role:** Admin
- **Account Type:** Paid
- **Verified:** Yes (all verifications complete)

### Alternative Admin Account (from TEST_USERS_AND_ROLES.md)
- **Email:** `admin@test.com`
- **Password:** `StrongPass123!`
- **Role:** Admin

## How to Login

1. Navigate to the login page: `login.html`
2. Enter the admin email and password
3. After successful login, you will see the **Admin Panel** link in the user dropdown menu (top right)
4. Click on **Admin Panel** to access the admin dashboard

## Admin Features Implemented

### ✅ Dashboard (`admin/dashboard.html`)
- Real-time statistics:
  - Total users and growth
  - Active listings
  - Pending verifications
  - Open disputes
  - Revenue statistics
  - Active subscriptions
- Charts:
  - User growth over time
  - Revenue trends
  - Category distribution
- Recent activity:
  - Recent users
  - Recent disputes

### ✅ User Management (`admin/users.html`)
- View all users with filters:
  - Search by name, email, or phone
  - Filter by role (renter, owner, dual_role, admin, moderator)
  - Filter by account type (free, paid)
  - Filter by verification status
  - Filter by account status (active, suspended, banned)
- User actions:
  - View user details
  - Change user role
  - Suspend/Activate users
  - Ban users
  - Verify users manually
  - Reset password (placeholder)

### ✅ Backend API Endpoints
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/users` - Get all users with filters
- `GET /api/admin/users/:id` - Get single user details
- `PATCH /api/admin/users/:id/role` - Change user role
- `PATCH /api/admin/users/:id/status` - Update user status
- `GET /api/admin/listings` - Get all listings with filters
- `PATCH /api/admin/listings/:id/status` - Update listing status

## Security

- All admin routes are protected with admin-only middleware
- Only users with `role: 'admin'` can access admin endpoints
- Authentication token required for all admin API calls
- Admin link in header is only visible to admin users

## Notes

- The admin panel is accessible from the main site header dropdown menu
- Admin users have full access to all features
- All admin actions are logged (can be extended for audit logging)
- The admin dashboard fetches real data from the database

