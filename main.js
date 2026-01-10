import config from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('loginError');

    // Authentication Logic
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (passwordInput.value === config.password) {
                sessionStorage.setItem('authenticated', 'true');
                window.location.href = 'index.html';
            } else {
                loginError.classList.remove('d-none');
            }
        });
    } else {
        // Only proceed if not on the login page and authentication is required
        if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
            if (sessionStorage.getItem('authenticated') !== 'true') {
                window.location.href = 'login.html';
            }

            // Control Panel Specific Logic
            // Sidebar toggle
            document.getElementById('menu-toggle').addEventListener('click', () => {
                document.getElementById('wrapper').classList.toggle('toggled');
            });

            // Handle section switching
            document.querySelectorAll('.list-group-item').forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    document.querySelectorAll('.list-group-item').forEach(link => link.classList.remove('active'));
                    this.classList.add('active');
                    document.querySelectorAll('.content-section').forEach(section => section.classList.add('d-none'));
                    const targetSection = document.getElementById(this.dataset.section + '-section');
                    if (targetSection) {
                        targetSection.classList.remove('d-none');
                    }
                });
            });

            // Initialize Quill editor
            const quill = new Quill('#articleContent', {
                theme: 'snow',
                placeholder: 'Write your article content here...'
            });

            // Logout functionality
            document.getElementById('logoutButton').addEventListener('click', () => {
                sessionStorage.removeItem('authenticated');
                window.location.href = 'login.html';
            });
        }
    }
});