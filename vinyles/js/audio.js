// Lecteur Spotify (API iFrame), chargé seulement au premier clic sur « Lancer le disque ».
// La musique ne démarre jamais seule.

let promesseApi = null;
let controleur = null;
let hote = null;
const etat = { piste: null, enPause: true, erreur: null };
const abonnes = new Set();

const uri = (piste) => `spotify:${piste.spotify_type}:${piste.spotify_id}`;
const notifier = () => abonnes.forEach((f) => f({ ...etat }));

function chargerApi() {
    if (!promesseApi) {
        promesseApi = new Promise((resolve, reject) => {
            window.onSpotifyIframeApiReady = (api) => resolve(api);
            const script = document.createElement('script');
            script.src = 'https://open.spotify.com/embed/iframe-api/v1';
            script.async = true;
            script.onerror = () => {
                promesseApi = null;
                reject(new Error('Impossible de charger Spotify.'));
            };
            document.head.appendChild(script);
        });
    }
    return promesseApi;
}

export function monterLecteur(element) {
    hote = element;
}

export function surChangement(rappel) {
    abonnes.add(rappel);
    rappel({ ...etat });
}

export async function jouer(piste) {
    if (!piste || !hote) return;
    etat.erreur = null;
    if (etat.piste?.id === piste.id && controleur) {
        controleur.togglePlay();
        return;
    }
    etat.piste = piste;
    etat.enPause = true;
    notifier();
    try {
        const api = await chargerApi();
        if (controleur) {
            controleur.loadUri(uri(piste));
            controleur.play();
            return;
        }
        const cible = document.createElement('div');
        hote.appendChild(cible);
        api.createController(cible, { uri: uri(piste), width: '100%', height: 80 }, (c) => {
            controleur = c;
            c.addListener('playback_update', (e) => {
                etat.enPause = !!e.data?.isPaused;
                notifier();
            });
            c.addListener('ready', () => c.play());
        });
    } catch (e) {
        etat.erreur = e.message;
        notifier();
    }
}

export function basculer() {
    controleur?.togglePlay();
}
