import config from './config.js';

// Configuration
const API_BASE = 'http://localhost:8787'; // Update this to your deployed worker URL

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    if (sessionStorage.getItem('authenticated') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // 2. Initialize UI Components
    initSidebar();
    initEditor();
    initCharts();
    initContinuity();

    // 3. Editorial Logic
    const saveBtn = document.getElementById('saveArticleBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveArticle);
    }

    // Handle Scheduling Field Toggle
    const statusSelect = document.getElementById('articleStatus');
    if (statusSelect) {
        statusSelect.addEventListener('change', () => {
            const schedulingField = document.getElementById('schedulingField');
            if (statusSelect.value === 'Scheduled') {
                schedulingField.classList.remove('hidden');
            } else {
                schedulingField.classList.add('hidden');
            }
        });
    }
});

// Sidebar & Tab Logic
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
            sidebar.classList.toggle('absolute');
            sidebar.classList.toggle('z-40');
            sidebar.classList.toggle('h-full');
        });
    }

    window.switchTab = (tabName) => {
        // Update Title
        const titles = {
            overview: 'System Overview',
            editorial: 'Composition Hub',
            knowledge: 'Knowledge Base',
            queue: 'Editorial Queue',
            assets: 'Digital Asset Registry',
            impact: 'Engagement Impact',
            continuity: 'System Continuity'
        };
        document.getElementById('currentTabTitle').textContent = titles[tabName] || 'Dashboard';

        // Update Active Sidebar Item
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('sidebar-item-active');
            if (item.dataset.tab === tabName) item.classList.add('sidebar-item-active');
        });

        // Toggle Visibility
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.add('hidden'));
        const activePane = document.getElementById(`tab-${tabName}`);
        if (activePane) activePane.classList.remove('hidden');

        // Re-init specific components if needed
        if (tabName === 'overview' || tabName === 'impact') initCharts();
    };
}

// Editor Initialization
let quill;
function initEditor() {
    if (document.getElementById('articleEditor')) {
        quill = new Quill('#articleEditor', {
            theme: 'snow',
            placeholder: 'Craft your masterpiece here...',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['link', 'image'],
                    ['clean']
                ]
            }
        });
    }
}

// Charts Initialization
let engagementChart, impactChart;
function initCharts() {
    // 1. Engagement Line Chart (Overview)
    const ctxEngagement = document.getElementById('engagementChart');
    if (ctxEngagement) {
        if (engagementChart) engagementChart.destroy();
        engagementChart = new Chart(ctxEngagement, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Reach',
                    data: [12000, 19000, 15000, 25000, 22000, 30000],
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#1e293b' }, ticks: { color: '#64748b' } },
                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                }
            }
        });
    }

    // 2. Impact Bar Chart (Engagement)
    const ctxImpact = document.getElementById('impactChart');
    if (ctxImpact) {
        if (impactChart) impactChart.destroy();
        impactChart = new Chart(ctxImpact, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'New Users',
                    data: [450, 680, 520, 940],
                    backgroundColor: '#10b981',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#1e293b' }, ticks: { color: '#64748b' } },
                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                }
            }
        });
    }
}

// Save Article Functional Logic
async function saveArticle() {
    const title = document.getElementById('articleTitle').value;
    const content_html = quill ? quill.root.innerHTML : '';
    const category = document.getElementById('articleCategory').value;
    const status = document.getElementById('articleStatus').value;
    const scheduled_at = document.getElementById('scheduledAt').value;
    const featured_image = document.getElementById('featuredImage').value;
    const meta_description = document.getElementById('metaDescription').value;
    const keywords = document.getElementById('keywords').value;

    if (!title) {
        showToast('Title is required!', 'error');
        return;
    }

    const saveBtn = document.getElementById('saveArticleBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Saving...';

    try {
        const response = await fetch(`${API_BASE}/articles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title, content_html, category, status, scheduled_at, featured_image, meta_description, keywords
            })
        });

        if (response.ok) {
            showToast('Article saved with success!', 'success');
            // Clear form (optional)
            document.getElementById('articleTitle').value = '';
            quill.setContents([]);
        } else {
            const err = await response.text();
            showToast(`Failed to save: ${err}`, 'error');
        }
    } catch (error) {
        showToast(`Network Error: ${error.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Save & Broadcast';
    }
}

// Continuity Logic (Export/Import)
function initContinuity() {
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            window.location.href = `${API_BASE}/export`;
        });
    }
}

// Toast Notification Helper
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const color = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

    toast.className = `${color} text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 mb-3 animate-bounce`;
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('animate-bounce');
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
