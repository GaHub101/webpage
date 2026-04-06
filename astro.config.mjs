import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://gahub101.github.io',
  base: '/webpage',
  integrations: [
    tailwind(),
  ],
});
