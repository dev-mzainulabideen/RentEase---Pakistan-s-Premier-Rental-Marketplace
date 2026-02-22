# 🏠 My Rental Marketplace

A comprehensive rental marketplace platform built with the MERN stack (MongoDB, Express.js, React-ready frontend). This platform connects renters with owners, enabling seamless rental transactions for various items including vehicles, electronics, furniture, and more.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-green.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Functionality
- 🔐 **User Authentication & Authorization**
  - Email/Phone registration and login
  - JWT-based authentication
  - Role-based access control (Renter, Owner, Admin, Moderator)
  - OAuth integration (Google, Facebook)
  - Email and SMS verification

- 📦 **Listing Management**
  - Create, update, and delete listings
  - Multiple categories and subcategories
  - Image and video uploads
  - Advanced search and filtering
  - Featured listings for paid accounts

- 📅 **Booking System**
  - Date-based booking calendar
  - Availability management
  - Booking confirmation workflow
  - Booking history and management

- 💳 **Payment Integration**
  - Multiple payment gateways (Easypaisa, JazzCash, Bank Cards)
  - Secure payment processing
  - Escrow-based payment system
  - Payment history and receipts

- ⭐ **Review & Rating System**
  - User reviews and ratings
  - Review moderation
  - Review filtering and sorting

- 💬 **Messaging System**
  - Real-time messaging between users
  - Conversation management
  - Message history

- 🛡️ **Dispute Management**
  - Dispute creation and tracking
  - Admin moderation panel
  - Evidence submission
  - Resolution workflow

- 👤 **User Profiles**
  - Comprehensive user profiles
  - Verification badges
  - User statistics and activity

- 🎯 **Admin Panel**
  - User management
  - Listing moderation
  - Dispute resolution
  - Analytics dashboard
  - Content management

### Advanced Features
- 📱 **Responsive Design** - Mobile-first, works on all devices
- 🌐 **Multi-language Support** - English, Urdu, Arabic (i18n ready)
- 🔍 **Advanced Search** - Full-text search with filters
- 📊 **Analytics** - User and business analytics
- 🔔 **Notifications** - Email and in-app notifications
- 📍 **Location Services** - Map integration for listings
- 🎨 **Modern UI/UX** - Clean, intuitive interface
- ⚡ **Performance Optimized** - Fast loading, efficient queries

---

## 🛠️ Tech Stack

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **Bootstrap 5** - UI framework
- **Vanilla JavaScript** - No framework dependencies (React-ready structure)
- **Mapbox/Google Maps** - Location services
- **Chart.js** - Analytics visualization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Passport.js** - OAuth authentication

### Services & Tools
- **MongoDB Atlas** - Cloud database (or local)
- **Payment Gateways** - Easypaisa, JazzCash, Bank APIs
- **Email Service** - SendGrid/Mailgun (to be integrated)
- **SMS Service** - Twilio/JazzCash SMS (to be integrated)

---

## 📁 Project Structure

```
myrental-marketplace/
├── backend/                 # Backend API
│   ├── config/             # Configuration files
│   │   └── database.js     # MongoDB connection
│   ├── controllers/        # Route controllers
│   │   ├── authController.js
│   │   ├── listingsController.js
│   │   ├── bookingsController.js
│   │   └── ...
│   ├── models/             # Mongoose models
│   │   ├── User.js
│   │   ├── Listing.js
│   │   ├── Booking.js
│   │   └── ...
│   ├── routes/             # API routes
│   │   ├── auth.js
│   │   ├── listings.js
│   │   └── ...
│   ├── middleware/         # Custom middleware
│   │   ├── auth.js
│   │   ├── admin.js
│   │   └── ...
│   ├── services/           # Business logic services
│   │   ├── paymentGateways.js
│   │   ├── subscriptionService.js
│   │   └── ...
│   ├── scripts/            # Utility scripts
│   │   ├── seed.js
│   │   └── optimize-database.js
│   ├── .env                # Environment variables (not in repo)
│   ├── package.json
│   └── server.js           # Entry point
│
├── frontend/               # Frontend files
│   ├── index.html          # Home page
│   ├── search.html         # Search page
│   ├── listing-detail.html # Listing details
│   ├── create-listing.html # Create listing
│   ├── profile.html        # User profile
│   ├── admin/              # Admin panel
│   │   ├── dashboard.html
│   │   ├── users.html
│   │   └── ...
│   ├── css/                # Stylesheets
│   │   ├── main.css
│   │   ├── responsive.css
│   │   └── ...
│   ├── js/                 # JavaScript files
│   │   ├── auth.js
│   │   ├── search.js
│   │   ├── listing-detail.js
│   │   └── ...
│   └── components/         # Reusable components
│       ├── header.html
│       └── footer.html
│
├── .gitignore              # Git ignore rules
├── README.md               # This file
└── package.json            # Root package.json
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14.0.0 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/downloads)
- **npm** or **yarn** (comes with Node.js)

---

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/myrental-marketplace.git
cd myrental-marketplace
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies (if any)

```bash
cd ..
npm install
```

### 4. Set Up Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env  # If .env.example exists
# Or create .env manually
```

Add the following variables to `.env`:

```env
# Server
PORT=4001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/myrental_marketplace
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/myrental_marketplace

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Payment Gateways (Optional - for production)
JAZZCASH_MERCHANT_ID=your-jazzcash-merchant-id
JAZZCASH_PASSWORD=your-jazzcash-password
EASYPAISA_MERCHANT_ID=your-easypaisa-merchant-id

# Email Service (Optional)
EMAIL_SERVICE_API_KEY=your-email-service-api-key

# SMS Service (Optional)
SMS_SERVICE_API_KEY=your-sms-service-api-key
```

**⚠️ Important:** Never commit `.env` file to Git! It's already in `.gitignore`.

---

## ⚙️ Configuration

### MongoDB Setup

#### Option 1: Local MongoDB

1. Install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```
3. Use connection string: `mongodb://localhost:27017/myrental_marketplace`

#### Option 2: MongoDB Atlas (Cloud)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get connection string from Atlas dashboard
4. Update `MONGODB_URI` in `.env`

### Database Optimization

Run the database optimization script to create indexes:

```bash
cd backend
node scripts/optimize-database.js
```

---

## 🎯 Usage

### Start Backend Server

```bash
cd backend
npm run dev    # Development mode with auto-reload
# OR
npm start      # Production mode
```

Backend will run on `http://localhost:4001`

### Start Frontend

Open `index.html` in your browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000

# Using VS Code Live Server extension
# Right-click index.html → "Open with Live Server"
```

Frontend will run on `http://localhost:8000`

### Seed Database (Optional)

Populate database with sample data:

```bash
cd backend
npm run seed              # Seed basic data
npm run seed:renter       # Seed renter data
npm run seed:owner        # Seed owner data
npm run test:users        # Create test users
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:4001/api
```

### Authentication
Most endpoints require authentication. Include JWT token in headers:
```
Authorization: Bearer <your-jwt-token>
```

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/send-verification-email` - Send verification email
- `POST /api/auth/verify-email` - Verify email

#### Listings
- `GET /api/listings` - Get all listings (with filters)
- `GET /api/listings/:id` - Get listing by ID
- `POST /api/listings` - Create new listing (Owner only)
- `PUT /api/listings/:id` - Update listing (Owner only)
- `DELETE /api/listings/:id` - Delete listing (Owner only)

#### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking by ID
- `PUT /api/bookings/:id` - Update booking status

#### Payments
- `POST /api/payments` - Process payment
- `GET /api/payments` - Get payment history
- `POST /api/payments/webhooks` - Payment webhooks

#### Reviews
- `GET /api/reviews` - Get reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review

For complete API documentation, see `API_DOCUMENTATION.md` (if available).

---

## 🧪 Testing

### Test Database Connection

```bash
cd backend
npm test
```

### Manual Testing

1. **Create test users:**
   ```bash
   npm run test:users
   ```

2. **Test accounts created:**
   - Admin: `admin@example.com` / `password123`
   - Owner: `owner@example.com` / `password123`
   - Renter: `renter@example.com` / `password123`

3. **Test the application:**
   - Register new user
   - Create listing
   - Make booking
   - Process payment
   - Leave review

---

## 🚀 Deployment

### Backend Deployment

#### Option 1: Heroku
```bash
# Install Heroku CLI
heroku create myrental-marketplace-api
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
git push heroku main
```

#### Option 2: DigitalOcean/AWS/Azure
- Set up Node.js server
- Configure environment variables
- Set up MongoDB (Atlas recommended)
- Configure domain and SSL

### Frontend Deployment

#### Option 1: Netlify/Vercel
- Connect GitHub repository
- Set build command (if needed)
- Deploy

#### Option 2: Static Hosting
- Upload files to hosting provider
- Configure API base URL

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes:**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch:**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Style
- Follow JavaScript ES6+ standards
- Use meaningful variable names
- Add comments for complex logic
- Follow existing code structure

---

## 📄 License

This project is licensed under the ISC License.

---

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

---

## 🙏 Acknowledgments

- MongoDB for the excellent database
- Express.js community
- All contributors and testers
- Payment gateway providers (Easypaisa, JazzCash)

---

## 📞 Support

For support, email your-email@example.com or open an issue on GitHub.

---

## 🔗 Useful Links

- [Project Documentation](./md1/)
- [Setup Guide](./SETUP_COMMANDS.md)
- [Performance Optimization](./PERFORMANCE_OPTIMIZATION_NOTES.md)
- [Nationwide Launch Strategy](./NATIONWIDE_LAUNCH_STRATEGY_REPORT.md)
- [Additional Improvements](./ADDITIONAL_IMPROVEMENTS_REQUIRED.md)

---

## 📊 Project Status

- ✅ Core Features: Complete
- ✅ User Authentication: Complete
- ✅ Listing Management: Complete
- ✅ Booking System: Complete
- ✅ Payment Integration: Complete (Sandbox)
- ⚠️ Email/SMS Service: Pending
- ⚠️ File Upload Service: Pending
- ⚠️ Real-time Messaging: Pending
- ⚠️ Testing: Pending

**Overall Progress:** ~75% Complete

---

## 🎯 Roadmap

- [ ] Email/SMS service integration
- [ ] File upload to cloud storage
- [ ] WebSocket real-time messaging
- [ ] Comprehensive testing suite
- [ ] API documentation (Swagger)
- [ ] Mobile app (React Native)
- [ ] Multi-language support (full i18n)
- [ ] GPS tracking integration
- [ ] Advanced analytics

---

**⭐ If you find this project helpful, please give it a star!**

