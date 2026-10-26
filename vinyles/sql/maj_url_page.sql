-- ============================================================
--  À exécuter UNE fois si ta base a été créée avec l'ancien schema_v2.sql
--  (ajoute la colonne du lien vers l'étude de cas HTML complète).
-- ============================================================
USE portfolio;
ALTER TABLE projet ADD COLUMN IF NOT EXISTS url_page VARCHAR(255) NULL AFTER url_site;
