/** Préfixe un fichier de `public/` avec le chemin de base du site. */
export function asset(path: string): string {
	return `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${path}`;
}
