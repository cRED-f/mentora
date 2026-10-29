import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  trailingSlash: 'always',
  // Keep existing academy bookmarks working after the landing page is removed.
  redirects: { '/academy': '/' },
});