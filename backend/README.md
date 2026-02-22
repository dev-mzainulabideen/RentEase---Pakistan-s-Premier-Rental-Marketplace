# My Rental Marketplace - Backend
## Node.js + MongoDB Backend API

---

## 🚀 QUICK START

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
1. Copy `.env.example` to `.env`
2. Add your MongoDB connection string to `.env`

### 3. Test Connection
```bash
npm test
```

### 4. Start Server
```bash
npm run dev
```

---

## 📁 PROJECT STRUCTURE

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── models/
│   ├── User.js              # User model
│   ├── Listing.js           # Listing model
│   └── ...                  # Other models
├── routes/
│   └── ...                  # API routes
├── controllers/
│   └── ...                  # Route controllers
├── middleware/
│   └── ...                  # Middleware functions
├── scripts/
│   └── seed.js              # Seed initial data
├── .env                     # Environment variables
├── package.json             # Dependencies
└── server.js                # Main server file
```

---

## 🔧 SETUP INSTRUCTIONS

See `MONGODB_STEP_BY_STEP.md` for detailed setup guide.

---

## 📝 ENVIRONMENT VARIABLES

Create `.env` file with:

```env
MONGODB_URI=your-connection-string
PORT=3000
JWT_SECRET=your-secret-key
```

---

## 🧪 TESTING

```bash
# Test database connection
npm test

# Test models
node test-models.js

# Seed data
npm run seed
```

---

## 📚 DOCUMENTATION

- `MONGODB_SETUP_GUIDE.md` - Complete setup guide
- `MONGODB_STEP_BY_STEP.md` - Step-by-step instructions

---

**Status:** Setup in progress

