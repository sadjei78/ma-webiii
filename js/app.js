// Mobile viewport change detection
let isMobileView = false;

function checkMobileView() {
    const wasMobile = isMobileView;
    isMobileView = window.innerWidth <= 768;
    
    // If viewport changed from desktop to mobile, refresh dashboard
    if (!wasMobile && isMobileView) {
        console.log('Viewport changed to mobile, refreshing dashboard');
        setTimeout(() => {
            updateDashboard();
        }, 100);
    }
}

// Listen for viewport changes
window.addEventListener('resize', checkMobileView);
window.addEventListener('orientationchange', () => {
    setTimeout(checkMobileView, 100);
});

// Check on page load
document.addEventListener('DOMContentLoaded', checkMobileView);

// Input sanitization function to prevent XSS
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Safe innerHTML assignment with sanitization
function setInnerHTML(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = sanitizeInput(content);
    }
}

// Help function
function showHelpModal() {
    const modal = new bootstrap.Modal(document.getElementById('helpModal'));
    modal.show();
}

// Global functions for cross-file access
window.loadApp = async function() {
    try {
        // Show loading state
        showLoading(true);
        
        // Check if user is authorized
        const user = firebase.auth().currentUser;
        if (!user) {
            showLogin();
            return;
        }

        const isAuthorized = await isUserAuthorized(user.email);
        if (!isAuthorized) {
            document.getElementById('appContent').style.display = 'none';
            document.getElementById('accessDenied').style.display = 'block';
            showLoading(false);
            return;
        }

        // Show app content
        document.getElementById('appContent').style.display = 'block';
        document.getElementById('accessDenied').style.display = 'none';
        
        // Update user info
        document.getElementById('userInfo').textContent = user.email.split('@')[0];
        document.getElementById('userEmail').textContent = user.email;
        
        // Load data with better error handling
        try {
            await loadContacts();
            await loadCategories();
            
            // Show dashboard by default after data is loaded
            showDashboard();
        } catch (dataError) {
            console.error('Error loading data:', dataError);
            // Show error state but don't redirect to login
            document.getElementById('dashboardView').innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <strong>Data Loading Error</strong><br>
                    Please check your internet connection and refresh the page.
                </div>
            `;
        }
        
        // Hide loading spinner
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading app:', error);
        showLoading(false);
        showLogin();
    }
};

window.showLogin = function() {
    window.location.href = 'login.html';
};

window.signOut = function() {
    firebase.auth().signOut().then(() => {
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
};

// Firebase Functions
async function loadContacts() {
    try {
        const snapshot = await db.collection('contacts').orderBy('name').get();
        allContacts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Update UI only if elements exist
        try {
            updateDashboard();
            renderContacts();
        } catch (uiError) {
            console.error('Error updating UI:', uiError);
        }
    } catch (error) {
        console.error('Error loading contacts:', error);
        // Don't show alert on mobile, just log the error
        allContacts = []; // Set empty array as fallback
    }
}

async function loadCategories() {
    try {
        const snapshot = await db.collection('categories').get();
        const categories = snapshot.docs.map(doc => doc.data().name);
        allCategories = ['Uncategorized', ...categories];
        // Categories loaded successfully
        updateCategoryFilters();
    } catch (error) {
        console.error('Error loading categories:', error);
        // Fallback to default categories if loading fails
        allCategories = ['Uncategorized', 'Family', 'Work', 'Friends', 'Healthcare', 'Services'];
        updateCategoryFilters();
    }
}

async function saveContact(contactData) {
    try {
        if (contactData.id) {
            // Update existing contact
            await db.collection('contacts').doc(contactData.id).update({
                ...contactData,
                last_modified: new Date().toISOString()
            });
        } else {
            // Add new contact
            await db.collection('contacts').add({
                ...contactData,
                created_date: new Date().toISOString(),
                last_modified: new Date().toISOString()
            });
        }
        await loadContacts();
        return true;
    } catch (error) {
        console.error('Error saving contact:', error);
        alert('Error saving contact. Please try again.');
        return false;
    }
}

async function deleteContact(contactId) {
    if (confirm('Are you sure you want to delete this contact?')) {
        try {
            await db.collection('contacts').doc(contactId).delete();
            await loadContacts();
        } catch (error) {
            console.error('Error deleting contact:', error);
            alert('Error deleting contact. Please try again.');
        }
    }
}

async function addCategory(categoryName) {
    if (!categoryName.trim()) {
        alert('Please enter a category name.');
        return;
    }
    
    if (allCategories.includes(categoryName)) {
        alert('This category already exists.');
        return;
    }
    
    try {
        await db.collection('categories').add({
            name: categoryName.trim(),
            created_date: new Date().toISOString()
        });
        
        // Reload categories to update dropdowns
        await loadCategories();
        
        alert('Category added successfully!');
    } catch (error) {
        console.error('Error adding category:', error);
        alert('Error adding category. Please try again.');
    }
}

// UI Functions
function showDashboard() {
    try {
        document.getElementById('dashboardView').style.display = 'block';
        document.getElementById('contactsView').style.display = 'none';
        
        // Check if dashboard content already exists
        const dashboardContent = document.getElementById('dashboardView');
        const hasDashboardStructure = dashboardContent && dashboardContent.querySelector('.row');
        
        if (!hasDashboardStructure) {
            // Only show loading if we need to rebuild the structure
            dashboardContent.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-3 text-muted">Loading dashboard...</p>
                </div>
            `;
            
            // Update dashboard after a short delay to ensure DOM is ready
            setTimeout(() => {
                updateDashboard();
            }, 100);
        } else {
            // If structure exists, just update the data
            updateDashboard();
        }
    } catch (error) {
        console.error('Error showing dashboard:', error);
        // Fallback to basic dashboard
        document.getElementById('dashboardView').innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Dashboard loading error. Please refresh the page.
            </div>
        `;
    }
}

function showContacts() {
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('contactsView').style.display = 'block';
    renderContacts();
}

function updateDashboard() {
    try {
        console.log('updateDashboard called');
        console.log('Mobile device:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
        console.log('Viewport width:', window.innerWidth);
        console.log('Is mobile view:', isMobileView);
        
        // First, restore the original dashboard HTML structure
        const dashboardView = document.getElementById('dashboardView');
        console.log('Dashboard view element:', dashboardView);
        console.log('Dashboard view display:', dashboardView ? dashboardView.style.display : 'null');
        console.log('Dashboard view has row:', dashboardView ? dashboardView.querySelector('.row') : 'null');
        
        if (dashboardView && !dashboardView.querySelector('.row')) {
            console.log('Restoring dashboard HTML structure');
            dashboardView.innerHTML = `
                <div class="row">
                    <div class="col-12">
                        <h2><i class="fas fa-tachometer-alt me-2"></i>Dashboard</h2>
                        <p class="text-muted">Overview of your contact management system</p>
                    </div>
                </div>
                
                <div class="row mb-4">
                    <div class="col-6 col-md-3 mb-3">
                        <div class="card text-center clickable-card" onclick="showFilteredContacts('all')">
                            <div class="card-body">
                                <i class="fas fa-users fa-2x text-primary mb-2"></i>
                                <h6 class="card-title">Total Contacts</h6>
                                <h4 class="text-primary" id="totalContacts">0</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3 mb-3">
                        <div class="card text-center clickable-card" onclick="showFilteredContacts('important')">
                            <div class="card-body">
                                <i class="fas fa-star fa-2x text-warning mb-2"></i>
                                <h6 class="card-title">Important</h6>
                                <h4 class="text-warning" id="importantContacts">0</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3 mb-3">
                        <div class="card text-center clickable-card" onclick="showFilteredContacts('active')">
                            <div class="card-body">
                                <i class="fas fa-user-check fa-2x text-success mb-2"></i>
                                <h6 class="card-title">Active</h6>
                                <h4 class="text-success" id="activeContacts">0</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3 mb-3">
                        <div class="card text-center clickable-card" onclick="showFilteredContacts('categories')">
                            <div class="card-body">
                                <i class="fas fa-tags fa-2x text-info mb-2"></i>
                                <h6 class="card-title">Categories</h6>
                                <h4 class="text-info" id="categoriesCount">0</h4>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12 col-md-6 mb-3">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-clock me-2"></i>Recent Contacts</h5>
                            </div>
                            <div class="card-body">
                                <div id="recentContacts" class="list-group">
                                    <!-- Recent contacts will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 col-md-6 mb-3">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-bolt me-2"></i>Quick Actions</h5>
                            </div>
                            <div class="card-body">
                                <div class="d-grid gap-2">
                                    <button class="btn btn-primary" onclick="showAddContactModal()">
                                        <i class="fas fa-plus me-2"></i>Add New Contact
                                    </button>
                                    <button class="btn btn-outline-primary" onclick="exportContacts()">
                                        <i class="fas fa-download me-2"></i>Export Contacts
                                    </button>
                                    <button class="btn btn-outline-secondary" onclick="showContacts()">
                                        <i class="fas fa-users me-2"></i>View All Contacts
                                    </button>
                                    <div class="dropdown-divider my-3"></div>
                                    <h6><i class="fas fa-question-circle me-2"></i>Need Help?</h6>
                                    <div class="d-grid gap-2">
                                        <a href="user-guide.html" target="_blank" class="btn btn-outline-info btn-sm">
                                            <i class="fas fa-book me-2"></i>Full User Guide
                                        </a>
                                        <a href="quick-reference.html" target="_blank" class="btn btn-outline-info btn-sm">
                                            <i class="fas fa-clipboard-list me-2"></i>Quick Reference
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            console.log('Dashboard HTML structure restored');
            
            // Force a reflow for mobile devices
            if (isMobileView) {
                dashboardView.offsetHeight; // Force reflow
                console.log('Forced reflow for mobile view');
            }
        } else {
            console.log('Dashboard structure already exists, updating data only');
        }

        const total = allContacts.length;
        const important = allContacts.filter(c => c.important).length;
        const archived = allContacts.filter(c => c.archived).length;
        const active = total - archived;
        const categories = new Set(allContacts.map(c => c.category || 'Uncategorized')).size;

        console.log('Dashboard stats:', { total, important, active, categories });

        // Update dashboard stats with error handling
        const totalElement = document.getElementById('totalContacts');
        const importantElement = document.getElementById('importantContacts');
        const activeElement = document.getElementById('activeContacts');
        const categoriesElement = document.getElementById('categoriesCount');

        if (totalElement) totalElement.textContent = total;
        if (importantElement) importantElement.textContent = important;
        if (activeElement) activeElement.textContent = active;
        if (categoriesElement) categoriesElement.textContent = categories;

        // Show recent contacts
        const recentContacts = allContacts
            .sort((a, b) => new Date(b.last_modified || 0) - new Date(a.last_modified || 0))
            .slice(0, 5);

        const recentHtml = recentContacts.map(contact => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${sanitizeInput(contact.name)}</strong>
                    ${contact.organization ? `<br><small class="text-muted">${sanitizeInput(contact.organization)}</small>` : ''}
                </div>
                <span class="badge bg-primary rounded-pill">${sanitizeInput(contact.category || 'Uncategorized')}</span>
            </div>
        `).join('');

        const recentElement = document.getElementById('recentContacts');
        if (recentElement) {
            recentElement.innerHTML = recentHtml || '<div class="list-group-item text-muted">No contacts yet</div>';
        }
        
        // Force visibility on mobile
        if (isMobileView) {
            dashboardView.style.display = 'block';
            dashboardView.style.visibility = 'visible';
            dashboardView.style.opacity = '1';
            console.log('Forced mobile visibility');
        }
        
        console.log('Dashboard update completed successfully');
    } catch (error) {
        console.error('Error updating dashboard:', error);
        // Fallback to show basic info
        const elements = ['totalContacts', 'importantContacts', 'activeContacts', 'categoriesCount'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '0';
        });
    }
}

function renderContacts() {
    const filteredContacts = filterContactsData();
    const contactsHtml = filteredContacts.map(contact => createContactCard(contact)).join('');
    document.getElementById('contactsGrid').innerHTML = contactsHtml;
    updateBulkActions();
}

function filterContactsData() {
    const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const importantOnly = document.getElementById('importantFilter')?.checked || false;
    const showArchived = document.getElementById('showArchived')?.checked || false;

    return allContacts.filter(contact => {
        const matchesSearch = !searchQuery || 
            contact.name.toLowerCase().includes(searchQuery) ||
            contact.full_name?.toLowerCase().includes(searchQuery) ||
            contact.organization?.toLowerCase().includes(searchQuery);
        
        const matchesCategory = !categoryFilter || contact.category === categoryFilter;
        const matchesImportant = !importantOnly || contact.important;
        const matchesArchived = showArchived || !contact.archived;

        return matchesSearch && matchesCategory && matchesImportant && matchesArchived;
    });
}

function filterContacts() {
    renderContacts();
}

function createContactCard(contact) {
    const importantClass = contact.important ? 'important-contact' : '';
    const archivedClass = contact.archived ? 'archived-contact' : '';
    
    // Check for duplicates
    const duplicates = findDuplicates(contact);
    const duplicateBadge = duplicates.length > 0 ? 
        `<span class="duplicate-badge">${duplicates.length} duplicate${duplicates.length > 1 ? 's' : ''}</span>` : '';
    
    // Handle multiple categories
    const categories = Array.isArray(contact.categories) ? contact.categories : [contact.category || 'Uncategorized'];
    const categoryBadges = categories.map(cat => 
        `<span class="category-badge">${cat}</span>`
    ).join('');
    
    return `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card contact-card ${importantClass} ${archivedClass}" onclick="showContactDetail('${contact.id}')">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h5 class="card-title">${contact.name} ${duplicateBadge}</h5>
                            ${contact.full_name ? `<p class="text-muted mb-1">${contact.full_name}</p>` : ''}
                            ${contact.organization ? `<p class="text-muted mb-1"><i class="fas fa-building me-1"></i>${contact.organization}</p>` : ''}
                            ${contact.phone_numbers?.length ? `<p class="mb-1"><i class="fas fa-phone me-1"></i>${contact.phone_numbers[0].display}</p>` : ''}
                            ${contact.emails?.length ? `<p class="mb-1"><i class="fas fa-envelope me-1"></i>${contact.emails[0]}</p>` : ''}
                            <div class="mt-2">${categoryBadges}</div>
                            ${contact.important ? '<span class="badge bg-warning ms-1"><i class="fas fa-star"></i></span>' : ''}
                            ${contact.archived ? '<span class="badge bg-secondary ms-1">Archived</span>' : ''}
                        </div>
                        <div class="dropdown" onclick="event.stopPropagation()">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="#" onclick="editContact('${contact.id}')"><i class="fas fa-edit me-2"></i>Edit</a></li>
                                <li><a class="dropdown-item" href="#" onclick="toggleImportant('${contact.id}')">
                                    <i class="fas fa-star me-2"></i>${contact.important ? 'Remove Important' : 'Mark Important'}
                                </a></li>
                                <li><a class="dropdown-item" href="#" onclick="toggleArchived('${contact.id}')">
                                    <i class="fas fa-archive me-2"></i>${contact.archived ? 'Unarchive' : 'Archive'}
                                </a></li>
                                ${duplicates.length > 0 ? `<li><a class="dropdown-item" href="#" onclick="showMergeDuplicates('${contact.id}')">
                                    <i class="fas fa-compress-alt me-2"></i>Merge Duplicates
                                </a></li>` : ''}
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteContact('${contact.id}')">
                                    <i class="fas fa-trash me-2"></i>Delete
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="mt-2" onclick="event.stopPropagation()">
                        <input type="checkbox" class="form-check-input contact-checkbox" value="${contact.id}" onchange="updateBulkActions()">
                        <label class="form-check-label ms-1">Select for bulk action</label>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function updateCategoryFilters() {
    const categorySelect = document.getElementById('categoryFilter');
    const contactCategory = document.getElementById('contactCategory');
    
    const options = ['<option value="">All Categories</option>'];
    allCategories.forEach(category => {
        options.push(`<option value="${category}">${category}</option>`);
    });
    
    if (categorySelect) {
        categorySelect.innerHTML = options.join('');
        console.log('Updated category filter dropdown'); // Debug log
    }
    if (contactCategory) {
        contactCategory.innerHTML = options.join('');
        console.log('Updated contact category dropdown'); // Debug log
    }
}

function updateBulkActions() {
    const selectedContacts = getSelectedContacts();
    const bulkActions = document.getElementById('bulkActions');
    
    if (selectedContacts.length > 0) {
        bulkActions.style.display = 'block';
    } else {
        bulkActions.style.display = 'none';
    }
}

function getSelectedContacts() {
    const checkboxes = document.querySelectorAll('.contact-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.add('show');
    } else {
        spinner.classList.remove('show');
    }
}

// Contact Management Functions
function showAddContactModal() {
    document.getElementById('addContactForm').reset();
    document.getElementById('contactName').focus();
    const modal = new bootstrap.Modal(document.getElementById('addContactModal'));
    modal.show();
}

async function saveContactFromForm() {
    const categories = getSelectedCategories();
    
    const formData = {
        name: document.getElementById('contactName').value,
        full_name: document.getElementById('contactFullName').value,
        organization: document.getElementById('contactOrganization').value,
        categories: categories.length > 0 ? categories : ['Uncategorized'],
        notes: document.getElementById('contactNotes').value,
        important: document.getElementById('contactImportant').checked,
        archived: false,
        phone_numbers: getPhoneNumbers(),
        emails: getEmailAddresses()
    };

    if (!formData.name) {
        alert('Please enter a name for the contact.');
        return;
    }

    const success = await saveContact(formData);
    if (success) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('addContactModal'));
        modal.hide();
    }
}

function getPhoneNumbers() {
    const phoneInputs = document.querySelectorAll('#phoneNumbers input[type="tel"]');
    return Array.from(phoneInputs)
        .map(input => input.value.trim())
        .filter(value => value)
        .map(number => ({
            number: number.replace(/\D/g, ''),
            display: number
        }));
}

function getEmailAddresses() {
    const emailInputs = document.querySelectorAll('#emailAddresses input[type="email"]');
    return Array.from(emailInputs)
        .map(input => input.value.trim())
        .filter(value => value);
}

function addPhoneField() {
    const container = document.getElementById('phoneNumbers');
    const newField = document.createElement('div');
    newField.className = 'input-group mb-2';
    newField.innerHTML = `
        <input type="tel" class="form-control" placeholder="Phone number">
        <button type="button" class="btn btn-outline-danger" onclick="removeField(this)">
            <i class="fas fa-minus"></i>
        </button>
    `;
    container.appendChild(newField);
}

function addEmailField() {
    const container = document.getElementById('emailAddresses');
    const newField = document.createElement('div');
    newField.className = 'input-group mb-2';
    newField.innerHTML = `
        <input type="email" class="form-control" placeholder="Email address">
        <button type="button" class="btn btn-outline-danger" onclick="removeField(this)">
            <i class="fas fa-minus"></i>
        </button>
    `;
    container.appendChild(newField);
}

function removeField(button) {
    button.parentElement.remove();
}

// Bulk Operations
function bulkEmail() {
    const selectedContacts = getSelectedContacts();
    if (selectedContacts.length === 0) {
        alert('Please select contacts to email.');
        return;
    }

    const contactsToEmail = allContacts.filter(contact => 
        selectedContacts.includes(contact.id) && contact.emails?.length > 0
    );

    if (contactsToEmail.length === 0) {
        alert('No selected contacts have email addresses.');
        return;
    }

    const emailList = contactsToEmail.map(contact => contact.emails[0]).join(',');
    window.open(`mailto:${emailList}`, '_blank');
}

function bulkUpdateCategories() {
    const selectedContacts = getSelectedContacts();
    if (selectedContacts.length === 0) {
        alert('Please select contacts to update.');
        return;
    }

    const newCategory = prompt('Enter new category:');
    if (!newCategory) return;

    // Update each selected contact
    selectedContacts.forEach(async (contactId) => {
        const contact = allContacts.find(c => c.id === contactId);
        if (contact) {
            await saveContact({ ...contact, category: newCategory });
        }
    });
}

function bulkUpdateStatus() {
    const selectedContacts = getSelectedContacts();
    if (selectedContacts.length === 0) {
        alert('Please select contacts to update.');
        return;
    }

    const markImportant = confirm('Mark selected contacts as important?');
    const markArchived = confirm('Archive selected contacts?');

    // Update each selected contact
    selectedContacts.forEach(async (contactId) => {
        const contact = allContacts.find(c => c.id === contactId);
        if (contact) {
            await saveContact({ 
                ...contact, 
                important: markImportant,
                archived: markArchived
            });
        }
    });
}

// Contact Actions
async function toggleImportant(contactId) {
    const contact = allContacts.find(c => c.id === contactId);
    if (contact) {
        await saveContact({ ...contact, important: !contact.important });
    }
}

async function toggleArchived(contactId) {
    const contact = allContacts.find(c => c.id === contactId);
    if (contact) {
        await saveContact({ ...contact, archived: !contact.archived });
    }
}

function editContact(contactId) {
    const contact = allContacts.find(c => c.id === contactId);
    if (contact) {
        // Populate form with contact data
        document.getElementById('editContactId').value = contact.id;
        document.getElementById('editContactName').value = contact.name;
        document.getElementById('editContactFullName').value = contact.full_name || '';
        document.getElementById('editContactOrganization').value = contact.organization || '';
        document.getElementById('editContactNotes').value = contact.notes || '';
        document.getElementById('editContactImportant').checked = contact.important || false;
        
        // Set phone numbers
        const phoneContainer = document.getElementById('editPhoneNumbers');
        phoneContainer.innerHTML = '';
        if (contact.phone_numbers?.length) {
            contact.phone_numbers.forEach((phone, index) => {
                if (index === 0) {
                    phoneContainer.innerHTML = `
                        <div class="input-group mb-2">
                            <input type="tel" class="form-control" value="${phone.display}">
                            <button type="button" class="btn btn-outline-secondary" onclick="addEditPhoneField()">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    `;
                } else {
                    addEditPhoneField();
                    const inputs = phoneContainer.querySelectorAll('input[type="tel"]');
                    inputs[inputs.length - 1].value = phone.display;
                }
            });
        } else {
            addEditPhoneField();
        }

        // Set email addresses
        const emailContainer = document.getElementById('editEmailAddresses');
        emailContainer.innerHTML = '';
        if (contact.emails?.length) {
            contact.emails.forEach((email, index) => {
                if (index === 0) {
                    emailContainer.innerHTML = `
                        <div class="input-group mb-2">
                            <input type="email" class="form-control" value="${email}">
                            <button type="button" class="btn btn-outline-secondary" onclick="addEditEmailField()">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    `;
                } else {
                    addEditEmailField();
                    const inputs = emailContainer.querySelectorAll('input[type="email"]');
                    inputs[inputs.length - 1].value = email;
                }
            });
        } else {
            addEditEmailField();
        }

        // Set categories
        const categories = Array.isArray(contact.categories) ? contact.categories : [contact.category || 'Uncategorized'];
        const categoryContainer = document.getElementById('editContactCategories');
        categoryContainer.innerHTML = '';
        categories.forEach((category, index) => {
            if (index === 0) {
                categoryContainer.innerHTML = `
                    <div class="input-group mb-2">
                        <select class="form-select">
                            <option value="">Select category...</option>
                            ${allCategories.map(cat => `<option value="${cat}" ${cat === category ? 'selected' : ''}>${cat}</option>`).join('')}
                        </select>
                        <button type="button" class="btn btn-outline-secondary" onclick="addEditCategoryField()">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                `;
            } else {
                addEditCategoryField();
                const selects = categoryContainer.querySelectorAll('select');
                selects[selects.length - 1].value = category;
            }
        });
        
        const modal = new bootstrap.Modal(document.getElementById('editContactModal'));
        modal.show();
    }
}

async function saveEditedContact() {
    const contactId = document.getElementById('editContactId').value;
    const categories = getSelectedEditCategories();
    
    const formData = {
        id: contactId,
        name: document.getElementById('editContactName').value,
        full_name: document.getElementById('editContactFullName').value,
        organization: document.getElementById('editContactOrganization').value,
        categories: categories.length > 0 ? categories : ['Uncategorized'],
        notes: document.getElementById('editContactNotes').value,
        important: document.getElementById('editContactImportant').checked,
        phone_numbers: getEditPhoneNumbers(),
        emails: getEditEmailAddresses()
    };

    if (!formData.name) {
        alert('Please enter a name for the contact.');
        return;
    }

    const success = await saveContact(formData);
    if (success) {
        const modal = bootstrap.Modal.getInstance(document.getElementById('editContactModal'));
        modal.hide();
    }
}

function getEditPhoneNumbers() {
    const phoneInputs = document.querySelectorAll('#editPhoneNumbers input[type="tel"]');
    return Array.from(phoneInputs)
        .map(input => input.value.trim())
        .filter(value => value)
        .map(number => ({
            number: number.replace(/\D/g, ''),
            display: number
        }));
}

function getEditEmailAddresses() {
    const emailInputs = document.querySelectorAll('#editEmailAddresses input[type="email"]');
    return Array.from(emailInputs)
        .map(input => input.value.trim())
        .filter(value => value);
}

function getSelectedEditCategories() {
    const categorySelects = document.querySelectorAll('#editContactCategories select');
    return Array.from(categorySelects)
        .map(select => select.value)
        .filter(value => value && value !== 'Uncategorized');
}

function addEditPhoneField() {
    const container = document.getElementById('editPhoneNumbers');
    const newField = document.createElement('div');
    newField.className = 'input-group mb-2';
    newField.innerHTML = `
        <input type="tel" class="form-control" placeholder="Phone number">
        <button type="button" class="btn btn-outline-danger" onclick="removeField(this)">
            <i class="fas fa-minus"></i>
        </button>
    `;
    container.appendChild(newField);
}

function addEditEmailField() {
    const container = document.getElementById('editEmailAddresses');
    const newField = document.createElement('div');
    newField.className = 'input-group mb-2';
    newField.innerHTML = `
        <input type="email" class="form-control" placeholder="Email address">
        <button type="button" class="btn btn-outline-danger" onclick="removeField(this)">
            <i class="fas fa-minus"></i>
        </button>
    `;
    container.appendChild(newField);
}

function addEditCategoryField() {
    const container = document.getElementById('editContactCategories');
    const newField = document.createElement('div');
    newField.className = 'input-group mb-2';
    newField.innerHTML = `
        <select class="form-select">
            <option value="">Select category...</option>
            ${allCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
        </select>
        <button type="button" class="btn btn-outline-danger" onclick="removeField(this)">
            <i class="fas fa-minus"></i>
        </button>
    `;
    container.appendChild(newField);
}

function exportContacts() {
    const csvContent = generateCSV(allContacts);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

function generateCSV(contacts) {
    const headers = ['Name', 'Full Name', 'Organization', 'Phone Numbers', 'Email Addresses', 'Category', 'Important', 'Archived', 'Notes'];
    const rows = contacts.map(contact => [
        contact.name,
        contact.full_name || '',
        contact.organization || '',
        contact.phone_numbers?.map(p => p.display).join('; ') || '',
        contact.emails?.join('; ') || '',
        contact.category || 'Uncategorized',
        contact.important ? 'Yes' : 'No',
        contact.archived ? 'Yes' : 'No',
        contact.notes || ''
    ]);
    
    return [headers, ...rows].map(row => 
        row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')
    ).join('\n');
} 

// Contact Detail Functions
function showContactDetail(contactId) {
    const contact = allContacts.find(c => c.id === contactId);
    if (!contact) return;
    
    const categories = Array.isArray(contact.categories) ? contact.categories : [contact.category || 'Uncategorized'];
    const categoryBadges = categories.map(cat => 
        `<span class="category-badge">${cat}</span>`
    ).join('');
    
    const phoneNumbers = contact.phone_numbers?.map(phone => 
        `<p class="mb-1"><i class="fas fa-phone me-1"></i>${phone.display}</p>`
    ).join('') || '<p class="text-muted mb-1">No phone numbers</p>';
    
    const emails = contact.emails?.map(email => 
        `<p class="mb-1"><i class="fas fa-envelope me-1"></i>${email}</p>`
    ).join('') || '<p class="text-muted mb-1">No email addresses</p>';
    
    const duplicates = findDuplicates(contact);
    const duplicateInfo = duplicates.length > 0 ? 
        `<div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle me-2"></i>
            This contact has ${duplicates.length} potential duplicate${duplicates.length > 1 ? 's' : ''}.
            <button class="btn btn-sm btn-warning ms-2" onclick="showMergeDuplicates('${contact.id}')">
                <i class="fas fa-compress-alt me-1"></i>Merge Duplicates
            </button>
        </div>` : '';
    
    document.getElementById('detailModalTitle').textContent = contact.name;
    const sanitizedContent = `
        ${duplicateInfo}
        <div class="row">
            <div class="col-md-6">
                <h6>Basic Information</h6>
                <p><strong>Name:</strong> ${sanitizeInput(contact.name)}</p>
                ${contact.full_name ? `<p><strong>Full Name:</strong> ${sanitizeInput(contact.full_name)}</p>` : ''}
                ${contact.organization ? `<p><strong>Organization:</strong> ${sanitizeInput(contact.organization)}</p>` : ''}
                <p><strong>Categories:</strong> ${categoryBadges}</p>
                <p><strong>Status:</strong> 
                    ${contact.important ? '<span class="badge bg-warning">Important</span>' : ''}
                    ${contact.archived ? '<span class="badge bg-secondary">Archived</span>' : ''}
                    ${!contact.important && !contact.archived ? '<span class="badge bg-success">Active</span>' : ''}
                </p>
            </div>
            <div class="col-md-6">
                <h6>Contact Information</h6>
                ${phoneNumbers}
                ${emails}
            </div>
        </div>
        ${contact.notes ? `
        <div class="row mt-3">
            <div class="col-12">
                <h6>Notes</h6>
                <p>${sanitizeInput(contact.notes)}</p>
            </div>
        </div>
        ` : ''}
        <div class="row mt-3">
            <div class="col-12">
                <h6>Timestamps</h6>
                <p><strong>Created:</strong> ${new Date(contact.created_date).toLocaleString()}</p>
                <p><strong>Last Modified:</strong> ${new Date(contact.last_modified).toLocaleString()}</p>
            </div>
        </div>
    `;
    document.getElementById('contactDetailContent').innerHTML = sanitizedContent;
    
    document.getElementById('editContactBtn').onclick = () => editContactFromDetail(contactId);
    
    const modal = new bootstrap.Modal(document.getElementById('contactDetailModal'));
    modal.show();
}

function editContactFromDetail(contactId) {
    // Close detail modal and open edit modal
    const detailModal = bootstrap.Modal.getInstance(document.getElementById('contactDetailModal'));
    detailModal.hide();
    
    // Wait a moment then open edit modal
    setTimeout(() => {
        editContact(contactId);
    }, 300);
}

// Duplicate Detection Functions
function findDuplicates(contact) {
    return allContacts.filter(c => 
        c.id !== contact.id && 
        (c.name.toLowerCase() === contact.name.toLowerCase() ||
         (contact.phone_numbers && c.phone_numbers && 
          contact.phone_numbers.some(p1 => 
              c.phone_numbers.some(p2 => p1.number === p2.number)
          )))
    );
}

function showMergeDuplicates(contactId) {
    const contact = allContacts.find(c => c.id === contactId);
    const duplicates = findDuplicates(contact);
    
    if (duplicates.length === 0) {
        alert('No duplicates found for this contact.');
        return;
    }
    
    const duplicatesList = [contact, ...duplicates];
    let html = '<h6>Select contacts to merge:</h6>';
    
    duplicatesList.forEach((dup, index) => {
        const isOriginal = dup.id === contactId;
        html += `
            <div class="form-check mb-2">
                <input class="form-check-input" type="checkbox" value="${dup.id}" 
                       ${isOriginal ? 'checked disabled' : ''} id="dup${index}">
                <label class="form-check-label" for="dup${index}">
                    <strong>${dup.name}</strong>
                    ${dup.phone_numbers?.length ? ` - ${dup.phone_numbers[0].display}` : ''}
                    ${isOriginal ? ' (Original)' : ''}
                </label>
            </div>
        `;
    });
    
    document.getElementById('duplicatesList').innerHTML = html;
    
    const modal = new bootstrap.Modal(document.getElementById('mergeDuplicatesModal'));
    modal.show();
}

async function mergeSelectedDuplicates() {
    const selectedIds = Array.from(document.querySelectorAll('#duplicatesList input:checked'))
        .map(cb => cb.value);
    
    if (selectedIds.length < 2) {
        alert('Please select at least 2 contacts to merge.');
        return;
    }
    
    const contactsToMerge = allContacts.filter(c => selectedIds.includes(c.id));
    const primaryContact = contactsToMerge[0];
    
    // Merge data
    const mergedContact = {
        ...primaryContact,
        phone_numbers: [...new Set(contactsToMerge.flatMap(c => c.phone_numbers || []))],
        emails: [...new Set(contactsToMerge.flatMap(c => c.emails || []))],
        categories: [...new Set(contactsToMerge.flatMap(c => 
            Array.isArray(c.categories) ? c.categories : [c.category || 'Uncategorized']
        ))],
        notes: contactsToMerge.map(c => c.notes).filter(n => n).join('\n\n'),
        important: contactsToMerge.some(c => c.important),
        last_modified: new Date().toISOString()
    };
    
    try {
        // Update primary contact
        await db.collection('contacts').doc(primaryContact.id).update(mergedContact);
        
        // Delete other contacts
        for (let i = 1; i < contactsToMerge.length; i++) {
            await db.collection('contacts').doc(contactsToMerge[i].id).delete();
        }
        
        await loadContacts();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('mergeDuplicatesModal'));
        modal.hide();
        
        alert('Contacts merged successfully!');
    } catch (error) {
        console.error('Error merging contacts:', error);
        alert('Error merging contacts. Please try again.');
    }
}

// Dashboard Filtering Functions
function showFilteredContacts(filterType) {
    showContacts();
    
    switch (filterType) {
        case 'all':
            document.getElementById('searchInput').value = '';
            document.getElementById('categoryFilter').value = '';
            document.getElementById('importantFilter').checked = false;
            document.getElementById('showArchived').checked = true;
            break;
        case 'important':
            document.getElementById('importantFilter').checked = true;
            document.getElementById('showArchived').checked = false;
            break;
        case 'active':
            document.getElementById('importantFilter').checked = false;
            document.getElementById('showArchived').checked = false;
            break;
        case 'categories':
            // Show category selection - mobile-friendly approach
            const category = prompt('Enter category name (or press Cancel to see all):');
            if (category && category.trim()) {
                document.getElementById('categoryFilter').value = category.trim();
            } else if (category === null) {
                // User cancelled, show all contacts
                document.getElementById('categoryFilter').value = '';
            }
            break;
    }
    
    filterContacts();
}

// Multiple Categories Support
function addCategoryField(selectElement) {
    const categoriesContainer = document.getElementById('contactCategories');
    const newRow = document.createElement('div');
    newRow.className = 'input-group mb-2';
    
    const selectedValue = selectElement ? selectElement.value : '';
    
    newRow.innerHTML = `
        <select class="form-select">
            <option value="">Select category...</option>
            ${allCategories.map(cat => `<option value="${cat}" ${cat === selectedValue ? 'selected' : ''}>${cat}</option>`).join('')}
        </select>
        <button type="button" class="btn btn-outline-danger" onclick="removeField(this)">
            <i class="fas fa-minus"></i>
        </button>
    `;
    
    categoriesContainer.appendChild(newRow);
}

function getSelectedCategories() {
    const categorySelects = document.querySelectorAll('#contactCategories select');
    return Array.from(categorySelects)
        .map(select => select.value)
        .filter(value => value && value !== 'Uncategorized');
}

function updateCategoryFilters() {
    const categorySelect = document.getElementById('categoryFilter');
    const contactCategory = document.getElementById('contactCategory');
    const editContactCategory = document.getElementById('editContactCategory');
    
    const options = ['<option value="">All Categories</option>'];
    allCategories.forEach(category => {
        options.push(`<option value="${category}">${category}</option>`);
    });
    
    if (categorySelect) {
        categorySelect.innerHTML = options.join('');
    }
    if (contactCategory) {
        contactCategory.innerHTML = options.join('');
    }
    if (editContactCategory) {
        editContactCategory.innerHTML = options.join('');
    }
} 

// Category Management Functions
function showManageCategoriesModal() {
    loadExistingCategories();
    const modal = new bootstrap.Modal(document.getElementById('manageCategoriesModal'));
    modal.show();
}

async function loadExistingCategories() {
    try {
        const snapshot = await db.collection('categories').get();
        const categories = snapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            created_date: doc.data().created_date
        }));
        
        const container = document.getElementById('existingCategories');
        if (categories.length === 0) {
            container.innerHTML = '<p class="text-muted">No custom categories yet. Add your first category above!</p>';
        } else {
            container.innerHTML = categories.map(cat => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <span>${cat.name}</span>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory('${cat.id}', '${cat.name}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        document.getElementById('existingCategories').innerHTML = '<p class="text-danger">Error loading categories.</p>';
    }
}

async function addNewCategory() {
    const categoryName = document.getElementById('newCategoryName').value.trim();
    
    if (!categoryName) {
        alert('Please enter a category name.');
        return;
    }
    
    if (allCategories.includes(categoryName)) {
        alert('This category already exists.');
        return;
    }
    
    try {
        await db.collection('categories').add({
            name: categoryName,
            created_date: new Date().toISOString()
        });
        
        // Clear input
        document.getElementById('newCategoryName').value = '';
        
        // Reload categories
        await loadCategories();
        await loadExistingCategories();
        
        alert('Category added successfully!');
    } catch (error) {
        console.error('Error adding category:', error);
        alert('Error adding category. Please try again.');
    }
}

async function deleteCategory(categoryId, categoryName) {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This will remove it from all contacts.`)) {
        return;
    }
    
    try {
        // Delete the category
        await db.collection('categories').doc(categoryId).delete();
        
        // Update contacts that use this category
        const contactsToUpdate = allContacts.filter(contact => {
            const categories = Array.isArray(contact.categories) ? contact.categories : [contact.category];
            return categories.includes(categoryName);
        });
        
        for (const contact of contactsToUpdate) {
            const categories = Array.isArray(contact.categories) ? contact.categories : [contact.category];
            const updatedCategories = categories.filter(cat => cat !== categoryName);
            
            await db.collection('contacts').doc(contact.id).update({
                categories: updatedCategories.length > 0 ? updatedCategories : ['Uncategorized']
            });
        }
        
        // Reload everything
        await loadCategories();
        await loadExistingCategories();
        await loadContacts();
        
        alert(`Category "${categoryName}" deleted successfully!`);
    } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
    }
} 

// User Management Functions
function showManageUsersModal() {
    loadAuthorizedUsers();
    const modal = new bootstrap.Modal(document.getElementById('manageUsersModal'));
    modal.show();
}

async function loadAuthorizedUsers() {
    try {
        const snapshot = await db.collection('authorizedUsers')
            .where('authorized', '==', true)
            .get();
        
        const users = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            users.push({
                id: doc.id,
                email: data.email,
                addedBy: data.addedBy,
                addedAt: data.addedAt
            });
        });
        
        const container = document.getElementById('authorizedUsersList');
        if (users.length === 0) {
            container.innerHTML = '<p class="text-muted">No authorized users found.</p>';
        } else {
            container.innerHTML = users.map(user => `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <span>${user.email}</span>
                        ${user.email === 'sam@adjeifamily.com' ? '<span class="badge bg-primary ms-2">Primary Admin</span>' : ''}
                        ${user.addedBy ? `<small class="text-muted d-block">Added by: ${user.addedBy}</small>` : ''}
                    </div>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeAuthorizedUser('${user.id}', '${user.email}')" ${users.length === 1 ? 'disabled' : ''} ${user.email === 'sam@adjeifamily.com' ? 'disabled' : ''}>
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading authorized users:', error);
        document.getElementById('authorizedUsersList').innerHTML = '<p class="text-danger">Error loading users. You may not have permission.</p>';
    }
}

async function addAuthorizedUser() {
    const email = document.getElementById('newUserEmail').value.trim();
    
    if (!email) {
        alert('Please enter an email address.');
        return;
    }
    
    if (!email.includes('@')) {
        alert('Please enter a valid email address.');
        return;
    }
    
    try {
        // Check if user already exists
        const existingQuery = await db.collection('authorizedUsers')
            .where('email', '==', email)
            .where('authorized', '==', true)
            .get();
        
        if (!existingQuery.empty) {
            alert('This user is already authorized.');
            return;
        }
        
        // Get current user info
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            alert('You must be signed in to add users.');
            return;
        }
        
        // Add new authorized user
        await db.collection('authorizedUsers').add({
            email: email,
            authorized: true,
            addedBy: currentUser.email,
            addedAt: new Date().toISOString()
        });
        
        // Clear input
        document.getElementById('newUserEmail').value = '';
        
        // Reload users
        await loadAuthorizedUsers();
        
        alert(`User ${email} has been authorized successfully!`);
    } catch (error) {
        console.error('Error adding user:', error);
        alert('Error adding user: ' + (error.message || 'Unknown error'));
    }
}

async function removeAuthorizedUser(userId, email) {
    // Protect primary admin account
    if (email === 'sam@adjeifamily.com') {
        alert('Cannot remove the primary admin account (sam@adjeifamily.com). This account is protected.');
        return;
    }
    
    if (!confirm(`Are you sure you want to remove ${email} from authorized users?\n\nThis will require them to go through the registration process again if they try to log in.`)) {
        return;
    }
    
    try {
        // Check if this is the last authorized user
        const allUsers = await db.collection('authorizedUsers')
            .where('authorized', '==', true)
            .get();
        
        if (allUsers.size <= 1) {
            alert('Cannot remove the last authorized user.');
            return;
        }
        
        // Remove the user
        await db.collection('authorizedUsers').doc(userId).delete();
        
        // Reload users
        await loadAuthorizedUsers();
        
        alert(`User ${email} has been removed from authorized users.\n\nThey will need to be re-authorized if they try to log in again.`);
    } catch (error) {
        console.error('Error removing user:', error);
        alert('Error removing user: ' + (error.message || 'Unknown error'));
    }
}

async function cleanupUnauthorizedUsers() {
    if (!confirm('This will remove all unauthorized users from the system.\n\nThis is useful to clean up old accounts that were added before security was properly configured.\n\nAre you sure you want to proceed?')) {
        return;
    }
    
    try {
        // Get all users in the authorizedUsers collection
        const allUsers = await db.collection('authorizedUsers').get();
        let removedCount = 0;
        
        // Remove users that are not authorized
        for (const doc of allUsers.docs) {
            const userData = doc.data();
            if (!userData.authorized || userData.authorized !== true) {
                await doc.ref.delete();
                removedCount++;
            }
        }
        
        // Reload users
        await loadAuthorizedUsers();
        
        alert(`Cleanup completed!\n\nRemoved ${removedCount} unauthorized users from the system.`);
    } catch (error) {
        console.error('Error cleaning up users:', error);
        alert('Error cleaning up users: ' + (error.message || 'Unknown error'));
    }
} 