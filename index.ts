import { Router } from 'itty-router';

interface Env {
    DB: D1Database;
}

const router = Router();

// Helper for CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight
router.options('*', () => new Response(null, { headers: corsHeaders }));

// Helper function to generate a slug
function slugify(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// 1. Adding an article with extended metadata
router.post('/articles', async (request: Request, env: Env) => {
    try {
        const data = await request.json();
        const { title, content_html, meta_description, keywords, featured_image, status, category, scheduled_at } = data;

        if (!title) {
            return new Response('Title is required', { status: 400, headers: corsHeaders });
        }

        const slug = slugify(title);

        const { success } = await env.DB.prepare(
            'INSERT INTO articles (title, slug, content_html, meta_description, keywords, featured_image, status, category, scheduled_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        )
            .bind(title, slug, content_html, meta_description, keywords, featured_image, status || 'Draft', category, scheduled_at)
            .run();

        if (success) {
            return new Response(JSON.stringify({ message: 'Article added successfully', slug }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 201,
            });
        }
        return new Response('Failed to add article', { status: 500, headers: corsHeaders });
    } catch (error: any) {
        return new Response(error.message, { status: 500, headers: corsHeaders });
    }
});

// 2. Extracting articles (Knowledge Base / Export)
router.get('/articles', async (request: Request, env: Env) => {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM articles ORDER BY created_at DESC').all();
        return new Response(JSON.stringify(results), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        return new Response(error.message, { status: 500, headers: corsHeaders });
    }
});

// 3. Extracting a single article based on Slug
router.get('/articles/:slug', async (request: Request, env: Env) => {
    try {
        const { slug } = request.params;
        const { results } = await env.DB.prepare('SELECT * FROM articles WHERE slug = ?').bind(slug).all();

        if (results && results.length > 0) {
            return new Response(JSON.stringify(results[0]), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        return new Response('Article not found', { status: 404, headers: corsHeaders });
    } catch (error: any) {
        return new Response(error.message, { status: 500, headers: corsHeaders });
    }
});

// 4. Exporting articles in JSON format
router.get('/export', async (request: Request, env: Env) => {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM articles').all();
        return new Response(JSON.stringify(results), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Content-Disposition': 'attachment; filename="articles.json"',
            },
        });
    } catch (error: any) {
        return new Response(error.message, { status: 500, headers: corsHeaders });
    }
});

// 5. Importing articles
router.post('/import', async (request: Request, env: Env) => {
    try {
        const articles = await request.json();

        if (!Array.isArray(articles)) {
            return new Response('Expected an array of articles', { status: 400, headers: corsHeaders });
        }

        const statements = articles.map((article) => {
            const slug = slugify(article.title);
            return env.DB.prepare(
                'INSERT INTO articles (title, slug, content_html, meta_description, keywords, featured_image, status, category, scheduled_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            ).bind(
                article.title,
                slug,
                article.content_html,
                article.meta_description,
                article.keywords,
                article.featured_image,
                article.status || 'Draft',
                article.category || '',
                article.scheduled_at || null,
                article.created_at || new Date().toISOString()
            );
        });

        const { success } = await env.DB.batch(statements);

        if (success) {
            return new Response(JSON.stringify({ message: 'Articles imported successfully', count: statements.length }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 201,
            });
        }
        return new Response('Failed to import articles', { status: 500, headers: corsHeaders });
    } catch (error: any) {
        return new Response(error.message, { status: 500, headers: corsHeaders });
    }
});

// Fallback
router.all('*', () => new Response('Not Found', { status: 404, headers: corsHeaders }));

export default {
    fetch: router.handle,
};
