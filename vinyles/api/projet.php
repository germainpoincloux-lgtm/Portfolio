<?php
declare(strict_types=1);
require __DIR__ . '/bootstrap.php';

// GET /api/projet.php?slug=projet-alpha  (étude de cas complète)
api(function () {
    $slug = slug_param('slug');

    $st = pdo()->prepare(
        'SELECT p.id, p.slug, p.titre, p.sous_titre, p.type_projet, p.annee, p.role, p.resume,
                p.pochette_url, p.couleur_hex, p.url_code, p.url_site,
                c.slug AS chapitre_slug, c.titre AS chapitre_titre, c.couleur_hex AS chapitre_couleur,
                ' . SELECT_PISTE . '
         FROM projet p
         JOIN chapitre c ON c.id = p.chapitre_id
         LEFT JOIN piste pi ON pi.id = p.piste_id
         WHERE p.slug = ? AND p.statut = \'visible\''
    );
    $st->execute([$slug]);
    $r = $st->fetch();
    if (!$r) {
        sortir(404, ['erreur' => 'Projet introuvable']);
    }
    $id = (int) $r['id'];

    $sections = pdo()->prepare('SELECT id, type, titre, contenu FROM section_projet WHERE projet_id = ? ORDER BY ordre, id');
    $sections->execute([$id]);

    $medias = pdo()->prepare('SELECT id, section_id, url, alt, legende, largeur, hauteur FROM media WHERE projet_id = ? ORDER BY ordre, id');
    $medias->execute([$id]);

    $technos = pdo()->prepare(
        'SELECT t.id, t.nom, t.slug FROM technologie t
         JOIN projet_technologie pt ON pt.technologie_id = t.id
         WHERE pt.projet_id = ? ORDER BY t.nom'
    );
    $technos->execute([$id]);

    // Expériences professionnelles liées à ce projet (chapitre Expérience), avec recommandations
    $exps = pdo()->prepare(
        'SELECT e.id, e.entreprise, e.poste, e.lieu, e.date_debut, e.date_fin, e.description
         FROM experience e JOIN experience_projet ep ON ep.experience_id = e.id
         WHERE ep.projet_id = ? AND e.statut = \'visible\' ORDER BY e.date_debut DESC'
    );
    $exps->execute([$id]);
    $experiences = $exps->fetchAll();
    $recos = pdo()->prepare('SELECT id, auteur, fonction, extrait, fichier_url FROM recommandation WHERE experience_id = ?');
    foreach ($experiences as &$e) {
        $recos->execute([$e['id']]);
        $e['recommandations'] = $recos->fetchAll();
    }
    unset($e);

    sortir(200, [
        'id'           => $id,
        'slug'         => $r['slug'],
        'titre'        => $r['titre'],
        'sous_titre'   => $r['sous_titre'],
        'type_projet'  => $r['type_projet'],
        'annee'        => $r['annee'],
        'role'         => $r['role'],
        'resume'       => $r['resume'],
        'pochette_url' => $r['pochette_url'],
        'couleur_hex'  => $r['couleur_hex'],
        'url_code'     => $r['url_code'],
        'url_site'     => $r['url_site'],
        'chapitre'     => [
            'slug'        => $r['chapitre_slug'],
            'titre'       => $r['chapitre_titre'],
            'couleur_hex' => $r['chapitre_couleur'],
        ],
        'piste'        => piste_depuis_ligne($r),
        'sections'     => $sections->fetchAll(),
        'medias'       => $medias->fetchAll(),
        'technologies' => $technos->fetchAll(),
        'experiences'  => $experiences,
    ]);
});
