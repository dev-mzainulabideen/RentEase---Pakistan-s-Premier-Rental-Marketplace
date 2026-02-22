// Ad Component - Displays ads based on account type and rules
(function() {
    'use strict';
    
    window.AdComponent = {
        // Initialize ad display on page
        async init(page = 'home') {
            try {
                const accountInfo = await window.AccountService.getCachedAccountInfo();
                
                // Paid accounts: don't show ads
                if (accountInfo.accountType === 'paid' && accountInfo.subscriptionActive) {
                    this.hideAllAds();
                    return;
                }
                
                // Free accounts and guests: check if should display
                const adData = await window.AccountService.getAdsForPage(page);
                
                // Debug logging
                console.log('Ad Display Check:', {
                    accountType: accountInfo.accountType,
                    subscriptionActive: accountInfo.subscriptionActive,
                    shouldDisplay: adData.shouldDisplay,
                    adsCount: adData.ads?.length || 0
                });
                
                if (adData.shouldDisplay && adData.ads && adData.ads.length > 0) {
                    this.displayAds(adData.ads, page);
                } else {
                    // For free users, still try to show ads even if shouldDisplay is false
                    // (in case of timing issues with 2-minute rule)
                    if (accountInfo.accountType === 'free' || !accountInfo.accountType) {
                        // Try to fetch ads anyway
                        const fallbackAds = await window.AccountService.getAdsForPage(page);
                        if (fallbackAds.ads && fallbackAds.ads.length > 0) {
                            this.displayAds(fallbackAds.ads, page);
                        } else {
                            this.hideAllAds();
                        }
                } else {
                    this.hideAllAds();
                    }
                }
            } catch (error) {
                console.error('Error initializing ads:', error);
                // For free users, try to show ads even on error
                const accountInfo = await window.AccountService.getCachedAccountInfo().catch(() => ({ accountType: 'free' }));
                if (accountInfo.accountType === 'free' || !accountInfo.accountType) {
                    // Don't hide ads on error for free users - might be a temporary issue
                    console.warn('Ad initialization error, but continuing for free user');
                } else {
                this.hideAllAds();
                }
            }
        },
        
        // Display ads on page
        displayAds(ads, page) {
            // Remove existing ads
            this.removeExistingAds();
            
            if (!ads || ads.length === 0) return;
            
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
            
            // Schedule next ad display check (2 minutes)
            this.scheduleNextAdDisplay(page);
        },
        
        // Display banner ads
        displayBannerAds(ads) {
            let bannerContainer = document.getElementById('ad-banner-container');
            if (!bannerContainer) {
                // Create container if it doesn't exist
                bannerContainer = document.createElement('div');
                bannerContainer.id = 'ad-banner-container';
                bannerContainer.className = 'ad-banner-container';
                
                // Place after hero section or header
                const heroSection = document.querySelector('.hero-section');
                const searchBar = document.querySelector('.global-search-bar-wrapper');
                const header = document.querySelector('header');
                
                if (heroSection && heroSection.nextSibling) {
                    heroSection.parentNode.insertBefore(bannerContainer, heroSection.nextSibling);
                } else if (heroSection) {
                    heroSection.parentNode.appendChild(bannerContainer);
                } else if (searchBar && searchBar.nextSibling) {
                    searchBar.parentNode.insertBefore(bannerContainer, searchBar.nextSibling);
                } else if (searchBar) {
                    searchBar.parentNode.appendChild(bannerContainer);
                } else if (header && header.nextSibling) {
                    header.parentNode.insertBefore(bannerContainer, header.nextSibling);
                } else if (header) {
                    header.parentNode.appendChild(bannerContainer);
                } else {
                    // Fallback: add to body after header
                    const main = document.querySelector('main');
                    if (main) {
                        main.insertBefore(bannerContainer, main.firstChild);
                    } else {
                    document.body.insertBefore(bannerContainer, document.body.firstChild);
                    }
                }
            } else {
                // Clear existing ads
                bannerContainer.innerHTML = '';
            }
            
            // Display ads (show up to 2 in banner)
            ads.slice(0, 2).forEach((ad) => {
                    const adElement = this.createAdElement(ad, 'banner');
                    bannerContainer.appendChild(adElement);
            });
        },
        
        // Display sidebar ads
        displaySidebarAds(ads) {
            let sidebarContainer = document.getElementById('ad-sidebar-container');
            if (!sidebarContainer) {
                sidebarContainer = document.createElement('div');
                sidebarContainer.id = 'ad-sidebar-container';
                sidebarContainer.className = 'ad-sidebar-container';
                
                // Find listing detail wrapper or main content
                const listingWrapper = document.querySelector('.listing-detail-wrapper');
                const mainContent = document.querySelector('main') || document.querySelector('.container');
                
                if (listingWrapper) {
                    // Insert as right column in listing detail
                    listingWrapper.appendChild(sidebarContainer);
                } else if (mainContent) {
                    mainContent.appendChild(sidebarContainer);
                } else {
                    document.body.appendChild(sidebarContainer);
                }
            } else {
                // Clear existing ads
                sidebarContainer.innerHTML = '';
            }
            
            ads.forEach(ad => {
                const adElement = this.createAdElement(ad, 'sidebar');
                sidebarContainer.appendChild(adElement);
            });
        },
        
        // Display inline ads
        displayInlineAds(ads) {
            let inlineContainer = document.getElementById('ad-inline-container');
            if (!inlineContainer) {
                inlineContainer = document.createElement('div');
                inlineContainer.id = 'ad-inline-container';
                inlineContainer.className = 'ad-inline-container';
                
                // Find best insertion point
                const mainContent = document.querySelector('main') || document.querySelector('.container');
                const searchResults = document.querySelector('.search-results') || document.querySelector('.listings-grid');
                
                if (searchResults && searchResults.parentNode) {
                    // Insert before search results
                    searchResults.parentNode.insertBefore(inlineContainer, searchResults);
                } else if (mainContent) {
                    // Insert at top of main content
                    if (mainContent.firstChild) {
                        mainContent.insertBefore(inlineContainer, mainContent.firstChild);
                    } else {
                        mainContent.appendChild(inlineContainer);
                    }
                } else {
                    document.body.appendChild(inlineContainer);
                }
            } else {
                // Clear existing ads
                inlineContainer.innerHTML = '';
            }
            
            ads.forEach(ad => {
                const adElement = this.createAdElement(ad, 'inline');
                inlineContainer.appendChild(adElement);
            });
        },
        
        // Display popup ads (last page)
        displayPopupAds(ads) {
            if (ads.length === 0) return;
            
            // Remove existing popup
            const existingPopup = document.getElementById('ad-popup');
            if (existingPopup) {
                existingPopup.remove();
            }
            
            const popup = document.createElement('div');
            popup.id = 'ad-popup';
            popup.className = 'ad-popup';
            popup.innerHTML = `
                <div class="ad-popup-content">
                    <button class="ad-popup-close" onclick="window.AdComponent.closePopup()" aria-label="Close ad">&times;</button>
                    ${ads.map(ad => this.createAdHTML(ad, 'popup')).join('')}
                </div>
            `;
            
            document.body.appendChild(popup);
            
            // Auto-close after 10 seconds
            setTimeout(() => {
                this.closePopup();
            }, 10000);
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
            const adType = ad.adType || (ad.video ? 'video' : 'image');
            const videoId = `ad-video-${ad._id || Date.now()}`;
            
            let mediaHTML = '';
            if (adType === 'video' && ad.video) {
                mediaHTML = `
                    <video 
                        id="${videoId}"
                        class="ad-video" 
                        ${ad.videoThumbnail ? `poster="${ad.videoThumbnail}"` : ''}
                        ${ad.videoAutoplay ? 'autoplay' : ''}
                        ${ad.videoMuted !== false ? 'muted' : ''}
                        ${ad.videoLoop !== false ? 'loop' : ''}
                        playsinline
                        preload="metadata"
                        onclick="window.AdComponent.toggleVideoPlay('${videoId}')"
                    >
                        <source src="${ad.video}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <div class="ad-video-controls">
                        <button class="ad-video-play-pause" onclick="window.AdComponent.toggleVideoPlay('${videoId}')" aria-label="Play/Pause">
                            <i class="bi bi-play-fill"></i>
                        </button>
                    </div>
                `;
            } else if (ad.image) {
                mediaHTML = `<img src="${ad.image}" alt="${ad.title || 'Advertisement'}" class="ad-image" loading="lazy">`;
            }
            
            return `
                <div class="ad-wrapper ad-wrapper-${adType}">
                    <a href="${ad.link || '#'}" target="_blank" rel="noopener noreferrer" class="ad-link" onclick="window.AdComponent.trackClick('${ad._id}')">
                        <div class="ad-media">
                            ${mediaHTML}
                        </div>
                        ${(ad.title || ad.content) ? `
                        <div class="ad-content">
                            ${ad.title ? `<h4 class="ad-title">${ad.title}</h4>` : ''}
                            ${ad.content ? `<p class="ad-description">${ad.content}</p>` : ''}
                        </div>
                        ` : ''}
                    </a>
                    <div class="ad-label">Advertisement</div>
                </div>
            `;
        },
        
        // Toggle video play/pause
        toggleVideoPlay(videoId) {
            const video = document.getElementById(videoId);
            if (!video) return;
            
            const playPauseBtn = video.closest('.ad-wrapper')?.querySelector('.ad-video-play-pause');
            
            if (video.paused) {
                video.play().then(() => {
                    if (playPauseBtn) {
                        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
                        playPauseBtn.setAttribute('aria-label', 'Pause');
                    }
                }).catch(err => {
                    console.error('Error playing video:', err);
                });
            } else {
                video.pause();
                if (playPauseBtn) {
                    playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
                    playPauseBtn.setAttribute('aria-label', 'Play');
                }
            }
        },
        
        // Initialize video event listeners
        initVideoListeners() {
            // Handle video play/pause on click
            document.addEventListener('click', (e) => {
                const video = e.target.closest('.ad-video');
                if (video && !e.target.closest('.ad-video-play-pause')) {
                    e.preventDefault();
                    this.toggleVideoPlay(video.id);
                }
            });
            
            // Update play/pause button on video events
            document.addEventListener('play', (e) => {
                if (e.target.classList.contains('ad-video')) {
                    const playPauseBtn = e.target.closest('.ad-wrapper')?.querySelector('.ad-video-play-pause');
                    if (playPauseBtn) {
                        playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
                    }
                }
            }, true);
            
            document.addEventListener('pause', (e) => {
                if (e.target.classList.contains('ad-video')) {
                    const playPauseBtn = e.target.closest('.ad-wrapper')?.querySelector('.ad-video-play-pause');
                    if (playPauseBtn) {
                        playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
                    }
                }
            }, true);
        },
        
        // Track ad click
        trackClick(adId) {
            // Track click in backend (optional)
            console.log('Ad clicked:', adId);
        },
        
        // Schedule next ad display check (2 minutes)
        scheduleNextAdDisplay(page) {
            // Clear existing timeout
            if (this._adTimeout) {
                clearTimeout(this._adTimeout);
            }
            
            this._adTimeout = setTimeout(() => {
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
    
    // Detect page type
    function detectPageType() {
        const path = window.location.pathname.toLowerCase();
        const searchParams = new URLSearchParams(window.location.search);
        
        // Check for confirmation/success pages
        if (path.includes('confirmation') || path.includes('success') || 
            path.includes('booking-complete') || path.includes('payment-success') ||
            searchParams.get('success') === 'true' || searchParams.get('confirmed') === 'true') {
            return 'last-page'; // Show popup ads on confirmation pages
        }
        
        // Check for other page types
        if (path.includes('listing-detail') || path.includes('listing')) return 'listing-detail';
        if (path.includes('search')) return 'search';
        if (path.includes('booking') && path.includes('complete')) return 'last-page';
        if (path === '/' || path.includes('index')) return 'home';
        
        return 'home';
    }
    
    // Initialize ads function
    function initializeAds() {
        // Wait for AccountService to be available
        if (typeof window.AccountService === 'undefined') {
            setTimeout(initializeAds, 100);
            return;
        }
        
        // Initialize video listeners
        window.AdComponent.initVideoListeners();
        
        // Auto-detect page type
        const page = detectPageType();
        window.AdComponent.init(page);
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAds);
    } else {
        // DOM already loaded
        setTimeout(initializeAds, 100);
    }
    
    // Also initialize when page becomes visible (for SPA navigation)
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            setTimeout(initializeAds, 500);
        }
    });
})();

