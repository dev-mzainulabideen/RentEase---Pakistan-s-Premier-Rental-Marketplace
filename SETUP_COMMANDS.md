# 🚀 Setup Commands - My Rental Marketplace

## Complete Setup Instructions

### Step-by-Step Commands (Run in Order)

#### 1. Navigate to Project Directory
```bash
cd "Z:\Fast\Semester\SEMESTER 8\WEB\Project\frontend-html"
```

#### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

#### 3. Install OAuth Dependencies (Required for Google/Facebook Login)
```bash
npm install passport passport-google-oauth20 passport-facebook axios --save
```

#### 4. Create Environment File
Create a `.env` file in the `backend` directory with the following content:
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

#### 5. Start MongoDB
```bash
# If MongoDB is installed as a service, it should auto-start
# To check if MongoDB is running:
mongosh

# Or manually start MongoDB:
mongod
```

#### 6. Seed the Database (First Time Only)
```bash
# Make sure you're in the backend directory
npm run seed
```

#### 7. Start Backend Server
```bash
# Development mode (with auto-restart on file changes):
npm run dev

# Or production mode:
npm start
```

#### 8. Start Frontend Server (New Terminal)
Open a new terminal window and run:
```bash
# Navigate to project root
cd "Z:\Fast\Semester\SEMESTER 8\WEB\Project\frontend-html"

# Option 1: Using Python HTTP Server
python -m http.server 3000

# Option 2: Using Node.js http-server
npx http-server -p 3000

# Option 3: Using VS Code Live Server
# Right-click on index.html > "Open with Live Server"
```

---

## 🎯 Quick Start (Copy & Paste All Commands)

### First Time Setup:
```bash
# 1. Navigate to project
cd "Z:\Fast\Semester\SEMESTER 8\WEB\Project\frontend-html"

# 2. Install backend dependencies
cd backend
npm install
npm install passport passport-google-oauth20 passport-facebook axios --save

# 3. Create .env file (manually create in backend folder with content above)

# 4. Start MongoDB (if not running)

# 5. Seed database
npm run seed

# 6. Start backend server
npm run dev
```

### Daily Development (After Initial Setup):
```bash
# Terminal 1: Start Backend
cd "Z:\Fast\Semester\SEMESTER 8\WEB\Project\frontend-html\backend"
npm run dev

# Terminal 2: Start Frontend Server
cd "Z:\Fast\Semester\SEMESTER 8\WEB\Project\frontend-html"
python -m http.server 3000
```

---

## ✅ Pre-Run Checklist

Before running the project, ensure:

- [ ] MongoDB is installed and running
- [ ] Node.js (v14+) is installed
- [ ] All backend dependencies installed (`npm install` in backend folder)
- [ ] OAuth dependencies installed (`passport`, `passport-google-oauth20`, `passport-facebook`, `axios`)
- [ ] `.env` file created in `backend` directory with correct values
- [ ] Database seeded (`npm run seed`)
- [ ] Backend server started (`npm run dev`)
- [ ] Frontend server started (Python HTTP server or Live Server)

---

## 🔍 Verify Installation

### Check Backend is Running:
- Open browser: `http://localhost:4001`
- Should see: `{"status":"ok","message":"My Rental Marketplace API"}`

### Check Frontend is Running:
- Open browser: `http://localhost:3000`
- Should see: Homepage of My Rental Marketplace

### Check MongoDB Connection:
```bash
mongosh
# Should connect successfully
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'axios'"
```bash
cd backend
npm install axios --save
```

### Error: "Cannot find module 'passport'"
```bash
cd backend
npm install passport passport-google-oauth20 passport-facebook --save
```

### Error: "MongoDB connection failed"
- Ensure MongoDB service is running
- Check MONGODB_URI in .env file
- Verify MongoDB is accessible on port 27017

### Error: "Port 4001 already in use"
- Change PORT in .env file to another port (e.g., 4002)
- Or stop the process using port 4001

### Error: "Port 3000 already in use"
- Use different port: `python -m http.server 3001`
- Update FRONTEND_URL in .env if changed

---

## 📝 Important Notes

1. **Always run backend first** before starting frontend
2. **MongoDB must be running** before seeding database
3. **Seed database only once** (or when you want to reset data)
4. **Keep both terminals open** - one for backend, one for frontend
5. **Check console for errors** if something doesn't work

---

## 🔗 Related Documentation

- Full Demo Guide: `PROJECT_DEMO_GUIDE.md`
- OAuth Setup: `OAUTH_SETUP.md`
- Admin Credentials: `ADMIN_CREDENTIALS.md`
- Test Users: `md1/TEST_USERS_AND_ROLES.md`

---

**Last Updated**: 2024

