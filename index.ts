import { Router } from 'itty-router';

interface Env {
    DB: D1Database;
}

const router = Router();

// Helper function to generate a slug
function slugify(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// 1. Adding an article with the title transferred to Slug automatically.
router.post('/articles', async (request: Request, env: Env) => {
    try {
        const { title, content_html, meta_description, keywords, featured_image } = await request.json();

        if (!title) {
            return new Response('Title is required', { status: 400 });
        }

        const slug = slugify(title);

        const { success } = await env.DB.prepare(
            'INSERT INTO articles (title, slug, content_html, meta_description, keywords, featured_image) VALUES (?, ?, ?, ?, ?, ?)'
        )
            .bind(title, slug, content_html, meta_description, keywords, featured_image)
            .run();

        if (success) {
            return new Response(JSON.stringify({ message: 'Article added successfully', slug }), {
                headers: { 'Content-Type': 'application/json' },
                status: 201,
            });
        }
        return new Response('Failed to add article', { status: 500 });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
});

// 2. Extracting a single article based on Slug (for archiving).
router.get('/articles/:slug', async (request: Request, env: Env) => {
    try {
        const { slug } = request.params;
        const { results } = await env.DB.prepare('SELECT * FROM articles WHERE slug = ?').bind(slug).all();

        if (results && results.length > 0) {
            return new Response(JSON.stringify(results[0]), {
                headers: { 'Content-Type': 'application/json' },
            });
        }
        return new Response('Article not found', { status: 404 });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
});

// 3. Exporting articles in JSON format.
router.get('/articles/export', async (request: Request, env: Env) => {
    try {
        const { results } = await env.DB.prepare('SELECT * FROM articles').all();
        return new Response(JSON.stringify(results), {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': 'attachment; filename="articles.json"',
            },
        });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
});

// 4. Importing articles in JSON format.
router.post('/articles/import', async (request: Request, env: Env) => {
    try {
        const articles = await request.json();

        if (!Array.isArray(articles)) {
            return new Response('Expected an array of articles', { status: 400 });
        }

        const statements = articles.map((article) => {
            const slug = slugify(article.title);
            return env.DB.prepare(
                'INSERT INTO articles (title, slug, content_html, meta_description, keywords, featured_image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(
                article.title,
                slug,
                article.content_html,
                article.meta_description,
                article.keywords,
                article.featured_image,
                article.created_at || new Date().toISOString()
            );
        });

        // Use a transaction for atomic import
        const { success, results } = await env.DB.batch(statements);

        if (success) {
            return new Response(JSON.stringify({ message: 'Articles imported successfully', importedCount: statements.length }), {
                headers: { 'Content-Type': 'application/json' },
                status: 201,
            });
        }
        return new Response('Failed to import articles', { status: 500, details: results });
    } catch (error: any) {
        return new Response(error.message, { status: 500 });
    }
});

// Fallback for any other requests
router.all('*', () => new Response('Not Found', { status: 404 }));

export default {
    fetch: router.handle,
};
