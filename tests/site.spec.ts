import { expect, test } from '@playwright/test';

test.describe('portfolio', () => {
	test('charge sans erreur ni ressource manquante', async ({ page }) => {
		const problems: string[] = [];
		page.on('pageerror', (error) => problems.push(error.message));
		page.on('console', (message) => {
			if (message.type() === 'error') problems.push(message.text());
		});
		page.on('response', (response) => {
			if (response.status() >= 400) problems.push(`${response.status()} ${response.url()}`);
		});

		await page.goto('./');
		await page.evaluate(() => document.fonts.ready);
		await page.locator('#simulateur').scrollIntoViewIfNeeded();
		await expect(page.getByRole('button', { name: 'Lancer' })).toBeEnabled();

		expect(problems).toEqual([]);
	});

	test('affiche le contenu principal', async ({ page }) => {
		await page.goto('./');
		await expect(page).toHaveTitle(/Gaël Razafintsalama/);
		await expect(page.getByRole('heading', { level: 1 })).toContainText('Razafintsalama');
		await expect(page.getByText('Alternant Lean Management (Master 2)')).toBeAttached();
		await expect(page.getByRole('heading', { name: 'OuiQuit' })).toBeAttached();
	});

	test('reste lisible sans JavaScript', async ({ browser, baseURL }) => {
		const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
		const page = await context.newPage();
		await page.goto('./');
		await expect(page.getByRole('heading', { name: 'Expérience', exact: true })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Formation', exact: true })).toBeVisible();
		await context.close();
	});

	test('ne déborde pas horizontalement', async ({ page }) => {
		await page.goto('./');
		const overflow = await page.evaluate(
			() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
		);
		expect(overflow).toBeLessThanOrEqual(0);
	});

	test('propose un CV téléchargeable', async ({ page, request }) => {
		await page.goto('./');
		const href = await page.getByRole('link', { name: 'Télécharger le CV' }).getAttribute('href');
		const response = await request.get(href!);
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('pdf');
	});

	test('mémorise le thème choisi', async ({ page }) => {
		await page.goto('./');
		const initial = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue('--bg'),
		);
		await page.locator('[data-theme-toggle]').click();
		const theme = await page.evaluate(() => document.documentElement.dataset.theme);

		await page.reload();
		await expect(page.locator('html')).toHaveAttribute('data-theme', theme!);
		const toggled = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue('--bg'),
		);
		expect(toggled).not.toBe(initial);
	});
});

test.describe('simulateur de flux', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('./');
		await page.locator('#simulateur').scrollIntoViewIfNeeded();
		await expect(page.getByRole('button', { name: 'Lancer' })).toBeEnabled();
	});

	test('avance puis se met en pause', async ({ page }) => {
		const tick = page.getByTestId('tick');
		const start = Number(await tick.textContent());

		await page.getByRole('button', { name: 'Lancer' }).click();
		await expect.poll(async () => Number(await tick.textContent())).toBeGreaterThan(start + 3);

		await page.getByRole('button', { name: 'Pause' }).click();
		const paused = await tick.textContent();
		await page.waitForTimeout(500);
		expect(await tick.textContent()).toBe(paused);
	});

	test('repart de zéro après réinitialisation', async ({ page }) => {
		await page.getByRole('button', { name: 'Réinitialiser' }).click();
		await expect(page.getByTestId('tick')).toHaveText('0');
	});

	test('montre moins d\'encours en flux tiré', async ({ page }) => {
		const row = page.getByRole('row', { name: /Encours/ });
		const push = Number(await row.getByRole('cell').nth(0).textContent());
		const pull = Number(await row.getByRole('cell').nth(1).textContent());
		expect(pull).toBeLessThan(push);
	});
});
