-- ============================================================
--  Portfolio GP : schéma v2 (MySQL / MariaDB, InnoDB, utf8mb4)
--  ATTENTION : ce script SUPPRIME la table `projet` existante
--  (données de test) avant de tout recréer.
--  Exécuter ensuite seed_demo.sql pour des données de démonstration.
-- ============================================================

SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS portfolio
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE portfolio;

-- Remise à zéro : supprime l'ancienne table `projet` (fausses données)
-- et toute version précédente de ce schéma. Ordre = enfants avant parents.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS recommandation, experience_projet, experience,
  projet_technologie, technologie, media, section_projet,
  projet, piste, chapitre, admin_utilisateur;
SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. CHAPITRES (les 4 grandes sections du portfolio)
-- ------------------------------------------------------------
CREATE TABLE chapitre (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug          VARCHAR(60)  NOT NULL UNIQUE,       -- ex. 'programmation'
  numero        TINYINT UNSIGNED NOT NULL,          -- 1 à 4
  titre         VARCHAR(120) NOT NULL,
  description   TEXT NULL,
  couleur_hex   CHAR(7) NOT NULL,                   -- couleur directrice du chapitre
  ordre         SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

INSERT INTO chapitre (slug, numero, titre, couleur_hex, ordre) VALUES
  ('programmation', 1, 'Programmation',        '#1B357E', 1),
  ('design',        2, 'Design',               '#192A57', 2),
  ('experience',    3, 'Expérience',           '#0F1524', 3),
  ('personnel',     4, 'Projets personnels',   '#E2E8F8', 4);

-- ------------------------------------------------------------
-- 2. PISTES (musique Spotify, réutilisable entre projets)
-- ------------------------------------------------------------
CREATE TABLE piste (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titre         VARCHAR(160) NOT NULL,
  artiste       VARCHAR(160) NOT NULL,
  spotify_type  ENUM('track','album','playlist') NOT NULL DEFAULT 'track',
  spotify_id    VARCHAR(40)  NOT NULL,              -- ex. '4uLU6hMCjMI75M1A2tKUQC'
  duree_ms      INT UNSIGNED NULL,
  UNIQUE KEY uq_spotify (spotify_type, spotify_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. PROJETS (= un disque vinyle)
-- ------------------------------------------------------------
CREATE TABLE projet (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chapitre_id     INT UNSIGNED NOT NULL,
  piste_id        INT UNSIGNED NULL,                -- la musique écoutée pendant la réalisation
  slug            VARCHAR(100) NOT NULL UNIQUE,
  titre           VARCHAR(160) NOT NULL,
  sous_titre      VARCHAR(255) NULL,
  type_projet     VARCHAR(80)  NULL,                -- ex. 'Site WordPress', 'Identité visuelle'
  annee           SMALLINT UNSIGNED NULL,
  role            VARCHAR(160) NULL,                -- ex. 'Intégration, design'
  resume          TEXT NULL,
  pochette_url    VARCHAR(255) NULL,
  couleur_hex     CHAR(7) NULL,                     -- couleur dominante (pré-calculée plus tard)
  url_code        VARCHAR(255) NULL,
  url_site        VARCHAR(255) NULL,
  statut          ENUM('brouillon','visible','archive') NOT NULL DEFAULT 'brouillon',
  ordre           SMALLINT NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_projet_chapitre FOREIGN KEY (chapitre_id) REFERENCES chapitre(id),
  CONSTRAINT fk_projet_piste    FOREIGN KEY (piste_id)    REFERENCES piste(id) ON DELETE SET NULL,
  KEY idx_affichage (statut, chapitre_id, ordre)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 4. SECTIONS D'ÉTUDE DE CAS (blocs ordonnés dans la vue projet)
-- ------------------------------------------------------------
CREATE TABLE section_projet (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  projet_id   INT UNSIGNED NOT NULL,
  type        ENUM('texte','image','galerie','citation','liste') NOT NULL DEFAULT 'texte',
  titre       VARCHAR(160) NULL,                    -- ex. 'Contexte', 'Démarche', 'Résultat'
  contenu     TEXT NULL,                            -- texte / citation / éléments de liste (JSON)
  ordre       SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT fk_section_projet FOREIGN KEY (projet_id) REFERENCES projet(id) ON DELETE CASCADE,
  KEY idx_section_ordre (projet_id, ordre)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. MÉDIAS (images des projets, rattachables à une section)
-- ------------------------------------------------------------
CREATE TABLE media (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  projet_id   INT UNSIGNED NOT NULL,
  section_id  INT UNSIGNED NULL,
  url         VARCHAR(255) NOT NULL,
  alt         VARCHAR(255) NOT NULL,                -- obligatoire pour l'accessibilité
  legende     VARCHAR(255) NULL,
  largeur     SMALLINT UNSIGNED NULL,
  hauteur     SMALLINT UNSIGNED NULL,
  ordre       SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT fk_media_projet  FOREIGN KEY (projet_id)  REFERENCES projet(id) ON DELETE CASCADE,
  CONSTRAINT fk_media_section FOREIGN KEY (section_id) REFERENCES section_projet(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 6. TECHNOLOGIES / OUTILS (relation plusieurs-à-plusieurs)
-- ------------------------------------------------------------
CREATE TABLE technologie (
  id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nom   VARCHAR(60) NOT NULL UNIQUE,                -- 'Vue 3', 'Illustrator', 'WordPress'...
  slug  VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE projet_technologie (
  projet_id       INT UNSIGNED NOT NULL,
  technologie_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (projet_id, technologie_id),
  CONSTRAINT fk_pt_projet FOREIGN KEY (projet_id)      REFERENCES projet(id)      ON DELETE CASCADE,
  CONSTRAINT fk_pt_techno FOREIGN KEY (technologie_id) REFERENCES technologie(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 7. EXPÉRIENCES PROFESSIONNELLES (chapitre 3)
-- ------------------------------------------------------------
CREATE TABLE experience (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entreprise    VARCHAR(160) NOT NULL,
  poste         VARCHAR(160) NOT NULL,
  lieu          VARCHAR(120) NULL,
  date_debut    DATE NOT NULL,
  date_fin      DATE NULL,                          -- NULL = en cours
  description   TEXT NULL,
  piste_id      INT UNSIGNED NULL,
  statut        ENUM('brouillon','visible','archive') NOT NULL DEFAULT 'brouillon',
  ordre         SMALLINT NOT NULL DEFAULT 0,
  CONSTRAINT fk_exp_piste FOREIGN KEY (piste_id) REFERENCES piste(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Lien optionnel entre une expérience et des projets réalisés pendant celle-ci
CREATE TABLE experience_projet (
  experience_id INT UNSIGNED NOT NULL,
  projet_id     INT UNSIGNED NOT NULL,
  PRIMARY KEY (experience_id, projet_id),
  CONSTRAINT fk_ep_exp    FOREIGN KEY (experience_id) REFERENCES experience(id) ON DELETE CASCADE,
  CONSTRAINT fk_ep_projet FOREIGN KEY (projet_id)     REFERENCES projet(id)     ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 8. RECOMMANDATIONS (lettre de recommandation, etc.)
-- ------------------------------------------------------------
CREATE TABLE recommandation (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  experience_id  INT UNSIGNED NULL,
  auteur         VARCHAR(160) NOT NULL,
  fonction       VARCHAR(160) NULL,
  extrait        TEXT NULL,                         -- citation courte affichée à l'écran
  fichier_url    VARCHAR(255) NULL,                 -- PDF de la lettre complète
  CONSTRAINT fk_reco_exp FOREIGN KEY (experience_id) REFERENCES experience(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 9. ADMINISTRATION (utile dès la phase 6, créé maintenant)
--    mot_de_passe_hash = résultat de password_hash() en PHP,
--    jamais le mot de passe en clair.
-- ------------------------------------------------------------
CREATE TABLE admin_utilisateur (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  courriel           VARCHAR(190) NOT NULL UNIQUE,
  mot_de_passe_hash  VARCHAR(255) NOT NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
