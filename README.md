# RentEase - Pakistan's Premier Rental Marketplace

## 📋 Overview

A comprehensive rental marketplace platform built for Pakistan, connecting renters with property owners seamlessly. This project demonstrates a full-stack MERN (MongoDB, Express.js, React-ready, Node.js) application with enterprise-grade features.

**Developed by:** M Zain-ul-Abideen

---

## 🔒 Privacy Notice

For privacy and security reasons, the following files have **NOT** been uploaded to this public GitHub repository:

- 🚫 **Backend source code** (`/backend` directory) - Contains sensitive API keys, database configurations, and business logic
- 🚫 **Admin panel files** - Restricted access to authorized personnel only
- 🚫 **Environment configuration files** (`.env`) - Contains MongoDB credentials, JWT secrets, and payment gateway keys
- 🚫 **Database schemas and seed data** - Protects sensitive data structures
- 🚫 **Payment integration details** - JazzCash, EasyPaisa merchant credentials
- 🚫 **OAuth credentials** - Google and Facebook API keys
- 🚫 **User authentication modules** - Security-critical components

These files remain in the private development environment to prevent unauthorized access and potential security breaches.

---

## ✨ Key Features

### Core Functionality
- 🔐 **Role-Based Authentication** - Renter, Owner, Admin, Moderator roles with JWT
- 🏠 **Listing Management** - 8 categories with images, pricing, and availability
- 📅 **Booking System** - Calendar-based reservations with instant or request booking
- 💳 **Payment Integration** - JazzCash, EasyPaisa, and bank card processing (sandbox)
- ⭐ **Review & Rating** - User feedback system with moderation
- 💬 **Real-Time Messaging** - WebSocket-enabled conversations
- 🛡️ **Dispute Resolution** - Admin-moderated conflict resolution
- 📊 **Analytics Dashboard** - User and business insights

### Advanced Capabilities
- 📍 **Map Integration** - Mapbox/Google Maps for precise location tracking
- 🎨 **Responsive Design** - Mobile-first, works on all devices (375px to 4K)
- 🌐 **Multi-Language Ready** - English, Urdu, Arabic support
- 🔔 **Smart Notifications** - Email and in-app alerts
- 🎯 **Advanced Search** - Full-text search with 15+ filters
- 📈 **Ad System** - 48-hour free ads, paid 30-day boosts
- 👥 **Dual Role Support** - Users can be both renters and owners

---

## 🛠️ Technology Stack

### Frontend (Public)
- **HTML5, CSS3, JavaScript (ES6+)** - Core technologies
- **Bootstrap 5** - Responsive UI framework
- **Vanilla JavaScript** - No framework dependencies
- **Mapbox/Google Maps** - Location services

### Backend (Private - Not Uploaded)
- **Node.js + Express.js** - Server framework
- **MongoDB + Mongoose** - Database (RentEasy Atlas cluster)
- **JWT + bcryptjs** - Authentication & security
- **Passport.js** - OAuth (Google, Facebook)

### Services
- **MongoDB Atlas** - Cloud database
- **JazzCash/EasyPaisa** - Payment gateways
- **SendGrid/Mailgun** - Email service (pending integration)

---

## 📂 Repository Structure

```
frontend-html/
├── *.html              # 30+ HTML pages (landing, search, booking, profile, etc.)
├── css/                # 40+ stylesheets
│   ├── main.css
│   ├── hero.css
│   ├── responsive.css
│   └── ...
├── js/                 # 35+ JavaScript modules
│   ├── auth.js
│   ├── search.js
│   ├── messages.js
│   ├── map-utils.js
│   └── ...
├── logos/              # Brand assets
└── index.html          # Main entry point
```

**Available Pages:**
- Landing Page (`index.html`)
- Search & Browse (`search.html`, `category.html`)
- Listing Details (`listing-detail.html`)
- Create Listing (`create-listing.html`)
- User Dashboard (`dashboard.html`)
- Profile & Settings (`profile.html`, `settings.html`)
- Booking & Payments (`booking.html`, `payment.html`)
- Messages (`messages.html`)
- And 20+ more...

---

## 🚀 Quick Start

### View the Project
1. Clone or download this repository
2. Open `index.html` in any modern browser
3. Explore the fully functional frontend

### Run Locally (Recommended)
```bash
# Using Python
cd frontend-html
python -m http.server 8000

# Or using Node.js
npx http-server -p 8000
```
Visit: `http://localhost:8000`

---

## 🔐 Backend Setup (Private - For Development Only)

**Note:** Backend files are not included in this public repo for security reasons. If you need the backend for development:

1. Contact the repository owner
2. Sign NDA if required
3. Access private development branch

**Backend requires:**
- Node.js v14+
- MongoDB Atlas account (or local MongoDB)
- Environment variables (`.env`)
- Payment gateway merchant accounts

---

## 🎯 Project Status

| Feature | Status |
|---------|--------|
| Frontend UI | ✅ Complete |
| Authentication | ✅ Backend Ready |
| Listing System | ✅ Backend Ready |
| Booking System | ✅ Backend Ready |
| Payment Gateway | ✅ Sandbox Mode |
| Messaging | ⚠️ WebSocket Ready |
| Admin Panel | ✅ Backend Ready |
| Email/SMS | 🔄 Integration Pending |
| File Upload | 🔄 Cloud Storage Pending |

**Overall Progress:** ~85% Complete

---

## 📊 Key Statistics

- **30+** HTML Pages
- **40+** CSS Files
- **35+** JavaScript Modules
- **12** Database Models
- **25+** API Endpoints
- **8** Listing Categories
- **5** User Roles
- **100+** Features

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Frontend UI enhancements
- Mobile app development (React Native)
- Testing and QA
- Documentation (non-sensitive)
- Bug fixes

**Please Note:** Do not attempt to access or recreate backend functionality without authorization. Security is paramount.

---

## 📄 License

ISC License

---

## 🙏 Acknowledgments

- MongoDB for database solutions
- Bootstrap for UI framework
- Pakistan's tech community for support
- All users and testers

---

**⭐ If this project helps you, please give it a star!**

**Contact:** For backend access or collaboration, contact the repository owner.

---

*Made with ❤️ in Pakistan by M Zain-ul-Abideen*