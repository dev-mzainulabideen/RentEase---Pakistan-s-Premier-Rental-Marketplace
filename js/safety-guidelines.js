// Safety Guidelines Page
(function() {
    'use strict';

    const CATEGORY_SAFETY_GUIDELINES = {
        property: {
            name: 'Property',
            icon: 'bi-house-door',
            guidelines: [
                {
                    title: 'Inspection on Arrival',
                    description: 'Always inspect keys, locks, and security systems on arrival. Report any issues immediately through the app chat.',
                    priority: 'high'
                },
                {
                    title: 'Secure Payments Only',
                    description: 'Never pay cash outside the platform. Use MyRental secure payments only. Avoid direct bank transfers.',
                    priority: 'high'
                },
                {
                    title: 'Document Verification',
                    description: 'Keep a copy of your CNIC and booking confirmation when checking in. Verify property ownership documents if possible.',
                    priority: 'medium'
                },
                {
                    title: 'Safety Equipment',
                    description: 'Check for fire extinguishers, smoke detectors, and emergency exits. Know the location of emergency contacts.',
                    priority: 'high'
                },
                {
                    title: 'Neighborhood Awareness',
                    description: 'Research the neighborhood before booking. Be aware of local emergency services and nearby facilities.',
                    priority: 'medium'
                },
                {
                    title: 'Guest Limits',
                    description: 'Respect the maximum guest limit. Unauthorized guests may violate terms and create safety issues.',
                    priority: 'medium'
                }
            ]
        },
        vehicles: {
            name: 'Vehicles',
            icon: 'bi-car-front',
            guidelines: [
                {
                    title: 'Document Verification',
                    description: 'Verify original documents (registration, token tax, insurance) before taking the vehicle. Check expiry dates.',
                    priority: 'high'
                },
                {
                    title: 'Pre-Rental Inspection',
                    description: 'Photograph existing scratches, dents, and damage in front of the owner before driving. Note fuel level.',
                    priority: 'high'
                },
                {
                    title: 'Safety Equipment',
                    description: 'Use helmet/seat belt and follow local traffic laws at all times. Check for first aid kit and emergency tools.',
                    priority: 'high'
                },
                {
                    title: 'Valid License',
                    description: 'Ensure you have a valid driving license for the vehicle type. Some vehicles require special licenses.',
                    priority: 'high'
                },
                {
                    title: 'Insurance Coverage',
                    description: 'Verify insurance coverage before driving. Understand what is covered and what is not.',
                    priority: 'high'
                },
                {
                    title: 'Emergency Contacts',
                    description: 'Keep owner contact information and roadside assistance numbers handy during the rental period.',
                    priority: 'medium'
                }
            ]
        },
        equipment: {
            name: 'Equipment',
            icon: 'bi-tools',
            guidelines: [
                {
                    title: 'Pre-Use Testing',
                    description: 'Test equipment before accepting it and note any existing faults. Document all issues with photos.',
                    priority: 'high'
                },
                {
                    title: 'Safety Gear',
                    description: 'Use appropriate safety gear (gloves, goggles, helmets) for heavy or electrical items. Never skip safety equipment.',
                    priority: 'high'
                },
                {
                    title: 'Power Safety',
                    description: 'Turn off main power and follow manufacturer instructions during use. Check for proper grounding.',
                    priority: 'high'
                },
                {
                    title: 'Weight Limits',
                    description: 'Respect weight and capacity limits. Overloading equipment can cause accidents and damage.',
                    priority: 'medium'
                },
                {
                    title: 'Maintenance Records',
                    description: 'Ask for maintenance records if available. Well-maintained equipment is safer to use.',
                    priority: 'medium'
                },
                {
                    title: 'Proper Storage',
                    description: 'Store equipment properly when not in use. Protect from weather and unauthorized access.',
                    priority: 'low'
                }
            ]
        },
        service_providers: {
            name: 'Service Providers',
            icon: 'bi-people',
            guidelines: [
                {
                    title: 'Platform Communication',
                    description: 'Share exact job details only via app chat, not on personal messengers. Keep all communication documented.',
                    priority: 'high'
                },
                {
                    title: 'Payment Terms',
                    description: 'Do not hand over full payment until the agreed work is completed. Use milestone payments for large projects.',
                    priority: 'high'
                },
                {
                    title: 'Privacy Protection',
                    description: 'Avoid sharing sensitive documents or passwords with service providers. Use secure methods for document sharing.',
                    priority: 'high'
                },
                {
                    title: 'Verification',
                    description: 'Verify service provider credentials and reviews before hiring. Check for verified badges.',
                    priority: 'medium'
                },
                {
                    title: 'Work Supervision',
                    description: 'Supervise work when possible, especially for home services. Be present during initial setup.',
                    priority: 'medium'
                },
                {
                    title: 'Background Check',
                    description: 'For sensitive services, request background verification. Use only verified service providers.',
                    priority: 'medium'
                }
            ]
        },
        animals: {
            name: 'Animals',
            icon: 'bi-heart',
            guidelines: [
                {
                    title: 'Gentle Handling',
                    description: 'Handle animals gently and follow all welfare guidelines. Never use force or intimidation.',
                    priority: 'high'
                },
                {
                    title: 'Health Records',
                    description: 'Confirm vaccination/deworming record with the owner before handover. Check for health certificates.',
                    priority: 'high'
                },
                {
                    title: 'Child Safety',
                    description: 'Never leave children unsupervised around large animals. Teach children proper animal interaction.',
                    priority: 'high'
                },
                {
                    title: 'Feeding Instructions',
                    description: 'Follow exact feeding instructions provided by the owner. Some animals have dietary restrictions.',
                    priority: 'medium'
                },
                {
                    title: 'Emergency Vet',
                    description: 'Know the location of the nearest veterinary clinic. Keep emergency vet contact information.',
                    priority: 'medium'
                },
                {
                    title: 'Behavioral Notes',
                    description: 'Ask about animal behavior, triggers, and special needs. Understand the animal\'s temperament.',
                    priority: 'medium'
                }
            ]
        },
        boat: {
            name: 'Boat',
            icon: 'bi-water',
            guidelines: [
                {
                    title: 'Life Jackets',
                    description: 'Always wear a life jacket provided by the operator. Ensure all passengers have proper safety equipment.',
                    priority: 'high'
                },
                {
                    title: 'Weather Check',
                    description: 'Check local weather conditions before departure and avoid overloading. Cancel if weather is unsafe.',
                    priority: 'high'
                },
                {
                    title: 'Safety Briefings',
                    description: 'Follow crew safety briefings and do not stand at edges while boat is moving. Know emergency procedures.',
                    priority: 'high'
                },
                {
                    title: 'Swimming Ability',
                    description: 'Ensure all passengers can swim or are properly supervised. Inform operator of non-swimmers.',
                    priority: 'medium'
                },
                {
                    title: 'Equipment Check',
                    description: 'Verify safety equipment (life jackets, flares, first aid) before departure. Check communication devices.',
                    priority: 'high'
                },
                {
                    title: 'Operator License',
                    description: 'Verify operator has valid license and experience. Check boat registration and insurance.',
                    priority: 'high'
                }
            ]
        },
        air_transport: {
            name: 'Air Transport',
            icon: 'bi-airplane',
            guidelines: [
                {
                    title: 'Operator Credentials',
                    description: 'Verify pilot credentials and aircraft registration. Check for valid licenses and certifications.',
                    priority: 'high'
                },
                {
                    title: 'Aircraft Inspection',
                    description: 'Request to see maintenance records and recent inspection certificates. Safety is paramount.',
                    priority: 'high'
                },
                {
                    title: 'Weather Conditions',
                    description: 'Check weather conditions before flight. Understand cancellation policies for weather-related issues.',
                    priority: 'high'
                },
                {
                    title: 'Insurance Coverage',
                    description: 'Verify insurance coverage for passengers and cargo. Understand liability and coverage limits.',
                    priority: 'high'
                },
                {
                    title: 'Safety Briefing',
                    description: 'Pay attention to safety briefings. Know emergency procedures and equipment locations.',
                    priority: 'high'
                },
                {
                    title: 'Medical Conditions',
                    description: 'Inform operator of any medical conditions that may affect flight safety. Follow medical advice.',
                    priority: 'medium'
                }
            ]
        },
        clothes: {
            name: 'Clothes',
            icon: 'bi-bag',
            guidelines: [
                {
                    title: 'Condition Inspection',
                    description: 'Inspect items for stains, tears, or damage before accepting. Document any existing issues with photos.',
                    priority: 'medium'
                },
                {
                    title: 'Size Verification',
                    description: 'Verify sizes match your requirements. Check measurements if available. Try on if possible.',
                    priority: 'medium'
                },
                {
                    title: 'Cleaning Instructions',
                    description: 'Follow cleaning instructions carefully. Some items require special care or professional cleaning.',
                    priority: 'medium'
                },
                {
                    title: 'Return Condition',
                    description: 'Return items in the same condition received. Clean items before returning if required.',
                    priority: 'medium'
                },
                {
                    title: 'Allergy Considerations',
                    description: 'Check for any allergy warnings or material information. Some fabrics may cause reactions.',
                    priority: 'low'
                },
                {
                    title: 'Storage',
                    description: 'Store items properly to prevent damage. Use appropriate hangers or storage methods.',
                    priority: 'low'
                }
            ]
        }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🛡️ Safety Guidelines page initialized');
        initSafetyGuidelines();
    });

    // Initialize safety guidelines page
    function initSafetyGuidelines() {
        renderCategoryButtons();
        
        // Load default category (property)
        loadCategoryGuidelines('property');
        
        // Setup event listeners
        setupEventListeners();
    }

    // Setup event listeners
    function setupEventListeners() {
        // Category button clicks
        document.addEventListener('click', function(e) {
            if (e.target.closest('.category-btn')) {
                const btn = e.target.closest('.category-btn');
                const category = btn.getAttribute('data-category');
                if (category) {
                    loadCategoryGuidelines(category);
                    // Update active state
                    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            }
        });
    }

    // Render category buttons
    function renderCategoryButtons() {
        const container = document.getElementById('categoryButtons');
        if (!container) return;

        const categories = Object.keys(CATEGORY_SAFETY_GUIDELINES);
        container.innerHTML = categories.map(catKey => {
            const cat = CATEGORY_SAFETY_GUIDELINES[catKey];
            return `
                <button class="btn btn-outline-primary category-btn ${catKey === 'property' ? 'active' : ''}" 
                        data-category="${catKey}">
                    <i class="bi ${cat.icon}"></i>
                    ${cat.name}
                </button>
            `;
        }).join('');
    }

    // Load category guidelines
    function loadCategoryGuidelines(categoryKey) {
        const content = document.getElementById('safetyContent');
        if (!content) return;

        const category = CATEGORY_SAFETY_GUIDELINES[categoryKey];
        if (!category) {
            content.innerHTML = '<div class="alert alert-warning">Category not found.</div>';
            return;
        }

        const priorityColors = {
            high: 'danger',
            medium: 'warning',
            low: 'info'
        };

        const priorityIcons = {
            high: 'exclamation-triangle',
            medium: 'exclamation-circle',
            low: 'info-circle'
        };

        content.innerHTML = `
            <div class="category-guidelines">
                <div class="category-header mb-4">
                    <h2>
                        <i class="bi ${category.icon}"></i>
                        ${category.name} Safety Guidelines
                    </h2>
                    <p class="text-muted">Essential safety information for ${category.name.toLowerCase()} rentals</p>
                </div>

                <div class="guidelines-list">
                    ${category.guidelines.map((guideline, index) => `
                        <div class="guideline-card mb-3">
                            <div class="guideline-header">
                                <div class="guideline-number">${index + 1}</div>
                                <div class="guideline-title-section">
                                    <h5 class="guideline-title">${escapeHtml(guideline.title)}</h5>
                                    <span class="badge bg-${priorityColors[guideline.priority]}">
                                        <i class="bi bi-${priorityIcons[guideline.priority]}"></i>
                                        ${guideline.priority.charAt(0).toUpperCase() + guideline.priority.slice(1)} Priority
                                    </span>
                                </div>
                            </div>
                            <div class="guideline-body">
                                <p>${escapeHtml(guideline.description)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="alert alert-warning mt-4">
                    <i class="bi bi-exclamation-triangle"></i>
                    <strong>Important:</strong> These guidelines are general recommendations. Always follow local laws, regulations, and manufacturer instructions. When in doubt, consult with the owner or contact support.
                </div>
            </div>
        `;
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();

