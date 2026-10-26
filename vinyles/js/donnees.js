// Accès aux données : l'API PHP/MySQL quand elle répond (XAMPP),
// sinon le fichier statique data/vinyles.json (GitHub Pages, Live Server).
// Les deux sources renvoient exactement le même format.

let source = null;     // 'api' ou 'json', fixée au premier chargement
let catalogue = null;  // cache du fichier JSON

async function lireJson(url) {
    const reponse = await fetch(url, { headers: { Accept: 'application/json' } });
    const type = reponse.headers.get('content-type') || '';
    // Sur un hébergement sans PHP, le fichier .php est renvoyé en texte brut : on l'écarte
    if (!type.includes('application/json')) throw new Error('Réponse non JSON');
    const corps = await reponse.json();
    if (!reponse.ok) throw new Error(corps?.erreur || `Erreur ${reponse.status}`);
    return corps;
}

async function lireCatalogueStatique() {
    if (!catalogue) catalogue = await lireJson('data/vinyles.json');
    return catalogue;
}

export async function chargerVinyles() {
    try {
        const donnees = await lireJson('api/vinyles.php');
        source = 'api';
        return donnees;
    } catch (e) {
        console.info('API indisponible, lecture de data/vinyles.json :', e.message);
        source = 'json';
        return lireCatalogueStatique();
    }
}

export async function chargerProjet(slug) {
    if (source === 'api') {
        return lireJson(`api/projet.php?slug=${encodeURIComponent(slug)}`);
    }
    const { chapitres, projets } = await lireCatalogueStatique();
    const projet = projets.find((p) => p.slug === slug);
    if (!projet) throw new Error('Projet introuvable');
    const chapitre = chapitres.find((c) => c.slug === projet.chapitre_slug);
    // Même structure que la réponse de api/projet.php
    return {
        sections: [],
        medias: [],
        technologies: [],
        experiences: [],
        ...projet,
        chapitre: {
            slug: projet.chapitre_slug,
            titre: projet.chapitre_titre,
            couleur_hex: chapitre?.couleur_hex || projet.chapitre_couleur
        }
    };
}
