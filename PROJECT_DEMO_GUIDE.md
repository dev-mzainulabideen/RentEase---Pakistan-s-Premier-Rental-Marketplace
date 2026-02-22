# My Rental Marketplace - Complete Project Demo Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Getting Started](#getting-started)
3. [Authentication & User Roles](#authentication--user-roles)
4. [Core Features](#core-features)
5. [Admin Panel](#admin-panel)
6. [API Endpoints](#api-endpoints)
7. [Security Features](#security-features)
8. [Demo Walkthrough](#demo-walkthrough)

---

## 🎯 Project Overview

**My Rental Marketplace** is a comprehensive rental platform that allows users to rent and list various items including properties, vehicles, equipment, clothes, services, animals, boats, and air transport. The platform supports multiple user roles (Renter, Owner, Dual Role, Admin) with role-based access control.

### Key Technologies
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5
- **Backend**: Node.js, Express.js, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **OAuth**: Google & Facebook Login
- **Security**: Helmet.js, CORS, Rate Limiting, Route Protection

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git
- npm (comes with Node.js)

### 📋 Complete Setup Commands (Run in Order)

**Step 1: Navigate to Project Directory**
```bash
cd "Z:\Fast\Semester\SEMESTER 8\WEB\Project\frontend-html"
```

**Step 2: Install Backend Dependencies**
```bash
cd backend
npm install
```

**Step 3: Install Additional OAuth Dependencies (if not already installed)**
```bash
npm install passport passport-google-oauth20 passport-facebook axios --save
```

**Step 4: Configure Environment Variables**
Create a `.env` file in the `backend` directory:
```env
PORT=4001
MONGODB_URI=mongodb://localhost:27017/myrental
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:4001

# OAuth Credentials (Optional - for Google/Facebook login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
```

**Step 5: Ensure MongoDB is Running**
```bash
# If MongoDB is installed locally, start it:
# Windows (if installed as service, it should auto-start)
# Or manually:
mongod

# Check if MongoDB is running:
# Open another terminal and run:
mongosh
# Or check connection:
mongosh "mongodb://localhost:27017"
```

**Step 6: Seed the Database**
```bash
# Make sure you're in the backend directory
npm run seed
```

**Step 7: Start the Backend Server**
```bash
# Development mode (with auto-restart):
npm run dev

# Or production mode:
npm start
```

**Step 8: Start the Frontend**
Open a new terminal window and navigate to the project root:
```bash
# Option 1: Using Python HTTP Server
python -m http.server 3000

# Option 2: Using Node.js http-server (if installed globally)
npx http-server -p 3000

# Option 3: Using VS Code Live Server extension
# Right-click on index.html > "Open with Live Server"

# Option 4: Direct file access (may have CORS issues)
# Simply open index.html in browser
```

### 🎯 Quick Start Commands Summary

**For First Time Setup:**
```bash
# 1. Navigate to project
cd "Z:\Fast\Semester\SEMESTER 8\WEB\Project\frontend-html"

# 2. Install backend dependencies
cd backend
npm install
npm install passport passport-google-oauth20 passport-facebook axios --save

# 3. Create .env file (see above for content)

# 4. Start MongoDB (if not running)

# 5. Seed database
npm run seed

# 6. Start backend (in backend directory)
npm run dev
```

**For Daily Development (Backend Already Set Up):**
```bash
# Terminal 1: Start Backend
cd "Z:\Fast\Semester\SEMESTER 8\WEB\Project\frontend-html\backend"
npm run dev

# Terminal 2: Start Frontend Server
cd "Z:\Fast\Semester\SEMESTER 8\WEB\Project\frontend-html"
python -m http.server 3000
```

### Installation Steps (Detailed)

1. **Clone the repository** (if not already cloned)
   ```bash
   git clone <repository-url>
   cd frontend-html
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   npm install passport passport-google-oauth20 passport-facebook axios --save
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the `backend` directory (see Step 4 above for content)

4. **Seed the Database**
   ```bash
   npm run seed
   ```

5. **Start the Backend Server**
   ```bash
   npm run dev
   # or
   npm start
   ```

6. **Start the Frontend**
   - Open `index.html` in a web browser
   - Or use a local server (e.g., Live Server in VS Code)
   - Or use Python: `python -m http.server 3000`

---

## 🔐 Authentication & User Roles

### Test Accounts

#### Admin Account
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Access**: Full admin panel access

#### Demo Accounts (from seed script)
- **Renter**: `renter@example.com` / `password123`
- **Owner**: `owner@example.com` / `password123`
- **Dual Role**: `dual@example.com` / `password123`

### User Roles

1. **Guest** (Not logged in)
   - Browse categories and listings
   - Search and filter
   - Cannot book or create listings

2. **Renter**
   - All guest permissions
   - Book items
   - View booking history
   - Send messages
   - File disputes

3. **Owner**
   - All guest permissions
   - Create and manage listings
   - Accept/reject bookings
   - View earnings
   - Manage availability

4. **Dual Role**
   - Combines Renter and Owner permissions
   - Can switch between roles

5. **Admin**
   - Full platform access
   - User management
   - Listing moderation
   - Dispute resolution
   - Statistics and analytics

### OAuth Login (Google & Facebook)

1. **Setup OAuth Apps**
   - Google: [Google Cloud Console](https://console.cloud.google.com/)
   - Facebook: [Facebook Developers](https://developers.facebook.com/)

2. **Configure Redirect URIs**
   - Google: `http://localhost:4001/api/auth/google/callback`
   - Facebook: `http://localhost:4001/api/auth/facebook/callback`

3. **Usage**
   - Click "Continue with Google" or "Continue with Facebook" on login/register pages
   - User will be redirected to OAuth provider
   - After authentication, user is automatically logged in

---

## ✨ Core Features

### 1. Homepage (`index.html`)
- **Hero Section**: Search bar with category selection
- **Categories**: Browse by category (Property, Vehicles, Equipment, etc.)
- **Featured Listings**: Highlighted rental items
- **How It Works**: Step-by-step guide
- **Why Choose Us**: Platform benefits
- **Account Types**: Free vs Paid comparison
- **Trust & Safety**: Security features
- **Payment Methods**: Supported payment options
- **Testimonials**: User reviews

**Link**: `http://localhost:3000/index.html`

### 2. Search & Browse (`search.html`)
- Advanced search filters
- Category-based browsing
- Price range filters
- Location-based search
- Sort options (price, date, rating)

**Link**: `http://localhost:3000/search.html`

### 3. Listing Management

#### Create Listing (`create-listing.html`)
- **Access**: Owner or Dual Role users
- **Features**:
  - Category selection
  - Title and description
  - Pricing (daily/weekly/monthly)
  - Location selection
  - Image uploads
  - Availability calendar
  - Terms and conditions

**Link**: `http://localhost:3000/create-listing.html`

#### My Listings (`my-listings.html`)
- View all created listings
- Edit/Delete listings
- View booking requests
- Manage availability
- View earnings

**Link**: `http://localhost:3000/my-listings.html`

### 4. Booking System

#### Book Item (`booking.html`)
- **Access**: Renter or Dual Role (as renter)
- **Features**:
  - Select dates
  - View pricing breakdown
  - Add special requests
  - Payment processing
  - Booking confirmation

**Link**: `http://localhost:3000/booking.html`

#### My Bookings (`my-bookings.html`)
- View all bookings (as renter or owner)
- Filter by status (pending, confirmed, completed, cancelled)
- View booking details
- Cancel bookings (if allowed)
- Leave reviews

**Link**: `http://localhost:3000/my-bookings.html`

### 5. User Profile (`profile.html`)
- View/edit profile information
- Upload avatar
- Manage verification status
- View statistics (listings, bookings, reviews)
- Account settings

**Link**: `http://localhost:3000/profile.html`

### 6. Settings (`settings.html`)
- Account preferences
- Notification settings
- Privacy settings
- Language selection (English/Urdu)
- Password change
- Account deletion

**Link**: `http://localhost:3000/settings.html`

### 7. Verification (`verification.html`)
- Email verification
- Phone verification (OTP)
- ID document upload
- Biometric verification
- Face verification
- Verification status tracking

**Link**: `http://localhost:3000/verification.html`

### 8. Dispute Resolution (`disputes.html`)
- File new disputes
- View dispute status
- Add updates/evidence
- Track dispute resolution
- Filter by type (payment, safety, quality, behavior, fraud, other)

**Link**: `http://localhost:3000/disputes.html`

### 9. Emergency Contacts (`emergency-contacts.html`)
- Add emergency contacts
- Report emergencies during bookings
- Quick access to emergency services

**Link**: `http://localhost:3000/emergency-contacts.html`

### 10. Safety Guidelines (`safety-guidelines.html`)
- Safety information for all categories
- Best practices
- Emergency procedures
- Public page (no login required)

**Link**: `http://localhost:3000/safety-guidelines.html`

### 11. Messages (`messages.html`)
- In-app messaging system
- Conversation threads
- Real-time notifications
- File attachments

**Link**: `http://localhost:3000/messages.html`

### 12. Subscriptions (`subscription.html`)
- View subscription plans
- Upgrade to paid account
- Payment processing
- Subscription management

**Link**: `http://localhost:3000/subscription.html`

---

## 👨‍💼 Admin Panel

### Access
- **URL**: `http://localhost:3000/admin/dashboard.html`
- **Login**: Use admin credentials (`admin@example.com` / `admin123`)

### Admin Sections

#### 1. Dashboard (`admin/dashboard.html`)
- **Statistics Overview**:
  - Total Users
  - Active Listings
  - Total Bookings
  - Pending Verifications
  - Active Disputes
  - Revenue
- **Quick Actions**
- **Recent Activity**

**Link**: `http://localhost:3000/admin/dashboard.html`

#### 2. Users & Verification (`admin/users.html`)
- **Features**:
  - View all users
  - Search and filter users
  - Verify user accounts
  - Suspend/Ban users
  - Change user roles
  - View user details
  - Export user data

**Link**: `http://localhost:3000/admin/users.html`

#### 3. Listings Management (`admin/listings.html`)
- **Features**:
  - View all listings
  - Approve/Reject listings
  - Feature listings
  - Edit listing details
  - Delete listings
  - Filter by status/category

**Link**: `http://localhost:3000/admin/listings.html`

#### 4. Categories (`admin/categories.html`)
- **Features**:
  - View all categories
  - Manage subcategories
  - View listing counts per category
  - Add/Edit/Delete categories

**Link**: `http://localhost:3000/admin/categories.html`

#### 5. Ads Management (`admin/ads.html`)
- **Features**:
  - View all ads
  - Create new ads
  - Edit/Delete ads
  - Manage ad display settings
  - View ad statistics

**Link**: `http://localhost:3000/admin/ads.html`

#### 6. Subscriptions (`admin/subscriptions.html`)
- **Features**:
  - View all subscriptions
  - Filter by status
  - View subscription details
  - Manage subscription plans

**Link**: `http://localhost:3000/admin/subscriptions.html`

#### 7. Disputes & Reports (`admin/disputes.html`)
- **Features**:
  - View all disputes
  - Filter by status/type
  - Resolve disputes
  - Add admin notes
  - View dispute details

**Link**: `http://localhost:3000/admin/disputes.html`

#### 8. Content Management (`admin/content.html`)
- **Features**:
  - Manage English content
  - Manage Urdu content
  - Edit static pages
  - Manage translations

**Link**: `http://localhost:3000/admin/content.html`

#### 9. Statistics (`admin/statistics.html`)
- **Features**:
  - Platform analytics
  - User growth charts
  - Revenue statistics
  - Booking trends
  - Category popularity

**Link**: `http://localhost:3000/admin/statistics.html`

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:4001/api
```

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "+923001234567",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "renter"
}
```

#### Login
```
POST /api/auth/login
Body: {
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

#### OAuth Endpoints
```
GET /api/auth/google          # Initiate Google OAuth
GET /api/auth/google/callback # Google OAuth callback
GET /api/auth/facebook        # Initiate Facebook OAuth
GET /api/auth/facebook/callback # Facebook OAuth callback
```

### Listings Endpoints

```
GET    /api/listings          # Get all listings
GET    /api/listings/:id      # Get single listing
POST   /api/listings          # Create listing (Owner only)
PATCH  /api/listings/:id      # Update listing
DELETE /api/listings/:id      # Delete listing
```

### Bookings Endpoints

```
GET    /api/bookings          # Get user bookings
GET    /api/bookings/:id      # Get single booking
POST   /api/bookings          # Create booking
PATCH  /api/bookings/:id      # Update booking status
```

### Disputes Endpoints

```
GET    /api/disputes          # Get user disputes
GET    /api/disputes/:id      # Get single dispute
POST   /api/disputes          # Create dispute
PATCH  /api/disputes/:id      # Update dispute
POST   /api/disputes/:id/updates # Add dispute update
```

### Admin Endpoints (Require Admin Role)

```
GET    /api/admin/stats              # Dashboard statistics
GET    /api/admin/users               # Get all users
GET    /api/admin/users/:id           # Get single user
PATCH  /api/admin/users/:id/role      # Update user role
PATCH  /api/admin/users/:id/status    # Update user status
PATCH  /api/admin/users/:id/verify    # Verify user
GET    /api/admin/listings            # Get all listings
PATCH  /api/admin/listings/:id/status # Update listing status
PATCH  /api/admin/listings/:id/feature # Toggle featured
GET    /api/admin/categories          # Get categories
GET    /api/admin/ads                 # Get ads
GET    /api/admin/subscriptions       # Get subscriptions
GET    /api/admin/disputes            # Get all disputes
GET    /api/admin/statistics          # Get statistics
```

---

## 🔒 Security Features

### 1. Route Protection (`js/route-protection.js`)
- **URL Validation**: Prevents direct access to protected routes
- **Parameter Sanitization**: Removes dangerous URL parameters
- **File Access Control**: Blocks access to sensitive files
- **Redirect Validation**: Prevents open redirect attacks

### 2. Authentication Middleware
- JWT token validation
- Token expiration handling
- User session management

### 3. Role-Based Access Control (RBAC)
- Permission-based UI restrictions
- API endpoint protection
- Role-based route guards

### 4. Backend Security
- Helmet.js for HTTP headers
- CORS configuration
- Rate limiting (300 requests per 15 minutes)
- Input validation
- SQL injection prevention (MongoDB)
- XSS protection

### 5. OAuth Security
- Secure token exchange
- State validation
- Redirect URI validation

---

## 🎬 Demo Walkthrough

### Scenario 1: New User Registration & First Listing

1. **Open Homepage**
   - Navigate to `index.html`
   - Click "Sign Up" or "Get Started"

2. **Register as Owner**
   - Fill registration form
   - Select "Owner" role
   - Verify email (if enabled)

3. **Create First Listing**
   - Navigate to "Create Listing"
   - Select category (e.g., "Property")
   - Fill listing details
   - Upload images
   - Set pricing
   - Submit listing

4. **View Listing**
   - Go to "My Listings"
   - View created listing
   - Check status (pending approval)

### Scenario 2: Renter Booking Flow

1. **Browse Listings**
   - Search for items
   - Filter by category/price
   - View listing details

2. **Book Item**
   - Click "Book Now"
   - Select dates
   - Review pricing
   - Complete booking

3. **View Booking**
   - Go to "My Bookings"
   - Check booking status
   - Wait for owner approval

### Scenario 3: Admin Management

1. **Login as Admin**
   - Use admin credentials
   - Access admin panel

2. **Verify User**
   - Go to "Users & Verification"
   - Find user
   - Click "Verify"

3. **Approve Listing**
   - Go to "Listings Management"
   - Review pending listing
   - Approve or reject

4. **View Statistics**
   - Check dashboard stats
   - View user growth
   - Monitor disputes

### Scenario 4: Dispute Resolution

1. **File Dispute**
   - Go to "Disputes"
   - Click "File New Dispute"
   - Select type and booking
   - Add description
   - Submit

2. **Admin Resolution**
   - Admin views dispute
   - Reviews evidence
   - Adds resolution notes
   - Updates status

### Scenario 5: OAuth Login

1. **Click Social Login**
   - On login page
   - Click "Continue with Google" or "Continue with Facebook"

2. **OAuth Flow**
   - Redirected to provider
   - Authorize application
   - Redirected back
   - Automatically logged in

---

## 📝 Important Notes

### Environment Setup
- Ensure MongoDB is running
- Backend must be running on port 4001
- Frontend should be served (not just file://)

### Testing
- Use test accounts from seed script
- Check browser console for errors
- Verify API responses in Network tab

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS is configured
   - Check frontend URL matches CORS origin

2. **Authentication Errors**
   - Check JWT_SECRET in .env
   - Verify token is stored in localStorage
   - Check token expiration

3. **OAuth Errors**
   - Verify OAuth credentials in .env
   - Check redirect URIs match
   - Ensure OAuth apps are configured

4. **Route Protection**
   - Ensure `route-protection.js` is loaded
   - Check auth.js is loaded before route-protection.js
   - Verify user has required permissions

---

## 🔗 Quick Links

### Frontend Pages
- Homepage: `index.html`
- Login: `login.html`
- Register: `register.html`
- Search: `search.html`
- Profile: `profile.html`
- Settings: `settings.html`
- Dashboard: `dashboard.html`
- Admin Panel: `admin/dashboard.html`

### Documentation
- Admin Credentials: `ADMIN_CREDENTIALS.md`
- Test Users: `md1/TEST_USERS_AND_ROLES.md`
- Booking IDs: `TEST_BOOKING_IDS.md`
- React Integration: `REACT_INTEGRATION_GUIDE.md`
- React Setup: `REACT_SETUP.md`

### React Demo (MERN Stack)
- **React Demo Page**: `react-demo.html` - Standalone React demo (no installation needed)
- **React App**: `react-app/` - Full React application (requires npm install)

---

## 📞 Support

For issues or questions:
1. Check browser console for errors
2. Verify backend logs
3. Review API responses
4. Check environment variables

---

**Last Updated**: 2024
**Version**: 1.0.0

