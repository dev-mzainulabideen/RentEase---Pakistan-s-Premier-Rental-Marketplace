/**
 * Map Utility Functions
 * Shared map functionality across the platform
 */

// Map instance storage
const mapInstances = new Map();

/**
 * Load Mapbox library
 */
function loadMapbox() {
    if (window.mapboxgl && window.mapboxgl.accessToken) {
        return Promise.resolve(window.mapboxgl);
    }
    
    if (window.mapboxLoading) {
        return new Promise(resolve => {
            const check = setInterval(() => {
                if (window.mapboxgl) {
                    clearInterval(check);
                    resolve(window.mapboxgl);
                }
            }, 100);
        });
    }
    
    window.mapboxLoading = true;
    return new Promise((resolve, reject) => {
        // Check if CSS already loaded
        if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
            const css = document.createElement('link');
            css.rel = 'stylesheet';
            css.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
            document.head.appendChild(css);
        }

        // Check if script already loaded
        if (document.querySelector('script[src*="mapbox-gl.js"]')) {
            if (window.mapboxgl) {
                window.mapboxLoading = false;
                resolve(window.mapboxgl);
                return;
            }
        }

        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
        script.onload = () => {
            window.mapboxLoading = false;
            resolve(window.mapboxgl);
        };
        script.onerror = () => {
            window.mapboxLoading = false;
            reject(new Error('Failed to load Mapbox'));
        };
        document.head.appendChild(script);
    });
}

/**
 * Initialize a map instance
 * @param {string} containerId - ID of the container element
 * @param {Object} options - Map options (center, zoom, style, etc.)
 * @returns {Promise<mapboxgl.Map>}
 */
async function initMap(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        throw new Error(`Container with ID "${containerId}" not found`);
    }

    const token = window.MAPBOX_TOKEN || window.mapboxToken;
    if (!token) {
        container.innerHTML = '<div class="p-4 text-center text-muted"><i class="bi bi-map"></i><p>Map token not configured. Please set MAPBOX_TOKEN.</p></div>';
        return null;
    }

    try {
        const mapboxgl = await loadMapbox();
        mapboxgl.accessToken = token;

        const defaultOptions = {
            container: containerId,
            style: options.style || 'mapbox://styles/mapbox/streets-v12',
            center: options.center || [74.3587, 31.5204], // Default: Lahore
            zoom: options.zoom || 12,
            ...options
        };

        const map = new mapboxgl.Map(defaultOptions);
        
        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        
        // Add geolocate control if requested
        if (options.geolocate !== false) {
            const geolocate = new mapboxgl.GeolocateControl({
                positionOptions: {
                    enableHighAccuracy: true
                },
                trackUserLocation: true,
                showUserHeading: true
            });
            map.addControl(geolocate, 'top-right');
        }

        // Store map instance
        mapInstances.set(containerId, map);

        return map;
    } catch (error) {
        console.error('Error initializing map:', error);
        container.innerHTML = '<div class="p-4 text-center text-danger"><i class="bi bi-exclamation-triangle"></i><p>Failed to load map. Please try again later.</p></div>';
        return null;
    }
}

/**
 * Add a marker to the map
 * @param {mapboxgl.Map} map - Map instance
 * @param {Object} coords - Coordinates {lat, lng}
 * @param {Object} options - Marker options (popup, custom element, etc.)
 * @returns {mapboxgl.Marker}
 */
function addMapMarker(map, coords, options = {}) {
    if (!map || !window.mapboxgl) return null;

    let markerElement = options.element;
    if (!markerElement && options.customMarker) {
        markerElement = createCustomMarker(options.customMarker);
    } else if (!markerElement) {
        markerElement = createDefaultMarker(options.color || '#FF385C');
    }

    const marker = new mapboxgl.Marker({
        element: markerElement,
        anchor: options.anchor || 'bottom'
    })
        .setLngLat([coords.lng, coords.lat]);

    if (options.popup) {
        const popup = new mapboxgl.Popup({
            offset: options.popupOffset || 25,
            maxWidth: options.popupMaxWidth || '300px',
            className: options.popupClassName || ''
        }).setHTML(options.popup);
        marker.setPopup(popup);
    }

    if (options.addToMap !== false) {
        marker.addTo(map);
    }

    return marker;
}

/**
 * Create a default marker element
 */
function createDefaultMarker(color = '#FF385C') {
    const el = document.createElement('div');
    el.className = 'map-marker-default';
    el.style.width = '20px';
    el.style.height = '20px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = color;
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    el.style.cursor = 'pointer';
    return el;
}

/**
 * Create a custom marker element
 */
function createCustomMarker(config) {
    const el = document.createElement('div');
    el.className = 'map-marker-custom';
    el.innerHTML = config.html || '';
    if (config.className) {
        el.classList.add(config.className);
    }
    return el;
}

/**
 * Geocode an address using Mapbox Geocoding API
 * @param {string} query - Address or location query
 * @returns {Promise<Object>} - Geocoding result with coordinates
 */
async function geocodeAddress(query) {
    const token = window.MAPBOX_TOKEN || window.mapboxToken;
    if (!token) {
        throw new Error('Mapbox token not configured');
    }

    try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
            `access_token=${token}&country=pk&limit=1`
        );
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            return {
                coordinates: {
                    lng: feature.center[0],
                    lat: feature.center[1]
                },
                placeName: feature.place_name,
                context: feature.context || []
            };
        }
        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}

/**
 * Reverse geocode coordinates to get address
 * @param {Object} coords - Coordinates {lat, lng}
 * @returns {Promise<string>} - Address string
 */
async function reverseGeocode(coords) {
    const token = window.MAPBOX_TOKEN || window.mapboxToken;
    if (!token) {
        throw new Error('Mapbox token not configured');
    }

    try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?` +
            `access_token=${token}&limit=1`
        );
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            return data.features[0].place_name;
        }
        return null;
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return null;
    }
}

/**
 * Calculate approximate location for privacy (adds random offset)
 * @param {Object} coords - Exact coordinates {lat, lng}
 * @param {number} radiusMeters - Radius in meters (default: 100)
 * @returns {Object} - Approximate coordinates
 */
function getApproximateLocation(coords, radiusMeters = 100) {
    // Convert radius from meters to degrees (approximate)
    const latOffset = (radiusMeters / 111320) * (Math.random() * 2 - 1);
    const lngOffset = (radiusMeters / (111320 * Math.cos(coords.lat * Math.PI / 180))) * (Math.random() * 2 - 1);
    
    return {
        lat: coords.lat + latOffset,
        lng: coords.lng + lngOffset
    };
}

/**
 * Draw a radius circle on the map
 * @param {mapboxgl.Map} map - Map instance
 * @param {Object} center - Center coordinates {lat, lng}
 * @param {number} radiusKm - Radius in kilometers
 * @param {Object} options - Circle options (color, opacity, etc.)
 */
function drawRadiusCircle(map, center, radiusKm, options = {}) {
    if (!map || !window.mapboxgl) return;

    const radiusMeters = radiusKm * 1000;
    const points = 64;
    const circle = [];

    for (let i = 0; i <= points; i++) {
        const angle = (i * 360) / points;
        const lat = center.lat + (radiusMeters / 111320) * Math.cos(angle * Math.PI / 180);
        const lng = center.lng + (radiusMeters / (111320 * Math.cos(center.lat * Math.PI / 180))) * Math.sin(angle * Math.PI / 180);
        circle.push([lng, lat]);
    }

    const sourceId = options.sourceId || 'radius-circle';
    const layerId = options.layerId || 'radius-circle';

    // Remove existing circle if any
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
        map.removeLayer(layerId + '-border');
        map.removeSource(sourceId);
    }

    map.addSource(sourceId, {
        type: 'geojson',
        data: {
            type: 'Feature',
            geometry: {
                type: 'Polygon',
                coordinates: [circle]
            }
        }
    });

    map.addLayer({
        id: layerId,
        type: 'fill',
        source: sourceId,
        paint: {
            'fill-color': options.color || '#FF385C',
            'fill-opacity': options.opacity || 0.1
        }
    });

    map.addLayer({
        id: layerId + '-border',
        type: 'line',
        source: sourceId,
        paint: {
            'line-color': options.color || '#FF385C',
            'line-width': options.width || 2,
            'line-opacity': options.borderOpacity || 0.5
        }
    });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - First coordinates {lat, lng}
 * @param {Object} coord2 - Second coordinates {lat, lng}
 * @returns {number} - Distance in kilometers
 */
function calculateDistance(coord1, coord2) {
    const R = 6371; // Earth's radius in km
    const toRad = deg => deg * Math.PI / 180;
    
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLng = toRad(coord2.lng - coord1.lng);
    const lat1 = toRad(coord1.lat);
    const lat2 = toRad(coord2.lat);
    
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.asin(Math.sqrt(a));
    
    return R * c;
}

// Export functions
window.MapUtils = {
    loadMapbox,
    initMap,
    addMapMarker,
    geocodeAddress,
    reverseGeocode,
    getApproximateLocation,
    drawRadiusCircle,
    calculateDistance,
    mapInstances
};


