<?php
/**
 * Physio Wellness by Marshall — Contact Form Configuration Template
 * 
 * INSTRUCCIONS PER A HOSTINGER:
 * 1. Copia aquest fitxer amb el nom "contact-config.php" (sense .example).
 *    Pots ubicar-lo a la mateixa carpeta api/ (ja està protegit per .htaccess i .gitignore)
 *    o bé fora de public_html a nivell superior si vols màxima seguretat.
 * 2. Omple les teves credencials reals de correu de Hostinger.
 * 3. NO pugis mai "contact-config.php" a GitHub ni a cap repositori públic.
 * 
 * Alternativament, si configures variables d'entorn al servidor (p. ex. al panell de Hostinger
 * o Apache SetEnv), l'endpoint les detectarà automàticament sense necessitat d'aquest fitxer.
 */

return [
    // -------------------------------------------------------------------------
    // 1. Configuració del Servidor SMTP (Hostinger)
    // -------------------------------------------------------------------------
    // Hostinger per defecte:
    // Host: smtp.hostinger.com
    // Port: 465 (amb ssl) o 587 (amb tls)
    'smtp_host'       => 'smtp.hostinger.com',
    'smtp_port'       => 465,
    'smtp_secure'     => 'ssl', // 'ssl' per a port 465, 'tls' per a port 587
    'smtp_auth'       => true,
    'smtp_username'   => 'hola@physiowellness.es', // El teu compte de correu creat a Hostinger
    'smtp_password'   => 'INTRODUEIX_AQUI_LA_TEVA_CONTRASENYA_SMTP', // Contrasenya del compte de correu

    // -------------------------------------------------------------------------
    // 2. Correu Remitent (From)
    // -------------------------------------------------------------------------
    // IMPORTANT: Per evitar problemes de SPF/DKIM/DMARC i filtres de spam,
    // el remitent HA DE PERTÀNYER al domini de Physio Wellness (igual que smtp_username).
    // El correu introduït pel pacient s'assignarà exclusivament al camp 'Reply-To'.
    'mail_from_email' => 'hola@physiowellness.es',
    'mail_from_name'  => 'Physio Wellness by Marshall',

    // -------------------------------------------------------------------------
    // 3. Destinatari (On rep Physio Wellness les consultes dels pacients)
    // -------------------------------------------------------------------------
    'mail_to_email'   => 'hola@physiowellness.es',
    'mail_to_name'    => 'Physio Wellness Sitges',

    // -------------------------------------------------------------------------
    // 4. Seguretat i Orígens Permesos
    // -------------------------------------------------------------------------
    'allowed_origins' => [
        'https://physiowellness.es',
        'https://www.physiowellness.es',
        // TEMPORAL: Domini de preproducció a Hostinger abans del canvi de DNS.
        // ELIMINAR aquesta línia després de migrar definitivament a physiowellness.es.
        'https://darkcyan-chinchilla-609962.hostingersite.com',
        // 'http://localhost:8000', // Descomentar només durant proves locals
        // 'http://127.0.0.1:8000',
    ],

    // -------------------------------------------------------------------------
    // 5. Rate Limiting (Protecció anti-abusos)
    // -------------------------------------------------------------------------
    'rate_limit_enabled' => true,
    'rate_limit_max'     => 5,     // Màxim d'enviaments permesos per IP
    'rate_limit_window'  => 900,   // Finestra de temps en segons (900s = 15 minuts)
    'rate_limit_salt'    => 'pw_secure_salt_sitges_2026', // Salt per anonimitzar IP (hash sha256)

    // -------------------------------------------------------------------------
    // 6. Logs i Depuració (mai exposats al públic)
    // -------------------------------------------------------------------------
    // Si està actiu, registra errors tècnics al log d'errors del servidor PHP
    // sense desar mai contingut del missatge, contrasenyes ni dades personals.
    'debug_log'          => false,
];
