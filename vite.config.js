import { defineConfig } from 'vite';
import compression from 'compression';
import fs from 'node:fs';
import path from 'node:path';

const cleanRoutes = new Map([
  ['/home', 'main/index-8.html'],
  ['/about', 'main/page-about.html'],
  ['/features', 'main/page-features.html'],
  ['/pricing', 'main/page-pricing.html'],
  ['/contact', 'main/page-contact.html'],
  ['/page-privacy.html', 'main/page-privacy.html'],
  ['/page-terms.html', 'main/page-terms.html'],
]);

const legacyRoutes = new Map([
  ['/index-8.html', '/home'],
  ['/main/index-8.html', '/home'],
  ['/page-about.html', '/about'],
  ['/main/page-about.html', '/about'],
  ['/page-features.html', '/features'],
  ['/main/page-features.html', '/features'],
  ['/page-pricing.html', '/pricing'],
  ['/main/page-pricing.html', '/pricing'],
  ['/page-contact.html', '/contact'],
  ['/main/page-contact.html', '/contact'],
  ['/main/page-privacy.html', '/page-privacy.html'],
  ['/main/page-terms.html', '/page-terms.html'],
]);

/**
 *
 * @returns {import('vite').PluginOption}
 */
const uniPlugin = () => ({
  name: 'uni-server-plugin',
  configureServer(server) {
    const app = server.middlewares;
    app.use(compression());
    // Keep the public URLs clean while serving the existing template files.
    server.middlewares.use((req, res, next) => {
      try {
        const u = new URL(req.url || '/', 'http://localhost');
        if (u.pathname === '/' || u.pathname === '') {
          res.statusCode = 302;
          res.setHeader('Location', `/home${u.search}`);
          res.end();
          return;
        }

        const normalizedPath = u.pathname.toLowerCase();
        const legacyTarget = legacyRoutes.get(normalizedPath);
        if (legacyTarget) {
          res.statusCode = 302;
          res.setHeader('Location', `${legacyTarget}${u.search}`);
          res.end();
          return;
        }

        const cleanRouteFile = cleanRoutes.get(normalizedPath);
        if (cleanRouteFile) {
          const filePath = path.join(server.config.root, cleanRouteFile);
          if (fs.existsSync(filePath)) {
            req.url = `/${cleanRouteFile}${u.search}`;
          }
        }
      } catch {
        /* continue */
      }
      next();
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  root: './src',
  plugins: [
    uniPlugin(),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['mixed-decls', 'import', 'global-builtin', 'color-functions'],
        quietDeps: true
      }
    }
  },
  server: {
    // auto open this page
    open: '/home',
    port: 3000,
  }
});