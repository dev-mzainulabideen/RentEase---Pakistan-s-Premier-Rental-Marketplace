# Mapbox Token Setup Guide

## Quick Setup

### Step 1: Get Your Mapbox Token

1. **Visit Mapbox**: Go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. **Sign Up/Login**: Create a free account or log in
3. **Access Tokens**: Navigate to "Access Tokens" in your account dashboard
4. **Copy Token**: Copy your default public token (starts with `pk.eyJ...`)

### Step 2: Configure the Token

#### Option A: Edit Config File (Recommended)
1. Open `js/config.js`
2. Find the line: `window.MAPBOX_TOKEN = 'YOUR_MAPBOX_TOKEN_HERE';`
3. Replace `YOUR_MAPBOX_TOKEN_HERE` with your actual token:
   ```javascript
   window.MAPBOX_TOKEN = 'pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImN...';
   ```

#### Option B: Set in HTML (Alternative)
Add this script tag **before** other scripts in your HTML files:
```html
<script>
    window.MAPBOX_TOKEN = 'pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImN...';
</script>
```

#### Option C: Environment Variable (For Production)
For production deployments, set it as an environment variable and load it via your build process.

### Step 3: Verify Setup

1. Open your browser's developer console (F12)
2. Navigate to a page with maps (search page or listing detail)
3. Check for any errors
4. The map should load and display listings

## Token Types

### Public Token (Recommended for Development)
- **Usage**: Frontend maps and geocoding
- **Scope**: Public, can be exposed in client-side code
- **Limits**: Free tier includes 50,000 map loads/month

### Secret Token (Backend Only)
- **Usage**: Server-side geocoding and API calls
- **Scope**: Must be kept secret, never expose in client code
- **Limits**: Higher rate limits

## Free Tier Limits

Mapbox offers a generous free tier:
- **50,000 map loads/month**
- **100,000 geocoding requests/month**
- **Unlimited static images**

This is typically sufficient for development and small to medium production deployments.

## Security Best Practices

1. **Never commit tokens to version control**
   - Add `js/config.js` to `.gitignore` if it contains your token
   - Use environment variables in production

2. **Use URL restrictions** (Production)
   - In Mapbox dashboard, restrict token to specific URLs
   - Prevents unauthorized use of your token

3. **Rotate tokens regularly**
   - Generate new tokens periodically
   - Revoke old tokens when no longer needed

## Troubleshooting

### Map Not Loading
- **Check token**: Verify token is correctly set in `js/config.js`
- **Check console**: Look for errors in browser console
- **Check network**: Ensure Mapbox API is accessible
- **Token format**: Token should start with `pk.eyJ`

### "Provide MAPBOX_TOKEN" Message
- Token is not set or incorrectly configured
- Check that `js/config.js` is loaded before map scripts
- Verify token variable name: `window.MAPBOX_TOKEN` or `window.mapboxToken`

### Geocoding Not Working
- Verify token has geocoding permissions
- Check browser console for API errors
- Ensure token is not rate-limited

## Example Configuration

```javascript
// js/config.js
window.MAPBOX_TOKEN = 'pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImN...';
```

## Testing

After setting up your token:

1. **Search Page**: 
   - Navigate to search page
   - Click "Map" view button
   - Map should load with listing markers

2. **Listing Detail**:
   - Open any listing detail page
   - Scroll to "Location" section
   - Map should display listing location

3. **Geocoding**:
   - Search for a location (e.g., "Lahore")
   - Map should center on that location

## Production Deployment

For production:

1. **Use environment variables**:
   ```javascript
   window.MAPBOX_TOKEN = process.env.MAPBOX_TOKEN || '';
   ```

2. **Set URL restrictions** in Mapbox dashboard:
   - Add your production domain
   - Restrict token to specific URLs

3. **Monitor usage**:
   - Check Mapbox dashboard for usage statistics
   - Set up alerts for approaching limits

## Support

- **Mapbox Documentation**: [https://docs.mapbox.com/](https://docs.mapbox.com/)
- **Mapbox Support**: [https://support.mapbox.com/](https://support.mapbox.com/)
- **Token Management**: [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)

