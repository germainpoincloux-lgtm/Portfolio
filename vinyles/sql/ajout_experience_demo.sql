-- OPTIONNEL : à n'exécuter que si tu as déjà importé l'ancien seed_demo.sql et que tu veux
-- garder ta base telle quelle. Ajoute un disque de démonstration dans le chapitre « Expérience »
-- (avec sa recommandation) sans rien effacer. Ne PAS l'exécuter après le nouveau seed_demo.sql.
SET NAMES utf8mb4;
USE portfolio;
UPDATE experience SET statut = 'visible' WHERE id = 1;
INSERT INTO projet (id, chapitre_id, piste_id, slug, titre, type_projet, annee, resume, statut, ordre) VALUES
  (8, 3, 2, 'experience-demo', 'Expérience démo', 'Emploi / stage', 2025, 'Résumé de démonstration.', 'visible', 1);
INSERT INTO experience_projet (experience_id, projet_id) VALUES (1, 8);
INSERT INTO recommandation (experience_id, auteur, fonction, extrait) VALUES
  (1, 'Nom du superviseur', 'Fonction', 'Extrait de démonstration de la lettre de recommandation.');
