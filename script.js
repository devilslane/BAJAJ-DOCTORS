// Global variables
let doctorsData = [];
let specialties = new Set();
let filters = {
    searchTerm: '',
    consultationType: '',
    selectedSpecialties: [],
    sortBy: ''
};

// DOM elements
const doctorSearch = document.getElementById('doctor-search');
const suggestionsDropdown = document.getElementById('suggestions-dropdown');
const doctorsList = document.getElementById('doctors-list');
const specialtyOptions = document.querySelector('.specialty-options');
const clearAllBtn = document.getElementById('clear-all');

// Fetch doctors data from API
// In the fetchDoctors function, update the URL and add error handling:

// Update the fetchDoctors function to properly handle the data format
// Update the fetchDoctors function to match the actual data format
async function fetchDoctors() {
    try {
        const response = await fetch('https://srijandubey.github.io/campus-api-mock/SRM-C1-25.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        doctorsData = await response.json();
        console.log("Data fetched successfully:", doctorsData);
        
        // Let's look at the first doctor to understand the structure
        if (doctorsData.length > 0) {
            console.log("First doctor structure:", doctorsData[0]);
        }
        
        // Extract unique specialties (now looking at the correct property)
        // Based on the error message, the property isn't 'specialties'
        // Let's check some likely alternatives
        doctorsData.forEach(doctor => {
            // Try different possible property names
            const specialtiesList = doctor.specialty || 
                                   doctor.specialties || 
                                   doctor.specialization || 
                                   doctor.specializations ||
                                   [];
            
            // If it's a string, split it; if it's an array, use it as is
            const specialtiesArray = Array.isArray(specialtiesList) 
                ? specialtiesList 
                : (typeof specialtiesList === 'string' ? [specialtiesList] : []);
            
            // Store the processed specialties back on the doctor object for later use
            doctor.processedSpecialties = specialtiesArray;
            
            specialtiesArray.forEach(specialty => {
                if (specialty) specialties.add(specialty);
            });
        });
        
        console.log("Extracted specialties:", specialties);
        
        // Populate specialties filter
        populateSpecialtiesFilter();
        
        // Initialize doctors list
        updateDoctorsList();
        
        // Apply URL params if any
        applyUrlParams();
    } catch (error) {
        console.error('Error fetching doctors data:', error);
        doctorsList.innerHTML = '<p>Failed to load doctors data. Please try again later.</p>';
    }
}

// Populate specialties filter
function populateSpecialtiesFilter() {
    const sortedSpecialties = Array.from(specialties).sort();
    
    sortedSpecialties.forEach(specialty => {
        const formattedId = specialty.replace(/[\/\s]+/g, '-');
        const checkboxLabel = document.createElement('label');
        checkboxLabel.className = 'checkbox-label';
        
        checkboxLabel.innerHTML = `
            <input type="checkbox" name="specialty" value="${specialty}" 
                data-testid="filter-specialty-${formattedId}">
            <span>${specialty}</span>
        `;
        
        specialtyOptions.appendChild(checkboxLabel);
        
        // Add event listener to each checkbox
        const checkbox = checkboxLabel.querySelector('input');
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                filters.selectedSpecialties.push(specialty);
            } else {
                filters.selectedSpecialties = filters.selectedSpecialties.filter(s => s !== specialty);
            }
            updateUrlParams();
            updateDoctorsList();
        });
    });
}

// Search functionality
doctorSearch.addEventListener('input', () => {
    const searchTerm = doctorSearch.value.trim().toLowerCase();
    
    if (searchTerm.length > 0) {
        // Find matching doctors
        const matchingDoctors = doctorsData.filter(doctor => 
            doctor.name.toLowerCase().includes(searchTerm)
        ).slice(0, 3);  // Get top 3 matches
        
        // Show suggestions
        if (matchingDoctors.length > 0) {
            suggestionsDropdown.innerHTML = '';
            matchingDoctors.forEach(doctor => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.setAttribute('data-testid', 'suggestion-item');
                suggestionItem.textContent = doctor.name;
                
                suggestionItem.addEventListener('click', () => {
                    doctorSearch.value = doctor.name;
                    filters.searchTerm = doctor.name.toLowerCase();
                    suggestionsDropdown.style.display = 'none';
                    updateUrlParams();
                    updateDoctorsList();
                });
                
                suggestionsDropdown.appendChild(suggestionItem);
            });
            suggestionsDropdown.style.display = 'block';
        } else {
            suggestionsDropdown.style.display = 'none';
        }
    } else {
        suggestionsDropdown.style.display = 'none';
        filters.searchTerm = '';
        updateUrlParams();
        updateDoctorsList();
    }
});

// Handle search submit
doctorSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        filters.searchTerm = doctorSearch.value.trim().toLowerCase();
        suggestionsDropdown.style.display = 'none';
        updateUrlParams();
        updateDoctorsList();
    }
});

// Handle clicks outside suggestions dropdown
document.addEventListener('click', (e) => {
    if (!suggestionsDropdown.contains(e.target) && e.target !== doctorSearch) {
        suggestionsDropdown.style.display = 'none';
    }
});

// Handle consultation type filter
const consultationRadios = document.querySelectorAll('input[name="consultation"]');
consultationRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.checked) {
            filters.consultationType = radio.value;
            updateUrlParams();
            updateDoctorsList();
        }
    });
});

// Handle sort filter
const sortRadios = document.querySelectorAll('input[name="sort"]');
sortRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        if (radio.checked) {
            filters.sortBy = radio.value;
            updateUrlParams();
            updateDoctorsList();
        }
    });
});

// Clear all filters
clearAllBtn.addEventListener('click', () => {
    // Reset all filter values
    filters = {
        searchTerm: '',
        consultationType: '',
        selectedSpecialties: [],
        sortBy: ''
    };
    
    // Reset UI
    doctorSearch.value = '';
    document.querySelectorAll('input[name="consultation"]').forEach(radio => {
        radio.checked = false;
    });
    document.querySelectorAll('input[name="specialty"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    document.querySelectorAll('input[name="sort"]').forEach(radio => {
        radio.checked = false;
    });
    
    // Update URL and doctors list
    updateUrlParams();
    updateDoctorsList();
});

// Filter and sort doctors based on current filters
// Update the filterAndSortDoctors function
function filterAndSortDoctors() {
    let filteredDoctors = [...doctorsData];
    
    // Apply search filter
    if (filters.searchTerm) {
        filteredDoctors = filteredDoctors.filter(doctor => 
            doctor.name.toLowerCase().includes(filters.searchTerm)
        );
    }
    
    // Apply consultation type filter
    if (filters.consultationType) {
        filteredDoctors = filteredDoctors.filter(doctor => {
            const consultationModes = doctor.consultation_modes || 
                                     doctor.consultationModes || 
                                     doctor.modes || 
                                     [];
            
            // If it's a string, check if it contains the value; if it's an array, check if it includes the value
            if (filters.consultationType === 'video') {
                return Array.isArray(consultationModes) 
                    ? consultationModes.includes('video') 
                    : String(consultationModes).toLowerCase().includes('video');
            } else if (filters.consultationType === 'clinic') {
                return Array.isArray(consultationModes) 
                    ? consultationModes.includes('clinic') 
                    : String(consultationModes).toLowerCase().includes('clinic');
            }
            return true;
        });
    }
    
    // Apply specialties filter
    if (filters.selectedSpecialties.length > 0) {
        filteredDoctors = filteredDoctors.filter(doctor => {
            const doctorSpecialties = doctor.processedSpecialties || [];
            return filters.selectedSpecialties.some(specialty => 
                doctorSpecialties.includes(specialty)
            );
        });
    }
    
    // Apply sorting
    if (filters.sortBy) {
        if (filters.sortBy === 'fees') {
            filteredDoctors.sort((a, b) => {
                const feeA = Number(a.fee || a.fees || a.consultation_fee || 0);
                const feeB = Number(b.fee || b.fees || b.consultation_fee || 0);
                return feeA - feeB;
            });
        } else if (filters.sortBy === 'experience') {
            filteredDoctors.sort((a, b) => {
                const expA = Number(a.experience || a.years_of_experience || 0);
                const expB = Number(b.experience || b.years_of_experience || 0);
                return expB - expA;
            });
        }
    }
    
    return filteredDoctors;
}
// Update doctors list based on filters
// Update the updateDoctorsList function to use the correct property names
function updateDoctorsList() {
    const filteredDoctors = filterAndSortDoctors();
    
    if (filteredDoctors.length === 0) {
        doctorsList.innerHTML = '<p>No doctors match your search criteria.</p>';
        return;
    }
    
    doctorsList.innerHTML = '';
    
    filteredDoctors.forEach(doctor => {
        // Use properties based on the actual data structure
        const doctorCard = document.createElement('div');
        doctorCard.className = 'doctor-card';
        doctorCard.setAttribute('data-testid', 'doctor-card');
        
        // Use the photo property from the API data
        const photoUrl = doctor.photo || '/api/placeholder/80/80';
        
        // Use processedSpecialties or default to empty array
        const specialties = doctor.processedSpecialties || [];
        
        // Use the appropriate fee and experience properties
        const fee = doctor.fee || doctor.fees || doctor.consultation_fee || 'N/A';
        const experience = doctor.experience || doctor.years_of_experience || 'N/A';
        
        doctorCard.innerHTML = `
            <img src="${photoUrl}" alt="${doctor.name}" class="doctor-image">
            <div class="doctor-info">
                <div class="doctor-header">
                    <div>
                        <h3 class="doctor-name" data-testid="doctor-name">${doctor.name}</h3>
                        <p class="doctor-specialty" data-testid="doctor-specialty">${specialties.join(', ')}</p>
                        <p class="doctor-qualification">${doctor.qualification || doctor.qualifications || ''}</p>
                        <p class="doctor-experience" data-testid="doctor-experience">${experience} yrs exp.</p>
                    </div>
                    <div class="doctor-fee" data-testid="doctor-fee">${fee}</div>
                </div>
                
                <div class="location-info">
                    <div class="location-item">
                        <span class="location-icon">🏥</span>
                        <span>${doctor.clinic_name || doctor.clinicName || doctor.hospital || ''}</span>
                    </div>
                    <div class="location-item">
                        <span class="location-icon">📍</span>
                        <span>${doctor.location || doctor.address || ''}</span>
                    </div>
                </div>
                
                <button class="book-btn">Book Appointment</button>
            </div>
        `;
        
        doctorsList.appendChild(doctorCard);
    });
}
// Update URL parameters based on current filters
function updateUrlParams() {
    const params = new URLSearchParams();
    
    if (filters.searchTerm) {
        params.set('search', filters.searchTerm);
    }
    
    if (filters.consultationType) {
        params.set('consultation', filters.consultationType);
    }
    
    if (filters.selectedSpecialties.length > 0) {
        params.set('specialties', filters.selectedSpecialties.join(','));
    }
    
    if (filters.sortBy) {
        params.set('sort', filters.sortBy);
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    history.pushState(null, '', newUrl);
}

// Apply filters from URL parameters
function applyUrlParams() {
    const params = new URLSearchParams(window.location.search);
    
    // Apply search term
    const searchTerm = params.get('search');
    if (searchTerm) {
        filters.searchTerm = searchTerm;
        doctorSearch.value = searchTerm;
    }
    
    // Apply consultation type
    const consultationType = params.get('consultation');
    if (consultationType) {
        filters.consultationType = consultationType;
        const consultationRadio = document.querySelector(`input[name="consultation"][value="${consultationType}"]`);
        if (consultationRadio) {
            consultationRadio.checked = true;
        }
    }
    
    // Apply specialties
    const specialtiesParam = params.get('specialties');
    if (specialtiesParam) {
        const selectedSpecialties = specialtiesParam.split(',');
        filters.selectedSpecialties = selectedSpecialties;
        
        selectedSpecialties.forEach(specialty => {
            const specialtyCheckbox = document.querySelector(`input[name="specialty"][value="${specialty}"]`);
            if (specialtyCheckbox) {
                specialtyCheckbox.checked = true;
            }
        });
    }
    
    // Apply sort
    const sortBy = params.get('sort');
    if (sortBy) {
        filters.sortBy = sortBy;
        const sortRadio = document.querySelector(`input[name="sort"][value="${sortBy}"]`);
        if (sortRadio) {
            sortRadio.checked = true;
        }
    }
    
    // Update doctors list based on URL params
    updateDoctorsList();
}

// Handle browser navigation
window.addEventListener('popstate', () => {
    applyUrlParams();
});

// Toggle filter sections
document.querySelectorAll('.filter-header').forEach(header => {
    header.addEventListener('click', () => {
        header.classList.toggle('collapsed');
        const options = header.nextElementSibling;
        options.style.display = header.classList.contains('collapsed') ? 'none' : 'flex';
    });
});

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    fetchDoctors();
});