// Application : routeur par hash, état partagé, interface par-dessus la scène 3D.
// Les adresses ressemblent à  vinyles/#/projet/espace-performance  (aucune config serveur).
import { chargerVinyles, chargerProjet } from './donnees.js';
import { monterLecteur, surChangement, jouer, basculer } from './audio.js';

const $ = (selecteur, parent = document) => parent.querySelector(selecteur);

const etat = {
    chapitres: [],
    projets: [],
    filtre: 'tout',
    selection: null,
    vue: null,
    projetOuvert: null,
    webglIndisponible: false,
    audio: { piste: null, enPause: true, erreur: null }
};

let scene = null;
const sceneChargee = chargerScene();

// ------------------------------------------------------------
// Scène 3D (chargée à part : l'accueil s'affiche sans attendre Three.js)
// ------------------------------------------------------------
async function chargerScene() {
    try {
        const [{ createVinylScene }, { preparerPolices }] = await Promise.all([
            import('./scene.js'),
            import('./textures.js')
        ]);
        await preparerPolices();
        scene = createVinylScene($('#scene'), {
            onSelect: (slug) => choisir(slug),
            onOpen: (slug) => ouvrir(slug),
            onHover: afficherInfobulle
        });
    } catch (e) {
        console.warn('Scène 3D indisponible :', e);
        etat.webglIndisponible = true;
        document.body.classList.add('sans-webgl');
    }
}

function synchroniserScene() {
    if (!scene) return;
    scene.setSelection(etat.selection);
    scene.setMode(etat.vue === 'projet' ? 'projet' : 'pile');
    scene.setLecture(enLecture());
    scene.setActif(etat.vue === 'vinyles' || (etat.vue === 'projet' && !!etat.projetOuvert));
}

// ------------------------------------------------------------
// Catalogue et filtres
// ------------------------------------------------------------
const projetsVisibles = () => etat.filtre === 'tout'
    ? etat.projets
    : etat.projets.filter((p) => p.chapitre_slug === etat.filtre);

const parSlug = (slug) => etat.projets.find((p) => p.slug === slug) || null;

function creerBoutonFiltre(slug, titre, nombre, couleur) {
    const bouton = document.createElement('button');
    bouton.type = 'button';
    bouton.className = 'filtre';
    bouton.dataset.filtre = slug;
    if (couleur) {
        const pastille = document.createElement('span');
        pastille.className = 'filtre-pastille';
        pastille.style.background = couleur;
        pastille.setAttribute('aria-hidden', 'true');
        bouton.append(pastille);
    }
    const compte = document.createElement('span');
    compte.className = 'filtre-nombre';
    compte.textContent = nombre;
    bouton.append(`${titre} `, compte);
    bouton.addEventListener('click', () => choisirFiltre(slug));
    return bouton;
}

function dessinerFiltres() {
    const zone = $('#filtres');
    zone.replaceChildren(creerBoutonFiltre('tout', 'Tout', etat.projets.length));
    for (const c of etat.chapitres) {
        const nombre = etat.projets.filter((p) => p.chapitre_slug === c.slug).length;
        if (nombre) zone.append(creerBoutonFiltre(c.slug, c.titre, nombre, c.couleur_hex));
    }
    majFiltres();
}

function majFiltres() {
    for (const bouton of $('#filtres').children) {
        bouton.setAttribute('aria-pressed', String(bouton.dataset.filtre === etat.filtre));
    }
}

function choisirFiltre(slug) {
    etat.filtre = slug;
    if (etat.selection && !projetsVisibles().some((p) => p.slug === etat.selection)) choisir(null);
    majFiltres();
    dessinerListes();
    scene?.setVisibles(projetsVisibles().map((p) => p.slug));
}

// Liens d'accès (clavier) et grille de secours (sans WebGL)
function dessinerListes() {
    const liens = projetsVisibles().map((p) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#/projet/${p.slug}`;
        a.textContent = `Ouvrir le projet : ${p.titre} (${p.chapitre_titre})`;
        li.append(a);
        return li;
    });
    $('#liens-acces').replaceChildren(...liens);

    const cartes = projetsVisibles().map((p) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#/projet/${p.slug}`;
        a.className = 'carte';
        a.style.setProperty('--chapitre', p.chapitre_couleur);
        const chapitre = document.createElement('span');
        chapitre.className = 'etiquette';
        chapitre.textContent = p.chapitre_titre;
        const titre = document.createElement('span');
        titre.className = 'titre-suisse carte-grand-titre';
        titre.textContent = p.titre;
        const type = document.createElement('span');
        type.className = 'carte-sous-titre';
        type.textContent = p.type_projet || '';
        a.append(chapitre, titre, type);
        li.append(a);
        return li;
    });
    $('#liste-cartes').replaceChildren(...cartes);
}

// ------------------------------------------------------------
// Sélection d'un disque
// ------------------------------------------------------------
function choisir(slug) {
    etat.selection = slug;
    scene?.setSelection(slug);
    majLienProjet();
    const carte = $('#carte-selection');
    const projet = slug ? parSlug(slug) : null;
    carte.hidden = !projet || etat.vue !== 'vinyles';
    if (projet) {
        carte.style.borderColor = projet.chapitre_couleur;
        $('.carte-chapitre', carte).textContent = projet.chapitre_titre;
        $('.carte-titre', carte).textContent = projet.titre;
        $('.carte-type', carte).textContent = projet.type_projet || '';
        afficherInfobulle(null);
    }
}

function ouvrir(slug) {
    location.hash = `#/projet/${slug}`;
}

// Parcours au clavier : ↑ ↓ (ou ← →) changent de disque, Entrée ouvre, Échap referme
function surTouche(e) {
    if (etat.vue !== 'vinyles' || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest('input, textarea, select')) return;
    const liste = projetsVisibles();
    if (e.key === 'Escape') {
        choisir(null);
        return;
    }
    if (e.key === 'Enter' && etat.selection && !e.target.closest('a, button')) {
        ouvrir(etat.selection);
        return;
    }
    const pas = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!pas || !liste.length) return;
    e.preventDefault();
    const index = liste.findIndex((p) => p.slug === etat.selection);
    const suivant = index < 0 ? (pas > 0 ? 0 : liste.length - 1) : (index + pas + liste.length) % liste.length;
    choisir(liste[suivant].slug);
}

function afficherInfobulle(survol) {
    const bulle = $('#infobulle');
    const projet = survol && survol.slug !== etat.selection ? parSlug(survol.slug) : null;
    bulle.hidden = !projet;
    if (!projet) return;
    $('.infobulle-chapitre', bulle).textContent = projet.chapitre_titre;
    $('.infobulle-titre', bulle).textContent = projet.titre;
    $('.infobulle-meta', bulle).textContent = [projet.type_projet, projet.annee].filter(Boolean).join(' · ');
    bulle.style.borderColor = projet.chapitre_couleur;
    bulle.style.left = `${Math.min(survol.x + 16, window.innerWidth - 300)}px`;
    bulle.style.top = `${survol.y + 16}px`;
}

function majLienProjet() {
    const lien = $('#lien-projet');
    if (etat.selection) {
        lien.href = `#/projet/${etat.selection}`;
        lien.removeAttribute('aria-disabled');
    } else {
        lien.removeAttribute('href');
        lien.setAttribute('aria-disabled', 'true');
    }
}

// ------------------------------------------------------------
// Vue projet (étude de cas)
// ------------------------------------------------------------
const numeroPiste = (slug) => {
    const i = etat.projets.findIndex((p) => p.slug === slug);
    return i >= 0 ? `TRK.${String(i + 1).padStart(2, '0')}` : '';
};
const annee = (date) => (date ? date.slice(0, 4) : 'Aujourd’hui');

function element(balise, classe, texte) {
    const el = document.createElement(balise);
    if (classe) el.className = classe;
    if (texte !== undefined && texte !== null) el.textContent = texte;
    return el;
}

function image(media, classe) {
    const img = element('img', classe);
    img.src = media.url;
    img.alt = media.alt;
    img.loading = 'lazy';
    if (media.largeur) img.width = media.largeur;
    if (media.hauteur) img.height = media.hauteur;
    return img;
}

function lienExterne(url, texte, classe) {
    const a = element('a', classe, texte);
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
}

function dessinerProjet(p) {
    const panneau = $('#vue-projet');
    panneau.style.setProperty('--chapitre', p.chapitre.couleur_hex || '#1B357E');
    $('.panneau-chapitre', panneau).textContent = p.chapitre.titre;
    $('.panneau-titre', panneau).textContent = p.titre;
    $('.panneau-sous-titre', panneau).textContent = p.sous_titre || '';
    $('.panneau-piste', panneau).textContent = numeroPiste(p.slug);
    $('.panneau-meta', panneau).textContent = [p.type_projet, p.annee, p.role].filter(Boolean).join(' · ');
    $('.platine-macaron', panneau).style.background = p.chapitre.couleur_hex || '#1B357E';

    const corps = $('.panneau-corps', panneau);
    corps.replaceChildren();
    if (p.resume) corps.append(element('p', 'resume', p.resume));
    for (const section of p.sections) {
        const bloc = element('div', 'section');
        if (section.titre) bloc.append(element('h2', 'section-titre', section.titre));
        if (section.type === 'texte') bloc.append(element('p', null, section.contenu));
        if (section.type === 'citation') bloc.append(element('blockquote', 'citation', section.contenu));
        p.medias.filter((m) => m.section_id === section.id).forEach((m) => bloc.append(image(m, 'media')));
        corps.append(bloc);
    }
    p.medias.filter((m) => !m.section_id).forEach((m) => corps.append(image(m, 'media')));
    for (const exp of p.experiences) {
        const bloc = element('div', 'experience');
        bloc.append(
            element('p', 'mono experience-dates', `${annee(exp.date_debut)} — ${annee(exp.date_fin)}`),
            element('p', 'experience-poste', exp.poste),
            element('p', 'experience-lieu', [exp.entreprise, exp.lieu].filter(Boolean).join(' · '))
        );
        if (exp.description) bloc.append(element('p', null, exp.description));
        for (const reco of exp.recommandations || []) {
            const figure = element('figure', 'citation');
            if (reco.extrait) figure.append(element('blockquote', null, reco.extrait));
            const legende = element('figcaption', 'experience-lieu', [reco.auteur, reco.fonction].filter(Boolean).join(', '));
            if (reco.fichier_url) legende.append(' ', lienExterne(reco.fichier_url, 'Lire la lettre', 'souligne'));
            figure.append(legende);
            bloc.append(figure);
        }
        corps.append(bloc);
    }
    if (!corps.childElementCount) corps.append(element('p', 'resume', 'Étude de cas à venir.'));

    $('.technos', panneau).replaceChildren(...p.technologies.map((t) => element('li', 'techno', t.nom)));

    const liens = $('.panneau-liens', panneau);
    liens.replaceChildren();
    if (p.url_page) {
        const a = element('a', 'bouton-clair', 'Lire l’étude de cas');
        a.href = p.url_page;
        liens.append(a);
    }
    if (p.url_code) liens.append(lienExterne(p.url_code, 'Voir le code', 'bouton-clair'));
    if (p.url_site) liens.append(lienExterne(p.url_site, 'Visiter le site', 'bouton-contour'));
    liens.hidden = !liens.childElementCount;

    $('.musique', panneau).hidden = !p.piste;
    majMusique();
}

async function afficherProjet(slug) {
    const statut = $('#etat-projet');
    const contenu = $('#contenu-projet');
    statut.hidden = false;
    statut.textContent = 'Chargement…';
    statut.classList.remove('erreur');
    contenu.hidden = true;
    etat.projetOuvert = null;
    choisir(slug);
    try {
        const projet = await chargerProjet(slug);
        if (etat.vue !== 'projet' || etat.selection !== slug) return; // l'utilisateur est déjà ailleurs
        etat.projetOuvert = projet;
        dessinerProjet(projet);
        statut.hidden = true;
        contenu.hidden = false;
        document.title = `${projet.titre} — Germain Poincloux`;
    } catch (e) {
        statut.textContent = e.message;
        statut.classList.add('erreur');
        choisir(null);
    }
    synchroniserScene();
}

// ------------------------------------------------------------
// Musique
// ------------------------------------------------------------
const enLecture = () => !!etat.projetOuvert?.piste
    && etat.audio.piste?.id === etat.projetOuvert.piste.id
    && !etat.audio.enPause;

function majMusique() {
    const piste = etat.projetOuvert?.piste;
    const lecture = enLecture();
    if (piste) {
        $('.musique-action').textContent = lecture ? 'Mettre en pause' : 'Lancer le disque';
        $('.musique-titre').textContent = `${piste.titre} — ${piste.artiste}`;
        $('.musique-icone').textContent = lecture ? '❚❚' : '▶';
    }
    $('.platine').classList.toggle('en-lecture', lecture);
    $('.platine').setAttribute('aria-label', lecture ? 'Disque en lecture' : 'Disque à l’arrêt');
    scene?.setLecture(lecture);

    const a = etat.audio;
    $('#lecteur').hidden = !a.piste;
    if (a.piste) {
        $('.lecteur-titre').textContent = a.piste.titre;
        $('.lecteur-artiste').textContent = a.piste.artiste;
    }
    $('.lecteur-disque').classList.toggle('en-lecture', !a.enPause);
    $('#lecteur-bouton').textContent = a.enPause ? 'Lecture' : 'Pause';
    $('#lecteur-erreur').hidden = !a.erreur;
    $('#lecteur-erreur').textContent = a.erreur || '';
}

// ------------------------------------------------------------
// Routeur et changement de vue (fondu, comme dans le prototype)
// ------------------------------------------------------------
function lireRoute() {
    const chemin = location.hash.replace(/^#/, '') || '/';
    if (chemin === '/') return { vue: 'accueil' };
    if (chemin === '/vinyles') return { vue: 'vinyles' };
    const m = chemin.match(/^\/projet\/([a-z0-9-]{1,100})$/);
    if (m) return { vue: 'projet', slug: m[1] };
    return { vue: 'introuvable' };
}

// Sans WebGL : grille de cartes et tourne-disque CSS à la place de la 3D
function majSecours() {
    $('#platine-secours').hidden = !etat.webglIndisponible;
    $('#liste-secours').hidden = !etat.webglIndisponible;
    $('#liens-acces').hidden = etat.webglIndisponible;
}

function montrerVue(vue) {
    for (const section of document.querySelectorAll('.vue')) {
        const cible = section.id === `vue-${vue}`;
        section.hidden = !cible;
        section.classList.remove('est-active');
        // Force le navigateur à repartir de l'opacité 0 avant le fondu
        if (cible) requestAnimationFrame(() => requestAnimationFrame(() => section.classList.add('est-active')));
    }
    for (const lien of document.querySelectorAll('[data-lien]')) {
        lien.classList.toggle('est-courant', lien.dataset.lien === vue);
    }
    document.body.dataset.vue = vue;
}

async function router() {
    // Ancres internes (« Aller au contenu ») : pas une route
    if (location.hash && !location.hash.startsWith('#/')) return;
    const route = lireRoute();
    etat.vue = route.vue;
    montrerVue(route.vue);
    if (route.vue !== 'projet') {
        document.title = 'Germain Poincloux — Portfolio';
        etat.projetOuvert = null;
    }
    $('#carte-selection').hidden = route.vue !== 'vinyles' || !etat.selection;
    afficherInfobulle(null);
    synchroniserScene();
    if (route.vue === 'vinyles') choisir(etat.selection);
    if (route.vue === 'projet') await afficherProjet(route.slug);
    window.scrollTo(0, 0);
}

// ------------------------------------------------------------
// Démarrage
// ------------------------------------------------------------
async function demarrer() {
    monterLecteur($('#lecteur-hote'));
    surChangement((a) => {
        etat.audio = a;
        majMusique();
    });
    $('#bouton-musique').addEventListener('click', () => jouer(etat.projetOuvert?.piste));
    $('#lecteur-bouton').addEventListener('click', basculer);
    $('#ouvrir-selection').addEventListener('click', () => etat.selection && ouvrir(etat.selection));
    $('#fermer-selection').addEventListener('click', () => choisir(null));
    $('.skip-link').addEventListener('click', (e) => {
        e.preventDefault();
        $('#contenu').focus();
    });
    window.addEventListener('keydown', surTouche);
    window.addEventListener('hashchange', router);

    try {
        const { chapitres, projets } = await chargerVinyles();
        etat.chapitres = chapitres;
        etat.projets = projets;
    } catch (e) {
        const erreur = $('#erreur-catalogue');
        erreur.hidden = false;
        erreur.textContent = `Chargement impossible : ${e.message}`;
    }
    dessinerFiltres();
    dessinerListes();
    router();

    // La pile est construite dès que Three.js est prêt, sans bloquer l'accueil
    await sceneChargee;
    if (scene) {
        scene.setProjets(etat.projets);
        scene.setVisibles(projetsVisibles().map((p) => p.slug));
    }
    majSecours();
    synchroniserScene();
}

demarrer();
