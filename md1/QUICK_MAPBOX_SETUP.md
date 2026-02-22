# Quick Mapbox Token Setup

## ⚡ Quick Start (3 Steps)

### Step 1: Get Your Token
1. Visit: **https://account.mapbox.com/access-tokens/**
2. Sign up (free) or log in
3. Copy your **default public token** (starts with `pk.eyJ...`)

### Step 2: Configure Token
Open `js/config.js` and replace `YOUR_MAPBOX_TOKEN_HERE` with your token:

```javascript
window.MAPBOX_TOKEN = 'pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImN...'; // Your token here
```

### Step 3: Test
1. Save the file
2. Refresh your browser
3. Go to search page and click "Map" view
4. Map should load! 🎉

## 📝 Detailed Instructions

### File to Edit
**Location**: `js/config.js`

**Find this line**:
```javascript
window.MAPBOX_TOKEN = window.MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE';
```

**Replace with**:
```javascript
window.MAPBOX_TOKEN = window.MAPBOX_TOKEN || 'pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImN...';
```

## ✅ Verification

After setting your token:

1. **Open browser console** (F12)
2. **Type**: `window.MAPBOX_TOKEN`
3. **Should show**: Your token (not 'YOUR_MAPBOX_TOKEN_HERE')
4. **Navigate to search page**
5. **Click "Map" view button**
6. **Map should display** with listing markers

## 🆓 Free Tier

Mapbox free tier includes:
- ✅ 50,000 map loads/month
- ✅ 100,000 geocoding requests/month
- ✅ Perfect for development and small production

## 🔒 Security Note

**For Production**:
- Never commit your actual token to Git
- Use environment variables
- Set URL restrictions in Mapbox dashboard

## 🐛 Troubleshooting

**"Provide MAPBOX_TOKEN" message?**
- Token not set correctly in `js/config.js`
- Check token starts with `pk.eyJ`
- Ensure `js/config.js` loads before map scripts

**Map not loading?**
- Check browser console for errors
- Verify token is valid in Mapbox dashboard
- Ensure internet connection is active

## 📚 More Help

See `MAPBOX_SETUP_GUIDE.md` for detailed documentation.


