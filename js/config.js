/**
 * Application Configuration
 * Configure API endpoints, tokens, and other settings here
 */

// API Configuration
window.API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';

// Mapbox Configuration
// ============================================
// IMPORTANT: Replace 'YOUR_MAPBOX_TOKEN_HERE' with your actual Mapbox token
// ============================================
//
// Quick Setup (3 steps):
// 1. Visit: https://account.mapbox.com/access-tokens/
// 2. Sign up (free) or log in to Mapbox
// 3. Copy your default public token (starts with 'pk.eyJ...')
// 4. Paste it below, replacing 'YOUR_MAPBOX_TOKEN_HERE'
//
// Example:
// window.MAPBOX_TOKEN = 'pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImN...';
//
// Free Tier: 50,000 map loads/month - Perfect for development!
// ============================================

window.MAPBOX_TOKEN = window.MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE';

// Alternative: You can also set it as:
// window.mapboxToken = 'YOUR_MAPBOX_TOKEN_HERE';

// Security Note: Never commit your actual token to version control in production!
// For production, use environment variables or secure configuration management.

