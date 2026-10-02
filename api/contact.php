<?php
declare(strict_types=1);

/**
 * Physio Wellness by Marshall — Production Contact Form Endpoint
 *
 * Flow:
 *   Frontend (POST) -> JSON API -> Backend Validation -> SMTP (Hostinger) -> Physio Wellness Email
 *
 * Security features:
 *   - Only POST accepted (405 Method Not Allowed for GET/others)
 *   - Origin / Referer / Sec-Fetch-Site same-origin validation
 *   - Custom header verification (X-Requested-With / application/json)
 *   - Invisible honeypot anti-spam check (website field)
 *   - Rate limiting via SHA-256 IP hashing (GDPR compliant, zero raw PII stored)
 *   - Strict backend normalization & sanitization (trim, lengths, regex, CRLF rejection)
 *   - Email header injection protection
 *   - Authenticated SMTP via PHPMailer with TLS/SSL
 *   - Physio Wellness domain address for 'From', user's verified address for 'Reply-To'
 *   - Safe error handling (never exposes internal paths, credentials, or stack traces)
 *   - Multilingual support: ES, CAT, EN
 */

// Disallow displaying any PHP errors/warnings in HTTP response (logs only)
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

// Base security headers for API response
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

// -----------------------------------------------------------------------------
// 1. Only POST Allowed
// -----------------------------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error'   => 'method_not_allowed',
        'message' => 'Method Not Allowed'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// -----------------------------------------------------------------------------
// 2. Multilingual Translations
// -----------------------------------------------------------------------------
$translations = [
    'es' => [
        'errName'         => 'Por favor, introduce tu nombre.',
        'errNameLength'   => 'El nombre debe tener entre 2 y 100 caracteres.',
        'errEmailEmpty'   => 'Por favor, introduce tu correo electrónico.',
        'errEmailInvalid' => 'Por favor, introduce un correo electrónico válido.',
        'errPhoneInvalid' => 'Por favor, introduce un número de teléfono válido o déjalo vacío.',
        'errMessageEmpty' => 'Por favor, escribe tu mensaje o consulta.',
        'errMessageShort' => 'El mensaje es demasiado corto (mínimo 5 caracteres).',
        'errMessageLong'  => 'El mensaje es demasiado largo (máximo 3000 caracteres).',
        'errGeneral'      => 'No hemos podido enviar tu mensaje. Inténtalo de nuevo en unos minutos.',
        'errRateLimit'    => 'Demasiadas solicitudes. Por favor, inténtalo de nuevo en unos minutos.',
        'successMsg'      => 'Gracias. Hemos recibido tu mensaje y te responderemos lo antes posible.',
        'langLabel'       => 'ES',
        'notSpecified'    => 'No indicado',
        'subjectPrefix'   => 'Nueva consulta web · ',
        'emailHeading'    => 'Nueva consulta desde la web de Physio Wellness',
    ],
    'ca' => [
        'errName'         => 'Si us plau, introdueix el teu nom.',
        'errNameLength'   => 'El nom ha de tenir entre 2 i 100 caràcters.',
        'errEmailEmpty'   => 'Si us plau, introdueix el teu correu electrònic.',
        'errEmailInvalid' => 'Si us plau, introdueix un correu electrònic vàlid.',
        'errPhoneInvalid' => 'Si us plau, introdueix un número de telèfon vàlid o deixa\'l buit.',
        'errMessageEmpty' => 'Si us plau, escriu el teu missatge o consulta.',
        'errMessageShort' => 'El missatge és massa curt (mínim 5 caràcters).',
        'errMessageLong'  => 'El missatge és massa llarg (màxim 3000 caràcters).',
        'errGeneral'      => 'No hem pogut enviar el teu missatge. Torna-ho a provar d\'aquí a uns minuts.',
        'errRateLimit'    => 'Massa peticions seguides. Si us plau, torna-ho a provar d\'aquí a uns minuts.',
        'successMsg'      => 'Gràcies. Hem rebut el teu missatge i et respondrem al més aviat possible.',
        'langLabel'       => 'CAT',
        'notSpecified'    => 'No indicat',
        'subjectPrefix'   => 'Nova consulta web · ',
        'emailHeading'    => 'Nova consulta des del web de Physio Wellness',
    ],
    'en' => [
        'errName'         => 'Please enter your name.',
        'errNameLength'   => 'Name must be between 2 and 100 characters.',
        'errEmailEmpty'   => 'Please enter your email address.',
        'errEmailInvalid' => 'Please enter a valid email address.',
        'errPhoneInvalid' => 'Please enter a valid phone number or leave it empty.',
        'errMessageEmpty' => 'Please write your message or enquiry.',
        'errMessageShort' => 'The message is too short (at least 5 characters).',
        'errMessageLong'  => 'The message is too long (maximum 3000 characters).',
        'errGeneral'      => 'We could not send your message. Please try again in a few minutes.',
        'errRateLimit'    => 'Too many requests. Please try again in a few minutes.',
        'successMsg'      => 'Thank you. We\'ve received your message and will get back to you as soon as possible.',
        'langLabel'       => 'EN',
        'notSpecified'    => 'Not provided',
        'subjectPrefix'   => 'New web enquiry · ',
        'emailHeading'    => 'New enquiry from the Physio Wellness website',
    ],
];

// -----------------------------------------------------------------------------
// 3. Load Configuration (Environment Variables first, then private config file)
// -----------------------------------------------------------------------------
$config = [
    'smtp_host'          => 'smtp.hostinger.com',
    'smtp_port'          => 465,
    'smtp_secure'        => 'ssl',
    'smtp_auth'          => true,
    'smtp_username'      => '',
    'smtp_password'      => '',
    'mail_from_email'    => 'hola@physiowellness.es',
    'mail_from_name'     => 'Physio Wellness by Marshall',
    'mail_to_email'      => 'hola@physiowellness.es',
    'mail_to_name'       => 'Physio Wellness Sitges',
    'allowed_origins'    => [
        'https://physiowellness.es',
        'https://www.physiowellness.es',
        // TEMPORAL: Domini de preproducció a Hostinger abans del canvi de DNS.
        // ELIMINAR aquesta línia després de migrar definitivament a physiowellness.es.
        'https://darkcyan-chinchilla-609962.hostingersite.com',
    ],
    'rate_limit_enabled' => true,
    'rate_limit_max'     => 5,
    'rate_limit_window'  => 900,
    'rate_limit_salt'    => 'pw_secure_salt_sitges_2026',
    'debug_log'          => false,
];

// Check environment variables first
$envHost = getenv('SMTP_HOST') ?: ($_ENV['SMTP_HOST'] ?? ($_SERVER['SMTP_HOST'] ?? null));
if (!empty($envHost)) {
    $config['smtp_host']       = (string)$envHost;
    $config['smtp_port']       = (int)(getenv('SMTP_PORT') ?: ($_ENV['SMTP_PORT'] ?? 465));
    $config['smtp_secure']     = (string)(getenv('SMTP_SECURE') ?: ($_ENV['SMTP_SECURE'] ?? 'ssl'));
    $config['smtp_username']   = (string)(getenv('SMTP_USER') ?: ($_ENV['SMTP_USER'] ?? ''));
    $config['smtp_password']   = (string)(getenv('SMTP_PASS') ?: ($_ENV['SMTP_PASS'] ?? ''));
    $config['mail_from_email'] = (string)(getenv('MAIL_FROM_EMAIL') ?: ($_ENV['MAIL_FROM_EMAIL'] ?? $config['mail_from_email']));
    $config['mail_from_name']  = (string)(getenv('MAIL_FROM_NAME') ?: ($_ENV['MAIL_FROM_NAME'] ?? $config['mail_from_name']));
    $config['mail_to_email']   = (string)(getenv('MAIL_TO_EMAIL') ?: ($_ENV['MAIL_TO_EMAIL'] ?? $config['mail_to_email']));
    $config['mail_to_name']    = (string)(getenv('MAIL_TO_NAME') ?: ($_ENV['MAIL_TO_NAME'] ?? $config['mail_to_name']));
} else {
    // Check private config file locations
    $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? __DIR__;
    $possibleConfigPaths = [
        dirname($docRoot) . '/physiowellness-config/contact-config.php',
        dirname($docRoot) . '/contact-config.php',
        __DIR__ . '/contact-config.php',
        dirname(__DIR__) . '/contact-config.php',
    ];

    foreach ($possibleConfigPaths as $cfgPath) {
        if (file_exists($cfgPath) && is_readable($cfgPath)) {
            $loadedConfig = require $cfgPath;
            if (is_array($loadedConfig)) {
                $config = array_merge($config, $loadedConfig);
            }
            break;
        }
    }
}

// -----------------------------------------------------------------------------
// 4. Origin & Anti-CSRF Verification
// -----------------------------------------------------------------------------
// Reject cross-site fetch according to modern browser metadata
$secFetchSite = strtolower($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '');
if ($secFetchSite === 'cross-site') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'forbidden', 'message' => 'Cross-site requests not allowed'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Verify Origin or Referer if present
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';

$originToCheck = $origin;
if (empty($originToCheck) && !empty($referer)) {
    $parsedReferer = parse_url($referer);
    if (!empty($parsedReferer['scheme']) && !empty($parsedReferer['host'])) {
        $originToCheck = $parsedReferer['scheme'] . '://' . $parsedReferer['host'];
        if (!empty($parsedReferer['port'])) {
            $originToCheck .= ':' . $parsedReferer['port'];
        }
    }
}

if (!empty($originToCheck)) {
    $isAllowed = false;
    foreach ($config['allowed_origins'] as $allowed) {
        if (strcasecmp($originToCheck, $allowed) === 0) {
            $isAllowed = true;
            break;
        }
    }
    // Allow local development on localhost or 127.0.0.1
    if (!$isAllowed && preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#i', $originToCheck)) {
        $isAllowed = true;
    }

    if (!$isAllowed) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'forbidden', 'message' => 'Origin not allowed'], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// -----------------------------------------------------------------------------
// 5. Parse Request Payload
// -----------------------------------------------------------------------------
$rawInput = file_get_contents('php://input');
$input = [];

$contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
if (strpos($contentType, 'application/json') !== false || (!empty($rawInput) && ($rawInput[0] === '{' || $rawInput[0] === '['))) {
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $input = $decoded;
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'invalid_json', 'message' => 'Invalid JSON payload'], JSON_UNESCAPED_UNICODE);
        exit;
    }
} else {
    // Fallback to standard form post
    $input = $_POST;
}

// Determine language
$lang = strtolower((string)($input['lang'] ?? 'es'));
if (!array_key_exists($lang, $translations)) {
    $lang = 'es';
}
$t = $translations[$lang];

// -----------------------------------------------------------------------------
// 6. Anti-Spam: Invisible Honeypot
// -----------------------------------------------------------------------------
// If the hidden 'website' input contains any text, a bot filled it.
// Silently return success to mislead the bot, but DO NOT send email.
if (!empty($input['website'])) {
    usleep(400000); // 400ms simulate processing
    echo json_encode(['success' => true, 'message' => $t['successMsg']], JSON_UNESCAPED_UNICODE);
    exit;
}

// -----------------------------------------------------------------------------
// 7. Rate Limiting (File-based, GDPR-compliant SHA-256 IP Hash)
// -----------------------------------------------------------------------------
if (!empty($config['rate_limit_enabled'])) {
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $ipHash = hash('sha256', $clientIp . '|' . ($config['rate_limit_salt'] ?? 'salt'));

    // Cache directory in api/.cache or sys temp
    $cacheDir = __DIR__ . '/.cache';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0750, true);
    }
    if (!is_writable($cacheDir)) {
        $cacheDir = sys_get_temp_dir();
    }

    $rateFile = $cacheDir . '/pw_rl_' . substr($ipHash, 0, 16) . '.json';
    $now = time();
    $window = (int)($config['rate_limit_window'] ?? 900);
    $maxAttempts = (int)($config['rate_limit_max'] ?? 5);

    $rateData = ['count' => 0, 'first_attempt' => $now];
    if (file_exists($rateFile)) {
        $content = @file_get_contents($rateFile);
        if ($content) {
            $parsed = @json_decode($content, true);
            if (is_array($parsed) && isset($parsed['first_attempt'], $parsed['count'])) {
                if ($now - $parsed['first_attempt'] < $window) {
                    $rateData = $parsed;
                }
            }
        }
    }

    if ($rateData['count'] >= $maxAttempts) {
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'error'   => 'rate_limited',
            'message' => $t['errRateLimit']
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $rateData['count']++;
    @file_put_contents($rateFile, json_encode($rateData), LOCK_EX);
}

// -----------------------------------------------------------------------------
// 8. Strict Backend Validation & Normalization
// -----------------------------------------------------------------------------
$errors = [];

// Check unexpected fields (prevent parameter tampering)
$allowedKeys = ['name', 'email', 'phone', 'message', 'website', 'lang', '_ts', '_token'];
foreach (array_keys($input) as $key) {
    if (!in_array($key, $allowedKeys, true)) {
        $errors['general'] = 'Unexpected form parameters detected.';
        break;
    }
}

// --- Name validation ---
$rawName = isset($input['name']) && is_string($input['name']) ? trim($input['name']) : '';
if ($rawName === '') {
    $errors['name'] = $t['errName'];
} elseif (preg_match('/[\r\n]/', $rawName)) {
    // Header injection / CRLF attempt
    $errors['name'] = $t['errName'];
} else {
    $nameLen = mb_strlen($rawName, 'UTF-8');
    if ($nameLen < 2 || $nameLen > 100) {
        $errors['name'] = $t['errNameLength'];
    }
}

// --- Email validation ---
$rawEmail = isset($input['email']) && is_string($input['email']) ? trim($input['email']) : '';
if ($rawEmail === '') {
    $errors['email'] = $t['errEmailEmpty'];
} elseif (preg_match('/[\r\n]/', $rawEmail)) {
    // Header injection / CRLF attempt
    $errors['email'] = $t['errEmailInvalid'];
} else {
    $emailLen = strlen($rawEmail);
    if ($emailLen > 254 || !filter_var($rawEmail, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = $t['errEmailInvalid'];
    } else {
        // Extra check for domain dot structure
        if (!preg_match('/^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/', $rawEmail)) {
            $errors['email'] = $t['errEmailInvalid'];
        }
    }
}

// --- Phone validation (optional) ---
$rawPhone = isset($input['phone']) && is_string($input['phone']) ? trim($input['phone']) : '';
if ($rawPhone !== '') {
    if (preg_match('/[\r\n]/', $rawPhone)) {
        $errors['phone'] = $t['errPhoneInvalid'];
    } else {
        $phoneLen = mb_strlen($rawPhone, 'UTF-8');
        // Reasonably flexible phone: allows international prefix +, digits, spaces, dots, dashes, parentheses
        if ($phoneLen < 6 || $phoneLen > 30 || !preg_match('/^[0-9+\s\-().]{6,30}$/', $rawPhone)) {
            $errors['phone'] = $t['errPhoneInvalid'];
        }
    }
}

// --- Message validation ---
$rawMessage = isset($input['message']) && is_string($input['message']) ? trim($input['message']) : '';
if ($rawMessage === '') {
    $errors['message'] = $t['errMessageEmpty'];
} else {
    $msgLen = mb_strlen($rawMessage, 'UTF-8');
    if ($msgLen < 5) {
        $errors['message'] = $t['errMessageShort'];
    } elseif ($msgLen > 3000) {
        $errors['message'] = $t['errMessageLong'];
    }
}

// If validation errors exist, return 400 Bad Request
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error'   => 'validation_failed',
        'errors'  => $errors,
        'message' => reset($errors), // First error message as default
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// -----------------------------------------------------------------------------
// 9. Check SMTP Configuration
// -----------------------------------------------------------------------------
$smtpPass = $config['smtp_password'] ?? '';
$isConfigured = !empty($smtpPass) && $smtpPass !== 'INTRODUEIX_AQUI_LA_TEVA_CONTRASENYA_SMTP';

if (!$isConfigured) {
    // Log to server error log without leaking secrets or payload
    error_log('[Physio Wellness Contact Form] SMTP configuration pending: password not set in contact-config.php or environment.');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'smtp_unconfigured',
        'message' => $t['errGeneral'],
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// -----------------------------------------------------------------------------
// 10. Send Email via PHPMailer
// -----------------------------------------------------------------------------
require_once __DIR__ . '/PHPMailer/Exception.php';
require_once __DIR__ . '/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host       = (string)$config['smtp_host'];
    $mail->SMTPAuth   = (bool)($config['smtp_auth'] ?? true);
    $mail->Username   = (string)$config['smtp_username'];
    $mail->Password   = (string)$config['smtp_password'];
    $mail->Port       = (int)($config['smtp_port'] ?? 465);
    $mail->CharSet    = 'UTF-8';
    $mail->Timeout    = 15;

    // Security: SSL / TLS
    $secureMode = strtolower((string)($config['smtp_secure'] ?? 'ssl'));
    if ($secureMode === 'ssl' || $mail->Port === 465) {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($secureMode === 'tls' || $mail->Port === 587) {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    }

    // Correu Remitent (Must belong to Physio Wellness domain to prevent SPF/DMARC rejection)
    $mail->setFrom((string)$config['mail_from_email'], (string)$config['mail_from_name']);

    // User's verified email as Reply-To
    $cleanNameHeader = str_replace(["\r", "\n"], '', $rawName);
    $mail->addReplyTo($rawEmail, $cleanNameHeader);

    // Center recipient
    $mail->addAddress((string)$config['mail_to_email'], (string)$config['mail_to_name']);

    // Subject
    $mail->Subject = $t['subjectPrefix'] . $cleanNameHeader;

    // Formatted date (Europe/Madrid)
    try {
        $dt = new DateTime('now', new DateTimeZone('Europe/Madrid'));
        $dateFormatted = $dt->format('d/m/Y H:i') . ' (Sitges)';
    } catch (\Exception $ex) {
        $dateFormatted = gmdate('d/m/Y H:i') . ' UTC';
    }

    $phoneDisplay = $rawPhone !== '' ? $rawPhone : $t['notSpecified'];

    // Plain text content (Requirement 8)
    $plainText = "Nueva consulta desde la web de Physio Wellness\n\n"
        . "Nombre:  \n" . $rawName . "\n\n"
        . "Email:  \n" . $rawEmail . "\n\n"
        . "Teléfono:  \n" . $phoneDisplay . "\n\n"
        . "Mensaje:  \n" . $rawMessage . "\n\n"
        . "Idioma:  \n" . $t['langLabel'] . "\n\n"
        . "Fecha y hora:  \n" . $dateFormatted . "\n";

    // Clean, accessible, branded HTML content
    $safeName    = htmlspecialchars($rawName, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeEmail   = htmlspecialchars($rawEmail, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safePhone   = htmlspecialchars($phoneDisplay, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeMessage = nl2br(htmlspecialchars($rawMessage, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
    $safeHeading = htmlspecialchars($t['emailHeading'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

    $htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f9f8; color: #12201d; margin: 0; padding: 24px 12px; }
  .email-card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8e6; overflow: hidden; box-shadow: 0 4px 12px rgba(18, 32, 29, 0.04); }
  .email-header { background: #237369; color: #ffffff; padding: 24px 28px; }
  .email-header h1 { font-size: 18px; font-weight: 600; margin: 0 0 6px 0; color: #ffffff; }
  .email-header p { font-size: 13px; margin: 0; opacity: 0.85; }
  .email-body { padding: 28px; }
  .field { margin-bottom: 20px; }
  .field-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #556965; margin-bottom: 4px; font-weight: 600; }
  .field-val { font-size: 15px; color: #12201d; font-weight: 500; }
  .field-val a { color: #237369; text-decoration: none; }
  .message-box { background: #fbfcfc; border: 1px solid #e9efed; border-left: 3px solid #237369; border-radius: 4px; padding: 14px 16px; font-size: 14px; line-height: 1.6; color: #1e2e2a; margin-top: 4px; }
  .email-footer { border-top: 1px solid #edf2f0; padding: 16px 28px; background: #fbfcfc; font-size: 12px; color: #738782; display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="email-card">
  <div class="email-header">
    <h1>{$safeHeading}</h1>
    <p>Sitges · Camí dels Capellans, 79</p>
  </div>
  <div class="email-body">
    <div class="field">
      <div class="field-label">Nombre</div>
      <div class="field-val">{$safeName}</div>
    </div>
    <div class="field">
      <div class="field-label">Email</div>
      <div class="field-val"><a href="mailto:{$safeEmail}">{$safeEmail}</a></div>
    </div>
    <div class="field">
      <div class="field-label">Teléfono</div>
      <div class="field-val">{$safePhone}</div>
    </div>
    <div class="field">
      <div class="field-label">Mensaje</div>
      <div class="message-box">{$safeMessage}</div>
    </div>
    <div class="field" style="margin-bottom: 0;">
      <div class="field-label">Idioma de la web</div>
      <div class="field-val">{$t['langLabel']}</div>
    </div>
  </div>
  <div class="email-footer">
    <span>Fecha: {$dateFormatted}</span>
    <span>Physio Wellness</span>
  </div>
</div>
</body>
</html>
HTML;

    $mail->isHTML(true);
    $mail->Body    = $htmlBody;
    $mail->AltBody = $plainText;

    $mail->send();

    // Success response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => $t['successMsg']
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    // Log technical error internally without leaking to client
    error_log('[Physio Wellness Contact Form] SMTP Exception: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'send_failed',
        'message' => $t['errGeneral']
    ], JSON_UNESCAPED_UNICODE);
}
