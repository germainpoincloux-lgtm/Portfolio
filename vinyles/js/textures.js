// Textures dessinées sur <canvas> : pochette, tranche et macaron de chaque disque.
// Reprend la charte « Swiss style » du prototype (cercle / bandeau en alternance)
// et l'ajustement automatique du texte de la version Vue (retour à la ligne, « … »).
import * as THREE from 'three';

export const POLICE = 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif';
export const SOMBRE = '#0F1524';
export const FONCE = '#192A57';
export const ACCENT = '#1B357E';
export const BLANC = '#FAFAFA';

// Épaisseur de la pochette : assez large pour lire le titre sur la tranche
export const EPAISSEUR = 0.34;
export const COTE = 2.5;

// Attend Inter (max 1,5 s) pour que les textures ne soient pas dessinées en police de secours
export async function preparerPolices() {
    if (!document.fonts) return;
    try {
        await Promise.race([
            Promise.all([
                document.fonts.load(`800 64px Inter`),
                document.fonts.load(`600 32px Inter`),
                document.fonts.load(`400 32px Inter`)
            ]),
            new Promise((resolve) => setTimeout(resolve, 1500))
        ]);
    } catch {
        // Police indisponible : on dessine avec la police de secours
    }
}

export function couleurValide(hex, defaut = ACCENT) {
    return /^#[0-9a-fA-F]{6}$/.test(hex || '') ? hex : defaut;
}

// Texte sombre sur fond clair, texte blanc sur fond foncé
export function couleurTexte(hex) {
    const n = parseInt(hex.slice(1), 16);
    const luminance = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    return luminance > 0.6 ? SOMBRE : BLANC;
}

function tronquer(ctx, texte, largeurMax) {
    if (ctx.measureText(texte).width <= largeurMax) return texte;
    let t = texte;
    while (t.length > 1 && ctx.measureText(t + '…').width > largeurMax) t = t.slice(0, -1);
    return t + '…';
}

function couperLignes(ctx, texte, largeurMax) {
    const lignes = [];
    let ligne = '';
    for (const mot of texte.split(/\s+/).filter(Boolean)) {
        const essai = ligne ? `${ligne} ${mot}` : mot;
        if (ctx.measureText(essai).width <= largeurMax || !ligne) {
            ligne = essai;
        } else {
            lignes.push(ligne);
            ligne = mot;
        }
    }
    if (ligne) lignes.push(ligne);
    return lignes;
}

// Cherche la plus grande taille de titre qui tient en `lignesMax` lignes
function ajusterTitre(ctx, texte, largeurMax, lignesMax, tailleMax, tailleMin) {
    for (let taille = tailleMax; taille >= tailleMin; taille -= 8) {
        ctx.font = `800 ${taille}px ${POLICE}`;
        const lignes = couperLignes(ctx, texte, largeurMax);
        if (lignes.length <= lignesMax && lignes.every((l) => ctx.measureText(l).width <= largeurMax)) {
            return { taille, lignes };
        }
    }
    ctx.font = `800 ${tailleMin}px ${POLICE}`;
    return { taille: tailleMin, lignes: couperLignes(ctx, texte, largeurMax).slice(0, lignesMax) };
}

function enTexture(canvas, anisotropie) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = anisotropie;
    return texture;
}

const numero = (index) => String(index + 1).padStart(2, '0');

export function texturePochette(projet, index, couleur, anisotropie) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const pair = index % 2 === 0;

    ctx.fillStyle = BLANC;
    ctx.fillRect(0, 0, 1024, 1024);

    // Forme géométrique à la couleur du chapitre
    ctx.fillStyle = couleur;
    if (pair) {
        ctx.beginPath();
        ctx.arc(830, 170, 220, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.fillRect(0, 0, 1024, 150);
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `600 34px ${POLICE}`;
    ctx.fillStyle = pair ? SOMBRE : couleurTexte(couleur);
    ctx.fillText((projet.chapitre_titre || '').toUpperCase(), 80, pair ? 110 : 95);

    ctx.fillStyle = SOMBRE;
    const { taille, lignes } = ajusterTitre(ctx, (projet.titre || 'Sans titre').toUpperCase(), 860, 3, 120, 56);
    ctx.font = `800 ${taille}px ${POLICE}`;
    let y = 480;
    for (const ligne of lignes) {
        ctx.fillText(ligne, 80, y);
        y += taille * 0.95;
    }

    ctx.fillRect(80, 770, 400, 10);
    ctx.font = `400 40px ${POLICE}`;
    ctx.fillStyle = FONCE;
    ctx.fillText(tronquer(ctx, (projet.type_projet || '').toLowerCase(), 640), 80, 840);
    if (projet.piste?.artiste) {
        ctx.fillText(tronquer(ctx, `♪ ${projet.piste.artiste}`.toLowerCase(), 640), 80, 894);
    }

    ctx.fillStyle = SOMBRE;
    ctx.font = `800 150px ${POLICE}`;
    ctx.textAlign = 'right';
    ctx.fillText(numero(index), 960, 980);

    return enTexture(canvas, anisotropie);
}

// Tranche : visible quand le disque est rangé dans la pile
export function textureTranche(projet, index, couleur, anisotropie) {
    const largeur = 1024;
    const hauteur = Math.round((EPAISSEUR / COTE) * largeur);
    const canvas = document.createElement('canvas');
    canvas.width = largeur;
    canvas.height = hauteur;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = couleur;
    ctx.fillRect(0, 0, largeur, hauteur);
    ctx.fillStyle = couleurTexte(couleur);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = `800 54px ${POLICE}`;
    ctx.fillText(tronquer(ctx, (projet.titre || 'Sans titre').toUpperCase(), 560), 36, hauteur / 2 + 2);

    ctx.textAlign = 'right';
    ctx.font = `800 40px ${POLICE}`;
    ctx.fillText(numero(index), 988, hauteur / 2 + 2);
    ctx.font = `500 28px ${POLICE}`;
    ctx.globalAlpha = 0.8;
    ctx.fillText(tronquer(ctx, projet.type_projet || '', 330), 914, hauteur / 2 + 2);
    ctx.globalAlpha = 1;

    return enTexture(canvas, anisotropie);
}

// Macaron : étiquette centrale du disque, avec un repère pour voir la rotation
export function textureMacaron(projet, couleur, anisotropie) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const texte = couleurTexte(couleur);

    ctx.fillStyle = couleur;
    ctx.fillRect(0, 0, 512, 512);

    ctx.fillStyle = texte;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 46px ${POLICE}`;
    ctx.fillText(tronquer(ctx, (projet.titre || '').toUpperCase(), 380), 256, 150);
    ctx.font = `500 30px ${POLICE}`;
    ctx.globalAlpha = 0.8;
    ctx.fillText(tronquer(ctx, projet.annee ? String(projet.annee) : 'GP.', 300), 256, 372);
    ctx.globalAlpha = 1;

    // Trou central
    ctx.fillStyle = SOMBRE;
    ctx.beginPath();
    ctx.arc(256, 256, 22, 0, Math.PI * 2);
    ctx.fill();

    // Les UV du disque du cylindre sont tournés d'un quart de tour : on remet le texte droit
    const texture = enTexture(canvas, anisotropie);
    texture.center.set(0.5, 0.5);
    texture.rotation = Math.PI / 2;
    return texture;
}

// Sillons du vinyle (anneaux concentriques)
export function textureSillons(anisotropie) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 1024, 1024);
    ctx.lineWidth = 2;
    for (let r = 180; r < 508; r += 5) {
        ctx.strokeStyle = r % 2 ? '#101010' : '#1a1a1a';
        ctx.beginPath();
        ctx.arc(512, 512, r, 0, Math.PI * 2);
        ctx.stroke();
    }
    return enTexture(canvas, anisotropie);
}
