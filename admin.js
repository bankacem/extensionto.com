import config from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('authenticated') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    const addArticleForm = document.getElementById('addArticleForm');
    const menuToggle = document.getElementById('menu-toggle');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.getElementById('wrapper').classList.toggle('toggled');
        });
    }

    if (addArticleForm) {
        // Initialize Quill editor (if exists)
        let quill;
        if (document.getElementById('articleContent')) {
            quill = new Quill('#articleContent', {
                theme: 'snow',
                placeholder: 'Write your article content here...'
            });
        }

        addArticleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('articleTitle').value;
            const content = quill ? quill.root.innerHTML : '';
            const metaDescription = document.getElementById('metaDescription').value;
            const keywords = document.getElementById('keywords').value;
            const featuredImage = document.getElementById('featuredImage').value;

            // Here you would normally send this to your Cloudflare Worker API
            console.log('Adding article:', { title, content, metaDescription, keywords, featuredImage });
            alert('Article submitted! (This is a placeholder for the actual API call)');
        });
    }

    // Handle section switching
    document.querySelectorAll('.list-group-item').forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.dataset.section;
            if (section) {
                document.querySelectorAll('.list-group-item').forEach(link => link.classList.remove('active'));
                this.classList.add('active');
                document.querySelectorAll('.content-section').forEach(s => s.classList.add('d-none'));
                const target = document.getElementById(section + '-section');
                if (target) target.classList.remove('d-none');
            }
        });
    });

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('authenticated');
            window.location.href = 'login.html';
        });
    }
});
