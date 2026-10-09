# Portfolio — Germain Poincloux

Portfolio personnel au format « répertoire de fichiers » : une page d'index qui liste les projets, et une page détaillée par projet.

Site HTML/CSS statique, sans framework ni dépendance.

🔗 **Site en ligne :** https://germainpoincloux-lgtm.github.io/portfolio/

## Structure

```
portfolio/
├── index.html              ← page d'accueil (liste des projets)
├── projet-template.html    ← page de projet (L'Inventaire Interdit)
├── style.css               ← styles de tout le site
├── README.md               ← ce fichier
└── CONTRIBUTING.md         ← règles pour contribuer
```

## Lancer le site en local

Option la plus simple : ouvrir `index.html` dans un navigateur.

Option recommandée (rechargement automatique) : dans VS Code, installer l'extension **Live Server**, puis clic droit sur `index.html` → *Open with Live Server*.

## Ajouter un nouveau projet

1. Copier `projet-template.html` et renommer la copie (ex. `vinyl-3d.html`).
2. Remplacer le titre, les métadonnées (année, catégorie, stack) et les textes.
3. Remplacer les blocs `placeholder-img` par de vraies images (`<img src="..." alt="...">`).
4. Dans `index.html`, faire pointer la ligne du projet vers le nouveau fichier.

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md). En résumé : une branche par tâche, puis une pull request. On ne modifie jamais `main` directement.

## Licence

Le code (HTML/CSS) peut être réutilisé librement.
Les textes, images et contenus des projets restent la propriété de Germain Poincloux.
