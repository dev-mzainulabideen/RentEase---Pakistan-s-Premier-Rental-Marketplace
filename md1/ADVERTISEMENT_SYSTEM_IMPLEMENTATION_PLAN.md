# Advertisement System Implementation Plan
## Free vs Paid Account Tiers

**Version:** 1.0  
**Date:** 2024  
**Status:** Implementation Plan

---

## Table of Contents

1. [Overview](#overview)
2. [Account Tier System](#account-tier-system)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Advertisement Display Logic](#advertisement-display-logic)
6. [Verification Badge System](#verification-badge-system)
7. [Subscription Management](#subscription-management)
8. [Test Account Creation](#test-account-creation)
9. [Database Schema Updates](#database-schema-updates)
10. [API Endpoints](#api-endpoints)
11. [Frontend Components](#frontend-components)
12. [Testing Strategy](#testing-strategy)
13. [Deployment Checklist](#deployment-checklist)

---

## Overview

This document outlines the complete implementation plan for an advertisement system with Free and Paid account tiers. The system will:


- Display ads for Free accounts based on specific rules
- Hide ads completely for Paid accounts
- Show verification badges based on account type
- Control review visibility based on account tier
- Manage subscriptions automatically
- Scale for future account types

---

## Account Tier System

### Account Types

#### 1. **Free Account** (Default)
- **Account Type:** `free`
- **Subscription Status:** `none`
- **Features:**
  - Ads displayed for 48 hours after account creation
  - Ads appear every 2 minutes
  - Multiple ads randomly across website
  - Ads on last page of flow
  - Profile shows "Not Verified" status
  - Reviews are hidden/not visible
  - Listing visibility: Standard (no promotion)

#### 2. **Paid Account**
- **Account Type:** `paid`
- **Subscription Status:** `active`
- **Pricing:**
  - Pakistan: Rs. 500/month
  - International: $7.99/month
- **Features:**
  - No ads displayed anywhere
  - Profile shows "Verified Customer" badge
  - Reviews visible and enabled
  - Listing visibility/promotion active for 1 month
  - Auto-renewal option

---

## Backend Implementation

### 1. Database Schema Updates

#### User Model Updates (`backend/models/User.js`)

```javascript
{
  // Existing fields...
  accountType: {
    type: String,
    enum: ['free', 'paid'],
    default: 'free',
    required: true
  },
  
  subscription: {
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'none'],
      default: 'none'
    },
    plan: {
      type: String,
      enum: ['monthly_pkr', 'monthly_usd', null],
      default: null
    },
    startDate: Date,
    endDate: Date,
    paymentMethod: String,
    transactionId: String,
    autoRenew: { type: Boolean, default: true },
    lastPaymentDate: Date,
    nextBillingDate: Date
  },
  
  accountCreatedAt: {
    type: Date,
    default: Date.now
  },
  
  adDisplaySettings: {
    adsEnabled: { type: Boolean, default: true },
    adsExpiryDate: Date, // 48 hours from account creation for free accounts
    lastAdDisplayTime: Date,
    adDisplayCount: { type: Number, default: 0 }
  },
  
  verification: {
    status: {
      type: String,
      enum: ['not_verified', 'verified'],
      default: 'not_verified'
    },
    verifiedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
}
```

#### Subscription Model (`backend/models/Subscription.js`) - NEW

```javascript
const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['monthly_pkr', 'monthly_usd'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    enum: ['PKR', 'USD'],
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  nextBillingDate: Date,
  autoRenew: {
    type: Boolean,
    default: true
  },
  paymentHistory: [{
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    amount: Number,
    currency: String,
    paidAt: Date,
    status: String
  }],
  cancellationRequestedAt: Date,
  cancellationReason: String
}, {
  timestamps: true
});
```

#### Ad Display Log Model (`backend/models/AdDisplayLog.js`) - NEW

```javascript
const adDisplayLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad'
  },
  page: {
    type: String,
    required: true // e.g., 'home', 'listing-detail', 'search', 'last-page'
  },
  displayedAt: {
    type: Date,
    default: Date.now
  },
  adType: {
    type: String,
    enum: ['banner', 'sidebar', 'inline', 'popup', 'last-page']
  },
  accountType: {
    type: String,
    enum: ['free', 'paid']
  }
});
```

### 2. Backend Services

#### Subscription Service (`backend/services/subscriptionService.js`) - NEW

```javascript
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');

class SubscriptionService {
  // Create subscription for paid account
  async createSubscription(userId, plan, paymentId) {
    const plans = {
      monthly_pkr: { amount: 500, currency: 'PKR', duration: 30 },
      monthly_usd: { amount: 7.99, currency: 'USD', duration: 30 }
    };
    
    const planDetails = plans[plan];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planDetails.duration);
    
    const nextBillingDate = new Date(endDate);
    
    // Create subscription
    const subscription = await Subscription.create({
      user: userId,
      plan,
      status: 'active',
      amount: planDetails.amount,
      currency: planDetails.currency,
      startDate,
      endDate,
      nextBillingDate,
      paymentHistory: [{
        paymentId,
        amount: planDetails.amount,
        currency: planDetails.currency,
        paidAt: new Date(),
        status: 'completed'
      }]
    });
    
    // Update user account type and subscription
    await User.findByIdAndUpdate(userId, {
      accountType: 'paid',
      'subscription.status': 'active',
      'subscription.plan': plan,
      'subscription.startDate': startDate,
      'subscription.endDate': endDate,
      'subscription.nextBillingDate': nextBillingDate,
      'verification.status': 'verified',
      'verification.verifiedAt': new Date(),
      'adDisplaySettings.adsEnabled': false
    });
    
    return subscription;
  }
  
  // Check if subscription is active
  async isSubscriptionActive(userId) {
    const user = await User.findById(userId);
    if (!user) return false;
    
    if (user.accountType === 'paid' && user.subscription.status === 'active') {
      const now = new Date();
      if (user.subscription.endDate && user.subscription.endDate > now) {
        return true;
      } else {
        // Subscription expired, update status
        await this.handleSubscriptionExpiry(userId);
        return false;
      }
    }
    
    return false;
  }
  
  // Handle subscription expiry
  async handleSubscriptionExpiry(userId) {
    const user = await User.findById(userId);
    if (user.subscription.autoRenew) {
      // Attempt auto-renewal
      // This would trigger payment processing
    } else {
      // Downgrade to free account
      await User.findByIdAndUpdate(userId, {
        accountType: 'free',
        'subscription.status': 'expired',
        'adDisplaySettings.adsEnabled': true,
        'adDisplaySettings.adsExpiryDate': new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours
        'verification.status': 'not_verified'
      });
    }
  }
  
  // Cancel subscription
  async cancelSubscription(userId, reason) {
    await Subscription.findOneAndUpdate(
      { user: userId },
      {
        status: 'cancelled',
        cancellationRequestedAt: new Date(),
        cancellationReason: reason,
        autoRenew: false
      }
    );
    
    // User remains paid until endDate, then downgrades
    const user = await User.findById(userId);
    if (user.subscription.endDate < new Date()) {
      await this.handleSubscriptionExpiry(userId);
    }
  }
}
```

#### Ad Display Service (`backend/services/adDisplayService.js`) - NEW

```javascript
const User = require('../models/User');
const Ad = require('../models/Ad');
const AdDisplayLog = require('../models/AdDisplayLog');

class AdDisplayService {
  // Check if ads should be displayed for user
  async shouldDisplayAds(userId) {
    const user = await User.findById(userId);
    if (!user) return false;
    
    // Paid accounts: no ads
    if (user.accountType === 'paid' && await this.isSubscriptionActive(userId)) {
      return false;
    }
    
    // Free accounts: check 48-hour rule
    if (user.accountType === 'free') {
      const accountAge = Date.now() - new Date(user.accountCreatedAt).getTime();
      const hoursSinceCreation = accountAge / (1000 * 60 * 60);
      
      if (hoursSinceCreation > 48) {
        return false; // 48 hours passed
      }
      
      // Check if ads are enabled
      if (!user.adDisplaySettings.adsEnabled) {
        return false;
      }
      
      return true;
    }
    
    return false;
  }
  
  // Get ads to display (every 2 minutes rule)
  async getAdsForUser(userId, page) {
    const user = await User.findById(userId);
    
    if (!(await this.shouldDisplayAds(userId))) {
      return [];
    }
    
    // Check last ad display time (2 minutes rule)
    const lastDisplayTime = user.adDisplaySettings.lastAdDisplayTime;
    const now = new Date();
    
    if (lastDisplayTime) {
      const minutesSinceLastAd = (now - lastDisplayTime) / (1000 * 60);
      if (minutesSinceLastAd < 2) {
        return []; // Too soon, don't show ads
      }
    }
    
    // Get random ads
    const ads = await Ad.find({
      status: 'active',
      targetAccountTypes: { $in: ['free', 'all'] }
    }).limit(3);
    
    // Shuffle and select random ads
    const shuffled = ads.sort(() => 0.5 - Math.random());
    const selectedAds = shuffled.slice(0, Math.min(2, shuffled.length)); // Max 2 ads at once
    
    // Log ad display
    for (const ad of selectedAds) {
      await AdDisplayLog.create({
        user: userId,
        adId: ad._id,
        page,
        adType: this.getAdTypeForPage(page),
        accountType: user.accountType
      });
    }
    
    // Update user's last ad display time
    await User.findByIdAndUpdate(userId, {
      'adDisplaySettings.lastAdDisplayTime': now,
      'adDisplaySettings.adDisplayCount': (user.adDisplaySettings.adDisplayCount || 0) + selectedAds.length
    });
    
    return selectedAds;
  }
  
  // Get ad type based on page
  getAdTypeForPage(page) {
    const pageAdMap = {
      'home': 'banner',
      'listing-detail': 'sidebar',
      'search': 'inline',
      'last-page': 'popup'
    };
    return pageAdMap[page] || 'inline';
  }
  
  // Check if should show ads on last page
  async shouldShowAdsOnLastPage(userId) {
    return await this.shouldDisplayAds(userId);
  }
}
```

### 3. Backend Controllers

#### Subscription Controller (`backend/controllers/subscriptionController.js`) - NEW

```javascript
const SubscriptionService = require('../services/subscriptionService');
const Payment = require('../models/Payment');

exports.createSubscription = async (req, res) => {
  try {
    const { plan, paymentMethod, paymentDetails } = req.body;
    const userId = req.user._id;
    
    // Create payment record
    const payment = await Payment.create({
      user: userId,
      type: 'subscription',
      amount: plan === 'monthly_pkr' ? 500 : 7.99,
      currency: plan === 'monthly_pkr' ? 'PKR' : 'USD',
      method: paymentMethod,
      status: 'completed',
      paymentDetails
    });
    
    // Create subscription
    const subscriptionService = new SubscriptionService();
    const subscription = await subscriptionService.createSubscription(
      userId,
      plan,
      payment._id
    );
    
    res.json({
      status: 'success',
      data: { subscription }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const subscriptionService = new SubscriptionService();
    const isActive = await subscriptionService.isSubscriptionActive(userId);
    
    const user = await User.findById(userId);
    
    res.json({
      status: 'success',
      data: {
        accountType: user.accountType,
        subscriptionActive: isActive,
        subscription: user.subscription,
        verificationStatus: user.verification.status
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user._id;
    
    const subscriptionService = new SubscriptionService();
    await subscriptionService.cancelSubscription(userId, reason);
    
    res.json({
      status: 'success',
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
```

#### Ad Display Controller (`backend/controllers/adDisplayController.js`) - NEW

```javascript
const AdDisplayService = require('../services/adDisplayService');

exports.getAdsForPage = async (req, res) => {
  try {
    const { page } = req.query;
    const userId = req.user?._id || null;
    
    const adDisplayService = new AdDisplayService();
    
    if (!userId) {
      // Guest users: show ads
      const ads = await Ad.find({ status: 'active' }).limit(2);
      return res.json({
        status: 'success',
        data: { ads, shouldDisplay: true }
      });
    }
    
    const shouldDisplay = await adDisplayService.shouldDisplayAds(userId);
    const ads = shouldDisplay 
      ? await adDisplayService.getAdsForUser(userId, page || 'home')
      : [];
    
    res.json({
      status: 'success',
      data: {
        ads,
        shouldDisplay,
        accountType: req.user.accountType
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.checkAdDisplayStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const adDisplayService = new AdDisplayService();
    
    const shouldDisplay = await adDisplayService.shouldDisplayAds(userId);
    
    res.json({
      status: 'success',
      data: {
        shouldDisplay,
        accountType: req.user.accountType,
        adsEnabled: req.user.adDisplaySettings?.adsEnabled || false
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
```

### 4. Backend Routes

#### Subscription Routes (`backend/routes/subscriptions.js`) - NEW

```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createSubscription,
  getSubscriptionStatus,
  cancelSubscription
} = require('../controllers/subscriptionController');

router.post('/', protect, createSubscription);
router.get('/status', protect, getSubscriptionStatus);
router.post('/cancel', protect, cancelSubscription);

module.exports = router;
```

#### Ad Display Routes (`backend/routes/adDisplay.js`) - NEW

```javascript
const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  getAdsForPage,
  checkAdDisplayStatus
} = require('../controllers/adDisplayController');

router.get('/ads', optionalAuth, getAdsForPage);
router.get('/status', protect, checkAdDisplayStatus);

module.exports = router;
```

---

## Frontend Implementation

### 1. Account Type Detection

#### Account Service (`js/accountService.js`) - NEW

```javascript
(function() {
  'use strict';
  
  const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
  
  window.AccountService = {
    // Get account type and subscription status
    async getAccountInfo() {
      try {
        const token = localStorage.getItem('mr-token');
        if (!token) {
          return {
            accountType: 'free',
            subscriptionActive: false,
            verificationStatus: 'not_verified'
          };
        }
        
        const response = await fetch(`${API_BASE_URL}/subscriptions/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.data;
        }
        
        return {
          accountType: 'free',
          subscriptionActive: false,
          verificationStatus: 'not_verified'
        };
      } catch (error) {
        console.error('Error fetching account info:', error);
        return {
          accountType: 'free',
          subscriptionActive: false,
          verificationStatus: 'not_verified'
        };
      }
    },
    
    // Check if ads should be displayed
    async shouldDisplayAds() {
      const accountInfo = await this.getAccountInfo();
      return accountInfo.accountType === 'free' && !accountInfo.subscriptionActive;
    },
    
    // Get ads for current page
    async getAdsForPage(page) {
      try {
        const token = localStorage.getItem('mr-token');
        const headers = {
          'Content-Type': 'application/json'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE_URL}/ad-display/ads?page=${page}`, {
          headers
        });
        
        if (response.ok) {
          const data = await response.json();
          return data.data;
        }
        
        return { ads: [], shouldDisplay: false };
      } catch (error) {
        console.error('Error fetching ads:', error);
        return { ads: [], shouldDisplay: false };
      }
    }
  };
})();
```

### 2. Ad Display Component

#### Ad Component (`js/adComponent.js`) - NEW

```javascript
(function() {
  'use strict';
  
  window.AdComponent = {
    // Initialize ad display on page
    async init(page = 'home') {
      const accountInfo = await window.AccountService.getAccountInfo();
      
      // Paid accounts: don't show ads
      if (accountInfo.accountType === 'paid' && accountInfo.subscriptionActive) {
        this.hideAllAds();
        return;
      }
      
      // Free accounts: check if should display
      const adData = await window.AccountService.getAdsForPage(page);
      
      if (adData.shouldDisplay && adData.ads.length > 0) {
        this.displayAds(adData.ads, page);
      } else {
        this.hideAllAds();
      }
    },
    
    // Display ads on page
    displayAds(ads, page) {
      // Remove existing ads
      this.removeExistingAds();
      
      // Display ads based on page type
      switch(page) {
        case 'home':
          this.displayBannerAds(ads);
          break;
        case 'listing-detail':
          this.displaySidebarAds(ads);
          break;
        case 'search':
          this.displayInlineAds(ads);
          break;
        case 'last-page':
          this.displayPopupAds(ads);
          break;
        default:
          this.displayInlineAds(ads);
      }
      
      // Schedule next ad display (2 minutes)
      this.scheduleNextAdDisplay(page);
    },
    
    // Display banner ads
    displayBannerAds(ads) {
      const bannerContainer = document.getElementById('ad-banner-container');
      if (!bannerContainer) return;
      
      ads.forEach((ad, index) => {
        const adElement = this.createAdElement(ad, 'banner');
        if (index === 0) {
          bannerContainer.appendChild(adElement);
        }
      });
    },
    
    // Display sidebar ads
    displaySidebarAds(ads) {
      const sidebarContainer = document.getElementById('ad-sidebar-container');
      if (!sidebarContainer) return;
      
      ads.forEach(ad => {
        const adElement = this.createAdElement(ad, 'sidebar');
        sidebarContainer.appendChild(adElement);
      });
    },
    
    // Display inline ads
    displayInlineAds(ads) {
      const inlineContainer = document.getElementById('ad-inline-container');
      if (!inlineContainer) return;
      
      ads.forEach(ad => {
        const adElement = this.createAdElement(ad, 'inline');
        inlineContainer.appendChild(adElement);
      });
    },
    
    // Display popup ads (last page)
    displayPopupAds(ads) {
      if (ads.length === 0) return;
      
      const popup = document.createElement('div');
      popup.id = 'ad-popup';
      popup.className = 'ad-popup';
      popup.innerHTML = `
        <div class="ad-popup-content">
          <button class="ad-popup-close" onclick="window.AdComponent.closePopup()">&times;</button>
          ${ads.map(ad => this.createAdHTML(ad, 'popup')).join('')}
        </div>
      `;
      
      document.body.appendChild(popup);
    },
    
    // Create ad element
    createAdElement(ad, type) {
      const div = document.createElement('div');
      div.className = `ad-container ad-${type}`;
      div.innerHTML = this.createAdHTML(ad, type);
      return div;
    },
    
    // Create ad HTML
    createAdHTML(ad, type) {
      return `
        <div class="ad-wrapper">
          <a href="${ad.link}" target="_blank" rel="noopener noreferrer" class="ad-link">
            ${ad.image ? `<img src="${ad.image}" alt="${ad.title}" class="ad-image">` : ''}
            <div class="ad-content">
              <h4 class="ad-title">${ad.title}</h4>
              ${ad.description ? `<p class="ad-description">${ad.description}</p>` : ''}
            </div>
          </a>
          <div class="ad-label">Ad</div>
        </div>
      `;
    },
    
    // Schedule next ad display (2 minutes)
    scheduleNextAdDisplay(page) {
      setTimeout(() => {
        this.init(page);
      }, 2 * 60 * 1000); // 2 minutes
    },
    
    // Hide all ads
    hideAllAds() {
      this.removeExistingAds();
    },
    
    // Remove existing ads
    removeExistingAds() {
      document.querySelectorAll('.ad-container, #ad-popup').forEach(el => el.remove());
    },
    
    // Close popup
    closePopup() {
      const popup = document.getElementById('ad-popup');
      if (popup) {
        popup.remove();
      }
    }
  };
})();
```

### 3. Verification Badge Component

#### Verification Badge (`js/verificationBadge.js`) - NEW

```javascript
(function() {
  'use strict';
  
  window.VerificationBadge = {
    // Update verification badge based on account type
    async updateBadge() {
      const accountInfo = await window.AccountService.getAccountInfo();
      
      const badgeElements = document.querySelectorAll('.verification-badge, .account-badge');
      
      badgeElements.forEach(badge => {
        if (accountInfo.accountType === 'paid' && accountInfo.subscriptionActive) {
          badge.className = 'verification-badge verified';
          badge.innerHTML = `
            <i class="bi bi-shield-check-fill"></i>
            <span>Verified Customer</span>
          `;
        } else {
          badge.className = 'verification-badge not-verified';
          badge.innerHTML = `
            <i class="bi bi-shield-exclamation"></i>
            <span>Not Verified</span>
          `;
        }
      });
    },
    
    // Initialize on page load
    init() {
      this.updateBadge();
      
      // Update when account info changes
      window.addEventListener('accountInfoUpdated', () => {
        this.updateBadge();
      });
    }
  };
  
  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.VerificationBadge.init();
    });
  } else {
    window.VerificationBadge.init();
  }
})();
```

### 4. Review Visibility Control

#### Review Filter (`js/reviewFilter.js`) - NEW

```javascript
(function() {
  'use strict';
  
  window.ReviewFilter = {
    // Filter reviews based on account type
    async filterReviews() {
      const accountInfo = await window.AccountService.getAccountInfo();
      
      // Free accounts: hide reviews
      if (accountInfo.accountType === 'free' && !accountInfo.subscriptionActive) {
        document.querySelectorAll('.review-section, .reviews-container').forEach(el => {
          el.style.display = 'none';
        });
        
        // Show message
        const message = document.createElement('div');
        message.className = 'review-disabled-message';
        message.innerHTML = `
          <p>Reviews are only available for verified paid accounts.</p>
          <a href="subscription.html" class="btn-upgrade">Upgrade to Premium</a>
        `;
        
        document.querySelectorAll('.review-section, .reviews-container').forEach(container => {
          container.appendChild(message);
        });
      } else {
        // Paid accounts: show reviews
        document.querySelectorAll('.review-section, .reviews-container').forEach(el => {
          el.style.display = '';
        });
      }
    },
    
    init() {
      this.filterReviews();
      
      window.addEventListener('accountInfoUpdated', () => {
        this.filterReviews();
      });
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ReviewFilter.init();
    });
  } else {
    window.ReviewFilter.init();
  }
})();
```

---

## Test Account Creation

### Script: `backend/scripts/create-test-accounts.js`

```javascript
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

async function createTestAccounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myrental');
    
    // Free test accounts
    const freeAccounts = [
      {
        email: 'free1@test.com',
        name: 'Free User 1',
        password: await bcrypt.hash('password123', 10),
        accountType: 'free',
        role: 'renter',
        accountCreatedAt: new Date(),
        adDisplaySettings: {
          adsEnabled: true,
          adsExpiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000)
        },
        verification: {
          status: 'not_verified'
        }
      },
      {
        email: 'free2@test.com',
        name: 'Free User 2',
        password: await bcrypt.hash('password123', 10),
        accountType: 'free',
        role: 'owner',
        accountCreatedAt: new Date(),
        adDisplaySettings: {
          adsEnabled: true,
          adsExpiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000)
        },
        verification: {
          status: 'not_verified'
        }
      },
      {
        email: 'free3@test.com',
        name: 'Free User 3',
        password: await bcrypt.hash('password123', 10),
        accountType: 'free',
        role: 'dual_role',
        accountCreatedAt: new Date(),
        adDisplaySettings: {
          adsEnabled: true,
          adsExpiryDate: new Date(Date.now() + 48 * 60 * 60 * 1000)
        },
        verification: {
          status: 'not_verified'
        }
      }
    ];
    
    // Paid test accounts
    const paidAccounts = [
      {
        email: 'paid1@test.com',
        name: 'Paid User 1',
        password: await bcrypt.hash('password123', 10),
        accountType: 'paid',
        role: 'renter',
        subscription: {
          status: 'active',
          plan: 'monthly_pkr',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        adDisplaySettings: {
          adsEnabled: false
        },
        verification: {
          status: 'verified',
          verifiedAt: new Date()
        }
      },
      {
        email: 'paid2@test.com',
        name: 'Paid User 2',
        password: await bcrypt.hash('password123', 10),
        accountType: 'paid',
        role: 'owner',
        subscription: {
          status: 'active',
          plan: 'monthly_usd',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        adDisplaySettings: {
          adsEnabled: false
        },
        verification: {
          status: 'verified',
          verifiedAt: new Date()
        }
      },
      {
        email: 'paid3@test.com',
        name: 'Paid User 3',
        password: await bcrypt.hash('password123', 10),
        accountType: 'paid',
        role: 'dual_role',
        subscription: {
          status: 'active',
          plan: 'monthly_pkr',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          autoRenew: true
        },
        adDisplaySettings: {
          adsEnabled: false
        },
        verification: {
          status: 'verified',
          verifiedAt: new Date()
        }
      }
    ];
    
    // Create free accounts
    console.log('Creating free test accounts...');
    for (const account of freeAccounts) {
      const existing = await User.findOne({ email: account.email });
      if (!existing) {
        await User.create(account);
        console.log(`✅ Created free account: ${account.email}`);
      } else {
        console.log(`⚠️  Account already exists: ${account.email}`);
      }
    }
    
    // Create paid accounts
    console.log('Creating paid test accounts...');
    for (const account of paidAccounts) {
      const existing = await User.findOne({ email: account.email });
      if (!existing) {
        await User.create(account);
        console.log(`✅ Created paid account: ${account.email}`);
      } else {
        console.log(`⚠️  Account already exists: ${account.email}`);
      }
    }
    
    console.log('\n✅ Test accounts created successfully!');
    console.log('\nFree Accounts:');
    freeAccounts.forEach(acc => console.log(`  - ${acc.email} / password123`));
    console.log('\nPaid Accounts:');
    paidAccounts.forEach(acc => console.log(`  - ${acc.email} / password123`));
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error creating test accounts:', error);
    process.exit(1);
  }
}

createTestAccounts();
```

---

## Implementation Checklist

### Phase 1: Backend Foundation
- [ ] Update User model with account tier fields
- [ ] Create Subscription model
- [ ] Create AdDisplayLog model
- [ ] Create SubscriptionService
- [ ] Create AdDisplayService
- [ ] Create subscription controller
- [ ] Create ad display controller
- [ ] Add subscription routes
- [ ] Add ad display routes
- [ ] Update server.js to include new routes

### Phase 2: Frontend Foundation
- [ ] Create accountService.js
- [ ] Create adComponent.js
- [ ] Create verificationBadge.js
- [ ] Create reviewFilter.js
- [ ] Add ad containers to HTML pages
- [ ] Add verification badge to profile pages
- [ ] Integrate ad display on all pages

### Phase 3: Test Accounts
- [ ] Create test account creation script
- [ ] Run script to create 3 free + 3 paid accounts
- [ ] Verify account creation

### Phase 4: Testing
- [ ] Test free account ad display (48-hour rule)
- [ ] Test paid account (no ads)
- [ ] Test verification badges
- [ ] Test review visibility
- [ ] Test subscription creation
- [ ] Test subscription expiry
- [ ] Test ad display timing (2 minutes)

### Phase 5: Integration
- [ ] Integrate with payment system
- [ ] Add subscription upgrade UI
- [ ] Add subscription management UI
- [ ] Add ad display on last page
- [ ] Test end-to-end flow

---

## API Endpoints Summary

### Subscription Endpoints
- `POST /api/subscriptions` - Create subscription
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions/cancel` - Cancel subscription

### Ad Display Endpoints
- `GET /api/ad-display/ads?page=home` - Get ads for page
- `GET /api/ad-display/status` - Check ad display status

---

## Future Enhancements

1. **Additional Account Tiers:**
   - Premium Plus (Rs. 1000/month)
   - Enterprise (Custom pricing)
   - Student Discount (50% off)

2. **Advanced Ad Features:**
   - Ad targeting based on user interests
   - Ad performance analytics
   - A/B testing for ads

3. **Subscription Features:**
   - Annual plans (discount)
   - Family plans
   - Gift subscriptions

---

**Document Status:** Ready for Implementation  
**Estimated Implementation Time:** 5-7 days  
**Priority:** High

