import { defineConfig } from 'vite';
import compression from 'compression';
import fs from 'node:fs';
import path from 'node:path';

/**
 *
 * @returns {import('vite').PluginOption}
 */
const uniPlugin = () => ({
  name: 'uni-server-plugin',
  configureServer(server) {
    const app = server.middlewares;
    app.use(compression());
    // Redirect so the browser URL stays under /main/ — relative links like page-about.html work.
    server.middlewares.use((req, res, next) => {
      try {
        const u = new URL(req.url || '/', 'http://localhost');
        if (u.pathname === '/' || u.pathname === '') {
          res.statusCode = 302;
          res.setHeader('Location', `/main/index-8.html${u.search}`);
          res.end();
          return;
        }
        const m = /^\/(page-[\w-]+\.html)$/i.exec(u.pathname);
        if (m) {
          const filePath = path.join(server.config.root, 'main', m[1]);
          if (fs.existsSync(filePath)) {
            res.statusCode = 302;
            res.setHeader('Location', `/main/${m[1]}${u.search}`);
            res.end();
            return;
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
    open: '/main/index-8.html',
    port: 3000,
  }
});