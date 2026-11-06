import { defineConfig } from 'vitest/config';

// tests/ contient les tests Playwright, lancés séparément par `npm run test:e2e`.
export default defineConfig({
	test: {
		include: ['src/**/*.test.ts'],
	},
});
