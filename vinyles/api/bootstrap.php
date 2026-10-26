<?php
declare(strict_types=1);

// Inclus par tous les points d'entrée de l'API (lecture seule, méthode GET).

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function sortir(int $code, mixed $donnees): never
{
    http_response_code($code);
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function pdo(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $fichier = __DIR__ . '/config.php';
        if (!is_file($fichier)) {
            error_log('api: config.php manquant');
            sortir(500, ['erreur' => 'Erreur serveur']);
        }
        $c = require $fichier;
        $pdo = new PDO(
            "mysql:host={$c['host']};port={$c['port']};dbname={$c['dbname']};charset=utf8mb4",
            $c['user'],
            $c['password'],
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    }
    return $pdo;
}

// Exécute le point d'entrée ; toute erreur est journalisée côté serveur,
// jamais envoyée au visiteur (pas de fuite de requêtes SQL ou d'identifiants).
function api(callable $traitement): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        sortir(405, ['erreur' => 'Méthode non autorisée']);
    }
    try {
        $traitement();
    } catch (Throwable $e) {
        error_log('api: ' . $e->getMessage());
        sortir(500, ['erreur' => 'Erreur serveur']);
    }
}

function slug_param(string $nom): string
{
    $v = $_GET[$nom] ?? '';
    if (!is_string($v) || !preg_match('/^[a-z0-9-]{1,100}$/', $v)) {
        sortir(400, ['erreur' => 'Paramètre invalide']);
    }
    return $v;
}

// Transforme les colonnes piste_* d'une ligne SQL en objet piste (ou null).
function piste_depuis_ligne(array $r): ?array
{
    if (empty($r['piste_id'])) {
        return null;
    }
    return [
        'id'           => (int) $r['piste_id'],
        'titre'        => $r['piste_titre'],
        'artiste'      => $r['piste_artiste'],
        'spotify_type' => $r['spotify_type'],
        'spotify_id'   => $r['spotify_id'],
    ];
}

const SELECT_PISTE = 'pi.id AS piste_id, pi.titre AS piste_titre, pi.artiste AS piste_artiste, pi.spotify_type, pi.spotify_id';
