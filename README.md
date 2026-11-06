# ThePortfolio

Portfolio de Gaël Razafintsalama, développeur web et web mobile.

**En ligne :** https://theduncanmacleod.github.io/ThePortfolio/

## Stack

- **Astro + TypeScript** : site statique, contenu validé par des schémas au build
- **React** : uniquement pour le simulateur de flux, chargé quand il arrive à l'écran
- **Vitest et Playwright** : tests unitaires du moteur et tests de bout en bout
- **GitHub Actions** : à chaque push sur `master`, tests, build puis publication sur GitHub Pages

## Commandes

Nécessite Node 22.23 ou plus récent.

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

```bash
npm run test:e2e
```

Les tests de bout en bout s'exécutent sur le build : lancer `npm run build` avant, et `npx playwright install chromium` la première fois.

## Modifier le contenu

- `src/data/experience.json`, `education.json`, `projects.json`, `skills.json` : le parcours et les projets
- `src/data/profile.ts` : coordonnées, réseaux, langues, soft skills
- `public/download/` : le CV
- `src/styles/main.css` : couleurs et polices (variables en haut du fichier)
- `src/lib/flow.ts` : le moteur du simulateur, sans dépendance à React

## Déploiement

Dans les réglages du dépôt : **Settings > Pages > Source > GitHub Actions**. C'est à régler une seule fois.
