import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// GitHub Pages sert le site sous https://theduncanmacleod.github.io/ThePortfolio/
export default defineConfig({
	site: 'https://theduncanmacleod.github.io',
	base: '/ThePortfolio',
	integrations: [react()],
});
