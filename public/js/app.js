// Global variables
let allContacts = [];
let allCategories = ['Uncategorized', 'Family', 'Work', 'Friends', 'Healthcare', 'Services'];

// Check authentication before loading app
window.loadApp = function() {
    // Check if user is authenticated
    if (!auth.currentUser) {
        window.location.href = '/login.html';
        return;
    }
    
    // Initialize the application
    loadContacts();
    loadCategories();
    showDashboard();
    
    // Show user info
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.textContent = auth.currentUser.email;
    }
};

// Show login function (for Firebase config)
window.showLogin = function() {
    // If we're not already on the login page, redirect
    if (window.location.pathname !== '/login.html') {
        window.location.href = '/login.html';
    }
};

// Sign out function
function signOut() {
    auth.signOut().then(() => {
        window.location.href = '/login.html';
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}

// Firebase Functions
async function loadContacts() {
    showLoading(true);
    try {
        const snapshot = await db.collection('contacts').orderBy('name').get();
        allContacts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        updateDashboard();
        renderContacts();
    } catch (error) {
        console.error('Error loading contacts:', error);
        alert('Error loading contacts. Please try again.');
    }
    showLoading(false);
}

async function loadCategories() {
    try {
        const snapshot = await db.collection('categories').get();
        const categories = snapshot.docs.map(doc => doc.data().name);
        allCategories = ['Uncategorized', ...categories];
        updateCategoryFilters();
    } catch (error) {
        console.error('Error loading categories:', error);
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
    try {
        await db.collection('categories').add({
            name: categoryName,
            created_date: new Date().toISOString()
        });
        await loadCategories();
    } catch (error) {
        console.error('Error adding category:', error);
        alert('Error adding category. Please try again.');
    }
}

// UI Functions
function showDashboard() {
    document.getElementById('dashboardView').style.display = 'block';
    document.getElementById('contactsView').style.display = 'none';
    updateDashboard();
}

function showContacts() {
    document.getElementById('dashboardView').style.display = 'none';
    document.getElementById('contactsView').style.display = 'block';
    renderContacts();
}

function updateDashboard() {
    const total = allContacts.length;
    const important = allContacts.filter(c => c.important).length;
    const archived = allContacts.filter(c => c.archived).length;
    const active = total - archived;
    const categories = new Set(allContacts.map(c => c.category || 'Uncategorized')).size;

    document.getElementById('totalContacts').textContent = total;
    document.getElementById('importantContacts').textContent = important;
    document.getElementById('activeContacts').textContent = active;
    document.getElementById('categoriesCount').textContent = categories;

    // Show recent contacts
    const recentContacts = allContacts
        .sort((a, b) => new Date(b.last_modified) - new Date(a.last_modified))
        .slice(0, 5);

    const recentHtml = recentContacts.map(contact => `
        <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
                <strong>${contact.name}</strong>
                ${contact.organization ? `<br><small class="text-muted">${contact.organization}</small>` : ''}
            </div>
            <span class="badge bg-primary rounded-pill">${contact.category || 'Uncategorized'}</span>
        </div>
    `).join('');

    document.getElementById('recentContacts').innerHTML = recentHtml || '<div class="list-group-item text-muted">No contacts yet</div>';
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
    
    return `
        <div class="col-md-6 col-lg-4 mb-3">
            <div class="card contact-card ${importantClass} ${archivedClass}">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                            <h5 class="card-title">${contact.name}</h5>
                            ${contact.full_name ? `<p class="text-muted mb-1">${contact.full_name}</p>` : ''}
                            ${contact.organization ? `<p class="text-muted mb-1"><i class="fas fa-building me-1"></i>${contact.organization}</p>` : ''}
                            ${contact.phone_numbers?.length ? `<p class="mb-1"><i class="fas fa-phone me-1"></i>${contact.phone_numbers[0].display}</p>` : ''}
                            ${contact.emails?.length ? `<p class="mb-1"><i class="fas fa-envelope me-1"></i>${contact.emails[0]}</p>` : ''}
                            <span class="badge bg-secondary">${contact.category || 'Uncategorized'}</span>
                            ${contact.important ? '<span class="badge bg-warning ms-1"><i class="fas fa-star"></i></span>' : ''}
                            ${contact.archived ? '<span class="badge bg-secondary ms-1">Archived</span>' : ''}
                        </div>
                        <div class="dropdown">
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
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="deleteContact('${contact.id}')">
                                    <i class="fas fa-trash me-2"></i>Delete
                                </a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="mt-2">
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
    
    if (categorySelect) categorySelect.innerHTML = options.join('');
    if (contactCategory) contactCategory.innerHTML = options.join('');
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

async function saveContact() {
    const formData = {
        name: document.getElementById('contactName').value,
        full_name: document.getElementById('contactFullName').value,
        organization: document.getElementById('contactOrganization').value,
        category: document.getElementById('contactCategory').value,
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
        document.getElementById('contactName').value = contact.name;
        document.getElementById('contactFullName').value = contact.full_name || '';
        document.getElementById('contactOrganization').value = contact.organization || '';
        document.getElementById('contactCategory').value = contact.category || 'Uncategorized';
        document.getElementById('contactNotes').value = contact.notes || '';
        document.getElementById('contactImportant').checked = contact.important || false;
        
        // Set phone numbers
        const phoneContainer = document.getElementById('phoneNumbers');
        phoneContainer.innerHTML = '';
        if (contact.phone_numbers?.length) {
            contact.phone_numbers.forEach((phone, index) => {
                if (index === 0) {
                    phoneContainer.innerHTML = `
                        <div class="input-group mb-2">
                            <input type="tel" class="form-control" value="${phone.display}">
                            <button type="button" class="btn btn-outline-secondary" onclick="addPhoneField()">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    `;
                } else {
                    addPhoneField();
                    const inputs = phoneContainer.querySelectorAll('input[type="tel"]');
                    inputs[inputs.length - 1].value = phone.display;
                }
            });
        } else {
            addPhoneField();
        }

        // Set email addresses
        const emailContainer = document.getElementById('emailAddresses');
        emailContainer.innerHTML = '';
        if (contact.emails?.length) {
            contact.emails.forEach((email, index) => {
                if (index === 0) {
                    emailContainer.innerHTML = `
                        <div class="input-group mb-2">
                            <input type="email" class="form-control" value="${email}">
                            <button type="button" class="btn btn-outline-secondary" onclick="addEmailField()">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    `;
                } else {
                    addEmailField();
                    const inputs = emailContainer.querySelectorAll('input[type="email"]');
                    inputs[inputs.length - 1].value = email;
                }
            });
        } else {
            addEmailField();
        }

        // Store contact ID for update
        document.getElementById('addContactForm').dataset.contactId = contact.id;
        
        const modal = new bootstrap.Modal(document.getElementById('addContactModal'));
        modal.show();
    }
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