/**
 * SDG-Shram Navbar Initialization & Interactive Logic
 * Handles authentication checks, user profile display, and dropdown behavior
 */

const NavbarManager = {
    init() {
        this.checkAuth();
        this.setupEventListeners();
    },

    checkAuth() {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (!token || !userStr) {
            // If on a protected page, redirect to dashboard/login
            const protectedPages = ['feed.html', 'connect.html', 'projects.html', 'goals.html', 'services.html', 'profile.html'];
            const currentPage = window.location.pathname.split('/').pop();

            if (protectedPages.includes(currentPage)) {
                window.location.replace('dashboard.html');
            }
            return;
        }

        try {
            const user = JSON.parse(userStr);
            this.updateNavbarUI(user);
        } catch (e) {
            console.error('Error parsing user data in Navbar:', e);
        }
    },

    updateNavbarUI(user) {
        // Find display name based on stakeholder type
        let displayName = 'User';
        if (user.stakeholderType === 'individual') displayName = user.individual?.fullName || user.name || 'User';
        else if (user.stakeholderType === 'ngo') displayName = user.ngo?.ngoName || user.name || 'NGO';
        else if (user.stakeholderType === 'business') displayName = user.business?.companyName || user.name || 'Business';
        else if (user.stakeholderType === 'institution') displayName = user.institution?.institutionName || user.name || 'Institution';

        const initial = displayName.charAt(0).toUpperCase();

        // Update UI elements if they exist
        const elements = {
            'userAvatar': initial,
            'dropdownAvatar': initial,
            'dropdownName': displayName,
            'dropdownBio': user.stakeholderType || 'SDG Advocate',
            'profileAvatar': initial,
            'profileName': displayName,
            'profileType': (user.stakeholderType || 'Member').toUpperCase()
        };

        for (const [id, value] of Object.entries(elements)) {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        }

        // Handle Welcome Text on feed
        const welcomeText = document.getElementById('welcomeText');
        if (welcomeText) {
            welcomeText.textContent = `Welcome back, ${displayName.split(' ')[0]}!`;
        }
    },

    setupEventListeners() {
        // Toggle dropdown
        const profileMenu = document.getElementById('profileMenu');
        if (profileMenu) {
            profileMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = document.getElementById('profileDropdown');
                if (dropdown) dropdown.classList.toggle('show');
            });
        }

        // Close dropdown on outside click
        document.addEventListener('click', () => {
            const dropdown = document.getElementById('profileDropdown');
            if (dropdown) dropdown.classList.remove('show');
        });

        // Prevention of dropdown close when clicking inside
        const profileDropdown = document.getElementById('profileDropdown');
        if (profileDropdown) {
            profileDropdown.addEventListener('click', (e) => e.stopPropagation());
        }
    }
};

// Global logout function
window.handleLogout = async function () {
    const token = localStorage.getItem('token');

    // Clear storage first for immediate UI response
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    if (token) {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {
            console.error('Logout API call failed:', e);
        }
    }

    window.location.replace('dashboard.html');
};

// Auto-init on load
document.addEventListener('DOMContentLoaded', () => NavbarManager.init());
