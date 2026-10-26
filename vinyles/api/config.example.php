<?php
// Copie ce fichier en config.php (ignoré par Git) et ajuste les valeurs.
// En production : utilise un utilisateur MySQL dédié avec un vrai mot de passe,
// jamais « root » sans mot de passe.
return [
    'host'     => '127.0.0.1',
    'port'     => 3307,
    'dbname'   => 'portfolio',
    'user'     => 'root',
    'password' => '',
];
