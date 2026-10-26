<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

// GET /api/vinyles.php : tout ce qu'il faut pour construire la pile 3D (projets visibles + chapitres)
api(function () {
    $chapitres = pdo()->query(
        'SELECT id, slug, numero, titre, description, couleur_hex FROM chapitre ORDER BY ordre, numero'
    )->fetchAll();

    $lignes = pdo()->query(
        'SELECT p.id, p.slug, p.titre, p.sous_titre, p.type_projet, p.annee, p.couleur_hex,
                c.slug AS chapitre_slug, c.titre AS chapitre_titre, c.couleur_hex AS chapitre_couleur, '
        . SELECT_PISTE . '
         FROM projet p
         JOIN chapitre c ON c.id = p.chapitre_id
         LEFT JOIN piste pi ON pi.id = p.piste_id
         WHERE p.statut = \'visible\'
         ORDER BY c.ordre, p.ordre, p.id'
    )->fetchAll();

    $projets = array_map(function (array $r) {
        $piste = piste_depuis_ligne($r);
        foreach (['piste_id', 'piste_titre', 'piste_artiste', 'spotify_type', 'spotify_id'] as $k) {
            unset($r[$k]);
        }
        $r['piste'] = $piste;
        return $r;
    }, $lignes);

    sortir(200, ['chapitres' => $chapitres, 'projets' => $projets]);
});
