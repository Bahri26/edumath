/**
 * Build/serve sırasında index.html + robots/sitemap için site URL enjekte eder.
 * Kaynak: VITE_PUBLIC_SITE_URL (Render / matova.app)
 */
export function matovaSeoPlugin() {
  const siteUrl = (
    process.env.VITE_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    'https://edumath-client.onrender.com'
  ).replace(/\/$/, '');

  const robots = `User-agent: *
Allow: /
Allow: /students
Allow: /teachers
Allow: /research
Allow: /legal/

Disallow: /student/
Disallow: /teacher/
Disallow: /admin/
Disallow: /reset-password
Disallow: /share/

Sitemap: ${siteUrl}/sitemap.xml
`;

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${siteUrl}/students</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteUrl}/teachers</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${siteUrl}/research</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${siteUrl}/legal/privacy</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${siteUrl}/legal/terms</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>
`;

  return {
    name: 'matova-seo',
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', siteUrl);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/robots.txt') {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(robots);
          return;
        }
        if (req.url === '/sitemap.xml') {
          res.setHeader('Content-Type', 'application/xml; charset=utf-8');
          res.end(sitemap);
          return;
        }
        next();
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemap });
    },
  };
}
