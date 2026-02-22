// Create Listing Page Functionality
// Dynamic form based on category selection

(function() {
    'use strict';

    let currentStep = 1;
    let uploadedImages = [];
    let uploadedVideo = null;
    let selectedCategory = '';
    let selectedSubcategory = '';

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initCreateListing();
        console.log('✅ Create listing page initialized');
    });

    // Initialize create listing form
    function initCreateListing() {
        // Set minimum date for availability calendar
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('availableFrom')?.setAttribute('min', today);
        document.getElementById('availableTo')?.setAttribute('min', today);

        // Description character counter
        const descriptionInput = document.getElementById('description');
        if (descriptionInput) {
            descriptionInput.addEventListener('input', function() {
                const count = this.value.length;
                const countElement = document.getElementById('description-count');
                if (countElement) {
                    countElement.textContent = count;
                }
            });
        }

        // Update availableTo min date when availableFrom changes
        const availableFrom = document.getElementById('availableFrom');
        const availableTo = document.getElementById('availableTo');
        if (availableFrom && availableTo) {
            availableFrom.addEventListener('change', function() {
                if (this.value) {
                    availableTo.setAttribute('min', this.value);
                }
            });
        }
    }

    // Handle category change
    window.handleCategoryChange = function() {
        const categorySelect = document.getElementById('category');
        const subcategoryGroup = document.getElementById('subcategory-group');
        const subcategorySelect = document.getElementById('subcategory');
        
        const previousCategory = selectedCategory;
        selectedCategory = categorySelect.value;
        
        // Reset subcategory when category changes to prevent mismatched pairs
        if (previousCategory && previousCategory !== selectedCategory) {
            selectedSubcategory = '';
            if (subcategorySelect) {
                subcategorySelect.value = '';
            }
        }
        
        if (selectedCategory) {
            subcategoryGroup.style.display = 'block';
            loadSubcategories(selectedCategory);
        } else {
            subcategoryGroup.style.display = 'none';
            subcategorySelect.innerHTML = '<option value="">Select a subcategory</option>';
            selectedSubcategory = '';
        }
        
        // Load dynamic fields for the category
        loadDynamicFields(selectedCategory);
    };

    // Load subcategories based on category
    function loadSubcategories(categoryId) {
        const subcategorySelect = document.getElementById('subcategory');
        if (!subcategorySelect) return;

        // Get subcategories from categoryData (from category.js)
        const category = categoryData[categoryId];
        if (!category || !category.subcategories) {
            subcategorySelect.innerHTML = '<option value="">No subcategories available</option>';
            return;
        }

        subcategorySelect.innerHTML = '<option value="">Select a subcategory</option>';
        category.subcategories.forEach(subcat => {
            const option = document.createElement('option');
            option.value = subcat.id;
            option.textContent = subcat.name;
            subcategorySelect.appendChild(option);
        });
    }

    // Handle subcategory change
    window.handleSubcategoryChange = function() {
        const subcategorySelect = document.getElementById('subcategory');
        selectedSubcategory = subcategorySelect.value;
        
        // Validate that subcategory belongs to selected category
        if (selectedCategory && selectedSubcategory) {
            const category = categoryData[selectedCategory];
            if (category && category.subcategories) {
                const isValidSubcategory = category.subcategories.some(
                    subcat => subcat.id === selectedSubcategory || 
                             subcat.id.replace(/-/g, '_') === selectedSubcategory.replace(/-/g, '_')
                );
                if (!isValidSubcategory) {
                    console.warn(`Subcategory "${selectedSubcategory}" does not belong to category "${selectedCategory}"`);
                    // Reset subcategory if invalid
                    subcategorySelect.value = '';
                    selectedSubcategory = '';
                    alert(`Invalid subcategory selection. Please select a valid subcategory for ${category.name}.`);
                    return;
                }
            }
        }
        
        loadDynamicFields(selectedCategory, selectedSubcategory);
    };

    // Load dynamic fields based on category
    function loadDynamicFields(categoryId, subcategoryId = '') {
        const dynamicFieldsContainer = document.getElementById('dynamic-fields');
        if (!dynamicFieldsContainer) return;

        let fieldsHTML = '';

        // Common fields for all categories
        if (categoryId === 'property') {
            fieldsHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label for="bedrooms" class="form-label">
                            <i class="bi bi-door-open"></i>
                            <span>Bedrooms</span>
                        </label>
                        <input type="number" id="bedrooms" name="bedrooms" class="form-control" min="0" placeholder="0">
                    </div>
                    <div class="form-group">
                        <label for="bathrooms" class="form-label">
                            <i class="bi bi-droplet"></i>
                            <span>Bathrooms</span>
                        </label>
                        <input type="number" id="bathrooms" name="bathrooms" class="form-control" min="0" placeholder="0">
                    </div>
                </div>
                <div class="form-group">
                    <label for="area" class="form-label">
                        <i class="bi bi-rulers"></i>
                        <span>Area (sq ft)</span>
                    </label>
                    <input type="number" id="area" name="area" class="form-control" min="0" placeholder="e.g., 1200">
                </div>
                <div class="form-group">
                    <label for="furnished" class="form-label">
                        <i class="bi bi-house-check"></i>
                        <span>Furnishing</span>
                    </label>
                    <select id="furnished" name="furnished" class="form-control">
                        <option value="">Select</option>
                        <option value="furnished">Furnished</option>
                        <option value="unfurnished">Unfurnished</option>
                        <option value="semi-furnished">Semi-Furnished</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">
                        <i class="bi bi-star"></i>
                        <span>Amenities</span>
                    </label>
                    <div class="amenities-grid">
                        <label class="amenity-checkbox">
                            <input type="checkbox" name="amenities" value="wifi">
                            <span><i class="bi bi-wifi"></i> WiFi</span>
                        </label>
                        <label class="amenity-checkbox">
                            <input type="checkbox" name="amenities" value="parking">
                            <span><i class="bi bi-car-front"></i> Parking</span>
                        </label>
                        <label class="amenity-checkbox">
                            <input type="checkbox" name="amenities" value="ac">
                            <span><i class="bi bi-snow"></i> Air Conditioning</span>
                        </label>
                        <label class="amenity-checkbox">
                            <input type="checkbox" name="amenities" value="heating">
                            <span><i class="bi bi-thermometer-sun"></i> Heating</span>
                        </label>
                        <label class="amenity-checkbox">
                            <input type="checkbox" name="amenities" value="kitchen">
                            <span><i class="bi bi-egg-fried"></i> Kitchen</span>
                        </label>
                        <label class="amenity-checkbox">
                            <input type="checkbox" name="amenities" value="pool">
                            <span><i class="bi bi-water"></i> Pool</span>
                        </label>
                        <label class="amenity-checkbox">
                            <input type="checkbox" name="amenities" value="gym">
                            <span><i class="bi bi-activity"></i> Gym</span>
                        </label>
                        <label class="amenity-checkbox">
                            <input type="checkbox" name="amenities" value="security">
                            <span><i class="bi bi-shield-check"></i> Security</span>
                        </label>
                    </div>
                </div>
            `;
        } else if (categoryId === 'vehicles') {
            fieldsHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label for="make" class="form-label">
                            <i class="bi bi-car-front"></i>
                            <span>Make/Brand</span>
                        </label>
                        <input type="text" id="make" name="make" class="form-control" placeholder="e.g., Toyota">
                    </div>
                    <div class="form-group">
                        <label for="model" class="form-label">
                            <i class="bi bi-tag"></i>
                            <span>Model</span>
                        </label>
                        <input type="text" id="model" name="model" class="form-control" placeholder="e.g., Corolla">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="year" class="form-label">
                            <i class="bi bi-calendar"></i>
                            <span>Year</span>
                        </label>
                        <input type="number" id="year" name="year" class="form-control" min="1900" max="2025" placeholder="2020">
                    </div>
                    <div class="form-group">
                        <label for="mileage" class="form-label">
                            <i class="bi bi-speedometer2"></i>
                            <span>Mileage (km)</span>
                        </label>
                        <input type="number" id="mileage" name="mileage" class="form-control" min="0" placeholder="50000">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="fuelType" class="form-label">
                            <i class="bi bi-fuel-pump"></i>
                            <span>Fuel Type</span>
                        </label>
                        <select id="fuelType" name="fuelType" class="form-control">
                            <option value="">Select</option>
                            <option value="petrol">Petrol</option>
                            <option value="diesel">Diesel</option>
                            <option value="cng">CNG</option>
                            <option value="electric">Electric</option>
                            <option value="hybrid">Hybrid</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="transmission" class="form-label">
                            <i class="bi bi-gear"></i>
                            <span>Transmission</span>
                        </label>
                        <select id="transmission" name="transmission" class="form-control">
                            <option value="">Select</option>
                            <option value="manual">Manual</option>
                            <option value="automatic">Automatic</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="capacity" class="form-label">
                        <i class="bi bi-people"></i>
                        <span>Seating Capacity</span>
                    </label>
                    <input type="number" id="capacity" name="capacity" class="form-control" min="1" placeholder="5">
                </div>
            `;
        } else if (categoryId === 'service-providers') {
            fieldsHTML = `
                <div class="form-group">
                    <label for="serviceType" class="form-label">
                        <i class="bi bi-briefcase"></i>
                        <span>Service Type</span>
                    </label>
                    <select id="serviceType" name="serviceType" class="form-control">
                        <option value="">Select</option>
                        <option value="skilled-worker">Skilled Worker</option>
                        <option value="technical-staff">Technical Staff</option>
                        <option value="event-staff">Event Staff</option>
                        <option value="agricultural-labor">Agricultural Labor</option>
                        <option value="domestic-help">Domestic Help</option>
                        <option value="driver">Driver & Transportation</option>
                        <option value="medical">Medical Services</option>
                        <option value="pilot">Pilot Services</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="experience" class="form-label">
                        <i class="bi bi-award"></i>
                        <span>Years of Experience</span>
                    </label>
                    <input type="number" id="experience" name="experience" class="form-control" min="0" placeholder="5">
                </div>
                <div class="form-group">
                    <label for="certifications" class="form-label">
                        <i class="bi bi-patch-check"></i>
                        <span>Certifications</span>
                    </label>
                    <textarea id="certifications" name="certifications" class="form-control" rows="3" placeholder="List your certifications and qualifications..."></textarea>
                </div>
            `;
        } else {
            // Generic fields for other categories
            fieldsHTML = `
                <div class="form-group">
                    <label for="condition" class="form-label">
                        <i class="bi bi-check-circle"></i>
                        <span>Condition</span>
                    </label>
                    <select id="condition" name="condition" class="form-control">
                        <option value="">Select</option>
                        <option value="new">New</option>
                        <option value="like-new">Like New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="specifications" class="form-label">
                        <i class="bi bi-list-check"></i>
                        <span>Specifications</span>
                    </label>
                    <textarea id="specifications" name="specifications" class="form-control" rows="4" placeholder="Add detailed specifications..."></textarea>
                </div>
            `;
        }

        dynamicFieldsContainer.innerHTML = fieldsHTML;
    }

    // Handle image upload
    window.handleImageUpload = function(event) {
        const files = Array.from(event.target.files);
        const maxFiles = 10;
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (uploadedImages.length + files.length > maxFiles) {
            alert(`You can upload maximum ${maxFiles} images. You already have ${uploadedImages.length} images.`);
            return;
        }

        files.forEach(file => {
            if (file.size > maxSize) {
                alert(`File ${file.name} is too large. Maximum size is 5MB.`);
                return;
            }

            if (!file.type.startsWith('image/')) {
                alert(`File ${file.name} is not an image.`);
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                uploadedImages.push({
                    file: file,
                    url: e.target.result
                });
                displayUploadedImages();
            };
            reader.readAsDataURL(file);
        });
    };

    // Display uploaded images
    function displayUploadedImages() {
        const container = document.getElementById('uploadedImages');
        if (!container) return;

        if (uploadedImages.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = uploadedImages.map((img, index) => `
            <div class="uploaded-image-item">
                <img src="${img.url}" alt="Uploaded image ${index + 1}">
                <button type="button" class="image-remove-btn" onclick="removeImage(${index})">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        `).join('');
    }

    // Remove image
    window.removeImage = function(index) {
        uploadedImages.splice(index, 1);
        displayUploadedImages();
    };

    // Handle video upload
    window.handleVideoUpload = function(event) {
        const file = event.target.files[0];
        const maxSize = 50 * 1024 * 1024; // 50MB

        if (!file) return;

        if (file.size > maxSize) {
            alert('Video file is too large. Maximum size is 50MB.');
            return;
        }

        if (!file.type.startsWith('video/')) {
            alert('Please select a video file.');
            return;
        }

        uploadedVideo = file;
        const reader = new FileReader();
        reader.onload = function(e) {
            const container = document.getElementById('uploadedVideo');
            if (container) {
                container.innerHTML = `
                    <video controls>
                        <source src="${e.target.result}" type="${file.type}">
                        Your browser does not support the video tag.
                    </video>
                    <button type="button" class="image-remove-btn" onclick="removeVideo()" style="top: 1rem; right: 1rem;">
                        <i class="bi bi-x-lg"></i>
                    </button>
                `;
                container.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    };

    // Remove video
    window.removeVideo = function() {
        uploadedVideo = null;
        const container = document.getElementById('uploadedVideo');
        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
        }
        document.getElementById('videoInput').value = '';
    };

    // Navigate to step
    window.goToStep = function(step) {
        // Validate current step before proceeding
        if (!validateCurrentStep()) {
            return;
        }

        // Hide current step
        document.querySelector(`#step${currentStep}`).classList.remove('active');
        document.querySelector(`[data-step="${currentStep}"]`).classList.remove('active');

        // Show new step
        currentStep = step;
        document.querySelector(`#step${currentStep}`).classList.add('active');
        document.querySelector(`[data-step="${currentStep}"]`).classList.add('active');

        // Mark previous steps as completed
        for (let i = 1; i < currentStep; i++) {
            const indicator = document.querySelector(`[data-step="${i}"]`);
            if (indicator) {
                indicator.classList.add('completed');
            }
        }

        // Generate preview on step 4
        if (currentStep === 4) {
            generatePreview();
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Validate current step
    function validateCurrentStep() {
        const currentStepElement = document.querySelector(`#step${currentStep}`);
        if (!currentStepElement) return true;

        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                showError(field.id + '-error', `${field.labels[0]?.textContent || 'This field'} is required`);
                field.focus();
            } else {
                clearError(field.id + '-error');
            }
        });

        // Special validation for step 2 (images)
        if (currentStep === 2) {
            if (uploadedImages.length < 3) {
                isValid = false;
                showError('images-error', 'Please upload at least 3 photos');
            } else {
                clearError('images-error');
            }
        }

        return isValid;
    }

    // Generate preview
    function generatePreview() {
        const previewContent = document.getElementById('previewContent');
        if (!previewContent) return;

        const formData = new FormData(document.getElementById('createListingForm'));
        const previewData = {
            title: document.getElementById('title')?.value || 'N/A',
            category: document.getElementById('category')?.selectedOptions[0]?.text || 'N/A',
            subcategory: document.getElementById('subcategory')?.selectedOptions[0]?.text || 'N/A',
            location: document.getElementById('location')?.value || 'N/A',
            price: document.getElementById('price')?.value || '0',
            pricingModel: document.querySelector('input[name="pricingModel"]:checked')?.value || 'N/A',
            availability: document.querySelector('input[name="availability"]:checked')?.value || 'N/A',
            images: uploadedImages.length,
            video: uploadedVideo ? 'Yes' : 'No'
        };

        previewContent.innerHTML = `
            <div class="preview-item">
                <span class="preview-label">Title:</span>
                <span class="preview-value">${previewData.title}</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">Category:</span>
                <span class="preview-value">${previewData.category}</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">Subcategory:</span>
                <span class="preview-value">${previewData.subcategory}</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">Location:</span>
                <span class="preview-value">${previewData.location}</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">Price:</span>
                <span class="preview-value">Rs ${previewData.price} / ${previewData.pricingModel}</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">Availability:</span>
                <span class="preview-value">${previewData.availability === 'instant' ? 'Instant Booking' : 'Request-Based'}</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">Photos:</span>
                <span class="preview-value">${previewData.images} uploaded</span>
            </div>
            <div class="preview-item">
                <span class="preview-label">Video:</span>
                <span class="preview-value">${previewData.video}</span>
            </div>
        `;
    }

    // Handle form submission
    window.handleListingSubmit = async function(event) {
        event.preventDefault();

        if (!validateCurrentStep()) {
            return;
        }

        const submitBtn = document.getElementById('publishBtn');
        const form = event.target;

        // Check authentication - use correct token key 'mr-token'
        const token = localStorage.getItem('mr-token');
        if (!token) {
            alert('Please log in to create a listing.');
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        // Also verify user has createListing permission
        if (window.hasPermission && !window.hasPermission('createListing')) {
            alert('You need to be an Owner to create listings. Please register or switch to Owner role.');
            return;
        }

        // Disable submit button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinning"></i> Publishing...';
        }

        try {
            // Gather form data
            const title = document.getElementById('title')?.value?.trim() || '';
            const description = document.getElementById('description')?.value?.trim() || '';
            const category = document.getElementById('category')?.value || 'property';
            const subCategory = document.getElementById('subcategory')?.value || '';
            
            // Validate category-subcategory relationship before submission
            if (category && subCategory) {
                const categoryDataObj = categoryData[category];
                if (categoryDataObj && categoryDataObj.subcategories) {
                    const isValidSubcategory = categoryDataObj.subcategories.some(
                        subcat => subcat.id === subCategory || 
                                 subcat.id.replace(/-/g, '_') === subCategory.replace(/-/g, '_')
                    );
                    if (!isValidSubcategory) {
                        throw new Error(`Invalid subcategory "${subCategory}" for category "${category}". Please select a valid subcategory.`);
                    }
                }
            }
            
            if (!subCategory) {
                throw new Error('Please select a subcategory.');
            }
            const address = document.getElementById('location')?.value?.trim() || '';
            const city = document.getElementById('city')?.value || 'Lahore';
            const province = document.getElementById('province')?.value || 'Punjab';
            const price = parseFloat(document.getElementById('price')?.value) || 0;
            const pricingModel = document.querySelector('input[name="pricingModel"]:checked')?.value || 'daily';
            const deposit = parseFloat(document.getElementById('deposit')?.value) || 0;
            const negotiable = document.getElementById('negotiable')?.checked || false;
            
            // Availability settings
            const availabilityType = document.querySelector('input[name="availability"]:checked')?.value || 'request';
            const instantBooking = availabilityType === 'instant';
            const availableFrom = document.getElementById('availableFrom')?.value || '';
            const availableTo = document.getElementById('availableTo')?.value || '';
            const minDuration = parseInt(document.getElementById('minDuration')?.value) || 1;
            const maxDuration = parseInt(document.getElementById('maxDuration')?.value) || 30;
            
            // Cancellation policy
            const cancellationPolicy = document.getElementById('cancellationPolicy')?.value || 'moderate';

            // Coordinates - auto-set based on city if not provided
            const cityCoords = {
                'Lahore': { lat: 31.5204, lng: 74.3587 },
                'Karachi': { lat: 24.8607, lng: 67.0011 },
                'Islamabad': { lat: 33.6844, lng: 73.0479 },
                'Rawalpindi': { lat: 33.5651, lng: 73.0169 },
                'Faisalabad': { lat: 31.4504, lng: 73.1350 },
                'Multan': { lat: 30.1575, lng: 71.5249 },
                'Peshawar': { lat: 34.0151, lng: 71.5249 },
                'Quetta': { lat: 30.1798, lng: 66.9750 },
                'Sialkot': { lat: 32.4945, lng: 74.5229 },
                'Gujranwala': { lat: 32.1877, lng: 74.1945 },
            };
            const coords = cityCoords[city] || { lat: 31.5204, lng: 74.3587 };
            const lat = parseFloat(document.getElementById('lat')?.value) || coords.lat;
            const lng = parseFloat(document.getElementById('lng')?.value) || coords.lng;

            // Collect amenities
            const amenities = [];
            document.querySelectorAll('input[name="amenities"]:checked').forEach(el => {
                amenities.push(el.value);
            });

            // Collect image URLs from uploaded images (use data URLs for now, real app would upload first)
            const images = uploadedImages.map((img, index) => ({
                url: img.url,
                order: index,
            }));

            // Build request body
            const listingData = {
                title,
                description,
                category: category.toLowerCase().replace(/-/g, '_'),
                subCategory: subCategory.toLowerCase().replace(/-/g, '_'),
                pricingModel,
                pricingAmount: price,
                currency: 'PKR',
                deposit,
                negotiable,
                address,
                city,
                province,
                lat,
                lng,
                instantBooking,
                minDuration,
                maxDuration,
                advanceNotice: 24,
                availableFrom,
                availableTo,
                cancellationPolicy,
                amenities,
                images,
                status: 'active', // Publish immediately
            };

            console.log('📝 Creating listing:', listingData);
            console.log('🔑 Using token:', token.substring(0, 20) + '...');

            const API_BASE = window.API_BASE_URL || 'http://localhost:4001/api';
            const res = await fetch(`${API_BASE}/listings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(listingData),
            });

            const data = await res.json();

            console.log('📨 API Response:', res.status, data);

            if (res.ok && data.status === 'success') {
                console.log('✅ Listing created:', data.listing);
                
                // Show success message
                showSuccessToast('Listing created successfully! Redirecting...');
                
                // Redirect to the new listing or my-listings page
                const listingId = data.listing?._id || data.listing?.id;
                setTimeout(() => {
                    if (listingId) {
                        window.location.href = `listing-detail.html?id=${listingId}`;
                    } else {
                        window.location.href = 'my-listings.html';
                    }
                }, 1500);
            } else {
                // Handle validation errors
                if (data.errors && Array.isArray(data.errors)) {
                    throw new Error(data.errors.join('\n'));
                }
                throw new Error(data.message || 'Failed to create listing');
            }
        } catch (error) {
            console.error('Create listing error:', error);
            showError('terms-error', error.message || 'An error occurred. Please try again.');
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Publish Listing';
            }
        }
    };

    // Show success toast notification
    function showSuccessToast(message) {
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `
            <i class="bi bi-check-circle-fill"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Add toast notification styles
    const toastStyle = document.createElement('style');
    toastStyle.textContent = `
        .success-toast {
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: #28a745;
            color: white;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(40, 167, 69, 0.3);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 10000;
            opacity: 0;
            transform: translateX(100px);
            transition: all 0.3s ease;
        }
        .success-toast.show {
            opacity: 1;
            transform: translateX(0);
        }
        .success-toast i {
            font-size: 1.25rem;
        }
    `;
    document.head.appendChild(toastStyle);

    // Show error message
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    // Clear error message
    function clearError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }

    // Add spinning animation
    const style = document.createElement('style');
    style.textContent = `
        .spinning {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .amenities-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 1rem;
        }
        
        .amenity-checkbox {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem;
            border: 1.5px solid #e0e0e0;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: 'Inter', sans-serif;
            font-size: 0.9375rem;
        }
        
        .amenity-checkbox:hover {
            border-color: var(--primary-color);
            background: rgba(255, 56, 92, 0.05);
        }
        
        .amenity-checkbox input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
            accent-color: var(--primary-color);
        }
        
        .amenity-checkbox span {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--text-primary);
        }
        
        .amenity-checkbox input[type="checkbox"]:checked + span {
            color: var(--primary-color);
            font-weight: 600;
        }
    `;
    document.head.appendChild(style);

})();

