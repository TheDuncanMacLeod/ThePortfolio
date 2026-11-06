// Améliorations progressives : le contenu reste entièrement lisible sans ce script.

const root = document.documentElement;

/** Récupère un élément indispensable à la page. */
function required<T extends Element>(selector: string): T {
	const element = document.querySelector<T>(selector);
	if (!element) throw new Error(`Élément introuvable : ${selector}`);
	return element;
}

/* Thème clair / sombre */
const themeButton = required<HTMLButtonElement>('[data-theme-toggle]');

function currentTheme(): 'light' | 'dark' {
	if (root.dataset.theme === 'light' || root.dataset.theme === 'dark') return root.dataset.theme;
	return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function labelThemeButton() {
	const next = currentTheme() === 'dark' ? 'clair' : 'sombre';
	themeButton.setAttribute('aria-label', `Passer au thème ${next}`);
}

labelThemeButton();

themeButton.addEventListener('click', () => {
	const theme = currentTheme() === 'dark' ? 'light' : 'dark';
	root.dataset.theme = theme;
	labelThemeButton();
	try {
		localStorage.setItem('theme', theme);
	} catch {
		// Stockage indisponible : le thème vaut seulement pour cette visite.
	}
});

/* Menu mobile */
const menu = required<HTMLElement>('[data-menu]');
const menuButton = required<HTMLButtonElement>('[data-menu-toggle]');

function setMenu(open: boolean) {
	menu.classList.toggle('is-open', open);
	menuButton.setAttribute('aria-expanded', String(open));
}

menuButton.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));

menu.addEventListener('click', (event) => {
	if ((event.target as Element).closest('a')) setMenu(false);
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && menu.classList.contains('is-open')) {
		setMenu(false);
		menuButton.focus();
	}
});

document.addEventListener('click', (event) => {
	if (!(event.target as Element).closest('.nav')) setMenu(false);
});

/* Apparition au défilement */
const revealObserver = new IntersectionObserver(
	(entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) {
				entry.target.classList.add('is-visible');
				revealObserver.unobserve(entry.target);
			}
		}
	},
	{ rootMargin: '0px 0px -8% 0px' },
);

document.querySelectorAll('[data-reveal]').forEach((item) => revealObserver.observe(item));

/* Section active dans le menu */
const links = [...menu.querySelectorAll('a')];

const sectionObserver = new IntersectionObserver(
	(entries) => {
		for (const entry of entries) {
			if (!entry.isIntersecting) continue;
			for (const link of links) {
				if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'true');
				else link.removeAttribute('aria-current');
			}
		}
	},
	{ rootMargin: '-45% 0px -50% 0px' },
);

document.querySelectorAll('main > section[id]').forEach((section) => sectionObserver.observe(section));

/* Formulaire : GitHub Pages n'a pas de serveur, on prépare un e-mail. */
const form = required<HTMLFormElement>('[data-contact-form]');

form.addEventListener('submit', (event) => {
	event.preventDefault();

	const data = new FormData(form);
	const subject = String(data.get('subject') || 'Contact depuis le portfolio');
	const body = `${data.get('message')}\n\n${data.get('name')}\n${data.get('email')}`;

	window.location.href = `${form.getAttribute('action')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

/* Année du pied de page */
required('[data-year]').textContent = String(new Date().getFullYear());
