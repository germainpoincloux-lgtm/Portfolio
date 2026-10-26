// Moteur 3D : la pile de vinyles (vue « Vinyles ») et le tourne-disque (vue « Projet »).
//
// Base : le prototype vanilla (pochette + disque qui glisse hors de la pochette,
// inclinaison qui suit la souris, molette / glissé pour refermer).
// Ajouts de la version Vue : tranches lisibles, espacement et caméra qui s'adaptent
// au nombre de disques et à l'écran, filtres animés, rendu en pause hors de la vue,
// prefers-reduced-motion, libération de la mémoire GPU.
// Nouveau : en vue Projet, le disque reste en 3D à gauche du panneau et tourne.
import * as THREE from 'three';
import {
    COTE, EPAISSEUR, FONCE, SOMBRE,
    couleurValide, texturePochette, textureTranche, textureMacaron, textureSillons
} from './textures.js';

const INCLINAISON = Math.PI / 2 - 0.05; // disque couché dans la pile, tranche face à la caméra
const DECALAGE_Z = 0.004;               // évite que deux tranches se superposent (z-fighting)
const RAYON_DISQUE = 1.2;
const SORTIE_MAX = -1.6;                // disque sorti au maximum de sa pochette

// Espacement vertical : se resserre quand il y a beaucoup de disques
const espacement = (total) => Math.min(0.36, 3.8 / Math.max(total, 1));
// Recule la pile quand la caméra s'éloigne (écran étroit)
const profondeurPile = (zCamera) => -0.6 + Math.min(2.2, Math.max(0, (zCamera - 6) * 0.6));
// Recule la caméra sur un écran en portrait pour que les pochettes restent entières
const distanceCamera = (ratio) => 1.5 + Math.max(4.5, 3.86 / Math.max(ratio, 0.2));

// Position cible d'un disque, recalculée à chaque image
function cible({ slot, total, slotSelection, survole, souris, surDisque, zPile, mode, cadre }) {
    // Disque masqué par le filtre : il rapetisse au fond
    if (slot < 0) return { x: 0, y: null, z: -3, rx: INCLINAISON, ry: 0, dx: 0, s: 0.001 };

    if (mode === 'projet') {
        if (slot !== slotSelection) return { x: 0, y: null, z: -3, rx: INCLINAISON, ry: 0, dx: 0, s: 0.001 };
        return {
            x: cadre.x, y: cadre.y, z: 0,
            rx: -souris.y * 0.12,
            ry: cadre.ry + souris.x * 0.12,
            dx: SORTIE_MAX, s: cadre.s
        };
    }

    // Aucun disque sorti : la pile complète, le disque survolé se redresse à demi
    if (slotSelection < 0) {
        return {
            x: 0,
            y: (total / 2 - slot - 0.5) * espacement(total),
            z: (survole ? zPile + 0.9 : zPile) + slot * DECALAGE_Z,
            rx: survole ? INCLINAISON - 0.3 : INCLINAISON,
            ry: 0, dx: 0, s: 1
        };
    }

    // Le disque sorti vient face à la caméra et suit la souris
    if (slot === slotSelection) {
        return {
            x: 0, y: 0, z: 1.5,
            rx: -souris.y * 0.3, ry: souris.x * 0.3,
            dx: surDisque ? SORTIE_MAX : -0.3, s: 1
        };
    }

    // Les autres s'écartent au-dessus et au-dessous
    const auDessus = slot < slotSelection;
    const restants = auDessus ? slotSelection : total - 1 - slotSelection;
    const pas = Math.min(0.34, 1.1 / Math.max(restants, 1));
    const ecart = auDessus ? slotSelection - slot : slot - slotSelection;
    return {
        x: 0,
        y: auDessus ? 2 + ecart * pas : -2 - ecart * pas,
        z: -1.5 + slot * DECALAGE_Z,
        rx: auDessus ? INCLINAISON + 0.34 : INCLINAISON,
        ry: 0, dx: 0, s: 1
    };
}

// Lève une erreur si WebGL est indisponible : l'appelant affiche alors la liste de secours
export function createVinylScene(conteneur, rappels = {}) {
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.touchAction = 'none';
    conteneur.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 6;
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const lumiere = new THREE.DirectionalLight(0xffffff, 1.5);
    lumiere.position.set(2, 5, 6);
    scene.add(lumiere);

    const mouvementReduit = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const anisotropie = Math.min(4, renderer.capabilities.getMaxAnisotropy());

    // Géométries et matériaux partagés par tous les disques
    const geoPochette = new THREE.BoxGeometry(COTE, COTE, EPAISSEUR);
    const geoDisque = new THREE.CylinderGeometry(RAYON_DISQUE, RAYON_DISQUE, 0.02, 64).rotateX(Math.PI / 2);
    const geoMacaron = new THREE.CylinderGeometry(0.4, 0.4, 0.022, 48).rotateX(Math.PI / 2);
    const texSillons = textureSillons(anisotropie);
    const matBord = new THREE.MeshStandardMaterial({ color: SOMBRE });
    const matDos = new THREE.MeshStandardMaterial({ color: FONCE });
    const matTrancheVinyle = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2 });
    const matSillons = new THREE.MeshStandardMaterial({ map: texSillons, roughness: 0.25, metalness: 0.1 });
    const partages = [geoPochette, geoDisque, geoMacaron, texSillons, matBord, matDos, matTrancheVinyle, matSillons];

    const disques = new Map(); // slug -> THREE.Group
    const ressources = [];     // textures et matériaux propres à chaque disque
    let slugsVisibles = [];
    let selection = null;
    let survol = null;
    let surDisque = false;
    let mode = 'pile';
    let lecture = false;
    const souris = { x: 0, y: 0 };
    let pointeur = null;       // dernière position écran de la souris
    let pointeurBouge = false;
    let boucle = 0;
    let dernierTemps = 0;
    let actif = false;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    function vider() {
        for (const groupe of disques.values()) scene.remove(groupe);
        disques.clear();
        ressources.splice(0).forEach((r) => r.dispose());
    }

    function creerDisque(projet, index) {
        const couleur = couleurValide(projet.chapitre_couleur);
        const pochette = texturePochette(projet, index, couleur, anisotropie);
        const tranche = textureTranche(projet, index, couleur, anisotropie);
        const macaron = textureMacaron(projet, couleur, anisotropie);
        // Émissif à 0,5 : la pochette reste lisible quel que soit l'éclairage
        const matPochette = new THREE.MeshStandardMaterial({
            map: pochette, roughness: 0.6, emissive: 0xffffff, emissiveMap: pochette, emissiveIntensity: 0.5
        });
        const matTranche = new THREE.MeshStandardMaterial({
            map: tranche, roughness: 0.6, emissive: 0xffffff, emissiveMap: tranche, emissiveIntensity: 0.5
        });
        const matMacaronBord = new THREE.MeshStandardMaterial({ color: couleur });
        const matMacaron = new THREE.MeshStandardMaterial({ map: macaron, roughness: 0.5 });
        ressources.push(pochette, tranche, macaron, matPochette, matTranche, matMacaronBord, matMacaron);

        const groupe = new THREE.Group();
        groupe.userData = { slug: projet.slug, slot: -1 };
        // Faces de la boîte : +x, -x, +y (tranche), -y, +z (pochette), -z (dos)
        groupe.add(new THREE.Mesh(geoPochette, [matBord, matBord, matTranche, matBord, matPochette, matDos]));

        // Faces du cylindre : côté, dessus (face caméra après rotation), dessous
        const disque = new THREE.Group();
        const vinyle = new THREE.Mesh(geoDisque, [matTrancheVinyle, matSillons, matSillons]);
        const etiquette = new THREE.Mesh(geoMacaron, [matMacaronBord, matMacaron, matMacaron]);
        vinyle.userData.surDisque = etiquette.userData.surDisque = true;
        disque.add(vinyle, etiquette);
        disque.position.z = -0.05;
        groupe.add(disque);
        groupe.userData.disque = disque;

        groupe.position.set(0, 0, -3);
        groupe.rotation.x = INCLINAISON;
        groupe.scale.setScalar(0.001);
        groupe.visible = false;
        scene.add(groupe);
        return groupe;
    }

    function setProjets(projets) {
        vider();
        projets.forEach((p, i) => disques.set(p.slug, creerDisque(p, i)));
        setVisibles(slugsVisibles.length ? slugsVisibles : projets.map((p) => p.slug));
    }

    function setVisibles(slugs) {
        slugsVisibles = slugs;
        for (const groupe of disques.values()) {
            const slot = slugs.indexOf(groupe.userData.slug);
            groupe.userData.slot = slot;
            if (slot >= 0) groupe.visible = true;
        }
    }

    // Lancer de rayon limité aux disques affichés, et seulement sur le canvas
    function toucher(x, y) {
        const rect = canvas.getBoundingClientRect();
        ndc.x = ((x - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((y - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        const cibles = [...disques.values()].filter((g) => g.visible && g.userData.slot >= 0);
        const impacts = raycaster.intersectObjects(cibles, true);
        if (!impacts.length) return null;
        let objet = impacts[0].object;
        while (objet && !objet.userData.slug) objet = objet.parent;
        return objet ? { slug: objet.userData.slug, surDisque: !!impacts[0].object.userData.surDisque } : null;
    }

    function majSurvol() {
        const impact = pointeur && mode === 'pile' ? toucher(pointeur.x, pointeur.y) : null;
        survol = impact ? impact.slug : null;
        surDisque = !!(impact && impact.surDisque && impact.slug === selection);
        canvas.style.cursor = impact ? 'pointer' : 'default';
        rappels.onHover?.(impact ? { slug: impact.slug, x: pointeur.x, y: pointeur.y } : null);
    }

    const surMouvement = (e) => {
        const rect = canvas.getBoundingClientRect();
        souris.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        souris.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        // Survol réservé à la souris : au doigt, un toucher = un clic
        if (e.pointerType !== 'mouse') return;
        pointeur = { x: e.clientX, y: e.clientY };
        pointeurBouge = true; // le rayon est lancé dans la boucle, une fois par image au plus
    };
    const surSortie = () => {
        pointeur = null;
        survol = null;
        surDisque = false;
        souris.x = souris.y = 0;
        rappels.onHover?.(null);
    };
    const surClic = (e) => {
        if (mode !== 'pile') return;
        const impact = toucher(e.clientX, e.clientY);
        if (!impact) rappels.onSelect?.(null);
        else if (impact.slug === selection) rappels.onOpen?.(impact.slug);
        else rappels.onSelect?.(impact.slug);
    };
    const surMolette = (e) => {
        if (mode === 'pile' && selection && Math.abs(e.deltaY) > 20) rappels.onSelect?.(null);
    };
    let debutToucher = 0;
    const surDebutToucher = (e) => { debutToucher = e.touches[0].clientY; };
    const surFinToucher = (e) => {
        if (mode === 'pile' && selection && Math.abs(debutToucher - e.changedTouches[0].clientY) > 50) {
            rappels.onSelect?.(null);
        }
    };

    canvas.addEventListener('pointermove', surMouvement);
    canvas.addEventListener('pointerleave', surSortie);
    canvas.addEventListener('click', surClic);
    canvas.addEventListener('wheel', surMolette, { passive: true });
    canvas.addEventListener('touchstart', surDebutToucher, { passive: true });
    canvas.addEventListener('touchend', surFinToucher, { passive: true });

    function redimensionner() {
        const largeur = conteneur.clientWidth;
        const hauteur = conteneur.clientHeight;
        if (!largeur || !hauteur) return;
        renderer.setSize(largeur, hauteur);
        camera.aspect = largeur / hauteur;
        camera.position.z = distanceCamera(camera.aspect);
        camera.updateProjectionMatrix();
    }
    const observateur = new ResizeObserver(redimensionner);
    observateur.observe(conteneur);

    // Place le tourne-disque dans la moitié gauche (paysage) ou en haut (portrait)
    function cadreProjet() {
        const demiH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
        const demiL = demiH * camera.aspect;
        const largeurTotale = COTE / 2 - SORTIE_MAX + RAYON_DISQUE; // pochette + disque sorti
        const centre = (COTE / 2 + SORTIE_MAX - RAYON_DISQUE) / 2;    // centre de l'ensemble
        // Mêmes seuils que la media query de la vue Projet dans vinyles.css
        if (camera.aspect >= 1 && conteneur.clientWidth >= 768) {
            const s = Math.min(1, (demiL * 0.85) / largeurTotale);
            return { x: -demiL / 2 - centre * s, y: 0, s, ry: 0.22 };
        }
        const s = Math.min(0.8, (demiL * 1.7) / largeurTotale);
        return { x: -centre * s, y: demiH * 0.5, s, ry: 0 };
    }

    function animer(temps) {
        boucle = requestAnimationFrame(animer);
        // Amortissement calé sur 60 images/s : même vitesse sur un écran 60 Hz ou 144 Hz
        const images = dernierTemps ? Math.min((temps - dernierTemps) / (1000 / 60), 4) : 1;
        dernierTemps = temps;
        if (pointeurBouge) {
            pointeurBouge = false;
            majSurvol();
        }

        const k = mouvementReduit ? 1 : 1 - Math.pow(0.9, images);
        const total = slugsVisibles.length;
        const zPile = profondeurPile(camera.position.z);
        const slotSelection = selection && disques.has(selection) ? disques.get(selection).userData.slot : -1;
        const cadre = mode === 'projet' ? cadreProjet() : null;

        for (const groupe of disques.values()) {
            const d = groupe.userData;
            const c = cible({
                slot: d.slot, total, slotSelection, survole: survol === d.slug, souris,
                surDisque: surDisque && d.slot === slotSelection, zPile, mode, cadre
            });
            groupe.position.x += (c.x - groupe.position.x) * k;
            if (c.y !== null) groupe.position.y += (c.y - groupe.position.y) * k;
            groupe.position.z += (c.z - groupe.position.z) * k;
            groupe.rotation.x += (c.rx - groupe.rotation.x) * k;
            groupe.rotation.y += (c.ry - groupe.rotation.y) * k;
            const s = groupe.scale.x + (c.s - groupe.scale.x) * k;
            groupe.scale.setScalar(s);
            d.disque.position.x += (c.dx - d.disque.position.x) * Math.min(1, k * 1.25);

            // Rotation du disque sur la platine : lente au repos, 33 tours en lecture
            const tourne = mode === 'projet' && d.slot === slotSelection && !mouvementReduit;
            if (tourne) d.disque.rotation.z -= (lecture ? 0.058 : 0.004) * images;
            else d.disque.rotation.z += (0 - d.disque.rotation.z) * k;

            if (c.s < 0.01 && s < 0.02) groupe.visible = false;
            else if (d.slot >= 0) groupe.visible = true;
        }
        renderer.render(scene, camera);
    }

    // Le rendu ne tourne que lorsque la scène est affichée
    function setActif(valeur) {
        actif = valeur;
        if (valeur && !boucle) {
            redimensionner();
            boucle = requestAnimationFrame(animer);
        }
        if (!valeur && boucle) {
            cancelAnimationFrame(boucle);
            boucle = 0;
            dernierTemps = 0;
            surSortie();
        }
    }

    function dispose() {
        setActif(false);
        observateur.disconnect();
        canvas.removeEventListener('pointermove', surMouvement);
        canvas.removeEventListener('pointerleave', surSortie);
        canvas.removeEventListener('click', surClic);
        canvas.removeEventListener('wheel', surMolette);
        canvas.removeEventListener('touchstart', surDebutToucher);
        canvas.removeEventListener('touchend', surFinToucher);
        vider();
        partages.forEach((r) => r.dispose());
        renderer.dispose();
        canvas.remove();
    }

    return {
        setProjets,
        setVisibles,
        setSelection: (slug) => { selection = slug; },
        setMode: (valeur) => { mode = valeur; if (valeur !== 'pile') surSortie(); },
        setLecture: (valeur) => { lecture = valeur; },
        setActif,
        dispose,
        get actif() { return actif; }
    };
}
