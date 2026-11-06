import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	use: {
		// Même chemin que sur GitHub Pages.
		baseURL: 'http://localhost:4321/ThePortfolio/',
	},
	projects: [
		{ name: 'desktop', use: { ...devices['Desktop Chrome'] } },
		{ name: 'mobile', use: { ...devices['Pixel 7'] } },
	],
	webServer: {
		command: 'npm run preview',
		url: 'http://localhost:4321/ThePortfolio/',
		reuseExistingServer: !process.env.CI,
	},
});
