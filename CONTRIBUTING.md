# Contribuer au portfolio

Merci de participer ! Voici les règles pour éviter de se marcher sur les pieds.

## Le principe

- La branche `main` = la version en ligne. **On n'écrit jamais directement dessus.**
- Chaque tâche se fait sur **sa propre branche**, puis passe par une **pull request** (PR) relue avant d'être fusionnée.

## Étapes pour une tâche

1. **Récupérer la dernière version** : dans GitHub Desktop, se placer sur `main` puis cliquer *Fetch origin* / *Pull origin*.
2. **Créer une branche** : *Current branch* → *New branch*. Nommage :
   - `fix/...` pour une correction (ex. `fix/lien-projet-vinyl`)
   - `feat/...` pour un ajout (ex. `feat/page-boss-fight`)
   - `style/...` pour du CSS (ex. `style/focus-clavier`)
   - `contenu/...` pour des textes ou images
3. **Faire les modifications** dans VS Code.
4. **Commit** avec un message court et clair au présent :
   - ✅ `Corrige le lien du projet vinyl`
   - ✅ `Ajoute les styles de focus clavier`
   - ❌ `modifs`, `test`, `ça marche enfin`
5. **Push** : bouton *Publish branch* / *Push origin*.
6. **Ouvrir une pull request** : bouton *Create Pull Request*, décrire ce qui change et pourquoi.
7. Attendre la relecture, puis fusion (*Merge*) sur GitHub.

## Avant d'ouvrir une PR, vérifier que…

- [ ] Le site s'affiche correctement sur ordinateur **et** sur mobile (outils de développement du navigateur → mode responsive).
- [ ] On peut naviguer avec la touche **Tab** et voir où on se trouve.
- [ ] Les images ont un attribut `alt` et pèsent moins de 500 Ko (compresser avec squoosh.app).
- [ ] Aucun lien ne pointe vers `#` par erreur.
- [ ] Pas de vidéo ni de fichier lourd dans le dépôt (héberger les vidéos sur YouTube/Vimeo).

## Conventions de code

- Indentation : 4 espaces (géré automatiquement par `.editorconfig`).
- Couleurs et polices : utiliser les variables CSS de `:root`, pas de valeurs codées en dur.
- Classes CSS en minuscules avec tirets (`.project-meta`, pas `.projectMeta`).
- Commentaires en français.

## Une question ou une idée ?

Ouvrir une **issue** sur GitHub (onglet *Issues* → *New issue*) plutôt que de commencer à coder directement.
