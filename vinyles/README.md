# Portfolio vinyle 3D (version hybride)

Chaque projet est un disque : on survole une tranche, on sort le disque de sa pochette,
puis on l'ouvre pour lire l'étude de cas pendant qu'il tourne sur la platine.

Cette version réunit les deux prototypes précédents :

| | Prototype vanilla (`Portfolio-v2`) | Version Vue compilée (`portfolio`) | Hybride |
|---|---|---|---|
| Installation | Aucune, Three.js par CDN | Build Vite, sources absentes (seul `dist` livré) | **Aucune**, modules ES + CDN |
| Code 3D | Lisible, un seul fichier | Minifié (537 Ko avec Three.js) | **Lisible**, `js/scene.js` |
| Tranches | Couleur unie, illisibles | Titre, type et numéro | Titre, type et numéro |
| Pochettes | Texte qui déborde | Texte ajusté (retour à la ligne, « … ») | Texte ajusté |
| Pile | Espacement fixe | S'adapte au nombre de disques | S'adapte |
| Caméra | Fixe (pochettes coupées sur mobile) | Recule en portrait | Recule en portrait |
| Survol | Lancer de rayon à chaque `mousemove` sur toute la page | Une fois par image, sur le canvas | Une fois par image, sur le canvas |
| Rendu | Tourne en permanence, même vue masquée | En pause hors de la vue | En pause hors de la vue |
| Animation | Liée au nombre d'images/s | Liée au nombre d'images/s | **Indépendante** (60 ou 144 Hz) |
| Filtres par chapitre | Non | Oui, animés | Oui, animés |
| Vue projet | Panneau à droite, mais la 3D disparaît | Tourne-disque en CSS | **Disque 3D sur la platine**, à gauche du panneau |
| Macaron | Couleur unie | Couleur unie | Étiquette qui montre la rotation |
| Accessibilité | Aucune | Liens clavier, Échap, mouvement réduit | Idem + **↑ ↓ pour parcourir**, Entrée pour ouvrir |
| Sans WebGL | Page vide | Liste de cartes | Liste de cartes + tourne-disque CSS |
| Données | `api_get_projets.php`, sinon rien | API PHP/MySQL obligatoire | API PHP/MySQL, **sinon `data/vinyles.json`** |

## Structure

```
vinyles/
├── index.html          ← page unique : accueil, pile, projet, 404
├── css/vinyles.css     ← styles (variables de couleur dans :root)
├── js/
│   ├── app.js          ← routeur (#/vinyles, #/projet/slug), filtres, panneau projet
│   ├── scene.js        ← moteur Three.js : pile, sélection, platine
│   ├── textures.js     ← pochettes, tranches, macarons dessinés sur <canvas>
│   ├── donnees.js      ← API PHP, ou data/vinyles.json en secours
│   └── audio.js        ← lecteur Spotify (jamais de lecture automatique)
├── data/vinyles.json   ← projets affichés sans base de données (GitHub Pages)
├── api/                ← API PHP en lecture seule (XAMPP)
└── sql/                ← schéma MySQL et données de démonstration
```

## Lancer en local

Les modules ES ne fonctionnent pas en ouvrant le fichier directement (`file://`) :
utiliser **Live Server** dans VS Code (clic droit sur `vinyles/index.html` → *Open with Live Server*).
Les projets viennent alors de `data/vinyles.json`.

### Avec la base de données (XAMPP)

1. Démarrer Apache et MySQL.
2. Dans phpMyAdmin, onglet SQL : exécuter `sql/schema_v2.sql`, puis `sql/seed_demo.sql`
   (le schéma **efface** les tables existantes du portfolio).
3. Copier `api/config.example.php` en `api/config.php` et ajuster le port MySQL (3306 ou 3307).
   `config.php` est ignoré par Git.
4. Ouvrir `http://localhost/Portfolio/vinyles/`.

Si l'API ne répond pas (pas de PHP, base vide, mauvais port), la page bascule
automatiquement sur `data/vinyles.json` ; le motif est affiché dans la console.

## Ajouter un projet sans base de données

Ajouter un objet dans `projets` de `data/vinyles.json` (même format que `api/vinyles.php`).
`url_page` (facultatif) pointe vers l'étude de cas HTML complète, par ex. `../espace-performance.html`.
Pour la musique, renseigner `piste` : `{ "id": 1, "titre": "…", "artiste": "…", "spotify_type": "track", "spotify_id": "…" }`.
