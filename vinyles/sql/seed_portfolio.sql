-- ============================================================
--  Vrais projets du portfolio (mêmes données que data/vinyles.json)
--  À exécuter APRÈS schema_v2.sql (à la place de seed_demo.sql).
--  Remplace les projets existants.
-- ============================================================
SET NAMES utf8mb4;
USE portfolio;

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM projet_technologie;
DELETE FROM technologie;
DELETE FROM section_projet;
DELETE FROM media;
DELETE FROM experience_projet;
DELETE FROM projet;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO projet
  (id, chapitre_id, slug, titre, sous_titre, type_projet, annee, role, resume, url_page, statut, ordre) VALUES
  (1, 1, 'espace-performance', 'Espace Performance', 'Suivi sportif et nutrition, mobile-first', 'Application Web', 2026, 'Conception, design et développement full-stack', 'Un outil de suivi sportif qui regroupe la planification des entraînements, le journal alimentaire et le suivi des métriques corporelles, avec une règle simple : chaque saisie doit demander le moins de gestes possible.', '../espace-performance.html', 'visible', 1),
  (2, 1, 'charme-des-vallons', 'Le Charme des Vallons', 'Site d''un gîte avec calendrier de disponibilités', 'Web sur mesure', 2026, 'Design, intégration et développement', 'Le premier site dédié d''un gîte de deux chambres à Saint-Senoux, en Bretagne : pensé pour mettre en valeur le cachet du lieu et rendre la réservation simple, grâce à un calendrier connecté à Google Agenda.', '../charme-des-vallons.html', 'visible', 2),
  (3, 1, 'inventaire-interdit', 'L''Inventaire Interdit', NULL, 'Web sur mesure', 2026, NULL, 'Un site qui explore l''impact de la loi 96 sur les détaillants de jeux de société au Québec : une interface claire au-dessus d''un catalogue structuré avec des blocs Gutenberg sur mesure et des champs ACF.', '../projet-template.html', 'visible', 3),
  (4, 1, 'simulateur-draft-lol', 'Simulateur Draft LoL', NULL, 'Application Web', 2025, NULL, NULL, NULL, 'visible', 4),
  (5, 2, 'documentaire-mont-jacob', 'Documentaire Mont Jacob', NULL, 'Production vidéo', 2026, 'Scénarisation, montage', NULL, NULL, 'visible', 1),
  (6, 4, 'portfolio-vinyle-3d', 'Portfolio Vinyle 3D', 'Ce site : chaque projet est un disque', 'Web expérientiel', 2026, 'Design, intégration 3D', 'Une pile de vinyles en Three.js : on survole une tranche, on sort le disque de sa pochette, puis on l''ouvre pour lire l''étude de cas pendant qu''il tourne sur la platine.', NULL, 'visible', 1),
  (7, 4, 'boss-fight-roi-alaric', 'Boss Fight : Roi Alaric', NULL, 'Jeu vidéo 2D', 2026, NULL, NULL, NULL, 'visible', 2);

INSERT INTO technologie (id, nom, slug) VALUES
  (1, 'Vue 3', 'vue-3'),
  (2, 'Vite', 'vite'),
  (3, 'PHP 8', 'php-8'),
  (4, 'MySQL', 'mysql'),
  (5, 'PHP', 'php'),
  (6, 'JavaScript', 'javascript'),
  (7, 'API Google Calendar', 'google-calendar'),
  (8, 'WordPress', 'wordpress'),
  (9, 'ACF', 'acf'),
  (10, 'HTML', 'html'),
  (11, 'CSS', 'css'),
  (12, 'Three.js', 'three-js'),
  (13, 'WebGL', 'webgl'),
  (14, 'Unity', 'unity'),
  (15, 'C#', 'c-sharp');

INSERT INTO projet_technologie (projet_id, technologie_id) VALUES
  (1, 1),
  (1, 2),
  (1, 3),
  (1, 4),
  (2, 5),
  (2, 6),
  (2, 7),
  (3, 8),
  (3, 5),
  (3, 9),
  (4, 6),
  (4, 10),
  (4, 11),
  (6, 12),
  (6, 13),
  (6, 4),
  (7, 14),
  (7, 15);
