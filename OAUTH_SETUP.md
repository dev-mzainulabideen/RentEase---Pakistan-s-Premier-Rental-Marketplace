# OAuth Setup Guide (Google & Facebook)

This guide explains how to set up Google and Facebook OAuth login for the My Rental Marketplace application.

## Prerequisites

1. A Google account (for Google OAuth)
2. A Facebook account (for Facebook OAuth)
3. Access to Google Cloud Console and Facebook Developers

---

## Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" (unless you have Google Workspace)
     - Fill in app name, user support email
     - Add your email to test users
     - Save and continue through the scopes (default is fine)
   - Application type: "Web application"
   - Name: "My Rental Marketplace"
   - Authorized JavaScript origins:
     - `http://localhost:4001`
     - `http://localhost:3000`
     - Your production URLs (if applicable)
   - Authorized redirect URIs:
     - `http://localhost:4001/api/auth/google/callback`
     - Your production callback URL (if applicable)
   - Click "Create"
   - Copy the **Client ID** and **Client Secret**

### Step 2: Add to Environment Variables

Add to your `backend/.env` file:

```env
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

### Step 3: Test Google OAuth

1. Start your backend server
2. Navigate to login page
3. Click "Continue with Google"
4. You should be redirected to Google's login page
5. After authentication, you'll be redirected back and logged in

---

## Facebook OAuth Setup

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" > "Create App"
3. Choose "Consumer" as the app type
4. Fill in app details:
   - App Name: "My Rental Marketplace"
   - App Contact Email: Your email
   - Click "Create App"

### Step 2: Configure Facebook Login

1. In the app dashboard, find "Facebook Login" in the products list
2. Click "Set Up" on Facebook Login
3. Choose "Web" as the platform
4. Site URL: `http://localhost:3000`
5. Click "Save"

### Step 3: Configure OAuth Settings

1. Go to "Settings" > "Basic"
2. Note your **App ID** and **App Secret**
3. Add platform:
   - Click "Add Platform" > "Website"
   - Site URL: `http://localhost:3000`
4. Go to "Facebook Login" > "Settings"
5. Add Valid OAuth Redirect URIs:
   - `http://localhost:4001/api/auth/facebook/callback`
   - Your production callback URL (if applicable)
6. Save changes

### Step 4: Add to Environment Variables

Add to your `backend/.env` file:

```env
FACEBOOK_APP_ID=your-facebook-app-id-here
FACEBOOK_APP_SECRET=your-facebook-app-secret-here
```

### Step 5: Test Facebook OAuth

1. Start your backend server
2. Navigate to login page
3. Click "Continue with Facebook"
4. You should be redirected to Facebook's login page
5. After authentication, you'll be redirected back and logged in

---

## Production Setup

### Google OAuth (Production)

1. Update OAuth consent screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Change app status to "In Production" (requires verification if using sensitive scopes)
   - Add production domains to authorized origins

2. Update redirect URIs:
   - Add production callback URL: `https://yourdomain.com/api/auth/google/callback`
   - Add production frontend URL to authorized origins

### Facebook OAuth (Production)

1. Add production domains:
   - Go to "Settings" > "Basic"
   - Add production domain
   - Update Site URL

2. Update redirect URIs:
   - Add production callback URL: `https://yourdomain.com/api/auth/facebook/callback`

3. Submit for App Review (if using advanced permissions):
   - Go to "App Review" > "Permissions and Features"
   - Request permissions you need
   - Submit for review

---

## Troubleshooting

### Common Issues

1. **"Redirect URI mismatch"**
   - Ensure redirect URI in OAuth provider matches exactly with your backend route
   - Check for trailing slashes
   - Verify protocol (http vs https)

2. **"Invalid client"**
   - Verify Client ID/Secret are correct
   - Check environment variables are loaded
   - Restart backend server after changing .env

3. **"Access denied"**
   - Check OAuth consent screen is configured
   - Verify test users are added (for development)
   - Check app is not in restricted mode

4. **CORS errors**
   - Ensure frontend URL is in authorized origins
   - Check backend CORS configuration

### Testing Checklist

- [ ] Google OAuth credentials created
- [ ] Facebook OAuth credentials created
- [ ] Environment variables set in .env
- [ ] Backend server restarted
- [ ] Redirect URIs match exactly
- [ ] Authorized origins include frontend URL
- [ ] OAuth consent screen configured
- [ ] Test user added (for Google, if needed)

---

## Security Notes

1. **Never commit .env file** to version control
2. **Use different credentials** for development and production
3. **Rotate secrets** periodically
4. **Use HTTPS** in production
5. **Validate redirect URIs** to prevent open redirect attacks
6. **Limit OAuth scopes** to only what's needed

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [OAuth 2.0 Best Practices](https://oauth.net/2/)

---

**Last Updated**: 2024

