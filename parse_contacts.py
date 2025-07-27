#!/usr/bin/env python3
"""
VCF Contact Parser
Parses a VCF file and extracts contact information into a table format.
"""

import re
import csv
from typing import List, Dict, Optional

def parse_vcf_file(file_path: str) -> List[Dict[str, str]]:
    """
    Parse a VCF file and extract contact information.
    
    Args:
        file_path: Path to the VCF file
        
    Returns:
        List of dictionaries containing contact information
    """
    contacts = []
    current_contact = {}
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
    except UnicodeDecodeError:
        with open(file_path, 'r', encoding='latin-1') as file:
            content = file.read()
    
    # Split by VCARD entries
    vcard_entries = content.split('BEGIN:VCARD')
    
    for entry in vcard_entries:
        if not entry.strip():
            continue
            
        # Parse each VCARD entry
        lines = entry.strip().split('\n')
        contact = {
            'Name': '',
            'Full Name': '',
            'Phone': '',
            'Email': '',
            'Organization': '',
            'Title': '',
            'Address': '',
            'URL': '',
            'Notes': ''
        }
        
        for line in lines:
            line = line.strip()
            if not line or line == 'END:VCARD':
                continue
                
            # Parse different fields
            if line.startswith('N:'):
                # Name field (Last;First;Middle;Prefix;Suffix)
                name_parts = line[2:].split(';')
                if len(name_parts) >= 2:
                    last_name = name_parts[0] if name_parts[0] else ''
                    first_name = name_parts[1] if len(name_parts) > 1 and name_parts[1] else ''
                    contact['Name'] = f"{first_name} {last_name}".strip()
                    
            elif line.startswith('FN:'):
                # Full Name
                contact['Full Name'] = line[3:]
                
            elif line.startswith('TEL'):
                # Phone number
                phone_match = re.search(r'TEL[^:]*:(.+)', line)
                if phone_match:
                    phone = phone_match.group(1)
                    if not contact['Phone']:
                        contact['Phone'] = phone
                    else:
                        contact['Phone'] += f"; {phone}"
                        
            elif line.startswith('EMAIL'):
                # Email
                email_match = re.search(r'EMAIL[^:]*:(.+)', line)
                if email_match:
                    email = email_match.group(1)
                    if not contact['Email']:
                        contact['Email'] = email
                    else:
                        contact['Email'] += f"; {email}"
                        
            elif line.startswith('ORG:'):
                # Organization
                contact['Organization'] = line[4:]
                
            elif line.startswith('TITLE:'):
                # Title
                contact['Title'] = line[6:]
                
            elif line.startswith('ADR'):
                # Address
                addr_match = re.search(r'ADR[^:]*:(.+)', line)
                if addr_match:
                    contact['Address'] = addr_match.group(1)
                    
            elif line.startswith('URL'):
                # URL
                url_match = re.search(r'URL[^:]*:(.+)', line)
                if url_match:
                    contact['URL'] = url_match.group(1)
                    
            elif line.startswith('NOTE:'):
                # Notes
                contact['Notes'] = line[5:]
        
        # Only add contacts that have at least a name or phone number
        if contact['Name'] or contact['Full Name'] or contact['Phone']:
            contacts.append(contact)
    
    return contacts

def display_contacts_table(contacts: List[Dict[str, str]]) -> None:
    """
    Display contacts in a formatted table.
    
    Args:
        contacts: List of contact dictionaries
    """
    if not contacts:
        print("No contacts found in the VCF file.")
        return
    
    # Define column headers and widths
    headers = ['#', 'Name', 'Phone', 'Email', 'Organization']
    col_widths = [3, 30, 20, 30, 20]
    
    # Print header
    header_line = ' | '.join(f"{h:<{w}}" for h, w in zip(headers, col_widths))
    print("=" * len(header_line))
    print(header_line)
    print("=" * len(header_line))
    
    # Print contacts
    for i, contact in enumerate(contacts, 1):
        # Truncate long fields
        name = (contact['Name'] or contact['Full Name'] or 'N/A')[:col_widths[1]-1]
        phone = contact['Phone'][:col_widths[2]-1] if contact['Phone'] else 'N/A'
        email = contact['Email'][:col_widths[3]-1] if contact['Email'] else 'N/A'
        org = contact['Organization'][:col_widths[4]-1] if contact['Organization'] else 'N/A'
        
        row = f"{i:<{col_widths[0]}} | {name:<{col_widths[1]}} | {phone:<{col_widths[2]}} | {email:<{col_widths[3]}} | {org:<{col_widths[4]}}"
        print(row)
    
    print("=" * len(header_line))
    print(f"Total contacts: {len(contacts)}")

def save_to_csv(contacts: List[Dict[str, str]], filename: str = 'contacts_table.csv') -> None:
    """
    Save contacts to a CSV file.
    
    Args:
        contacts: List of contact dictionaries
        filename: Output CSV filename
    """
    if not contacts:
        print("No contacts to save.")
        return
    
    fieldnames = ['Name', 'Full Name', 'Phone', 'Email', 'Organization', 'Title', 'Address', 'URL', 'Notes']
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for contact in contacts:
            # Use Full Name if Name is empty
            if not contact['Name'] and contact['Full Name']:
                contact['Name'] = contact['Full Name']
            writer.writerow(contact)
    
    print(f"Contacts saved to {filename}")

def main():
    """Main function to parse VCF file and display results."""
    vcf_file = 'contacts.vcf'
    
    print("Parsing VCF file...")
    contacts = parse_vcf_file(vcf_file)
    
    if contacts:
        print(f"\nFound {len(contacts)} contacts in the VCF file.\n")
        display_contacts_table(contacts)
        
        # Save to CSV
        save_to_csv(contacts)
        
        # Show some statistics
        print(f"\nStatistics:")
        print(f"- Total contacts: {len(contacts)}")
        print(f"- Contacts with phone numbers: {sum(1 for c in contacts if c['Phone'])}")
        print(f"- Contacts with email: {sum(1 for c in contacts if c['Email'])}")
        print(f"- Contacts with organization: {sum(1 for c in contacts if c['Organization'])}")
    else:
        print("No contacts found in the VCF file.")

if __name__ == "__main__":
    main() 