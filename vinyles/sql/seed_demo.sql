-- ============================================================
--  Données de démonstration (à exécuter APRÈS schema_v2.sql)
--  Remplace les spotify_id 'REMPLACER_xx' par de vrais identifiants :
--  sur Spotify, clic droit sur une chanson > Partager > Copier le lien,
--  puis garde la partie entre /track/ et le '?'.
--  Ex. https://open.spotify.com/track/ABC123?si=...  =>  ABC123
-- ============================================================
SET NAMES utf8mb4;
USE portfolio;

INSERT INTO piste (id, titre, artiste, spotify_type, spotify_id) VALUES
  (1, 'Titre à remplacer 1', 'Daft Punk',     'track', 'REMPLACER_01'),
  (2, 'Titre à remplacer 2', 'Justice',       'track', 'REMPLACER_02'),
  (3, 'Titre à remplacer 3', 'Kavinsky',      'track', 'REMPLACER_03'),
  (4, 'Titre à remplacer 4', 'Air',           'track', 'REMPLACER_04'),
  (5, 'Titre à remplacer 5', 'C2C',           'track', 'REMPLACER_05'),
  (6, 'Titre à remplacer 6', 'Gesaffelstein', 'track', 'REMPLACER_06');

-- chapitre_id : 1 programmation, 2 design, 3 expérience, 4 personnel
INSERT INTO projet
  (id, chapitre_id, piste_id, slug, titre, type_projet, annee, resume, statut, ordre) VALUES
  (1, 1, 1, 'projet-alpha',   'Projet Alpha',   'Développement Front-End', 2026, 'Résumé de démonstration.', 'visible',   1),
  (2, 2, 2, 'projet-beta',    'Projet Beta',    'Design UI / UX',          2026, 'Résumé de démonstration.', 'visible',   1),
  (3, 1, 3, 'projet-gamma',   'Projet Gamma',   'Intégration WordPress',   2026, 'Résumé de démonstration.', 'visible',   2),
  (4, 1, 4, 'projet-delta',   'Projet Delta',   'Base de données SQL',     2026, 'Résumé de démonstration.', 'visible',   3),
  (5, 4, 5, 'projet-epsilon', 'Projet Epsilon', 'Jeu vidéo Unity',         2025, 'Résumé de démonstration.', 'visible',   1),
  (6, 4, 6, 'portfolio-v1',   'Portfolio V1',   'Intégration Web',         2025, 'Première version.',        'archive',   2),
  (7, 4, 3, 'projet-secret',  'Projet Secret',  'App mobile Vue.js',       2026, 'En préparation.',          'brouillon', 3),
  (8, 3, 2, 'experience-demo', 'Expérience démo', 'Emploi / stage',    2025, 'Résumé de démonstration.', 'visible',   1);

INSERT INTO section_projet (projet_id, type, titre, contenu, ordre) VALUES
  (1, 'texte', 'Contexte',  'Pourquoi ce projet existe et pour qui.',      1),
  (1, 'texte', 'Démarche',  'Les choix de conception et d''intégration.', 2),
  (1, 'texte', 'Résultat',  'Ce que le projet a donné.',                   3);

INSERT INTO technologie (id, nom, slug) VALUES
  (1, 'Vue 3', 'vue-3'), (2, 'Tailwind CSS', 'tailwind-css'),
  (3, 'WordPress', 'wordpress'), (4, 'MySQL', 'mysql'), (5, 'Figma', 'figma');

INSERT INTO projet_technologie (projet_id, technologie_id) VALUES
  (1,1),(1,2),(3,3),(4,4),(2,5);

INSERT INTO experience (id, entreprise, poste, date_debut, description, statut, ordre) VALUES
  (1, 'Entreprise à renseigner', 'Poste à renseigner', '2025-01-01',
   'Description de démonstration.', 'visible', 1);

-- L'expérience est liée au disque « Expérience démo » ; sa recommandation s'affiche dans l'étude de cas
INSERT INTO experience_projet (experience_id, projet_id) VALUES (1, 8);
INSERT INTO recommandation (experience_id, auteur, fonction, extrait) VALUES
  (1, 'Nom du superviseur', 'Fonction', 'Extrait de démonstration de la lettre de recommandation.');
