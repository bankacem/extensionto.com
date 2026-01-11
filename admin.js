/**
 * ExtensionTo CMS - Premium Admin Logic
 * API Base: Cloudflare Workers + D1
 */
const API_BASE = 'https://articles-worker.extensionto.workers.dev';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Guard
    if (sessionStorage.getItem('authenticated') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // 2. Component Initialization
    initSidebar();
    initEditor();
    initCharts();
    initAuth();

    // Set Default Tab
    window.switchTab('overview');

    // 3. Save Article Event
    const saveBtn = document.getElementById('saveArticleBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveArticle);
    }

    // 4. Scheduling Field Toggle
    const statusSelect = document.getElementById('articleStatus');
    if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
            const field = document.getElementById('schedulingField');
            if (e.target.value === 'Scheduled') field.classList.remove('hidden');
            else field.classList.add('hidden');
        });
    }

    // 5. Export Data Event
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            window.open(`${API_BASE}/export`, '_blank');
        });
    }
});

/**
 * Tab Switching Logic - Hides all and shows target
 * @param {string} tabName 
 */
window.switchTab = (tabName) => {
    // 1. Hide all sections
    document.querySelectorAll('.tab-content').forEach(section => section.classList.add('hidden'));

    // 2. Show target section
    const target = document.getElementById(`tab-${tabName}`);
    if (target) target.classList.remove('hidden');

    // 3. Update Sidebar Active State
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('nav-item-active');
        // Match by looking at the switchTab argument in the onclick attribute
        if (btn.getAttribute('onclick')?.includes(`'${tabName}'`)) {
            btn.classList.add('nav-item-active');
        }
    });

    // 4. Update Header Title
    const titles = {
        overview: 'System Overview',
        editorial: 'Content Creation',
        knowledge: 'Knowledge Base',
        queue: 'Content Queue',
        assets: 'Digital Assets',
        analytics: 'Analytics Dashboard',
        system: 'System Management'
    };
    const titleEl = document.getElementById('currentTabTitle');
    if (titleEl) titleEl.textContent = titles[tabName] || 'Dashboard';

    // 5. Re-render charts if needed (slight delay for visibility)
    if (tabName === 'overview' || tabName === 'analytics') {
        setTimeout(initCharts, 100);
    }
};

/**
 * Quill Rich Text Editor Initialization
 */
let quill;
function initEditor() {
    const editorEl = document.getElementById('articleEditor');
    if (editorEl) {
        quill = new Quill('#articleEditor', {
            theme: 'snow',
            placeholder: 'Craft your professional article here...',
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

/**
 * Sign Out Logic
 */
function initAuth() {
    const logoutBtn = document.getElementById('logoutButton');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('authenticated');
            window.location.href = 'login.html';
        });
    }
}

/**
 * Article Management Functions
 */
let editingSlug = null; // Track if we are editing an existing article

async function fetchArticles() {
    const listContainer = document.getElementById('articlesList');
    if (!listContainer) return;

    try {
        const response = await fetch(`${API_BASE}/articles`);
        if (response.ok) {
            const articles = await response.json();
            renderArticles(articles);
        } else {
            showToast('Failed to load articles', 'error');
        }
    } catch (error) {
        showToast('Network error while fetching articles', 'error');
    }
}

function renderArticles(articles) {
    const listContainer = document.getElementById('articlesList');
    if (articles.length === 0) {
        listContainer.innerHTML = '<tr><td colspan="5" class="p-12 text-center text-slate-500">No articles found in your empire yet.</td></tr>';
        return;
    }

    listContainer.innerHTML = articles.map(article => `
        <tr class="hover:bg-slate-800/30 transition-colors group">
            <td class="p-4">
                <p class="font-medium text-white">${article.title}</p>
                <p class="text-xs text-slate-500 mt-1">/${article.slug}</p>
            </td>
            <td class="p-4">
                <span class="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-semibold border border-blue-500/20">
                    ${article.category || 'Uncategorized'}
                </span>
            </td>
            <td class="p-4">
                <span class="px-3 py-1 ${article.status === 'Published' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'} rounded-full text-xs font-semibold border border-green-500/20">
                    ${article.status}
                </span>
            </td>
            <td class="p-4 text-xs text-slate-400">
                ${new Date(article.created_at).toLocaleDateString()}
            </td>
            <td class="p-4 text-right">
                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editArticle('${article.slug}')" class="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteArticle('${article.slug}')" class="p-2 text-rose-400 hover:bg-rose-400/10 rounded-lg transition-all" title="Delete">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                    <a href="https://extensionto.com/${article.slug}" target="_blank" class="p-2 text-slate-400 hover:bg-slate-400/10 rounded-lg transition-all" title="View">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </td>
        </tr>
    `).join('');
}

async function editArticle(slug) {
    showToast('Loading article data...', 'info');
    try {
        const response = await fetch(`${API_BASE}/articles/${slug}`);
        if (response.ok) {
            const article = await response.json();

            // Populating Editorial fields
            document.getElementById('articleTitle').value = article.title;
            if (quill) quill.root.innerHTML = article.content_html;
            document.getElementById('articleStatus').value = article.status;
            document.getElementById('articleCategory').value = article.category || '';
            document.getElementById('metaDescription').value = article.meta_description || '';
            document.getElementById('keywords').value = article.keywords || '';
            document.getElementById('featuredImage').value = article.featured_image || '';

            if (article.status === 'Scheduled') {
                document.getElementById('schedulingField').classList.remove('hidden');
                document.getElementById('scheduledAt').value = article.scheduled_at || '';
            }

            editingSlug = slug;
            const saveBtn = document.getElementById('saveArticleBtn');
            saveBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Update Article';

            window.switchTab('editorial');
            showToast('Ready to edit!', 'success');
        }
    } catch (error) {
        showToast('Error loading article', 'error');
    }
}

async function deleteArticle(slug) {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) return;

    try {
        const response = await fetch(`${API_BASE}/articles/${slug}`, { method: 'DELETE' });
        if (response.ok) {
            showToast('Article deleted', 'success');
            fetchArticles();
        } else {
            showToast('Deletion failed', 'error');
        }
    } catch (error) {
        showToast('Network error during deletion', 'error');
    }
}

/**
 * Core Logic: Saving Article to D1 via Worker
 */
async function saveArticle() {
    const title = document.getElementById('articleTitle').value;
    const content_html = quill ? quill.root.innerHTML : '';
    const status = document.getElementById('articleStatus').value;
    const category = document.getElementById('articleCategory').value;
    const scheduled_at = document.getElementById('scheduledAt').value;

    const meta_description = document.getElementById('metaDescription').value;
    const keywords = document.getElementById('keywords').value;
    const featured_image = document.getElementById('featuredImage').value;

    // Validation
    if (!title || content_html === '<p><br></p>') {
        showToast('Title and Content are required!', 'error');
        return;
    }

    const saveBtn = document.getElementById('saveArticleBtn');
    const originalHTML = saveBtn.innerHTML;

    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';

    const url = editingSlug ? `${API_BASE}/articles/${editingSlug}` : `${API_BASE}/articles`;
    const method = editingSlug ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                content_html,
                status,
                category,
                scheduled_at: status === 'Scheduled' ? scheduled_at : null,
                meta_description,
                keywords,
                featured_image
            })
        });

        if (response.ok) {
            showToast(editingSlug ? 'Article updated!' : 'Article published!', 'success');
            resetForm();
            fetchArticles();
        } else {
            const err = await response.text();
            showToast(`Error: ${err}`, 'error');
        }
    } catch (error) {
        showToast(`Connection Error: ${error.message}`, 'error');
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalHTML;
    }
}

/**
 * Reset Form after Success
 */
function resetForm() {
    document.getElementById('articleTitle').value = '';
    if (quill) quill.setContents([]);
    document.getElementById('metaDescription').value = '';
    document.getElementById('keywords').value = '';
    document.getElementById('featuredImage').value = '';
    document.getElementById('articleStatus').value = 'Draft';
    document.getElementById('schedulingField').classList.add('hidden');

    editingSlug = null;
    const saveBtn = document.getElementById('saveArticleBtn');
    saveBtn.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Save & Publish';
}

/**
 * Charts Visualization
 */
let engChart, anaChart;
function initCharts() {
    const ctx1 = document.getElementById('engagementChart');
    if (ctx1 && !engChart) {
        engChart = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Views',
                    data: [400, 600, 550, 900, 700, 1100, 1500],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { display: false },
                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                }
            }
        });
    }

    const ctx2 = document.getElementById('analyticsChart');
    if (ctx2 && !anaChart) {
        anaChart = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Page Views',
                    data: [4500, 7800, 6200, 9400],
                    backgroundColor: '#8b5cf6',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                }
            }
        });
    }
}

/**
 * Premium Toast Notifications
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const isSuccess = type === 'success';
    const isInfo = type === 'info';

    let bgColor = 'bg-rose-600';
    if (isSuccess) bgColor = 'bg-emerald-600';
    if (isInfo) bgColor = 'bg-blue-600';

    toast.className = `flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transform transition-all duration-500 scale-90 opacity-0 ${bgColor} text-white`;

    toast.innerHTML = `
        <i class="fas ${isSuccess ? 'fa-check-circle' : (isInfo ? 'fa-info-circle' : 'fa-exclamation-circle')} text-xl"></i>
        <span class="font-medium">${message}</span>
    `;

    container.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.remove('scale-90', 'opacity-0');
        toast.classList.add('scale-100', 'opacity-100');
    }, 10);

    // Auto-remove
    setTimeout(() => {
        toast.classList.remove('scale-100', 'opacity-100');
        toast.classList.add('scale-90', 'opacity-0');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

function initSidebar() { console.log("Sidebar Active"); }

// Global exports for inline HTML onclick handlers
window.fetchArticles = fetchArticles;
window.editArticle = editArticle;
window.deleteArticle = deleteArticle;