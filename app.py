#!/usr/bin/env python3
"""
Contact Management System
A web-based interface for managing contacts with categorization, importance marking, and interactive features.
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for, send_file
import json
import csv
import os
from datetime import datetime
from typing import Dict, List, Optional
import re
import fcntl
import tempfile
import shutil

app = Flask(__name__)
app.secret_key = 'your-secret-key-here'

# Data storage
CONTACTS_FILE = 'contacts_data.json'
CATEGORIES_FILE = 'categories.json'

# Default categories
DEFAULT_CATEGORIES = [
    "Family",
    "Friends", 
    "Work",
    "Medical",
    "Services",
    "Church",
    "Business",
    "Emergency"
]

def load_contacts():
    """Load contacts from JSON file with error handling."""
    if not os.path.exists(CONTACTS_FILE):
        return []
    
    try:
        with open(CONTACTS_FILE, 'r', encoding='utf-8') as f:
            # Try to acquire a shared lock for reading
            fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            try:
                data = json.load(f)
                return data if isinstance(data, list) else []
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                # If JSON is corrupted, try to backup and return empty list
                backup_corrupted_file(CONTACTS_FILE)
                return []
            finally:
                fcntl.flock(f.fileno(), fcntl.LOCK_UN)
    except Exception as e:
        print(f"Error loading contacts: {e}")
        return []

def save_contacts(contacts):
    """Save contacts to JSON file with atomic write and file locking."""
    try:
        # Create a temporary file
        temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, encoding='utf-8')
        
        # Write to temporary file
        json.dump(contacts, temp_file, indent=2, ensure_ascii=False)
        temp_file.close()
        
        # Acquire exclusive lock and atomically replace the file
        with open(temp_file.name, 'r', encoding='utf-8') as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_EX)
            try:
                # Atomically move the temp file to the target location
                shutil.move(temp_file.name, CONTACTS_FILE)
            finally:
                fcntl.flock(f.fileno(), fcntl.LOCK_UN)
                
    except Exception as e:
        print(f"Error saving contacts: {e}")
        # Clean up temp file if it exists
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        raise

def backup_corrupted_file(filename):
    """Backup a corrupted file with timestamp."""
    if os.path.exists(filename):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{filename}.corrupted.{timestamp}"
        try:
            shutil.copy2(filename, backup_name)
            print(f"Corrupted file backed up as: {backup_name}")
        except Exception as e:
            print(f"Failed to backup corrupted file: {e}")

def load_categories():
    """Load categories from JSON file with error handling."""
    if not os.path.exists(CATEGORIES_FILE):
        return DEFAULT_CATEGORIES
    
    try:
        with open(CATEGORIES_FILE, 'r', encoding='utf-8') as f:
            # Try to acquire a shared lock for reading
            fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            try:
                data = json.load(f)
                return data if isinstance(data, list) else DEFAULT_CATEGORIES
            except json.JSONDecodeError as e:
                print(f"JSON decode error in categories: {e}")
                # If JSON is corrupted, try to backup and return defaults
                backup_corrupted_file(CATEGORIES_FILE)
                return DEFAULT_CATEGORIES
            finally:
                fcntl.flock(f.fileno(), fcntl.LOCK_UN)
    except Exception as e:
        print(f"Error loading categories: {e}")
        return DEFAULT_CATEGORIES

def save_categories(categories):
    """Save categories to JSON file with atomic write and file locking."""
    try:
        # Create a temporary file
        temp_file = tempfile.NamedTemporaryFile(mode='w', delete=False, encoding='utf-8')
        
        # Write to temporary file
        json.dump(categories, temp_file, indent=2, ensure_ascii=False)
        temp_file.close()
        
        # Acquire exclusive lock and atomically replace the file
        with open(temp_file.name, 'r', encoding='utf-8') as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_EX)
            try:
                # Atomically move the temp file to the target location
                shutil.move(temp_file.name, CATEGORIES_FILE)
            finally:
                fcntl.flock(f.fileno(), fcntl.LOCK_UN)
                
    except Exception as e:
        print(f"Error saving categories: {e}")
        # Clean up temp file if it exists
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)
        raise

def parse_phone_number(phone_str):
    """Parse and format phone number."""
    if not phone_str:
        return []
    
    # Split multiple numbers
    numbers = phone_str.split(';')
    formatted_numbers = []
    
    for num in numbers:
        num = num.strip()
        if num:
            # Clean the number
            cleaned = re.sub(r'[^\d+]', '', num)
            formatted_numbers.append({
                'number': cleaned,
                'display': num.strip()
            })
    
    return formatted_numbers

def parse_email(email_str):
    """Parse and format email addresses."""
    if not email_str:
        return []
    
    emails = email_str.split(';')
    return [email.strip() for email in emails if email.strip()]

def initialize_contacts_from_vcf():
    """Initialize contacts from VCF file if no JSON exists."""
    if os.path.exists(CONTACTS_FILE):
        return
    
    from parse_contacts import parse_vcf_file
    vcf_contacts = parse_vcf_file('contacts.vcf')
    
    contacts = []
    for i, vcf_contact in enumerate(vcf_contacts):
        contact = {
            'id': i + 1,
            'name': vcf_contact['Name'] or vcf_contact['Full Name'] or f'Contact {i+1}',
            'full_name': vcf_contact['Full Name'],
            'phone_numbers': parse_phone_number(vcf_contact['Phone']),
            'emails': parse_email(vcf_contact['Email']),
            'organization': vcf_contact['Organization'],
            'title': vcf_contact['Title'],
            'address': vcf_contact['Address'],
            'url': vcf_contact['URL'],
            'notes': vcf_contact['Notes'],
            'category': 'Uncategorized',
            'important': False,
            'archived': False,
            'created_date': datetime.now().isoformat(),
            'last_modified': datetime.now().isoformat()
        }
        contacts.append(contact)
    
    save_contacts(contacts)

@app.route('/')
def index():
    """Main dashboard view."""
    contacts = load_contacts()
    categories = load_categories()
    
    # Dashboard statistics
    total_contacts = len(contacts)
    important_contacts = len([c for c in contacts if c.get('important', False)])
    archived_contacts = len([c for c in contacts if c.get('archived', False)])
    active_contacts = total_contacts - archived_contacts
    
    # Category statistics
    category_stats = {}
    for contact in contacts:
        category = contact.get('category', 'Uncategorized')
        if category not in category_stats:
            category_stats[category] = 0
        category_stats[category] += 1
    
    # Recent contacts (last 10 modified)
    recent_contacts = sorted(contacts, key=lambda x: x.get('last_modified', ''), reverse=True)[:10]
    
    return render_template('dashboard.html',
                         contacts=contacts,
                         categories=categories,
                         total_contacts=total_contacts,
                         important_contacts=important_contacts,
                         archived_contacts=archived_contacts,
                         active_contacts=active_contacts,
                         category_stats=category_stats,
                         recent_contacts=recent_contacts)

@app.route('/contacts')
def contacts_list():
    """Contacts list view."""
    contacts = load_contacts()
    categories = load_categories()
    
    # Filter parameters
    category_filter = request.args.get('category', '')
    important_only = request.args.get('important', '') == 'true'
    show_archived = request.args.get('archived', '') == 'true'
    search_query = request.args.get('search', '').lower()
    
    # Apply filters
    filtered_contacts = contacts
    
    if category_filter and category_filter != 'all':
        filtered_contacts = [c for c in filtered_contacts if c.get('category') == category_filter]
    
    if important_only:
        filtered_contacts = [c for c in filtered_contacts if c.get('important', False)]
    
    if not show_archived:
        filtered_contacts = [c for c in filtered_contacts if not c.get('archived', False)]
    
    if search_query:
        filtered_contacts = [c for c in filtered_contacts if 
                           search_query in c.get('name', '').lower() or
                           search_query in c.get('full_name', '').lower() or
                           search_query in c.get('organization', '').lower()]
    
    return render_template('contacts.html',
                         contacts=filtered_contacts,
                         categories=categories,
                         category_filter=category_filter,
                         important_only=important_only,
                         show_archived=show_archived,
                         search_query=search_query)

@app.route('/contact/<int:contact_id>')
def contact_detail(contact_id):
    """Contact detail view."""
    contacts = load_contacts()
    categories = load_categories()
    
    contact = next((c for c in contacts if c['id'] == contact_id), None)
    if not contact:
        return redirect(url_for('contacts_list'))
    
    return render_template('contact_detail.html',
                         contact=contact,
                         categories=categories)

@app.route('/api/contacts/bulk', methods=['PUT'])
def api_bulk_update_contacts():
    """Bulk update contacts endpoint."""
    try:
        data = request.json
        contact_ids = data.get('contact_ids', [])
        updates = data.get('updates', {})
        
        if not contact_ids:
            return jsonify({'error': 'No contact IDs provided'}), 400
        
        contacts = load_contacts()
        updated_count = 0
        
        # Update each contact
        for i, contact in enumerate(contacts):
            if contact['id'] in contact_ids:
                contacts[i].update(updates)
                contacts[i]['last_modified'] = datetime.now().isoformat()
                updated_count += 1
        
        if updated_count > 0:
            save_contacts(contacts)
            return jsonify({
                'message': f'Successfully updated {updated_count} contacts',
                'updated_count': updated_count
            })
        else:
            return jsonify({'error': 'No contacts found to update'}), 404
            
    except Exception as e:
        print(f"Error in bulk update: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/contacts', methods=['GET', 'POST', 'PUT', 'DELETE'])
def api_contacts():
    """API endpoint for contact operations."""
    contacts = load_contacts()
    
    if request.method == 'GET':
        return jsonify(contacts)
    
    elif request.method == 'POST':
        # Add new contact
        data = request.json
        new_id = max([c['id'] for c in contacts], default=0) + 1
        
        new_contact = {
            'id': new_id,
            'name': data.get('name', ''),
            'full_name': data.get('full_name', ''),
            'phone_numbers': data.get('phone_numbers', []),
            'emails': data.get('emails', []),
            'organization': data.get('organization', ''),
            'title': data.get('title', ''),
            'address': data.get('address', ''),
            'url': data.get('url', ''),
            'notes': data.get('notes', ''),
            'category': data.get('category', 'Uncategorized'),
            'important': data.get('important', False),
            'archived': data.get('archived', False),
            'created_date': datetime.now().isoformat(),
            'last_modified': datetime.now().isoformat()
        }
        
        contacts.append(new_contact)
        save_contacts(contacts)
        return jsonify(new_contact), 201
    
    elif request.method == 'PUT':
        # Update contact
        data = request.json
        contact_id = data.get('id')
        
        for i, contact in enumerate(contacts):
            if contact['id'] == contact_id:
                contacts[i].update(data)
                contacts[i]['last_modified'] = datetime.now().isoformat()
                save_contacts(contacts)
                return jsonify(contacts[i])
        
        return jsonify({'error': 'Contact not found'}), 404
    
    elif request.method == 'DELETE':
        # Delete contact
        contact_id = request.args.get('id', type=int)
        
        for i, contact in enumerate(contacts):
            if contact['id'] == contact_id:
                deleted_contact = contacts.pop(i)
                save_contacts(contacts)
                return jsonify(deleted_contact)
        
        return jsonify({'error': 'Contact not found'}), 404

@app.route('/api/categories', methods=['GET', 'POST'])
def api_categories():
    """API endpoint for category operations."""
    categories = load_categories()
    
    if request.method == 'GET':
        return jsonify(categories)
    
    elif request.method == 'POST':
        # Add new category
        data = request.json
        new_category = data.get('name', '').strip()
        
        if new_category and new_category not in categories:
            categories.append(new_category)
            save_categories(categories)
            return jsonify({'name': new_category}), 201
        
        return jsonify({'error': 'Category already exists or invalid name'}), 400

@app.route('/export')
def export_contacts():
    """Export contacts to CSV."""
    contacts = load_contacts()
    
    # Filter parameters
    category_filter = request.args.get('category', '')
    important_only = request.args.get('important', '') == 'true'
    show_archived = request.args.get('archived', '') == 'true'
    selected_ids = request.args.get('selected', '').split(',') if request.args.get('selected') else []
    
    # Apply filters
    filtered_contacts = contacts
    
    if category_filter and category_filter != 'all':
        filtered_contacts = [c for c in filtered_contacts if c.get('category') == category_filter]
    
    if important_only:
        filtered_contacts = [c for c in filtered_contacts if c.get('important', False)]
    
    if not show_archived:
        filtered_contacts = [c for c in filtered_contacts if not c.get('archived', False)]
    
    if selected_ids and selected_ids[0]:
        selected_ids = [int(id) for id in selected_ids]
        filtered_contacts = [c for c in filtered_contacts if c['id'] in selected_ids]
    
    # Create CSV
    filename = f'contacts_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['ID', 'Name', 'Full Name', 'Phone Numbers', 'Emails', 'Organization', 
                     'Title', 'Address', 'URL', 'Notes', 'Category', 'Important', 'Archived']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for contact in filtered_contacts:
            phone_str = '; '.join([p['display'] for p in contact.get('phone_numbers', [])])
            email_str = '; '.join(contact.get('emails', []))
            
            writer.writerow({
                'ID': contact['id'],
                'Name': contact.get('name', ''),
                'Full Name': contact.get('full_name', ''),
                'Phone Numbers': phone_str,
                'Emails': email_str,
                'Organization': contact.get('organization', ''),
                'Title': contact.get('title', ''),
                'Address': contact.get('address', ''),
                'URL': contact.get('url', ''),
                'Notes': contact.get('notes', ''),
                'Category': contact.get('category', ''),
                'Important': 'Yes' if contact.get('important') else 'No',
                'Archived': 'Yes' if contact.get('archived') else 'No'
            })
    
    return send_file(filename, as_attachment=True, download_name=filename)

if __name__ == '__main__':
    initialize_contacts_from_vcf()
    
    # Production configuration
    app.run(debug=False, host='0.0.0.0', port=8080) 