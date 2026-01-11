CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    content_html TEXT,
    meta_description TEXT,
    keywords TEXT,
    featured_image TEXT,
    status TEXT DEFAULT 'Draft',
    category TEXT,
    scheduled_at DATETIME,
    views INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles (slug);
